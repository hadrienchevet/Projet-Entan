'use client';

import Link from 'next/link';
import { useWorkspace } from '@/lib/store';
import { useAcademyProgress } from '@/modules/academy/useAcademyProgress';
import { CertificationCard } from '@/modules/academy/CertificationCard';
import { IconLogout } from '@/components/icons';

function initials(name?: string, email?: string): string {
  const s = (name || email || '?').trim();
  const parts = s.split(/[\s@._-]+/).filter(Boolean);
  const two = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  return two || (s[0] ?? '?').toUpperCase();
}

const roleLabel = (role: string) =>
  role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Admin' : 'Membre';

/**
 * Mon compte — profil personnel : identité, organisation, formation.
 * Ne dépend PAS du chargement de l'organisation (marche en solo).
 */
export function AccountPage() {
  const { userEmail, userId, company, companyRole, companyMembers } = useWorkspace();
  const { progress } = useAcademyProgress();

  const me = companyMembers.find((m) => m.userId === userId);
  const name = me?.displayName || userEmail || '—';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mon compte</h1>
          <p className="subtitle">Mon profil, mon organisation et ma formation.</p>
        </div>
      </div>

      {/* Identité */}
      <div className="card">
        <div className="card-body profile-id">
          <span className="profile-avatar">{initials(me?.displayName, userEmail ?? undefined)}</span>
          <div>
            <h2>{name}</h2>
            {userEmail && (
              <p className="muted" style={{ fontSize: 13 }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Organisation */}
      <div className="card">
        <div className="card-header">
          <h2>Organisation</h2>
          {company && (
            <Link className="link" href="/equipe">
              Gérer
            </Link>
          )}
        </div>
        <div className="card-body">
          {company ? (
            <p>
              Membre de <strong>{company.name}</strong> — {roleLabel(companyRole ?? 'member')}.
            </p>
          ) : (
            <p className="muted">
              Vous n'appartenez à aucune organisation.{' '}
              <Link className="link" href="/equipe">
                Créer ou rejoindre une organisation
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {/* Formation & certification */}
      <div className="card">
        <div className="card-header">
          <h2>Formation &amp; certification</h2>
          <Link className="link" href="/help">
            S'entraîner
          </Link>
        </div>
        <div className="card-body">
          <CertificationCard progress={progress} />
        </div>
      </div>

      {/* Déconnexion */}
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn">
          <IconLogout /> Déconnexion
        </button>
      </form>
    </div>
  );
}
