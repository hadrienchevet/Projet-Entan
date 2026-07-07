'use client';

import { useState, type ReactNode } from 'react';
import { IconHelp, IconStar } from '@/components/icons';
import { AcademyPanel } from '@/modules/academy/AcademyPanel';

/**
 * Onglets de la page Aide : « Apprendre » (le cours, rendu côté serveur et
 * passé en prop) et « S'entraîner » (l'Académie et ses mini-jeux).
 */
export function HelpTabs({ learn }: { learn: ReactNode }) {
  const [tab, setTab] = useState<'learn' | 'practice'>('learn');

  return (
    <>
      <div className="acad-tabbar">
        <div className="acad-tabs" role="tablist" aria-label="Aide et entraînement">
          <button
            role="tab"
            aria-selected={tab === 'learn'}
            className={`acad-tab${tab === 'learn' ? ' active' : ''}`}
            onClick={() => setTab('learn')}
          >
            <IconHelp /> Apprendre
          </button>
          <button
            role="tab"
            aria-selected={tab === 'practice'}
            className={`acad-tab${tab === 'practice' ? ' active' : ''}`}
            onClick={() => setTab('practice')}
          >
            <IconStar /> S’entraîner
          </button>
        </div>
      </div>
      {tab === 'learn' ? learn : <AcademyPanel />}
    </>
  );
}
