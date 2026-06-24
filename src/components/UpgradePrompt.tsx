'use client';

import Link from 'next/link';
import { Modal } from './Modal';
import { useWorkspace } from '@/lib/store';

/** Modale affichée quand tous les sièges payés sont occupés. */
export function UpgradePrompt() {
  const { seatLimitPrompt, closeSeatPrompt } = useWorkspace();
  if (!seatLimitPrompt) return null;

  return (
    <Modal
      title="Limite de sièges atteinte"
      onClose={closeSeatPrompt}
      footer={
        <>
          <button className="btn" onClick={closeSeatPrompt}>
            Plus tard
          </button>
          <Link className="btn btn-primary" href="/abonnement" onClick={closeSeatPrompt}>
            Ajouter un siège
          </Link>
        </>
      }
    >
      <p>
        Tous vos sièges sont occupés. Ajoutez un siège (ou utilisez une clé d’accès) pour inviter un
        membre supplémentaire.
      </p>
    </Modal>
  );
}
