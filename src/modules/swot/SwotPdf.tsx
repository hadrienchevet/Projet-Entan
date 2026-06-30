'use client';

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';
import type { SwotItem } from '@/lib/types';
import { SWOT_QUADRANTS } from '@/lib/types';
import { ps, PdfHeader, PdfFooter, MUTED, todayFr, slugify, downloadBlob } from '@/lib/pdf/shared';

const TONE: Record<string, { bg: string; border: string; title: string }> = {
  green: { bg: '#e2f0e2', border: '#b7d9b7', title: '#2f6b35' },
  red: { bg: '#f8e0d8', border: '#e8b9a8', title: '#9a3412' },
  accent: { bg: '#f5e9e2', border: '#ecd0c2', title: '#a84f2f' },
  amber: { bg: '#fbeccc', border: '#f0d9a0', title: '#92600a' },
};

function Quadrant({ items, q, last }: { items: SwotItem[]; q: (typeof SWOT_QUADRANTS)[number]; last?: boolean }) {
  const t = TONE[q.tone] ?? TONE.accent;
  const list = items.filter((i) => i.quadrant === q.id);
  return (
    <View
      style={{
        flex: 1, minHeight: 290, marginRight: last ? 0 : 10, padding: 12,
        backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, borderRadius: 6,
      }}
    >
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: t.title }}>{q.label}</Text>
      <Text style={{ fontSize: 8, color: MUTED, marginBottom: 8 }}>{q.hint}</Text>
      {list.length === 0 ? (
        <Text style={{ fontSize: 8.5, color: MUTED }}>Aucun élément</Text>
      ) : (
        list.map((i) => (
          <View key={i.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ color: t.title, marginRight: 4 }}>•</Text>
            <Text style={{ flex: 1, fontSize: 9 }}>{i.text}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function SwotReport({ projectName, items }: { projectName: string; items: SwotItem[] }) {
  const [forces, faiblesses, opportunites, menaces] = SWOT_QUADRANTS;
  return (
    <Document title={`SWOT - ${projectName}`} author="Projet Entan">
      <Page size="A4" style={ps.page}>
        <PdfHeader
          title={`SWOT — ${projectName}`}
          subtitle={`Forces et faiblesses (internes), opportunités et menaces (externes) · ${todayFr()}`}
        />
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Quadrant items={items} q={forces} />
          <Quadrant items={items} q={faiblesses} last />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Quadrant items={items} q={opportunites} />
          <Quadrant items={items} q={menaces} last />
        </View>
        <PdfFooter />
      </Page>
    </Document>
  );
}

export async function exportSwotPdf(projectName: string, items: SwotItem[]): Promise<void> {
  const blob = await pdf(<SwotReport projectName={projectName} items={items} />).toBlob();
  downloadBlob(blob, `SWOT-${slugify(projectName)}.pdf`);
}
