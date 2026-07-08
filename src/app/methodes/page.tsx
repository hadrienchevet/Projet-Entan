import type { Metadata } from 'next';
import { HelpPage } from '@/modules/help/HelpPage';
import { PublicShell } from '@/components/PublicShell';

export const metadata: Metadata = {
  title: { absolute: 'Méthodes de gestion de projet industriel — RACI, AMDEC, Ishikawa, A3 | ENTAN' },
  description:
    'Guide des méthodes de pilotage de projet industriel : matrice RACI, AMDEC, plan d’action, planning, SWOT, charte A3 et résolution de problèmes (Ishikawa, 5 pourquoi). À quoi sert chaque outil et comment les combiner.',
  keywords: [
    'méthodes gestion de projet',
    'matrice RACI',
    'AMDEC',
    'diagramme Ishikawa',
    '5 pourquoi',
    'analyse SWOT',
    'rapport A3',
    'PDCA',
    'résolution de problèmes',
    'gestion de projet industriel',
    'amélioration continue',
  ],
  alternates: { canonical: '/methodes' },
  openGraph: {
    title: 'Méthodes de gestion de projet industriel — le guide ENTAN',
    description:
      'RACI, AMDEC, planning, SWOT, A3 et résolution de problèmes : à quoi sert chaque outil et comment les combiner.',
    url: '/methodes',
    type: 'article',
  },
};

export default function Page() {
  return (
    <PublicShell>
      <HelpPage
        title="Les méthodes de gestion de projet industriel"
        subtitle="RACI, AMDEC, planning, SWOT, A3 et résolution de problèmes : à quoi sert chaque outil, et comment les combiner pour piloter un projet de bout en bout."
        showVideo={false}
      />
    </PublicShell>
  );
}
