'use client';

import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_PNG } from './logo';

/**
 * Briques communes aux exports PDF (en-tête à la charte, pied de page, styles,
 * téléchargement). Importé uniquement par les générateurs *Pdf.tsx, eux-mêmes
 * chargés en dynamique → @react-pdf reste hors du bundle principal.
 */

export const ACCENT = '#c15f3c';
export const INK = '#1f1e1b';
export const MUTED = '#6b6a64';
export const DOWN = '#2f6b35';
export const UP = '#9a3412';

export const ps = StyleSheet.create({
  page: { paddingVertical: 26, paddingHorizontal: 28, fontSize: 8.5, fontFamily: 'Helvetica', color: INK },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  logo: { width: 24, height: 24, marginRight: 8 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 8, color: MUTED, marginTop: 2 },
  statRow: { flexDirection: 'row', marginBottom: 12 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#e5e3dc', borderRadius: 5, padding: 7, marginRight: 6 },
  statValue: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 7, color: MUTED, marginTop: 2 },
  thead: { flexDirection: 'row', backgroundColor: ACCENT },
  th: { color: '#ffffff', fontFamily: 'Helvetica-Bold', paddingVertical: 4, paddingHorizontal: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eceae3' },
  rowAlt: { backgroundColor: '#faf9f5' },
  td: { paddingVertical: 4, paddingHorizontal: 4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  center: { textAlign: 'center' },
  footer: {
    position: 'absolute', bottom: 16, left: 28, right: 28,
    flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: MUTED,
  },
});

export const PdfHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={ps.header}>
    <Image src={LOGO_PNG} style={ps.logo} />
    <View>
      <Text style={ps.title}>{title}</Text>
      {subtitle ? <Text style={ps.subtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

export const PdfFooter = () => (
  <View style={ps.footer} fixed>
    <Text>Généré par Projet Entan — projetentan.fr</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

/** Carte d'indicateur (valeur + libellé). `last` retire la marge droite. */
export const Stat = ({ value, label, last }: { value: string | number; label: string; last?: boolean }) => (
  <View style={last ? [ps.stat, { marginRight: 0 }] : ps.stat}>
    <Text style={ps.statValue}>{value}</Text>
    <Text style={ps.statLabel}>{label}</Text>
  </View>
);

export const todayFr = () =>
  new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export const dateFr = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projet';
}

/** Déclenche le téléchargement d'un Blob PDF déjà généré. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
