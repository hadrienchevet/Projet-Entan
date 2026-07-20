import type { ReactElement } from 'react';
import {
  IconA3,
  IconActions,
  IconAmdec,
  IconBulb,
  IconCost,
  IconHelp,
  IconPlanning,
  IconRaci,
  IconSwot,
  IconTree,
} from '@/components/icons';

/**
 * Page « Aide & Tutoriel » — un véritable cours de gestion de projet :
 * rôle et intérêt de chaque outil (avec un exemple imagé), puis l’intérêt de
 * les combiner. Contenu sémantique (h1/h2/h3) pensé pour servir de base de
 * référencement.
 */

interface ToolGuide {
  icon: ReactElement;
  name: string;
  tagline: string;
  what: string;
  why: string;
  link: string;
  /** Mini-illustration concrète de l’outil. */
  example: ReactElement;
}

const TOOLS: ToolGuide[] = [
  {
    icon: <IconSwot />,
    name: 'SWOT',
    tagline: 'Cadrer la situation',
    what: 'La matrice SWOT recense les Forces et Faiblesses (internes) ainsi que les Opportunités et Menaces (externes) de votre projet ou de votre organisation.',
    why: 'Avant de se lancer, elle oblige à regarder la réalité en face : sur quoi s’appuyer, que corriger, que saisir, qu’anticiper. C’est le point de départ stratégique d’un projet.',
    link: 'Les menaces identifiées alimentent naturellement l’AMDEC, et les faiblesses se transforment en actions d’amélioration.',
    example: (
      <div className="ex-swot">
        <div className="s"><b>Forces</b>Équipe expérimentée</div>
        <div className="w"><b>Faiblesses</b>Machines vieillissantes</div>
        <div className="o"><b>Opportunités</b>Nouveau marché export</div>
        <div className="t"><b>Menaces</b>Délais fournisseurs</div>
      </div>
    ),
  },
  {
    icon: <IconRaci />,
    name: 'RACI',
    tagline: 'Clarifier qui fait quoi',
    what: 'La matrice RACI attribue à chaque action un Responsible (réalise), un Accountable (rend des comptes), des Consulted (avis) et des Informed (tenus au courant).',
    why: 'La première cause de retard d’un projet, c’est le flou sur les responsabilités. Le RACI supprime les « je croyais que c’était toi » et garantit qu’une action a toujours un responsable unique.',
    link: 'Chaque rôle est porté par une action réelle : la responsabilité suit la tâche jusque dans le plan d’action et le planning, sans ressaisie.',
    example: (
      <div className="ex-raci">
        <div className="act">Action : valider le plan qualité</div>
        <div className="roles">
          <span className="role"><b>R</b> Claire</span>
          <span className="role"><b>A</b> Marc</span>
          <span className="role"><b>C</b> Sonia</span>
          <span className="role"><b>I</b> Équipe</span>
        </div>
      </div>
    ),
  },
  {
    icon: <IconAmdec />,
    name: 'AMDEC',
    tagline: 'Anticiper les risques',
    what: 'L’AMDEC (Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité) note chaque risque selon trois critères — Gravité, Occurrence, Détectabilité — et en calcule la Criticité (G × O × D).',
    why: 'Plutôt que de subir les pannes, on les hiérarchise : l’effort se concentre sur les risques les plus critiques, avant qu’ils ne coûtent cher. C’est le cœur de la démarche qualité industrielle.',
    link: 'Un risque critique se transforme en un clic en action corrective, reliée à l’AMDEC d’origine : la traçabilité va du risque à sa parade.',
    example: (
      <div className="ex-amdec">
        <span>Arrêt inopiné du convoyeur</span>
        <span className="calc">
          G&nbsp;<b>4</b> × O&nbsp;<b>3</b> × D&nbsp;<b>2</b> ={' '}
          <span className="crit">24 · Critique</span>
        </span>
      </div>
    ),
  },
  {
    icon: <IconActions />,
    name: 'Actions',
    tagline: 'Exécuter le plan',
    what: 'Le plan d’action liste les tâches à mener : titre, description, responsable, échéance et statut (à faire / en cours / terminé).',
    why: 'C’est le moteur du projet : sans plan d’action suivi, la meilleure analyse reste lettre morte. Il transforme les intentions en tâches datées et assignées.',
    link: 'L’action est l’entité centrale de l’app : elle porte son RACI, apparaît dans le planning, peut être chiffrée dans les coûts et découler d’une AMDEC.',
    example: (
      <div className="ex-action">
        <span className="st">En cours</span>
        <span>Remplacer les roulements du convoyeur</span>
        <span className="due">éch. 30 juin · Marc</span>
      </div>
    ),
  },
  {
    icon: <IconPlanning />,
    name: 'Planning',
    tagline: 'Tenir les délais',
    what: 'Le planning affiche les actions sur un calendrier et un diagramme de Gantt : dates de début, échéances, retards et charge à venir.',
    why: 'Il rend le temps visible : on repère d’un coup d’œil les retards, les goulots et les semaines chargées, et on réagit avant l’embouteillage.',
    link: 'Le planning ne stocke aucune donnée propre : c’est une vue des actions. Changer une échéance dans le plan d’action met le Gantt à jour instantanément.',
    example: (
      <div className="ex-gantt">
        <div>
          <div className="lbl">Diagnostic</div>
          <div className="track"><span className="bar" style={{ left: '4%', width: '28%' }} /></div>
        </div>
        <div>
          <div className="lbl">Commande des pièces</div>
          <div className="track"><span className="bar late" style={{ left: '26%', width: '34%' }} /></div>
        </div>
        <div>
          <div className="lbl">Montage</div>
          <div className="track"><span className="bar" style={{ left: '58%', width: '30%' }} /></div>
        </div>
      </div>
    ),
  },
  {
    icon: <IconCost />,
    name: 'Coûts',
    tagline: 'Maîtriser le budget',
    what: 'Le module Coûts suit le budget prévu face au coût réel, calcule l’écart et le taux de consommation, poste par poste.',
    why: 'Un projet qui tient les délais mais explose le budget reste un échec. Le suivi des coûts garde la dimension économique sous contrôle.',
    link: 'Les dépenses se rattachent au projet et à ses actions : chaque coût est relié à ce qui le génère.',
    example: (
      <div className="ex-cost">
        <div className="line">
          Prévu <b>10 000 €</b> · réel <b>11 200 €</b> · <span className="over">écart +12 %</span>
        </div>
        <div className="bar"><span /></div>
      </div>
    ),
  },
  {
    icon: <IconTree />,
    name: 'Liens',
    tagline: 'Voir les relations',
    what: 'La vue Liens dessine l’arborescence des relations entre risques, actions et éléments du projet.',
    why: 'Elle donne la vision d’ensemble : comprendre d’où vient une action, ce qu’un risque déclenche, comment tout s’enchaîne — pour expliquer et pour ne rien oublier.',
    link: 'C’est la carte qui matérialise le fil rouge entre tous les modules.',
    example: (
      <div className="ex-link">
        <span className="node"><small>Risque</small>Arrêt convoyeur</span>
        <span className="arr">→</span>
        <span className="node"><small>Action</small>Maintenance préventive</span>
        <span className="arr">→</span>
        <span className="node"><small>Élément</small>Roulements</span>
      </div>
    ),
  },
  {
    icon: <IconA3 />,
    name: 'Charte A3',
    tagline: 'Synthétiser sur une page',
    what: 'La charte A3 condense tout le projet sur une seule page : contexte, situation, objectifs, analyse, plan d’action et suivi.',
    why: 'Héritée du lean (Toyota), elle impose la clarté : si ça ne tient pas sur une feuille A3, c’est que ce n’est pas assez mûr. Idéale pour communiquer et standardiser.',
    link: 'L’A3 agrège des données déjà saisies ailleurs : c’est une synthèse, pas une ressaisie.',
    example: (
      <div className="ex-a3">
        <div className="full"><b>Contexte</b>Fiabiliser la ligne A3</div>
        <div><b>Objectifs</b>−50 % d’arrêts</div>
        <div><b>Analyse</b>Ishikawa + AMDEC</div>
        <div className="full"><b>Plan &amp; suivi</b>5 actions · 80 % avancées</div>
      </div>
    ),
  },
];

