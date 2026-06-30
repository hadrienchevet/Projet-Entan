'use client';

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';
import type { Action, Member } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { ps, PdfHeader, PdfFooter, Stat, MUTED, todayFr, dateFr, slugify, downloadBlob } from '@/lib/pdf/shared';

const COLS = [
  { label: 'Action', w: '24%' as const },
  { label: 'Responsable (R)', w: '13%' as const },
  { label: 'Accountable (A)', w: '13%' as const },
  { label: 'Consulted (C)', w: '13%' as const },
  { label: 'Informed (I)', w: '13%' as const },
  { label: 'Statut', w: '10%' as const, c: true },
  { label: 'Échéance', w: '11%' as const, c: true },
];

function nameOf(members: Member[], id?: string): string {
  if (!id) return '—';
  return members.find((m) => m.id === id)?.name ?? '—';
}
function namesOf(members: Member[], ids: string[]): string {
  return ids.length ? ids.map((id) => nameOf(members, id)).join(', ') : '—';
}

function ActionsReport({ projectName, actions, members }: { projectName: string; actions: Action[]; members: Member[] }) {
  const count = (s: Action['status']) => actions.filter((a) => a.status === s).length;
  return (
    <Document title={`Plan d'actions - ${projectName}`} author="Projet Entan">
      <Page size="A4" orientation="landscape" style={ps.page}>
        <PdfHeader title={`Plan d'actions — ${projectName}`} subtitle={`Suivi RACI des actions · ${todayFr()}`} />
        <View style={ps.statRow}>
          <Stat value={actions.length} label="Actions au total" />
          <Stat value={count('todo')} label={STATUS_LABELS.todo} />
          <Stat value={count('in_progress')} label={STATUS_LABELS.in_progress} />
          <Stat value={count('done')} label={STATUS_LABELS.done} last />
        </View>

        <View style={ps.thead} fixed>
          {COLS.map((c) => (
            <Text key={c.label} style={[ps.th, { width: c.w }, ...(c.c ? [ps.center] : [])]}>{c.label}</Text>
          ))}
        </View>
        {actions.map((a, i) => (
          <View key={a.id} style={i % 2 ? [ps.row, ps.rowAlt] : [ps.row]} wrap={false}>
            <View style={[ps.td, { width: '24%' }]}>
              <Text style={ps.bold}>{a.title}</Text>
              {a.description ? <Text style={{ color: MUTED, marginTop: 1 }}>{a.description}</Text> : null}
            </View>
            <Text style={[ps.td, { width: '13%' }]}>{nameOf(members, a.responsibleId)}</Text>
            <Text style={[ps.td, { width: '13%' }]}>{nameOf(members, a.accountableId)}</Text>
            <Text style={[ps.td, { width: '13%' }]}>{namesOf(members, a.consultedIds)}</Text>
            <Text style={[ps.td, { width: '13%' }]}>{namesOf(members, a.informedIds)}</Text>
            <Text style={[ps.td, { width: '10%' }, ps.center]}>{STATUS_LABELS[a.status]}</Text>
            <Text style={[ps.td, { width: '11%' }, ps.center]}>{dateFr(a.dueDate)}</Text>
          </View>
        ))}
        <PdfFooter />
      </Page>
    </Document>
  );
}

export async function exportActionsPdf(projectName: string, actions: Action[], members: Member[]): Promise<void> {
  const blob = await pdf(<ActionsReport projectName={projectName} actions={actions} members={members} />).toBlob();
  downloadBlob(blob, `Plan-actions-${slugify(projectName)}.pdf`);
}
