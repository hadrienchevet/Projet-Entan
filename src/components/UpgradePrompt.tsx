'use client';

import Link from 'next/link';
import { Modal } from './Modal';
import { useWorkspace, FREE_PROJECTS_PER_TYPE } from '@/lib/store';
import { PROJECT_TYPE_LABELS } from '@/lib/types';

/**
 * Modale affichée quand la limite du plan gratuit (nombre de projets par type)
 * est atteinte. Pilotée par `limitPromptType` dans le store.
 */
export function UpgradePrompt() {
  const { limitPromptType, closeLimitPrompt } = useWorkspace();
  if (!limitPromptType) return null;

  return (
    <Modal
      title="Limite du plan gratuit atteinte"
      onClose={closeLimitPrompt}
      footer={
        <>
          <button className="btn" onClick={closeLimitPrompt}>
            Plus tard
          </button>
          <Link className="btn btn-primary" href="/abonnement" onClick={closeLimitPrompt}>
            Passer à Pro
          </Link>
        </>
      }
    >
      <p>
        Le plan gratuit est limité à <strong>{FREE_PROJECTS_PER_TYPE} projets</strong> de type
        «&nbsp;{PROJECT_TYPE_LABELS[limitPromptType]}&nbsp;». Passe à <strong>Pro</strong> pour créer
        des projets en illimité.
      </p>
    </Modal>
  );
}
