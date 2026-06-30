'use client';

import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import type { AmdecEntry } from '@/lib/types';
import { criticality, residualCriticality } from '@/lib/types';

/**
 * Export PDF d'un rapport AMDEC (vectoriel, texte sélectionnable, à la charte).
 * Chargé en dynamique (`import('./AmdecPdf')`) → @react-pdf reste hors du bundle
 * principal et n'est téléchargé qu'au clic sur « Exporter PDF ».
 */

const ACCENT = '#c15f3c';
const INK = '#1f1e1b';
const MUTED = '#6b6a64';
const DOWN = '#2f6b35';
const UP = '#9a3412';

const styles = StyleSheet.create({
  page: { paddingVertical: 26, paddingHorizontal: 28, fontSize: 8, fontFamily: 'Helvetica', color: INK },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 24, height: 24, borderRadius: 6, backgroundColor: ACCENT, marginRight: 8 },
  logoText: { color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 7 },
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

function AmdecReport({ projectName, entries }: { projectName: string; entries: AmdecEntry[] }) {
  const reassessed = entries.filter((e) => residualCriticality(e) !== null);
  const totalBefore = entries.reduce((s, e) => s + criticality(e), 0);
  const beforeR = reassessed.reduce((s, e) => s + criticality(e), 0);
  const afterR = reassessed.reduce((s, e) => s + (residualCriticality(e) ?? 0), 0);
  const reduction = beforeR > 0 ? Math.round(((beforeR - afterR) / beforeR) * 100) : null;
  const exited = reassessed.filter((e) => criticality(e) >= 24 && (residualCriticality(e) ?? 0) < 24).length;
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const stat = (value: string | number, label: string, last = false) => (
    <View style={last ? [styles.stat, { marginRight: 0 }] : styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <Document title={`AMDEC - ${projectName}`} author="Projet Entan">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>PE</Text></View>
          <View>
            <Text style={styles.title}>Rapport AMDEC — {projectName}</Text>
            <Text style={styles.subtitle}>
              Analyse des modes de défaillance · Criticité = Gravité × Occurrence × Détectabilité (échelle 1–4) · {today}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          {stat(entries.length, 'Analyses')}
          {stat(totalBefore, 'Criticité cumulée avant actions')}
          {stat(reassessed.length > 0 ? afterR : '—', `Criticité après actions (${reassessed.length}/${entries.length} réévaluées)`)}
          {stat(reduction !== null ? `-${reduction} %` : '—', 'Réduction du risque')}
          {stat(reassessed.length > 0 ? exited : '—', 'Sorties de la zone critique', true)}
        </View>

        <View style={styles.thead} fixed>
          {COLS.map((col) => (
            <Text key={col.key} style={[styles.th, { width: col.width }, ...(col.c ? [styles.center] : [])]}>
              {col.label}
            </Text>
          ))}
        </View>

        {entries.map((e, i) => {
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

        <View style={styles.footer} fixed>
          <Text>Généré par Projet Entan — projetentan.fr</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Génère le PDF et déclenche le téléchargement. */
export async function exportAmdecPdf(projectName: string, entries: AmdecEntry[]): Promise<void> {
  const blob = await pdf(<AmdecReport projectName={projectName} entries={entries} />).toBlob();
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
