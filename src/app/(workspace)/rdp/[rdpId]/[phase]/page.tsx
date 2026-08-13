'use client';

import { useParams } from 'next/navigation';
import { RdpShell } from '@/modules/rdp/RdpShell';
import { SujetPage } from '@/modules/rdp/SujetPage';
import { ProblemePage } from '@/modules/rdp/ProblemePage';
import { IshikawaPage } from '@/modules/rdp/IshikawaPage';
import { CinqPourquoiPage } from '@/modules/rdp/CinqPourquoiPage';
import { SolutionsPage } from '@/modules/rdp/SolutionsPage';
import { CapaPage } from '@/modules/rdp/CapaPage';

/**
 * Route unique des 7 phases d'une résolution de problème. Avant fix-32 il y
 * avait une route de premier niveau par phase (/sujet, /probleme, …) : elles ne
 * pouvaient pas désigner DE QUELLE résolution il s'agissait.
 */
export default function Page() {
  const params = useParams();
  const rdpId = String(params.rdpId ?? '');
  const slug = String(params.phase ?? '');

  const content = () => {
    switch (slug) {
      case 'sujet':
        return <SujetPage rdpId={rdpId} />;
      case 'probleme':
        return <ProblemePage rdpId={rdpId} />;
      case 'ishikawa':
        return <IshikawaPage rdpId={rdpId} />;
      case 'cinq-pourquoi':
        return <CinqPourquoiPage rdpId={rdpId} />;
      case 'solutions':
        return <SolutionsPage rdpId={rdpId} />;
      case 'capa':
        return <CapaPage rdpId={rdpId} />;
      case 'standardisation':
        return <CapaPage rdpId={rdpId} phase={6} />;
      default:
        return (
          <div className="empty">
            <p>Phase inconnue.</p>
          </div>
        );
    }
  };

  return (
    <RdpShell rdpId={rdpId} slug={slug}>
      {content()}
    </RdpShell>
  );
}
