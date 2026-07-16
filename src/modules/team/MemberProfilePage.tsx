'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { fetchAcademyProgressFor } from '@/modules/academy/academyRemote';
import { CertificationCard } from '@/modules/academy/CertificationCard';
import type { AcademyProgress } from '@/modules/academy/useAcademyProgress';

function initials(name?: string, email?: string): string {
  const s = (name || email || '?').trim();
  const parts = s.split(/[\s@._-]+/).filter(Boolean);
  const two = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  return two || (s[0] ?? '?').toUpperCase();
}

const roleLabel = (role: string) =>
  role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Admin' : 'Membre';

/** Profil d'un membre de l'organisation : identité + parcours de formation. */
export function MemberProfilePage({ userId }: { userId: string }) {
  const { companyMembers, userId: myId } = useWorkspace();
  const [progress, setProgress] = useState<AcademyProgress | null>(null);

  const member = companyMembers.find((m) => m.userId === userId);
  const name = member?.displayName || member?.email || 'Membre';
  const you = userId === myId;

  useEffect(() => {
    let alive = true;
    void fetchAcademyProgressFor(userId).then((p) => {
      if (alive) setProgress(p);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link className="link" href="/equipe">
            ← Organisation
          </Link>
          <h1 style={{ marginTop: 8 }}>
            {name}
            {you && <span className="muted"> (vous)</span>}
          </h1>
          <p className="subtitle">
            {member?.email ? `${member.email} · ` : ''}
            {roleLabel(member?.role ?? 'member')}
          </p>
        </div>
      </div>

      {/* Identité */}
      <div className="card">
        <div className="card-body profile-id">
          <span className="profile-avatar">{initials(member?.displayName, member?.email)}</span>
          <div>
            <h2>{name}</h2>
            {member?.email && (
              <p className="muted" style={{ fontSize: 13 }}>
                {member.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formation & certification */}
      <div className="card">
        <div className="card-header">
          <h2>Formation &amp; certification</h2>
        </div>
        <div className="card-body">
          <CertificationCard progress={progress ?? {}} loading={progress === null} />
        </div>
      </div>
    </div>
  );
}
