'use client';

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';
import type { A3Report, AmdecEntry, Action, Member } from '@/lib/types';
import { criticality, residualCriticality } from '@/lib/types';
import { ps, PdfHeader, PdfFooter, ACCENT, MUTED, INK, DOWN, UP, todayFr, dateFr, slugify, downloadBlob } from '@/lib/pdf/shared';

const SECTIONS: { key: keyof A3Report; label: string }[] = [
  { key: 'contexte', label: '1 · Contexte' },
  { key: 'situation', label: '2 · Situation actuelle' },
  { key: 'objectifs', label: '3 · Objectifs / cible' },
  { key: 'analyse', label: '4 · Analyse des causes' },
  { key: 'plan', label: "5 · Plan d'action" },
  { key: 'suivi', label: '6 · Suivi / résultats' },
];

function critChip(s: number): { backgroundColor: string; color: string } {
  if (s >= 24) return { backgroundColor: '#f5d6cb', color: UP };
  if (s >= 12) return { backgroundColor: '#fbeccc', color: '#92600a' };
  return { backgroundColor: '#dcefdc', color: DOWN };
}

const Section = ({ label, text }: { label: string; text: string }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: ACCENT, marginBottom: 3 }}>{label}</Text>
    <View style={{ borderWidth: 1, borderColor: '#e5e3dc', borderRadius: 4, padding: 6, minHeight: 84 }}>
      <Text style={{ fontSize: 9, lineHeight: 1.4, color: text ? INK : MUTED }}>{text || '—'}</Text>
    </View>
  </View>
);

function A3Doc({
  projectName,
  report,
  topRisks,
  keyActions,
  members,
}: {
  projectName: string;
  report: A3Report | null;
  topRisks: AmdecEntry[];
  keyActions: Action[];
  members: Member[];
}) {
  const val = (k: keyof A3Report) => (report ? (report[k] as string) ?? '' : '');
  const left = SECTIONS.slice(0, 3);
  const right = SECTIONS.slice(3, 6);
  const nameOf = (id?: string) => (id ? members.find((m) => m.id === id)?.name ?? '—' : '—');

  return (
    <Document title={`Charte A3 - ${projectName}`} author="Projet Entan">
      <Page size="A4" style={ps.page}>
        <PdfHeader title={`Charte A3 — ${projectName}`} subtitle={`Cadrage du problème, analyse et plan d'action · ${todayFr()}`} />

        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            {left.map((s) => <Section key={s.key} label={s.label} text={val(s.key)} />)}
          </View>
          <View style={{ flex: 1 }}>
            {right.map((s) => <Section key={s.key} label={s.label} text={val(s.key)} />)}
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <View style={{ flex: 1, marginRight: 10, borderWidth: 1, borderColor: '#e5e3dc', borderRadius: 4, padding: 8 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>Risques majeurs (AMDEC)</Text>
            {topRisks.length === 0 ? (
              <Text style={{ fontSize: 8.5, color: MUTED }}>Aucune analyse AMDEC.</Text>
            ) : (
              topRisks.map((r) => {
                const score = residualCriticality(r) ?? criticality(r);
                return (
                  <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <Text style={{ flex: 1, fontSize: 8.5 }}>{r.element} — {r.failureMode}</Text>
                    <Text style={[{ fontSize: 8, fontFamily: 'Helvetica-Bold', borderRadius: 3, paddingVertical: 1, paddingHorizontal: 5 }, critChip(score)]}>{score}</Text>
                  </View>
                );
              })
            )}
          </View>
          <View style={{ flex: 1, borderWidth: 1, borderColor: '#e5e3dc', borderRadius: 4, padding: 8 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>Actions clés (échéances proches)</Text>
            {keyActions.length === 0 ? (
              <Text style={{ fontSize: 8.5, color: MUTED }}>Aucune action ouverte avec échéance.</Text>
            ) : (
              keyActions.map((a) => (
                <View key={a.id} style={{ marginBottom: 3 }}>
                  <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{a.title}</Text>
                  <Text style={{ fontSize: 8, color: MUTED }}>{nameOf(a.responsibleId)} · échéance {dateFr(a.dueDate)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}

export async function exportA3Pdf(
  projectName: string,
  report: A3Report | null,
  topRisks: AmdecEntry[],
  keyActions: Action[],
  members: Member[],
): Promise<void> {
  const blob = await pdf(
    <A3Doc projectName={projectName} report={report} topRisks={topRisks} keyActions={keyActions} members={members} />,
  ).toBlob();
  downloadBlob(blob, `A3-${slugify(projectName)}.pdf`);
}
