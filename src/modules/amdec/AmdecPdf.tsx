'use client';

import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import type { AmdecEntry } from '@/lib/types';
import { criticality, residualCriticality } from '@/lib/types';
import { LOGO_PNG } from '@/lib/pdf/logo';

/**
 * Export PDF d'un rapport AMDEC (vectoriel, texte sélectionnable, à la charte).
 * Sections optionnelles : tableau détaillé et/ou matrices de risque (avant/après).
 * Chargé en dynamique (`import('./AmdecPdf')`) → @react-pdf reste hors du bundle
 * principal et n'est téléchargé qu'au moment de l'export.
 */

export interface AmdecPdfOptions {
  table: boolean;
  matrices: boolean;
}

const ACCENT = '#c15f3c';
const INK = '#1f1e1b';
const MUTED = '#6b6a64';
const DOWN = '#2f6b35';
const UP = '#9a3412';

const styles = StyleSheet.create({
  page: { paddingVertical: 26, paddingHorizontal: 28, fontSize: 8, fontFamily: 'Helvetica', color: INK },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 24, height: 24, marginRight: 8 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 8, color: MUTED, marginTop: 2 },
  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#e5e3dc', borderRadius: 5, padding: 7, marginRight: 6 },
  statValue: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 7, color: MUTED, marginTop: 2 },
  thead: { flexDirection: 'row', backgroundColor: ACCENT },
  th: { color: '#ffffff', fontFamily: 'Helvetica-Bold', paddingVertical: 4, paddingHorizontal: 3 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eceae3' },
  rowAlt: { backgroundColor: '#faf9f5' },
  td: { paddingVertical: 3, paddingHorizontal: 3 },
  center: { textAlign: 'center' },
  chipWrap: { alignItems: 'center' },
  chip: { borderRadius: 3, paddingVertical: 2, paddingHorizontal: 5, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  footer: {
    position: 'absolute', bottom: 16, left: 28, right: 28,
    flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: MUTED,
  },
  // Matrices
  matricesRow: { flexDirection: 'row' },
  matrixBlock: { marginRight: 36 },
  matrixTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  matrixRow: { flexDirection: 'row' },
  matrixHeadY: { width: 16, height: 36, fontSize: 7, color: MUTED, textAlign: 'center', paddingTop: 14 },
  matrixHeadX: { width: 36, height: 14, fontSize: 7, color: MUTED, textAlign: 'center', paddingTop: 4 },
  matrixCorner: { width: 16, height: 14 },
  matrixCell: {
    width: 36, height: 36, borderWidth: 0.5, borderColor: '#ffffff',
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', padding: 2,
  },
  matrixChip: {
    width: 13, height: 13, borderRadius: 6.5, backgroundColor: INK, color: '#ffffff',
    fontSize: 6.5, textAlign: 'center', paddingTop: 3.5, marginHorizontal: 1, marginVertical: 0.5, fontFamily: 'Helvetica-Bold',
  },
  matrixAxisX: { fontSize: 7, color: MUTED, marginTop: 3, marginLeft: 16 },
  legendTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 6 },
  legendItem: { fontSize: 7.5, color: INK, marginBottom: 2 },
});

const COLS = [
  { key: 'element', label: 'Élément / fonction', width: '13%' as const },
  { key: 'failureMode', label: 'Mode de défaillance', width: '17%' as const },
  { key: 'cause', label: 'Cause', width: '15%' as const },
  { key: 'effect', label: 'Effet', width: '14%' as const },
  { key: 'g', label: 'G', width: '4%' as const, c: true },
  { key: 'o', label: 'O', width: '4%' as const, c: true },
  { key: 'd', label: 'D', width: '4%' as const, c: true },
  { key: 'crit', label: 'Criticité', width: '10%' as const, c: true },
  { key: 'after', label: 'Après', width: '10%' as const, c: true },
  { key: 'evo', label: 'Évol.', width: '9%' as const, c: true },
];

/** Couleur de pastille selon le seuil (≥ 24 critique, ≥ 12 à surveiller). */
function chipStyle(score: number): { backgroundColor: string; color: string } {
  if (score >= 24) return { backgroundColor: '#f5d6cb', color: UP };
  if (score >= 12) return { backgroundColor: '#fbeccc', color: '#92600a' };
  return { backgroundColor: '#dcefdc', color: DOWN };
}

/** Couleur de zone de la matrice selon le produit G × O (≥ 9 critique, ≥ 4 à surveiller). */
function zoneColor(g: number, o: number): string {
  const p = g * o;
  if (p >= 9) return '#efc3b4';
  if (p >= 4) return '#f6dcb0';
  return '#cfe7cf';
}

interface Plotted {
  entry: AmdecEntry;
  num: number;
}

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.header}>
    <Image src={LOGO_PNG} style={styles.logo} />
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text>Généré par Projet Entan — projetentan.fr</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

function PdfMatrix({
  title,
  items,
  position,
}: {
  title: string;
  items: Plotted[];
  position: (e: AmdecEntry) => { g: number; o: number };
}) {
  const grid: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => []));
  for (const { entry, num } of items) {
    const { g, o } = position(entry);
    if (g >= 1 && g <= 4 && o >= 1 && o <= 4) grid[g - 1][o - 1].push(num);
  }
  return (
    <View style={styles.matrixBlock}>
      <Text style={styles.matrixTitle}>{title}</Text>
      {[4, 3, 2, 1].map((g) => (
        <View key={g} style={styles.matrixRow}>
          <Text style={styles.matrixHeadY}>{g}</Text>
          {[1, 2, 3, 4].map((o) => (
            <View key={o} style={[styles.matrixCell, { backgroundColor: zoneColor(g, o) }]}>
              {grid[g - 1][o - 1].map((n) => (
                <Text key={n} style={styles.matrixChip}>{n}</Text>
              ))}
            </View>
          ))}
        </View>
      ))}
      <View style={styles.matrixRow}>
        <View style={styles.matrixCorner} />
        {[1, 2, 3, 4].map((o) => (
          <Text key={o} style={styles.matrixHeadX}>{o}</Text>
        ))}
      </View>
      <Text style={styles.matrixAxisX}>Horizontal : Occurrence  ·  Vertical : Gravité</Text>
    </View>
  );
}

