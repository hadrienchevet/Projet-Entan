'use client';

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';
import type {
  Action,
  FiveWhyAnalysis,
  IshikawaAnalysis,
  IshikawaCategory,
  Project,
  Rdp,
  RdpIndicator,
  RdpProblem,
  RdpSolution,
  RdpSubject,
} from '@/lib/types';
import {
  CAPA_TYPE_LABELS,
  STATUS_LABELS,
  ISHIKAWA_CATEGORIES,
  solutionScore,
  subjectScore,
} from '@/lib/types';
import { ps, PdfHeader, PdfFooter, Stat, ACCENT, INK, MUTED, DOWN, UP, todayFr, dateFr, slugify, downloadBlob } from '@/lib/pdf/shared';

function nameOf(project: Project, id?: string): string {
  if (!id) return '—';
  return project.members.find((m) => m.id === id)?.name ?? '—';
}

/**
 * Rapport de résolution de problème (type 8D) : compile toute la démarche en
 * 7 phases (sujet → problème → causes → solutions → CAPA) dans un document
 * unique, avec bloc de validation à signer. Chargé en dynamique
 * (`import('./RdpPdf')`) → @react-pdf reste hors du bundle principal.
 */

export interface RdpReportData {
  project: Project;
  rdp: Rdp;
  subjects: RdpSubject[];
  problem: RdpProblem | null;
  indicators: RdpIndicator[];
  fiveWhys: FiveWhyAnalysis[];
  ishikawa: IshikawaAnalysis[];
  solutions: RdpSolution[];
  capa: Action[];
}

const PHASE_NAMES: Record<number, string> = {
  0: 'Choix du sujet',
  1: 'Description du problème',
  2: 'Analyse des causes',
  3: 'Recherche de solutions',
  4: 'Choix des solutions',
  5: 'Mise en œuvre',
  6: 'Standardisation',
};

const SectionTitle = ({ label }: { label: string }) => (
  <Text
    style={{
      fontSize: 10.5,
      fontFamily: 'Helvetica-Bold',
      color: ACCENT,
      marginTop: 16,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e3dc',
    }}
  >
    {label}
  </Text>
);

const Empty = ({ text }: { text: string }) => (
  <Text style={{ fontSize: 8.5, color: MUTED }}>{text}</Text>
);

const chipGreen = { backgroundColor: '#dcefdc', color: DOWN };
const chipRed = { backgroundColor: '#f5d6cb', color: UP };
const chip = {
  fontSize: 7,
  fontFamily: 'Helvetica-Bold',
  borderRadius: 3,
  paddingVertical: 1,
  paddingHorizontal: 4,
} as const;

/** Encadré libellé + texte (QQOQCP, situations…). */
const Box = ({ label, text, flex = 1, mr = false }: { label: string; text: string; flex?: number; mr?: boolean }) => (
  <View style={{ flex, marginRight: mr ? 6 : 0, borderWidth: 1, borderColor: '#e5e3dc', borderRadius: 4, padding: 6, marginBottom: 6 }}>
    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, marginBottom: 2 }}>{label}</Text>
    <Text style={{ fontSize: 8.5, lineHeight: 1.35, color: text ? INK : MUTED }}>{text || '—'}</Text>
  </View>
);