const FLOW = ['SWOT', 'AMDEC', 'Actions', 'RACI', 'Planning', 'Coûts', 'A3'];

const css = `
.page-header h1 .ic { color: var(--accent); display: inline-flex; }
.page-header h1 .ic svg { width: 22px; height: 22px; flex-shrink: 0; }
.guide h2 { font-size: 18px; margin: 0 0 4px; }
.guide .lead { color: var(--text-secondary); margin: 0 0 16px; line-height: 1.7; }
.guide-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.guide-tool h3 { display: flex; align-items: center; gap: 9px; font-size: 15px; margin: 0; }
.guide-tool h3 .ic { color: var(--accent); display: inline-flex; }
.guide-tool h3 .ic svg { width: 18px; height: 18px; }
.guide-tool .tagline { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 4px 0 12px; }
.guide-tool p { color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 8px 0; }
.guide-tool p .lbl { color: var(--text); font-weight: 600; }
.guide-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 4px 0 18px; }
.guide-flow .step { background: var(--accent-soft); color: var(--accent-text); border-radius: 999px; padding: 6px 13px; font-weight: 600; font-size: 13px; }
.guide-flow .arrow { color: var(--text-muted); font-weight: 700; }
.guide-benefits { margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8; }
.guide-benefits strong { color: var(--text); }
.guide-steps { margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.9; }

/* --- Exemples imagés ---------------------------------------------------- */
.guide-example { margin-top: 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 11px 12px; }
.guide-example .cap { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 9px; }

.ex-swot { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.ex-swot > div { border-radius: 6px; padding: 6px 8px; font-size: 11.5px; line-height: 1.3; color: var(--text); }
.ex-swot b { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); margin-bottom: 2px; }
.ex-swot .s { background: var(--success-soft); }
.ex-swot .w { background: var(--danger-soft); }
.ex-swot .o { background: var(--accent-soft); }
.ex-swot .t { background: var(--warning-soft); }

.ex-raci .act { font-size: 12.5px; font-weight: 600; margin-bottom: 9px; }
.ex-raci .roles { display: flex; flex-wrap: wrap; gap: 6px; }
.ex-raci .role { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 3px 9px 3px 4px; }
.ex-raci .role b { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); color: #fff; display: grid; place-items: center; font-size: 9.5px; font-weight: 700; }

.ex-amdec { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 12.5px; }
.ex-amdec .calc b { color: var(--text); }
.ex-amdec .crit { background: var(--danger-soft); color: var(--danger); border: 1px solid var(--danger-border); border-radius: 999px; padding: 2px 9px; font-weight: 700; font-size: 11.5px; }

.ex-action { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12.5px; }
.ex-action .st { background: var(--accent-soft); color: var(--accent-text); border-radius: 999px; padding: 2px 9px; font-weight: 600; font-size: 11px; }
.ex-action .due { color: var(--text-muted); margin-left: auto; font-size: 11.5px; }

.ex-gantt { display: grid; gap: 7px; }
.ex-gantt .lbl { font-size: 11px; color: var(--text-secondary); margin-bottom: 3px; }
.ex-gantt .track { position: relative; height: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; }
.ex-gantt .bar { position: absolute; top: 2px; height: 8px; border-radius: 4px; background: var(--accent); }
.ex-gantt .bar.late { background: var(--danger); }

.ex-cost .line { font-size: 12.5px; margin-bottom: 9px; }
.ex-cost .line b { color: var(--text); }
.ex-cost .over { color: var(--danger); font-weight: 600; }
.ex-cost .bar { height: 9px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
.ex-cost .bar span { display: block; height: 100%; width: 100%; background: var(--danger); }

.ex-link { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; }
.ex-link .node { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 5px 9px; }
.ex-link .node small { display: block; color: var(--text-muted); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; }
.ex-link .arr { color: var(--text-muted); font-weight: 700; }

.ex-a3 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.ex-a3 > div { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; font-size: 11px; color: var(--text-secondary); }
.ex-a3 .full { grid-column: 1 / -1; }
.ex-a3 b { display: block; color: var(--text); font-size: 11px; margin-bottom: 1px; }
`;

