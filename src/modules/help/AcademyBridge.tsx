'use client';

/**
 * Passerelle vers l'Académie, en fin de guide.
 *
 * Un onglet en haut de page se rate : on remet donc l'entraînement là où le
 * lecteur arrive après avoir lu, avec son avancement réel — un parcours
 * commencé se termine bien plus souvent qu'un parcours à zéro.
 *
 * Bascule d'onglet par événement DOM plutôt que par remontée d'état : le guide
 * est rendu par une page serveur et n'a pas accès au `setState` des onglets.
 */

import { IconStar } from '@/components/icons';
import { certificationStatus } from '@/modules/academy/certification';
import { useAcademyProgress } from '@/modules/academy/useAcademyProgress';

/** Écouté par `HelpTabs`. */
export const GO_PRACTICE_EVENT = 'entan:go-practice';

export function AcademyBridge() {
  const { progress } = useAcademyProgress();
  const { mastered, total, certified } = certificationStatus(progress);

  return (
    <div className="card">
      <div className="card-body">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
            <IconStar />
          </span>
          {certified ? 'Vous êtes certifié' : 'Passer à la pratique'}
        </h2>
        <p className="lead">
          {certified
            ? 'Tous les badges de l’Académie sont décrochés. Rejouez un module quand vous voulez pour garder la main.'
            : `Lire ne suffit pas à retenir. L’Académie fait manipuler chaque outil sur des cas concrets — ${mastered} badge${mastered > 1 ? 's' : ''} sur ${total} pour l’instant.`}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => window.dispatchEvent(new CustomEvent(GO_PRACTICE_EVENT))}
        >
          {certified ? 'Revoir l’Académie' : 'S’entraîner maintenant'} →
        </button>
      </div>
    </div>
  );
}