function AmdecReport({
  projectName,
  entries,
  opts,
}: {
  projectName: string;
  entries: AmdecEntry[];
  opts: AmdecPdfOptions;
}) {
  const plotted: Plotted[] = entries.map((entry, i) => ({ entry, num: i + 1 }));
  const reassessed = plotted.filter(({ entry }) => residualCriticality(entry) !== null);

  const totalBefore = entries.reduce((s, e) => s + criticality(e), 0);
  const beforeR = reassessed.reduce((s, { entry }) => s + criticality(entry), 0);
  const afterR = reassessed.reduce((s, { entry }) => s + (residualCriticality(entry) ?? 0), 0);
  const reduction = beforeR > 0 ? Math.round(((beforeR - afterR) / beforeR) * 100) : null;
  const exited = reassessed.filter(
    ({ entry }) => criticality(entry) >= 24 && (residualCriticality(entry) ?? 0) < 24,
  ).length;
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const subtitle = `Analyse des modes de défaillance · Criticité = Gravité × Occurrence × Détectabilité (échelle 1–4) · ${today}`;

  const stat = (value: string | number, label: string, last = false) => (
    <View style={last ? [styles.stat, { marginRight: 0 }] : styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <Document title={`AMDEC - ${projectName}`} author="Projet Entan">
      {opts.table && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Header title={`Rapport AMDEC — ${projectName}`} subtitle={subtitle} />
          <View style={styles.summaryRow}>
            {stat(entries.length, 'Analyses')}
            {stat(totalBefore, 'Criticité cumulée avant actions')}
            {stat(reassessed.length > 0 ? afterR : '—', `Criticité après actions (${reassessed.length}/${entries.length} réévaluées)`)}
            {stat(reduction !== null ? `-${reduction} %` : '—', 'Réduction du risque')}
            {stat(reassessed.length > 0 ? exited : '—', 'Sorties de la zone critique', true)}
          </View>
          <View style={styles.thead} fixed>
            {COLS.map((col) => (
              <Text key={col.key} style={[styles.th, { width: col.width }, ...(col.c ? [styles.center] : [])]}>{col.label}</Text>
            ))}
          </View>
          {plotted.map(({ entry: e }, i) => {
            const before = criticality(e);
            const after = residualCriticality(e);
            const delta = after !== null ? after - before : null;
            return (
              <View key={e.id} style={i % 2 ? [styles.row, styles.rowAlt] : [styles.row]} wrap={false}>
                <Text style={[styles.td, { width: '13%' }]}>{e.element}</Text>
                <Text style={[styles.td, { width: '17%' }]}>{e.failureMode}</Text>
                <Text style={[styles.td, { width: '15%' }]}>{e.cause}</Text>
                <Text style={[styles.td, { width: '14%' }]}>{e.effect ?? ''}</Text>
                <Text style={[styles.td, { width: '4%' }, styles.center]}>{e.severity}</Text>
                <Text style={[styles.td, { width: '4%' }, styles.center]}>{e.occurrence}</Text>
                <Text style={[styles.td, { width: '4%' }, styles.center]}>{e.detection}</Text>
                <View style={[styles.td, { width: '10%' }, styles.chipWrap]}>
                  <Text style={[styles.chip, chipStyle(before)]}>{before}</Text>
                </View>
                <View style={[styles.td, { width: '10%' }, styles.chipWrap]}>
                  {after !== null
                    ? <Text style={[styles.chip, chipStyle(after)]}>{after}</Text>
                    : <Text style={[styles.center, { color: MUTED }]}>—</Text>}
                </View>
                <Text style={[styles.td, { width: '9%' }, styles.center, { color: delta === null ? MUTED : delta < 0 ? DOWN : delta > 0 ? UP : MUTED }]}>
                  {delta === null ? '—' : delta > 0 ? `+${delta}` : `${delta}`}
                </Text>
              </View>
            );
          })}
          <Footer />
        </Page>
      )}

      {opts.matrices && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Header title={`Matrices de risque — ${projectName}`} subtitle={subtitle} />
          <View style={styles.matricesRow}>
            <PdfMatrix
              title="Avant actions correctives"
              items={plotted}
              position={(e) => ({ g: e.severity, o: e.occurrence })}
            />
            <PdfMatrix
              title="Après actions correctives"
              items={reassessed}
              position={(e) => ({ g: e.severityAfter ?? 1, o: e.occurrenceAfter ?? 1 })}
            />
          </View>
          <Text style={styles.legendTitle}>Légende des analyses (numéro = ligne du tableau, triées par criticité)</Text>
          {plotted.map(({ entry: e, num }) => (
            <Text key={e.id} style={styles.legendItem}>{num}. {e.element} — {e.failureMode}</Text>
          ))}
          <Footer />
        </Page>
      )}
    </Document>
  );
}

/** Génère le PDF et déclenche le téléchargement (sections selon `opts`). */
export async function exportAmdecPdf(
  projectName: string,
  entries: AmdecEntry[],
  opts: AmdecPdfOptions,
): Promise<void> {
  const blob = await pdf(<AmdecReport projectName={projectName} entries={entries} opts={opts} />).toBlob();
  const slug = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projet';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AMDEC-${slug}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
