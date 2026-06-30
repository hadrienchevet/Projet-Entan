'use client';

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';
import type { CostItem } from '@/lib/types';
import { costPlannedTotal, costActualTotal, costVariance } from '@/lib/types';
import { ps, PdfHeader, PdfFooter, Stat, MUTED, DOWN, UP, todayFr, slugify, downloadBlob } from '@/lib/pdf/shared';

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const COLS = [
  { label: 'Poste', w: '46%' as const },
  { label: 'Qté', w: '8%' as const, c: true },
  { label: 'Prévu', w: '15%' as const, c: true },
  { label: 'Réel', w: '15%' as const, c: true },
  { label: 'Écart', w: '16%' as const, c: true },
];

function CostsReport({ projectName, items }: { projectName: string; items: CostItem[] }) {
  const planned = items.reduce((s, c) => s + costPlannedTotal(c), 0);
  const actual = items.reduce((s, c) => s + costActualTotal(c), 0);
  const variance = actual - planned;
  const consumption = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  return (
    <Document title={`Couts - ${projectName}`} author="Projet Entan">
      <Page size="A4" style={ps.page}>
        <PdfHeader title={`Suivi des coûts — ${projectName}`} subtitle={`Budget prévu vs coût réel · ${todayFr()}`} />
        <View style={ps.statRow}>
          <Stat value={eur(planned)} label="Budget prévu" />
          <Stat value={eur(actual)} label="Coût réel" />
          <Stat value={`${variance > 0 ? '+' : ''}${eur(variance)}`} label="Écart" />
          <Stat value={`${consumption} %`} label="Consommation du budget" last />
        </View>

        <View style={ps.thead} fixed>
          {COLS.map((c) => (
            <Text key={c.label} style={[ps.th, { width: c.w }, ...(c.c ? [ps.center] : [])]}>{c.label}</Text>
          ))}
        </View>
        {items.map((c, i) => {
          const v = costVariance(c);
          return (
            <View key={c.id} style={i % 2 ? [ps.row, ps.rowAlt] : [ps.row]} wrap={false}>
              <View style={[ps.td, { width: '46%' }]}>
                <Text style={ps.bold}>{c.label}</Text>
                {c.isSubscription ? (
                  <Text style={{ color: MUTED, marginTop: 1 }}>Abonnement · {c.months} mois × quantité {c.quantity}</Text>
                ) : c.quantity !== 1 ? (
                  <Text style={{ color: MUTED, marginTop: 1 }}>Quantité {c.quantity}</Text>
                ) : null}
              </View>
              <Text style={[ps.td, { width: '8%' }, ps.center]}>{c.quantity}</Text>
              <Text style={[ps.td, { width: '15%' }, ps.center]}>{eur(costPlannedTotal(c))}</Text>
              <Text style={[ps.td, { width: '15%' }, ps.center]}>{eur(costActualTotal(c))}</Text>
              <Text style={[ps.td, { width: '16%' }, ps.center, { color: v > 0 ? UP : v < 0 ? DOWN : MUTED }]}>
                {v > 0 ? '+' : ''}{eur(v)}
              </Text>
            </View>
          );
        })}
        <PdfFooter />
      </Page>
    </Document>
  );
}

export async function exportCostsPdf(projectName: string, items: CostItem[]): Promise<void> {
  const blob = await pdf(<CostsReport projectName={projectName} items={items} />).toBlob();
  downloadBlob(blob, `Couts-${slugify(projectName)}.pdf`);
}
