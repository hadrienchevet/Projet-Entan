'use client';

import Link from 'next/link';
import { useWorkspace } from '@/lib/store';
import { IconMail, IconPlus, IconTrash, IconUser } from '@/components/icons';

/**
 * Carte « Sièges » de l'entreprise (page Équipe) : combien de sièges, combien
 * utilisés, combien libres, avec la liste des membres et des invitations.
 * Lit `seatsAllowed`, `companyMembers`, `companyInvitations` du store.
 *
 * Convention : une invitation en attente réserve un siège jusqu'à son
 * acceptation ou son expiration ; le store bloque l'invitation au-delà.
 */

function initials(name?: string, email?: string): string {
  const s = (name || email || '?').trim();
  const parts = s.split(/[\s@._-]+/).filter(Boolean);
  const two = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  return two || (s[0] ?? '?').toUpperCase();
}

const roleLabel = (role: string) =>
  role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Admin' : 'Membre';

export function SeatsPanel() {
  const {
    company,
    companyMembers,
    companyInvitations,
    seatsAllowed,
    seatsInvited,
    isCompanyAdmin,
    userId,
    removeCompanyMember,
  } = useWorkspace();
  if (!company) return null;

  const activeMembers = companyMembers.filter((m) => m.status === 'active');
  const active = activeMembers.length;
  const invited = seatsInvited;
  const unlimited = !Number.isFinite(seatsAllowed);
  const reserved = active + invited;
  const free = unlimited ? Infinity : Math.max(0, seatsAllowed - reserved);
  const noSeats = !unlimited && seatsAllowed === 0;
  const full = !unlimited && !noSeats && free === 0;

  // Une case par siège (icône : actif / invité / libre) ; barre au-delà de 24.
  const cellCount = unlimited ? 0 : Math.min(Math.max(seatsAllowed, reserved), 24);
  const cells = Array.from({ length: cellCount }, (_, i) =>
    i < active ? 'u' : i < reserved ? 'i' : 'f',
  );

  const onRemove = (uid: string, name: string) => {
    if (!window.confirm(`Retirer ${name} de l'entreprise ?`)) return;
    void removeCompanyMember(uid);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Sièges</h2>
          <span className={`badge ${unlimited ? 'done' : 'in_progress'}`}>
            {unlimited ? 'Accès offert' : 'Plan Équipe'}
          </span>
        </div>
        {isCompanyAdmin && (
          <Link className="link" href="/abonnement">Gérer l’abonnement</Link>
        )}
      </div>

      <div className="card-body">
        <div className="seats-metric">
          <span className="n">{active}</span>
          <span className="d">
            {unlimited
              ? 'membre(s) · sièges illimités'
              : noSeats
                ? 'membre(s) · aucun siège attribué'
                : `/ ${seatsAllowed} sièges utilisés`}
          </span>
        </div>

        {cellCount > 0 && (
          <div className="seats-cells">
            {cells.map((k, i) => (
              <span key={i} className={`seats-cell ${k}`}>
                {k === 'u' ? <IconUser /> : k === 'i' ? <IconMail /> : <IconPlus />}
              </span>
            ))}
          </div>
        )}

        {!unlimited && (
          <div className="seats-legend">
            <span><span className="dot u" />{active} actif(s)</span>
            {invited > 0 && <span><span className="dot i" />{invited} invité(s) — réservé</span>}
            <span><span className="dot f" />{free} libre(s)</span>
          </div>
        )}
      </div>

      <div className="seats-roster">
        {activeMembers.map((m) => {
          const name = m.displayName || m.email || m.userId;
          const you = m.userId === userId;
          return (
            <div key={m.userId} className="seats-member">
              <span className="seats-avatar">{initials(m.displayName, m.email)}</span>
              <div className="seats-member-main">
                <div className="seats-member-name">
                  {name}
                  {you && <span className="you"> (vous)</span>}
                </div>
                {m.email && <div className="seats-member-sub">{m.email}</div>}
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{roleLabel(m.role)}</span>
              <span className="badge done">Actif</span>
              {isCompanyAdmin && m.role !== 'owner' && !you && (
                <button
                  className="icon-btn danger"
                  aria-label={`Retirer ${name}`}
                  onClick={() => onRemove(m.userId, name)}
                >
                  <IconTrash />
                </button>
              )}
            </div>
          );
        })}

        {companyInvitations.map((inv) => (
          <div key={inv.email} className="seats-member">
            <span className="seats-avatar inv"><IconMail /></span>
            <div className="seats-member-main">
              <div className="seats-member-name" style={{ color: 'var(--text-secondary)' }}>{inv.email}</div>
              <div className="seats-member-sub">
                invité le {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>{roleLabel(inv.role)}</span>
            <span className="badge crit-medium">Invité</span>
          </div>
        ))}
      </div>

      {isCompanyAdmin && (
        <div className="seats-foot">
          <span className={full || noSeats ? 'danger-text' : 'muted'}>
            {noSeats
              ? 'Aucun siège au plan — ajoutez-en pour votre équipe.'
              : full
                ? 'Tous les sièges sont occupés.'
                : `${free} siège(s) disponible(s) pour inviter votre équipe.`}
          </span>
          <Link className="btn btn-sm" href="/abonnement">
            {full || noSeats ? 'Ajouter des sièges' : 'Voir l’abonnement'}
          </Link>
        </div>
      )}
    </div>
  );
}
