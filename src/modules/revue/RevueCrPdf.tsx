'use client';

/**
 * Export PDF du compte-rendu de revue. Même structure que `A3Pdf.tsx` (un doc +
 * une fonction d'export), et chargé en dynamique par `RevueCrView` pour garder
 * @react-pdf hors du bundle principal.
 *
 * Comme la vue écran, ne lit QUE le snapshot : le PDF doit être la copie exacte
 * du document figé.
 */

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';
import type { Revue, RevueActionLine, RevueDecision } from '@/lib/types';
import {
  ps,
  PdfHeader,
  PdfFooter,
  Stat,
  ACCENT,
  MUTED,
  INK,
  dateFr,
  slugify,
  downloadBlob,
} from '@/lib/pdf/shared';

const dt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const SectionTitle = ({ n, label }: { n: number; label: string }) => (
  <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: ACCENT, marginTop: 12, marginBottom: 5 }}>
    {n} · {label}
  </Text>
);

const Line = ({ title, sub }: { title: string; sub: string }) => (
  <View style={{ marginBottom: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eceae3' }}>
    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{title}</Text>
    <Text style={{ fontSize: 8, color: MUTED, marginTop: 1 }}>{sub}</Text>
  </View>
);

const Empty = ({ children }: { children: string }) => (
  <Text style={{ fontSize: 8.5, color: MUTED, fontStyle: 'italic' }}>{children}</Text>
);

function actionLines(lines: RevueActionLine[] | undefined, empty: string) {
  if (!lines || lines.length === 0) return <Empty>{empty}</Empty>;
  return (
    <>
      {lines.map((l, i) => (
        <Line
          key={`${l.title}-${i}`}
          title={l.title}
          sub={`${l.responsible}${l.dueDate ? ` · échéance ${dateFr(l.dueDate)}` : ' · sans échéance'}`}
        />
      ))}
    </>
  );
}

function CrDoc({
  projectName,
  revue,
  attendees,
  decisions,
}: {
  projectName: string;
  revue: Revue;
  attendees: string[];
  decisions: RevueDecision[];
}) {
  const snap = revue.snapshot;
  const deltaPts = snap?.prevPlanningPct != null ? (snap.planningPct ?? 0) - snap.prevPlanningPct : null;

  return (
    <Document>
      <Page size="A4" style={ps.page}>
        <PdfHeader
          title={`Compte-rendu — ${revue.title}`}
          subtitle={`${projectName} · clôturée le ${dt(revue.closedAt)}${
            snap?.durationMin != null ? ` · ${snap.durationMin} min` : ''
          }${snap?.closedByName ? ` · animée par ${snap.closedByName}` : ''}`}
        />

        <Text style={{ fontSize: 8, color: MUTED, marginBottom: 10 }}>
          {snap?.prevRevueAt
            ? `Période couverte : depuis le ${dateFr(snap.prevRevueAt)}`
            : 'Première revue du projet'}
        </Text>

        <View style={ps.statRow}>
          <Stat
            value={`${snap?.planningPct ?? 0} %`}
            label={deltaPts != null ? `Avancement (${deltaPts >= 0 ? '+' : ''}${deltaPts} pts)` : 'Avancement'}
          />
          <Stat value={snap?.doneSince?.length ?? snap?.doneActionIds.length ?? 0} label="Terminées sur la période" />
          <Stat value={snap?.lateActions?.length ?? 0} label="En retard à la clôture" />
          <Stat value={snap?.openRisks?.length ?? 0} label="Risques critiques" last />
        </View>

        <SectionTitle n={1} label="Participants" />
        {attendees.length === 0 ? (
          <Empty>Aucun participant noté.</Empty>
        ) : (
          <Text style={{ fontSize: 9, color: INK, lineHeight: 1.5 }}>{attendees.join(' · ')}</Text>
        )}

        <SectionTitle n={2} label="Décisions prises" />
        {decisions.length === 0 ? (
          <Empty>Aucune décision captée pendant cette revue.</Empty>
        ) : (
          decisions.map((d) => <Line key={d.id} title={d.content} sub={`${dt(d.createdAt)} · ${d.authorName}`} />)
        )}

        <SectionTitle n={3} label="Qui fait quoi pour quand" />
        {actionLines(snap?.createdActions, 'Aucune action créée pendant cette revue.')}

        <SectionTitle n={4} label="Ce qui a avancé" />
        {actionLines(snap?.doneSince, 'Aucune action terminée sur la période.')}

        <SectionTitle n={5} label="Points ouverts" />
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Actions en retard</Text>
        {actionLines(snap?.lateActions, 'Aucun retard à la clôture.')}
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 3 }}>
          Risques critiques
        </Text>
        {!snap?.openRisks || snap.openRisks.length === 0 ? (
          <Empty>Aucun risque critique restant.</Empty>
        ) : (
          snap.openRisks.map((r, i) => (
            <Line
              key={`${r.label}-${i}`}
              title={r.label}
              sub={`Criticité ${r.score} · ${r.hasPlan ? 'plan d’action en cours' : 'aucune action corrective'}`}
            />
          ))
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}

export async function exportRevueCrPdf(
  projectName: string,
  revue: Revue,
  attendees: string[],
  decisions: RevueDecision[],
): Promise<void> {
  const blob = await pdf(
    <CrDoc projectName={projectName} revue={revue} attendees={attendees} decisions={decisions} />,
  ).toBlob();
  const day = (revue.closedAt ?? new Date().toISOString()).slice(0, 10);
  downloadBlob(blob, `CR-${slugify(projectName)}-${day}.pdf`);
}
