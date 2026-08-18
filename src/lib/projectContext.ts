/**
 * Contexte IA — résumé Markdown d'un projet, destiné à être collé dans un
 * assistant (ChatGPT, Claude, Copilot…).
 *
 * Règles éditoriales (ce qui fait la qualité de la réponse de l'IA en face) :
 * - **Tout est pré-calculé** ici : pourcentages, jours de retard, écarts budget.
 *   Une IA compte mal ; elle ne doit avoir qu'à lire.
 * - **C'est une sélection, pas un export.** Chaque coupe est annoncée
 *   (« n non listées ») : sans ça l'IA affirme des faux négatifs.
 * - **Les barèmes sont expliqués** (criticité G×O×D 1–4, score matrice /12) —
 *   un nombre sans son échelle n'est pas exploitable.
 * - **Aucun identifiant technique, aucun email** : noms dénormalisés, libellés
 *   français. L'option `anonymize` remplace même les noms.
 *
 * Fonction PURE (aucun accès store/Supabase) : `today` est injecté pour rester
 * déterministe et testable.
 */

import { diffDays } from './date';
import { RDP_PHASES } from './rdp';
import { enabledTools, TOOLS, type ToolId } from './tools';
import {
  costActualTotal,
  costPlannedTotal,
  costVariance,
  criticality,
  criticalityLevel,
  residualCriticality,
  solutionScore,
  subjectScore,
  PROJECT_STATUS_LABELS,
  REVUE_TYPE_LABELS,
  STATUS_LABELS,
  SWOT_QUADRANTS,
  type A3Report,
  type Action,
  type AmdecEntry,
  type CostItem,
  type FiveWhyAnalysis,
  type Id,
  type IshikawaAnalysis,
  type Project,
  type Rdp,
  type RdpIndicator,
  type RdpProblem,
  type RdpSolution,
  type RdpSubject,
  type Revue,
  type RevueDecision,
  type SwotItem,
} from './types';

export interface ProjectContextInput {
  project: Project;
  actions: Action[];
  amdecs: AmdecEntry[];
  costItems: CostItem[];
  swotItems: SwotItem[];
  a3Report: A3Report | null;
  revues: Revue[];
  revueDecisions: RevueDecision[];
  rdps: Rdp[];
  rdpSubjects: RdpSubject[];
  rdpProblems: RdpProblem[];
  rdpSolutions: RdpSolution[];
  rdpIndicators: RdpIndicator[];
  fiveWhyAnalyses: FiveWhyAnalysis[];
  ishikawaAnalyses: IshikawaAnalysis[];
  /** Date du jour (ISO) — injectée pour que la génération soit déterministe. */
  today: string;
  /** Remplace les noms des personnes par « Membre 1 », « Membre 2 »… */
  anonymize?: boolean;
}

/* --- Plafonds de listage (au-delà : on annonce un reste) -------------------- */
const MAX_UPCOMING = 10;
const MAX_LATE = 10;
const MAX_MEDIUM_RISKS = 8;
const MAX_COST_LINES = 5;
const MAX_ROOT_CAUSES = 6;
// Un item SWOT tient sur une ligne : le tronquer coûte du contexte pour presque
// aucune place gagnée. Plafond haut, purement anti-pathologique.
const MAX_SWOT_PER_QUADRANT = 12;
const MAX_DECISIONS = 8;

/* --- Petits utilitaires de rendu ------------------------------------------- */

/**
 * Texte libre → une seule ligne, tronquée proprement.
 * Un saut de ligne saisi par l'utilisateur devient un « ; » visible : aplati en
 * simple espace, deux idées distinctes se recollent en une phrase incohérente
 * que le lecteur d'en face prend pour une seule affirmation.
 */
function clip(s: string | null | undefined, max: number): string {
  const t = (s ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]*\n+[ \t]*/g, ' ; ')
    .replace(/[ \t]+/g, ' ')
    .replace(/(\s*;\s*)+$/, '')
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Échappe ce qui casserait une cellule de tableau Markdown. */
function cell(s: string): string {
  return s.replace(/\|/g, '\\|');
}