function CapaTable({ project, actions }: { project: Project; actions: Action[] }) {
  const cols = [
    { label: 'Action', w: '38%' as const },
    { label: 'Type', w: '12%' as const, c: true },
    { label: 'Responsable', w: '20%' as const },
    { label: 'Échéance', w: '14%' as const, c: true },
    { label: 'Statut', w: '16%' as const, c: true },
  ];
  return (
    <View>
      <View style={ps.thead}>
        {cols.map((c) => (
          <Text key={c.label} style={[ps.th, { width: c.w }, ...(c.c ? [ps.center] : [])]}>{c.label}</Text>
        ))}
      </View>
      {actions.map((a, i) => (
        <View key={a.id} style={i % 2 ? [ps.row, ps.rowAlt] : [ps.row]} wrap={false}>
          <View style={[ps.td, { width: '38%' }]}>
            <Text style={ps.bold}>{a.title}</Text>
            {a.description ? <Text style={{ color: MUTED, marginTop: 1 }}>{a.description}</Text> : null}
          </View>
          <Text style={[ps.td, { width: '12%' }, ps.center]}>{CAPA_TYPE_LABELS[a.capaType ?? 'corrective']}</Text>
          <Text style={[ps.td, { width: '20%' }]}>{nameOf(project, a.responsibleId)}</Text>
          <Text style={[ps.td, { width: '14%' }, ps.center]}>{dateFr(a.dueDate)}</Text>
          <Text style={[ps.td, { width: '16%' }, ps.center]}>
            {STATUS_LABELS[a.status]}{a.capaVerified ? ' (vérifiée)' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Bloc de validation à signer (rédaction / vérification / approbation). */
const SignatureBlock = () => (
  <View wrap={false} style={{ marginTop: 18 }}>
    <SectionTitle label="Validation" />
    <View style={{ flexDirection: 'row' }}>
      {['Rédigé par', 'Vérifié par', 'Approuvé par'].map((role, i) => (
        <View
          key={role}
          style={{
            flex: 1,
            marginRight: i < 2 ? 6 : 0,
            borderWidth: 1,
            borderColor: '#e5e3dc',
            borderRadius: 4,
            padding: 8,
            minHeight: 74,
          }}
        >
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>{role}</Text>
          <Text style={{ fontSize: 8, color: MUTED, marginBottom: 5 }}>Nom :</Text>
          <Text style={{ fontSize: 8, color: MUTED, marginBottom: 5 }}>Date :</Text>
          <Text style={{ fontSize: 8, color: MUTED }}>Signature :</Text>
        </View>
      ))}
    </View>
  </View>
);

export function RdpReport({ data }: { data: RdpReportData }) {
  const { project, rdp, subjects, problem, indicators, fiveWhys, ishikawa, solutions, capa } = data;

  const sortedSubjects = [...subjects].sort((a, b) => subjectScore(b) - subjectScore(a));
  const sortedSolutions = [...solutions].sort((a, b) => solutionScore(b) - solutionScore(a));
  const allCauses = ishikawa.flatMap((a) => a.causes);
  const causeText = (id?: string) => (id ? allCauses.find((c) => c.id === id)?.causeText ?? '—' : '—');
  const retainedSolutions = solutions.filter((s) => s.retained).length;
  const capaClosed = capa.filter((a) => a.status === 'done').length;
  const capa5 = capa.filter((a) => a.rdpPhase === 5);
  const capa6 = capa.filter((a) => a.rdpPhase === 6);
  const phase = PHASE_NAMES[rdp.currentPhase] ?? PHASE_NAMES[0];
  const subtitle = `${project.name} · Phase actuelle : ${rdp.currentPhase} — ${phase} · ${todayFr()}`;

  const val = (k: keyof RdpProblem) => (problem ? ((problem[k] as string) ?? '') : '');

  // Causes Ishikawa groupées par nature (5M), catégories hors liste incluses à la suite.
  const categories: IshikawaCategory[] = [
    ...ISHIKAWA_CATEGORIES,
    ...([...new Set(allCauses.map((c) => c.category))].filter((c) => !ISHIKAWA_CATEGORIES.includes(c)) as IshikawaCategory[]),
  ];

  return (
    <Document title={`Rapport RDP - ${rdp.title}`} author="ENTAN">
      <Page size="A4" style={ps.page}>
        <PdfHeader title={`Résolution de problème — ${rdp.title}`} subtitle={subtitle} />

        <View style={ps.statRow}>
          <Stat value={subjects.length} label="Sujets étudiés" />
          <Stat value={allCauses.length} label="Causes identifiées (Ishikawa)" />
          <Stat value={solutions.length ? `${retainedSolutions}/${solutions.length}` : '—'} label="Solutions retenues" />
          <Stat value={capa.length ? `${capaClosed}/${capa.length}` : '—'} label="Actions CAPA clôturées" last />
        </View>

        {/* Phase 0 — sujets priorisés */}
        <SectionTitle label="0 · Choix du sujet" />
        {sortedSubjects.length === 0 ? (
          <Empty text="Aucun sujet renseigné." />
        ) : (
          <View>
            <View style={ps.thead}>
              <Text style={[ps.th, { width: '52%' }]}>Sujet</Text>
              <Text style={[ps.th, { width: '12%' }, ps.center]}>Fréquence</Text>
              <Text style={[ps.th, { width: '12%' }, ps.center]}>Impact</Text>
              <Text style={[ps.th, { width: '12%' }, ps.center]}>Score</Text>
              <Text style={[ps.th, { width: '12%' }, ps.center]}>Retenu</Text>
            </View>
            {sortedSubjects.map((s, i) => (
              <View key={s.id} style={i % 2 ? [ps.row, ps.rowAlt] : [ps.row]} wrap={false}>
                <Text style={[ps.td, { width: '52%' }, ...(s.retained ? [ps.bold] : [])]}>{s.label}</Text>
                <Text style={[ps.td, { width: '12%' }, ps.center]}>{s.frequency}</Text>
                <Text style={[ps.td, { width: '12%' }, ps.center]}>{s.impact}</Text>
                <Text style={[ps.td, { width: '12%' }, ps.center, ps.bold]}>{subjectScore(s)}</Text>
                <View style={[ps.td, { width: '12%' }, { alignItems: 'center' }]}>
                  {s.retained ? <Text style={[chip, chipGreen]}>Retenu</Text> : <Text style={{ color: MUTED }}>—</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Phase 1 — QQOQCP + situations + indicateurs */}
        <SectionTitle label="1 · Description du problème (QQOQCP)" />
        <View style={{ flexDirection: 'row' }}>
          <Box label="Quoi ?" text={val('quoi')} mr />
          <Box label="Qui ?" text={val('qui')} mr />
          <Box label="Où ?" text={val('ou')} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Box label="Quand ?" text={val('quand')} mr />
          <Box label="Comment ?" text={val('comment')} mr />
          <Box label="Pourquoi ?" text={val('pourquoi')} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Box label="Situation actuelle" text={val('situationActuelle')} mr />
          <Box label="Situation souhaitée" text={val('situationSouhaitee')} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Box label="Écart" text={val('ecart')} mr />
          <Box label="Objectifs" text={val('objectifs')} />
        </View>
        {indicators.length > 0 && (
          <View style={{ marginTop: 2 }}>
            <View style={ps.thead}>
              <Text style={[ps.th, { width: '26%' }]}>Indicateur</Text>
              <Text style={[ps.th, { width: '10%' }, ps.center]}>Unité</Text>
              <Text style={[ps.th, { width: '16%' }, ps.center]}>Valeur actuelle</Text>
              <Text style={[ps.th, { width: '16%' }, ps.center]}>Cible</Text>
              <Text style={[ps.th, { width: '16%' }, ps.center]}>Relevé</Text>
              <Text style={[ps.th, { width: '16%' }]}>Responsable</Text>
            </View>
            {indicators.map((ind, i) => (
              <View key={ind.id} style={i % 2 ? [ps.row, ps.rowAlt] : [ps.row]} wrap={false}>
                <Text style={[ps.td, { width: '26%' }]}>{ind.name}</Text>
                <Text style={[ps.td, { width: '10%' }, ps.center]}>{ind.unit || '—'}</Text>
                <Text style={[ps.td, { width: '16%' }, ps.center]}>{ind.currentValue || '—'}</Text>
                <Text style={[ps.td, { width: '16%' }, ps.center]}>{ind.targetValue || '—'}</Text>
                <Text style={[ps.td, { width: '16%' }, ps.center]}>{ind.frequency || '—'}</Text>
                <Text style={[ps.td, { width: '16%' }]}>{nameOf(project, ind.responsibleId)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Phase 2 — Ishikawa + 5 Pourquoi */}
        <SectionTitle label="2 · Analyse des causes" />
        {ishikawa.length === 0 && fiveWhys.length === 0 && <Empty text="Aucune analyse de causes renseignée." />}
        {ishikawa.map((a) => (
          <View key={a.id} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Ishikawa (5M) — {a.title}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, marginBottom: 4 }}>Effet observé : {a.effect || '—'}</Text>
            {categories
              .filter((cat) => a.causes.some((c) => c.category === cat))
              .map((cat) => (
                <View key={cat} style={{ flexDirection: 'row', marginBottom: 2 }} wrap={false}>
                  <Text style={{ width: '18%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{cat}</Text>
                  <Text style={{ width: '82%', fontSize: 8.5, lineHeight: 1.35 }}>
                    {a.causes.filter((c) => c.category === cat).map((c) => c.causeText).join(' · ')}
                  </Text>
                </View>
              ))}
          </View>
        ))}
        {fiveWhys.map((a) => (
          <View key={a.id} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>5 Pourquoi — {a.title}</Text>
            {a.problemStatement ? (
              <Text style={{ fontSize: 8.5, color: MUTED, marginBottom: 4 }}>Problème : {a.problemStatement}</Text>
            ) : null}
            {a.levels.length === 0 ? (
              <Empty text="Aucun niveau renseigné." />
            ) : (
              a.levels.map((l) => (
                <View key={l.id} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }} wrap={false}>
                  <Text style={{ width: '18%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Pourquoi {l.levelNum} ?</Text>
                  <Text style={{ width: l.isRootCause ? '66%' : '82%', fontSize: 8.5, lineHeight: 1.35 }}>
                    {l.whyQuestion ? `${l.whyQuestion} — ` : ''}{l.becauseAnswer || '—'}
                  </Text>
                  {l.isRootCause ? (
                    <View style={{ width: '16%', alignItems: 'flex-end' }}>
                      <Text style={[chip, chipRed]}>Cause racine</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ))}

        {/* Phases 3-4 — matrice de décision */}
        <SectionTitle label="3-4 · Solutions — matrice de décision" />
        {sortedSolutions.length === 0 ? (
          <Empty text="Aucune solution renseignée." />
        ) : (
          <View>
            <View style={ps.thead}>
              <Text style={[ps.th, { width: '32%' }]}>Solution</Text>
              <Text style={[ps.th, { width: '24%' }]}>Cause traitée</Text>
              <Text style={[ps.th, { width: '8%' }, ps.center]}>Eff.</Text>
              <Text style={[ps.th, { width: '8%' }, ps.center]}>Fac.</Text>
              <Text style={[ps.th, { width: '8%' }, ps.center]}>Coût</Text>
              <Text style={[ps.th, { width: '10%' }, ps.center]}>Score /12</Text>
              <Text style={[ps.th, { width: '10%' }, ps.center]}>Retenue</Text>
            </View>
            {sortedSolutions.map((s, i) => (
              <View key={s.id} style={i % 2 ? [ps.row, ps.rowAlt] : [ps.row]} wrap={false}>
                <View style={[ps.td, { width: '32%' }]}>
                  <Text style={s.retained ? ps.bold : undefined}>{s.title}</Text>
                  {s.description ? <Text style={{ color: MUTED, marginTop: 1 }}>{s.description}</Text> : null}
                </View>
                <Text style={[ps.td, { width: '24%' }]}>{causeText(s.causeId)}</Text>
                <Text style={[ps.td, { width: '8%' }, ps.center]}>{s.effectiveness}</Text>
                <Text style={[ps.td, { width: '8%' }, ps.center]}>{s.ease}</Text>
                <Text style={[ps.td, { width: '8%' }, ps.center]}>{s.cost}</Text>
                <Text style={[ps.td, { width: '10%' }, ps.center, ps.bold]}>{solutionScore(s)}</Text>
                <View style={[ps.td, { width: '10%' }, { alignItems: 'center' }]}>
                  {s.retained ? <Text style={[chip, chipGreen]}>Retenue</Text> : <Text style={{ color: MUTED }}>—</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Phases 5-6 — CAPA */}
        <SectionTitle label="5 · Mise en œuvre — plan d'action" />
        {capa5.length === 0 ? <Empty text="Aucune action de mise en œuvre." /> : <CapaTable project={project} actions={capa5} />}
        <SectionTitle label="6 · Standardisation" />
        {capa6.length === 0 ? <Empty text="Aucune action de standardisation." /> : <CapaTable project={project} actions={capa6} />}

        <SignatureBlock />
        <PdfFooter />
      </Page>
    </Document>
  );
}

/** Génère le rapport complet et déclenche le téléchargement. */
export async function exportRdpPdf(data: RdpReportData): Promise<void> {
  const blob = await pdf(<RdpReport data={data} />).toBlob();
  downloadBlob(blob, `Rapport-RDP-${slugify(data.rdp.title)}.pdf`);
}