export interface HelpPageProps {
  title?: string;
  subtitle?: string;
  /** Masque la section vidéo (utile pour la page publique). */
  showVideo?: boolean;
}

export function HelpPage({
  title = 'Aide & Tutoriel',
  subtitle = 'Un guide complet des outils de gestion de projet — et de l’intérêt de les combiner.',
  showVideo = true,
}: HelpPageProps = {}) {
  return (
    <div className="page guide">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ic"><IconHelp /></span> {title}
          </h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>

      {showVideo && (
        <div className="card">
          <div className="card-body">
            <h2 style={{ marginBottom: 4 }}>Visite guidée en vidéo</h2>
            <p className="lead">Une vue d’ensemble de Projet Entan en quelques minutes.</p>
            <div
              style={{
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-modal)',
                border: '1px solid var(--border)',
              }}
            >
              <video
                src="/projet-entan.mp4"
                style={{ width: '100%', height: '100%', display: 'block' }}
                controls
                muted
                loop
                playsInline
              />
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <a
                href="/projet-entan.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Ouvrir la vidéo en plein écran →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Intro */}
      <div className="card">
        <div className="card-body">
          <h2>La gestion de projet, en bref</h2>
          <p className="lead" style={{ marginBottom: 0 }}>
            Mener un projet industriel, c’est jongler avec quatre exigences à la fois : <strong>cadrer</strong>{' '}
            la situation, <strong>répartir</strong> clairement les responsabilités, <strong>anticiper</strong>{' '}
            les risques, puis <strong>exécuter</strong> en tenant les délais et le budget. Chaque outil
            ci-dessous répond à l’une de ces exigences. La force de Projet Entan, c’est qu’ils ne sont pas
            cloisonnés : ils partagent un <strong>modèle de données unique</strong>, où chaque information n’est
            saisie qu’une seule fois.
          </p>
        </div>
      </div>

      {/* Les outils un par un */}
      <div className="card">
        <div className="card-body">
          <h2>Les outils, un par un</h2>
          <p className="lead">
            Chacun a une valeur propre. Pour chaque outil : à quoi il sert, pourquoi il est utile, comment il
            se connecte aux autres, et un exemple concret.
          </p>
          <div className="guide-grid">
            {TOOLS.map((t) => (
              <div key={t.name} className="card guide-tool">
                <div className="card-body">
                  <h3>
                    <span className="ic">{t.icon}</span>
                    {t.name}
                  </h3>
                  <div className="tagline">{t.tagline}</div>
                  <p>{t.what}</p>
                  <p>
                    <span className="lbl">L’intérêt — </span>
                    {t.why}
                  </p>
                  <p>
                    <span className="lbl">Lien avec le reste — </span>
                    {t.link}
                  </p>
                  <div className="guide-example">
                    <div className="cap">Exemple</div>
                    {t.example}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Combiner */}
      <div className="card">
        <div className="card-body">
          <h2>L’intérêt de les combiner</h2>
          <p className="lead">
            Pris isolément, chaque outil est utile. Reliés, ils forment un système de pilotage où l’information
            circule sans rupture — c’est là que se crée la vraie valeur.
          </p>

          <h3 style={{ fontSize: 14, margin: '12px 0 6px' }}>Un fil rouge naturel</h3>
          <div className="guide-flow" aria-label="Enchaînement des outils">
            {FLOW.map((step, i) => (
              <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="step">{step}</span>
                {i < FLOW.length - 1 && <span className="arrow">→</span>}
              </span>
            ))}
          </div>
          <p className="lead">
            On <strong>cadre</strong> avec le SWOT, on <strong>analyse les risques</strong> en AMDEC, qui{' '}
            <strong>génère des actions</strong>. Chaque action reçoit son <strong>RACI</strong>, se positionne
            dans le <strong>planning</strong>, se <strong>chiffre</strong> dans les coûts, et le tout se{' '}
            <strong>synthétise</strong> dans une charte A3. La vue <strong>Liens</strong> en donne la carte.
          </p>

          <h3 style={{ fontSize: 14, margin: '16px 0 6px' }}>Ce que ça change concrètement</h3>
          <ul className="guide-benefits">
            <li>
              <strong>Zéro double saisie</strong> : une action n’existe qu’une fois ; elle apparaît dans le plan
              d’action, le planning, le RACI et les coûts — toujours la même donnée.
            </li>
            <li>
              <strong>Traçabilité de bout en bout</strong> : du risque stratégique (SWOT/AMDEC) jusqu’à la tâche
              datée et son responsable.
            </li>
            <li>
              <strong>Vision 360°</strong> : risques, responsabilités, délais et budget au même endroit, à jour
              en temps réel pour toute l’équipe.
            </li>
            <li>
              <strong>Un dossier projet présentable</strong> : l’A3 et les Liens donnent une synthèse cohérente,
              sans repartir d’une feuille blanche.
            </li>
          </ul>
        </div>
      </div>

      {/* RDP */}
      <div className="card">
        <div className="card-body">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
              <IconBulb />
            </span>
            Et la résolution de problèmes (RDP) ?
          </h2>
          <p className="lead" style={{ marginBottom: 0 }}>
            Au-delà de la gestion de projet, Projet Entan propose un second mode : la{' '}
            <strong>Résolution de Problèmes</strong>, une démarche structurée en 7 phases (sujet, QQOQCP,
            Ishikawa 5M, 5 Pourquoi, matrice de décision, PDCA, standardisation). Quand un projet bute sur un
            problème de fond, on bascule en mode RDP pour le traiter à la racine plutôt qu’en surface.
          </p>
        </div>
      </div>

      {/* Par où commencer */}
      <div className="card">
        <div className="card-body">
          <h2>Par où commencer</h2>
          <ol className="guide-steps">
            <li>Créez un projet (mode gestion ou résolution de problèmes).</li>
            <li>Constituez l’équipe et posez le RACI.</li>
            <li>Listez les risques en AMDEC, puis générez les actions correctives.</li>
            <li>Complétez le plan d’action, fixez les échéances et suivez le planning.</li>
            <li>Chiffrez dans les coûts, puis synthétisez le tout dans une charte A3.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