/** 48200 → « 48 200 € » (formatage manuel : déterministe, sans dépendre d'Intl). */
function eur(n: number): string {
  const rounded = Math.round(n);
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '−' : ''}${digits} €`;
}

/** Écart signé : « +3 200 € » / « −450 € ». */
function signedEur(n: number): string {
  return `${Math.round(n) > 0 ? '+' : ''}${eur(n)}`;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Écart budget lisible : « +3 200 € (+7 %) », « −450 € (−2 %) », « à l'équilibre ». */
function gapLabel(gap: number, base: number): string {
  if (Math.round(gap) === 0) return 'à l’équilibre';
  return `${signedEur(gap)} (${gap > 0 ? '+' : '−'}${pct(Math.abs(gap), base)} %)`;
}

/** « dans 15 j » / « il y a 3 j » / « aujourd'hui ». */
function relDays(from: string, to: string): string {
  const d = diffDays(from, to);
  if (d === 0) return 'aujourd’hui';
  return d > 0 ? `dans ${d} j` : `il y a ${-d} j`;
}

function plural(n: number, one: string, many: string): string {
  return n > 1 ? many : one;
}

/** Ligne de tableau Markdown. */
function row(cells: string[]): string {
  return `| ${cells.map(cell).join(' | ')} |`;
}

function table(headers: string[], rows: string[][]): string[] {
  return [
    row(headers),
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map(row),
  ];
}

/* --- Générateur ------------------------------------------------------------- */

export function buildProjectContextMd(input: ProjectContextInput): string {
  const { project, actions, amdecs, today, anonymize } = input;
  const tools = enabledTools(project.tools);
  const has = (id: ToolId) => tools.includes(id);

  /* Noms : dénormalisés une fois pour tout le document (jamais d'UUID). */
  const nameById = new Map<Id, string>();
  project.members.forEach((m, i) => {
    nameById.set(m.id, anonymize ? `Membre ${i + 1}` : m.name);
  });
  const who = (id: Id | undefined): string => (id ? nameById.get(id) ?? 'Membre retiré' : '—');

  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  /* --- Chiffres de tête (calculés une fois, réutilisés par la synthèse) ----- */
  const done = actions.filter((a) => a.status === 'done');
  const open = actions.filter((a) => a.status !== 'done');
  const progress = pct(done.length, actions.length);

  const late = open
    .filter((a) => a.dueDate && a.dueDate < today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  // Une action en retard qui bloque une suivante coûte plus cher qu'une autre :
  // c'est l'information qui fait arbitrer, donc elle mérite d'être calculée.
  // On nomme l'action bloquée, sinon la chaîne de dépendances reste invérifiable
  // pour le lecteur — il ne peut que supposer l'ordre des travaux.
  const blockedTitles = new Map<Id, string[]>();
  for (const a of actions) {
    for (const dep of a.dependsOnIds ?? []) {
      blockedTitles.set(dep, [...(blockedTitles.get(dep) ?? []), a.title]);
    }
  }
  const blockingLate = late.filter((a) => blockedTitles.has(a.id));

  const milestones = actions
    .filter((a) => a.milestone && a.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const nextMilestone = milestones.find((m) => m.status !== 'done' && m.dueDate! >= today);

  const scored = amdecs
    .map((a) => ({ entry: a, score: criticality(a), residual: residualCriticality(a) }))
    .sort((a, b) => b.score - a.score);
  const critical = scored.filter((s) => criticalityLevel(s.residual ?? s.score) === 'high');
  const medium = scored.filter((s) => criticalityLevel(s.residual ?? s.score) === 'medium');
  const coveredAmdecIds = new Set(actions.map((a) => a.amdecId).filter(Boolean));
  const uncoveredCritical = critical.filter((s) => !coveredAmdecIds.has(s.entry.id));

  const budgetPlanned = input.costItems.reduce((s, c) => s + costPlannedTotal(c), 0);
  const budgetActual = input.costItems.reduce((s, c) => s + costActualTotal(c), 0);
  const budgetGap = budgetActual - budgetPlanned;
  /** Aucun réel saisi → il n'y a pas d'écart à interpréter (cf. section Budget). */
  const budgetTracked = input.costItems.some((c) => c.actual > 0);

  /* --- En-tête -------------------------------------------------------------- */
  push(
    `# Contexte projet — ${project.name}`,
    '',
    '> Résumé généré par ENTAN pour servir de contexte à un assistant IA.',
    `> **Date du jour : ${today}** (à utiliser pour tout calcul de délai). Dates au format AAAA-MM-JJ.`,
    '> Ce document est une **sélection** des informations utiles, pas un export exhaustif.',
    '',
  );

  /* --- Synthèse ------------------------------------------------------------- */
  push('## Synthèse', '');
  const synth: string[] = [];
  synth.push(
    actions.length > 0
      ? `**Avancement : ${progress} %** (${done.length} ${plural(done.length, 'action terminée', 'actions terminées')} sur ${actions.length})`
      : 'Aucune action enregistrée pour l’instant',
  );
  if (late.length > 0) {
    const suffix = blockingLate.length > 0
      ? `, dont ${blockingLate.length} ${plural(blockingLate.length, 'bloque', 'bloquent')} d’autres actions`
      : '';
    synth.push(`**${late.length} ${plural(late.length, 'action en retard', 'actions en retard')}**${suffix}`);
  } else if (actions.length > 0) {
    synth.push('Aucune action en retard');
  }
  if (nextMilestone) {
    synth.push(`**Prochain jalon** : « ${clip(nextMilestone.title, 80)} » — ${nextMilestone.dueDate} (${relDays(today, nextMilestone.dueDate!)})`);
  }
  if (has('amdec') && critical.length > 0) {
    const suffix = uncoveredCritical.length > 0
      ? `, dont ${uncoveredCritical.length} sans action corrective`
      : `, ${plural(critical.length, 'couvert', 'tous couverts')} par au moins une action`;
    synth.push(`**${critical.length} ${plural(critical.length, 'risque critique', 'risques critiques')}** (criticité ≥ 24)${suffix}`);
  }
  if (has('couts') && input.costItems.length > 0) {
    synth.push(
      budgetTracked
        ? `**Budget : ${eur(budgetActual)} réel / ${eur(budgetPlanned)} prévu** → ${gapLabel(budgetGap, budgetPlanned)}`
        : `**Budget prévu : ${eur(budgetPlanned)}** — aucune dépense réelle saisie à ce jour`,
    );
  }
  synth.push(
    `Statut : ${PROJECT_STATUS_LABELS[project.status]} · Équipe : ${project.members.length} ${plural(project.members.length, 'membre', 'membres')} · Créé le ${project.createdAt.slice(0, 10)}`,
  );
  push(...synth.map((s) => `- ${s}`), '');

  /* --- Fiche projet --------------------------------------------------------- */
  push('## Fiche projet', '');
  if (project.description) push(`**Description** : ${clip(project.description, 500)}`, '');
  if (project.members.length > 0) {
    const team = project.members
      .map((m) => {
        const label = anonymize ? nameById.get(m.id)! : m.name;
        const role = clip(m.role, 40);
        return role ? `${label} (${role})` : label;
      })
      .join(' · ');
    push(`**Équipe** : ${team}`, '');
  }
  push(`**Outils utilisés dans ce projet** : ${tools.map((t) => TOOLS[t].label).join(', ') || 'aucun'}`, '');

  /* --- Jalons --------------------------------------------------------------- */
  if (milestones.length > 0) {
    push(`## Jalons (${milestones.length})`, '');
    push(
      ...table(
        ['Jalon', 'Échéance', 'État'],
        milestones.map((m) => {
          const state =
            m.status === 'done'
              ? 'atteint'
              : m.dueDate! < today
                ? `**en retard de ${diffDays(m.dueDate!, today)} j**`
                : `à venir (${relDays(today, m.dueDate!)})`;
          return [clip(m.title, 80), m.dueDate!, state];
        }),
      ),
      '',
    );
  }

  /* --- Actions en retard ---------------------------------------------------- */
  if (late.length > 0) {
    // Sans cette définition, le lecteur ne peut pas savoir si « terminée en
    // retard » est comptée ici — et passe un paragraphe à en douter.
    push(
      `## Actions en retard (${late.length})`,
      '',
      '« En retard » = échéance dépassée **et** action non terminée. Une action achevée après son échéance n’apparaît pas ici : elle est comptée comme terminée.',
      '',
    );
    push(
      ...table(
        ['Action', 'Responsable', 'Échéance', 'Retard', 'Bloque'],
        late.slice(0, MAX_LATE).map((a) => {
          const blocked = blockedTitles.get(a.id) ?? [];
          const blockedLabel =
            blocked.length === 0
              ? '—'
              : blocked.length === 1
                ? clip(blocked[0], 40)
                : `${clip(blocked[0], 40)} +${blocked.length - 1}`;
          return [
            clip(a.title, 80),
            who(a.responsibleId),
            a.dueDate!,
            `${diffDays(a.dueDate!, today)} j`,
            blockedLabel,
          ];
        }),
      ),
      '',
    );
    if (late.length > MAX_LATE) {
      push(`*(${late.length - MAX_LATE} autres actions en retard non listées.)*`, '');
    }
  }

  /* --- Actions ouvertes ------------------------------------------------------ */
  const lateIds = new Set(late.map((a) => a.id));
  const upcoming = open
    .filter((a) => !lateIds.has(a.id))
    // Les actions non datées passent en fin de liste, pas en tête.
    .sort((a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31'));
  if (upcoming.length > 0) {
    const shown = upcoming.slice(0, MAX_UPCOMING);
    const scope = shown.length < upcoming.length ? `${shown.length} sur ${upcoming.length}` : `${shown.length}`;
    push(
      `## Actions en cours et à venir (${scope}, par échéance)`,
      '',
      ...table(
        ['Action', 'Responsable', 'Échéance', 'Statut'],
        shown.map((a) => [
          clip(a.title, 80),
          who(a.responsibleId),
          a.dueDate ?? 'non datée',
          STATUS_LABELS[a.status],
        ]),
      ),
      '',
    );
    const rest: string[] = [];
    const far = upcoming.length - shown.length;
    if (far > 0) rest.push(`${far} ${plural(far, 'action ouverte plus lointaine', 'actions ouvertes plus lointaines')}`);
    if (done.length > 0) rest.push(`${done.length} ${plural(done.length, 'action terminée', 'actions terminées')}`);
    if (rest.length > 0) push(`*(${rest.join(' et ')} non ${plural(far + done.length, 'listée', 'listées')}.)*`, '');
  }

  /* --- Risques AMDEC --------------------------------------------------------- */
  if (has('amdec') && amdecs.length > 0) {
    push(
      `## Risques — AMDEC (${amdecs.length} ${plural(amdecs.length, 'risque analysé au total', 'risques analysés au total')})`,
      '',
      'Criticité = Gravité × Occurrence × Détectabilité, chacune cotée de 1 à 4 (maximum 64).',
      'Seuils : **critique à partir de 24**, à surveiller à partir de 12.',
      'La « criticité courante » utilisée ci-dessous est la criticité **réévaluée** après actions correctives lorsqu’elle a été saisie, sinon la criticité initiale — c’est elle qui classe le risque.',
      '',
    );
    const riskLine = (s: (typeof scored)[number]): string => {
      const e = s.entry;
      const parts = [`**${clip(e.element, 60)} — ${clip(e.failureMode, 80)}**`];
      if (e.cause) parts.push(`cause : ${clip(e.cause, 100)}`);
      if (e.effect) parts.push(`effet : ${clip(e.effect, 100)}`);
      const cot = `Criticité **${s.score}** (G${e.severity}×O${e.occurrence}×D${e.detection})`;
      const reval = s.residual !== null ? `, réévaluée à **${s.residual}**` : '';
      const linked = actions.filter((a) => a.amdecId === e.id);
      const cover = linked.length === 0
        ? ' *Aucune action corrective rattachée.*'
        : ` ${linked.length} ${plural(linked.length, 'action rattachée', 'actions rattachées')} (${linked.filter((a) => a.status === 'done').length} ${plural(linked.filter((a) => a.status === 'done').length, 'terminée', 'terminées')}).`;
      return `- ${parts.join(' — ')}. ${cot}${reval}.${cover}`;
    };

    if (critical.length > 0) {
      push(`### Critiques (${critical.length})`, '', ...critical.map(riskLine), '');
    }
    if (medium.length > 0) {
      push(`### À surveiller (${medium.length})`, '', ...medium.slice(0, MAX_MEDIUM_RISKS).map(riskLine), '');
      if (medium.length > MAX_MEDIUM_RISKS) {
        push(`*(${medium.length - MAX_MEDIUM_RISKS} autres risques à surveiller non listés.)*`, '');
      }
    }
    // « courante » : la criticité réévaluée si elle existe, sinon l'initiale —
    // un risque ramené sous le seuil par des actions atterrit donc ici.
    // Ne jamais écrire « autres » quand rien n'a été listé au-dessus : le
    // lecteur (humain ou IA) additionne alors les deux nombres.
    const low = scored.length - critical.length - medium.length;
    const listed = critical.length + Math.min(medium.length, MAX_MEDIUM_RISKS);
    if (listed === 0) {
      push(
        `Aucun risque n’atteint le seuil de surveillance : les ${amdecs.length} ${plural(amdecs.length, 'risque analysé a', 'risques analysés ont')} une criticité courante (réévaluée si elle existe, sinon initiale) inférieure à 12.`,
        '',
      );
    } else if (low > 0) {
      push(
        `*(${low} ${plural(low, 'autre risque', 'autres risques')} de criticité courante inférieure à 12, non ${plural(low, 'listé', 'listés')} — soit ${listed} ${plural(listed, 'risque détaillé', 'risques détaillés')} ci-dessus sur ${amdecs.length} au total.)*`,
        '',
      );
    }
    push('');
  }

  /* --- Budget ---------------------------------------------------------------- */
  if (has('couts') && input.costItems.length > 0) {
    // Sans aucun réel saisi, parler d'« écart » est faux : ce n'est pas une
    // économie, c'est un budget qui n'a pas encore été consommé (ou pas saisi).
    // Une IA lit « −100 % » comme une performance ; il faut lever l'ambiguïté.
    const engaged = input.costItems.filter((c) => c.actual > 0);
    push(`## Budget (${input.costItems.length} ${plural(input.costItems.length, 'ligne', 'lignes')})`, '');

    if (engaged.length === 0) {
      push(
        `**Budget prévu : ${eur(budgetPlanned)}. Aucune dépense réelle n’a été saisie à ce jour** — il n’y a donc pas d’écart à interpréter, ni économie ni dépassement.`,
        '',
      );
      const top = [...input.costItems]
        .sort((a, b) => costPlannedTotal(b) - costPlannedTotal(a))
        .slice(0, MAX_COST_LINES);
      push(
        `**Principaux postes prévus** : ${top.map((c) => `${clip(c.label, 50)} ${eur(costPlannedTotal(c))}`).join(' · ')}`,
        '',
      );
    } else {
      push(
        ...table(
          ['', 'Prévu', 'Réel', 'Écart'],
          [['**Total**', eur(budgetPlanned), eur(budgetActual), `**${gapLabel(budgetGap, budgetPlanned)}**`]],
        ),
        '',
      );
      // On ne compare que les lignes réellement engagées : mélanger une ligne
      // non saisie (réel 0) avec un vrai sous-coût fabrique un faux écart.
      const variances = engaged
        .map((c) => ({ c, v: costVariance(c) }))
        .filter((x) => x.v !== 0)
        .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
        .slice(0, MAX_COST_LINES);
      if (variances.length > 0) {
        push(
          `**Principaux écarts sur les lignes engagées** : ${variances.map((x) => `${clip(x.c.label, 50)} ${signedEur(x.v)}`).join(' · ')}`,
          '',
        );
      }
      const notEngaged = input.costItems.length - engaged.length;
      if (notEngaged > 0) {
        const plannedNotEngaged = input.costItems
          .filter((c) => c.actual <= 0)
          .reduce((s, c) => s + costPlannedTotal(c), 0);
        push(
          `*(${notEngaged} ${plural(notEngaged, 'ligne budgétaire sans dépense saisie', 'lignes budgétaires sans dépense saisie')}, soit ${eur(plannedNotEngaged)} prévus non encore engagés — non comptés dans les écarts ci-dessus.)*`,
          '',
        );
      }
    }
  }

  /* --- Résolutions de problème ----------------------------------------------- */
  if (has('rdp') && input.rdps.length > 0) {
    const openRdps = input.rdps.filter((r) => r.status === 'en_cours');
    const closedRdps = input.rdps.filter((r) => r.status !== 'en_cours');
    for (const rdp of openRdps) {
      push(...rdpSection(rdp, input, who));
    }
    if (closedRdps.length > 0) {
      push(
        `## Résolutions de problème clôturées (${closedRdps.length})`,
        '',
        ...closedRdps.map((r) => `- « ${clip(r.title, 80)} » — clôturée`),
        '',
      );
    }
  }

  /* --- Dernière revue --------------------------------------------------------- */
  if (has('revue')) {
    const lastClosed = input.revues
      .filter((r) => r.status === 'cloturee' && r.closedAt)
      .sort((a, b) => b.closedAt!.localeCompare(a.closedAt!))[0];
    if (lastClosed) {
      const snap = lastClosed.snapshot;
      push(
        `## Dernière revue — ${REVUE_TYPE_LABELS[lastClosed.type]} du ${lastClosed.closedAt!.slice(0, 10)}`,
        '',
        `« ${clip(lastClosed.title, 80)} »`,
        '',
      );
      const decisions = input.revueDecisions.filter((d) => d.revueId === lastClosed.id);
      if (decisions.length > 0) {
        push(
          '**Décisions prises en séance :**',
          '',
          ...decisions.slice(0, MAX_DECISIONS).map((d) => `- ${clip(d.content, 240)}`),
          '',
        );
        if (decisions.length > MAX_DECISIONS) {
          push(`*(${decisions.length - MAX_DECISIONS} autres décisions non listées.)*`, '');
        }
      }
      if (snap) {
        const facts: string[] = [];
        if (snap.createdActions?.length) {
          facts.push(`${snap.createdActions.length} ${plural(snap.createdActions.length, 'action décidée', 'actions décidées')} en séance`);
        }
        if (snap.doneSince?.length) {
          facts.push(`${snap.doneSince.length} ${plural(snap.doneSince.length, 'action terminée', 'actions terminées')} depuis la revue précédente`);
        }
        if (typeof snap.planningPct === 'number') {
          const delta = typeof snap.prevPlanningPct === 'number'
            ? ` (${snap.planningPct - snap.prevPlanningPct >= 0 ? '+' : '−'}${Math.abs(snap.planningPct - snap.prevPlanningPct)} pts vs revue précédente)`
            : '';
          facts.push(`avancement constaté à la clôture : ${snap.planningPct} %${delta}`);
        }
        if (facts.length > 0) push(`**Constat** : ${facts.join(' · ')}.`, '');
      }
    }
  }

  /* --- SWOT ------------------------------------------------------------------- */
  // Un item par ligne, jamais concaténés sur une seule : joints par un séparateur,
  // deux items se lisent comme une seule phrase dès que le document est recopié
  // (le séparateur saute au passage) — c'est ce qui a fait diagnostiquer à tort
  // une « donnée corrompue » sur un SWOT parfaitement valide.
  // Les items vides ne sont ni comptés ni rendus : un blanc entre deux
  // séparateurs est illisible et fausse le total annoncé.
  if (has('swot')) {
    const swotFilled = input.swotItems.filter((s) => clip(s.text, 200).length > 0);
    if (swotFilled.length > 0) {
      push('## Analyse SWOT', '');
      for (const q of SWOT_QUADRANTS) {
        const items = swotFilled.filter((s) => s.quadrant === q.id);
        if (items.length === 0) continue;
        push(`**${q.label} (${items.length})**`, '');
        push(...items.slice(0, MAX_SWOT_PER_QUADRANT).map((s) => `- ${clip(s.text, 200)}`));
        const hidden = items.length - MAX_SWOT_PER_QUADRANT;
        if (hidden > 0) {
          push(`- *(${hidden} ${plural(hidden, 'autre élément non listé', 'autres éléments non listés')}.)*`);
        }
        push('');
      }
    }
  }

  /* --- Charte A3 --------------------------------------------------------------- */
  if (has('a3') && input.a3Report) {
    const a3 = input.a3Report;
    const fields: [string, string][] = [
      ['Contexte', a3.contexte],
      ['Situation', a3.situation],
      ['Objectifs', a3.objectifs],
      ['Analyse', a3.analyse],
      ['Plan d’action', a3.plan],
      ['Suivi', a3.suivi],
    ];
    const filled = fields.filter(([, v]) => (v ?? '').trim().length > 0);
    if (filled.length > 0) {
      push('## Charte A3', '', ...filled.map(([k, v]) => `- **${k}** : ${clip(v, 400)}`), '');
    }
  }

  /* --- Pied de page ------------------------------------------------------------ */
  push(
    '---',
    '',
    '*Généré automatiquement par ENTAN. Les sections absentes correspondent à des outils non activés ou non renseignés sur ce projet.*',
    '*Données internes : vérifiez la politique de votre entreprise avant de les transmettre à un service d’IA externe.*',
  );

  // Jamais plus d'une ligne vide d'affilée : le document reste dense à lire.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/* --- Section d'une résolution de problème ------------------------------------ */

function rdpSection(
  rdp: Rdp,
  input: ProjectContextInput,
  who: (id: Id | undefined) => string,
): string[] {
  const phase = RDP_PHASES.find((p) => p.num === rdp.currentPhase);
  const out: string[] = [
    `## Résolution de problème — « ${clip(rdp.title, 80)} »`,
    '',
    `**Phase courante : ${rdp.currentPhase}/6${phase ? ` — ${phase.label}` : ''}** (démarche en 7 phases, de 0 « choisir un sujet » à 6 « standardiser »).`,
    '',
  ];

  const subject = input.rdpSubjects.find((s) => s.rdpId === rdp.id && s.retained);
  if (subject) {
    out.push(`**Sujet retenu** : ${clip(subject.label, 160)} — priorité ${subjectScore(subject)}/16 (fréquence ${subject.frequency} × impact ${subject.impact}, cotés 1–4).`, '');
  }

  const problem = input.rdpProblems.find((p) => p.rdpId === rdp.id);
  if (problem) {
    const qqoqcp: [string, string][] = [
      ['Quoi', problem.quoi],
      ['Qui', problem.qui],
      ['Où', problem.ou],
      ['Quand', problem.quand],
      ['Comment', problem.comment],
      ['Pourquoi', problem.pourquoi],
    ];
    const filled = qqoqcp.filter(([, v]) => (v ?? '').trim().length > 0);
    if (filled.length > 0) {
      out.push(`**Problème (QQOQCP)** : ${filled.map(([k, v]) => `${k} : ${clip(v, 120)}`).join(' · ')}`, '');
    }
    if (problem.ecart?.trim()) out.push(`**Écart mesuré** : ${clip(problem.ecart, 240)}`, '');
    if (problem.objectifs?.trim()) out.push(`**Objectif** : ${clip(problem.objectifs, 240)}`, '');
  }

  /* Causes racines : 5 Pourquoi (niveaux marqués racine) + Ishikawa (5M). */
  const roots: string[] = [];
  for (const analysis of input.fiveWhyAnalyses.filter((f) => f.rdpId === rdp.id)) {
    for (const level of analysis.levels) {
      if (level.isRootCause && level.becauseAnswer?.trim()) {
        roots.push(`${clip(level.becauseAnswer, 140)} *(5 Pourquoi)*`);
      }
    }
  }
  const ishikawa = input.ishikawaAnalyses.filter((i) => i.rdpId === rdp.id);
  const ishikawaCauses = ishikawa.flatMap((i) => i.causes);
  for (const c of ishikawaCauses) {
    if (c.causeText?.trim()) roots.push(`${clip(c.causeText, 140)} *(Ishikawa — ${c.category})*`);
  }
  if (roots.length > 0) {
    out.push(
      `**Causes identifiées (${roots.length})** :`,
      '',
      ...roots.slice(0, MAX_ROOT_CAUSES).map((r) => `- ${r}`),
      '',
    );
    if (roots.length > MAX_ROOT_CAUSES) {
      out.push(`*(${roots.length - MAX_ROOT_CAUSES} autres causes non listées.)*`, '');
    }
  }

  /* Solutions : les retenues d'abord ; sinon le haut du classement. */
  const solutions = input.rdpSolutions
    .filter((s) => s.rdpId === rdp.id)
    .sort((a, b) => solutionScore(b) - solutionScore(a));
  const retained = solutions.filter((s) => s.retained);
  const shownSolutions = retained.length > 0 ? retained : solutions.slice(0, 3);
  if (shownSolutions.length > 0) {
    out.push(
      retained.length > 0
        ? `**Solutions retenues** (score matrice de décision sur 12 = efficacité + facilité + coût, chacun coté 1–4) :`
        : `**Solutions envisagées, pas encore arbitrées** (score matrice sur 12) :`,
      '',
      ...shownSolutions.map((s) => {
        const desc = s.description?.trim() ? ` — ${clip(s.description, 160)}` : '';
        return `- **${clip(s.title, 80)}** (${solutionScore(s)}/12)${desc}`;
      }),
      '',
    );
    const notRetained = solutions.length - retained.length;
    if (retained.length > 0 && notRetained > 0) {
      out.push(`*(${notRetained} ${plural(notRetained, 'autre solution évaluée mais non retenue', 'autres solutions évaluées mais non retenues')}.)*`, '');
    }
  }

  const indicators = input.rdpIndicators.filter((i) => i.rdpId === rdp.id);
  if (indicators.length > 0) {
    out.push(
      '**Indicateurs de suivi** :',
      '',
      ...indicators.map((i) => {
        const unit = i.unit?.trim() ? ` ${i.unit.trim()}` : '';
        const freq = i.frequency?.trim() ? `, relevé ${i.frequency.trim()}` : '';
        const resp = i.responsibleId ? `, suivi par ${who(i.responsibleId)}` : '';
        return `- ${clip(i.name, 80)} : ${i.currentValue || '—'}${unit} → cible ${i.targetValue || '—'}${unit}${freq}${resp}`;
      }),
      '',
    );
  }

  /* Actions de la démarche (phases 5 et 6). */
  const rdpActions = input.actions.filter((a) => a.rdpId === rdp.id);
  if (rdpActions.length > 0) {
    const doneCount = rdpActions.filter((a) => a.status === 'done').length;
    out.push(
      `**Plan d’action de la démarche** : ${rdpActions.length} ${plural(rdpActions.length, 'action', 'actions')} dont ${doneCount} ${plural(doneCount, 'terminée', 'terminées')} — voir les sections Actions ci-dessus.`,
      '',
    );
  }

  return out;
}

/** Nom de fichier proposé au téléchargement. */
export function projectContextFilename(projectName: string, today: string): string {
  const slug = projectName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'projet';
  return `contexte-ia-${slug}-${today}.md`;
}
