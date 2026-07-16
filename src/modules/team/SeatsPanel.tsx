'use client';

import Link from 'next/link';
import { useWorkspace } from '@/lib/store';
import { IconMail, IconPlus, IconTrash, IconUser } from '@/components/icons';

/**
 * Carte « Sièges » de l'entreprise (page Équipe). Trois états :
 *  - accès offert (`isComp`) → sièges illimités ;
 *  - abonnement (seats > 0) → visualisation utilisés / libres, réservation ;
 *  - accès par clé (seats = 0) → pas de quota, chaque membre a sa clé perso.
 * Lit `seatsAllowed`, `companyMembers`, `companyInvitations` du store.
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
    trialEndsAt,
    removeCompanyMember,
  } = useWorkspace();
  if (!company) return null;

  const activeMembers = companyMembers.filter((m) => m.status === 'active');
  const active = activeMembers.length;
  const invited = seatsInvited;
  const unlimited = !Number.isFinite(seatsAllowed);
  const subscribed = !unlimited && seatsAllowed > 0;
  // Accès purement via l'essai gratuit (ni offert, ni abonnement, ni clé).
  const onTrial = !unlimited && !subscribed && !!trialEndsAt;
  const reserved = active + invited;
  const free = Math.max(0, seatsAllowed - reserved);
  const full = subscribed && free === 0;

  const cellCount = subscribed ? Math.min(Math.max(seatsAllowed, reserved), 24) : 0;
  const cells = Array.from({ length: cellCount }, (_, i) =>
    i < active ? 'u' : i < reserved ? 'i' : 'f',
  );

  const badgeLabel = unlimited
    ? 'Accès offert'
    : subscribed
      ? 'Abonnement'
      : onTrial
        ? 'Essai gratuit'
        : 'Accès par clé';
  const badgeClass = unlimited ? 'done' : subscribed || onTrial ? 'in_progress' : 'todo';

  const onRemove = (uid: string, name: string) => {
    if (!window.confirm(`Retirer ${name} de l'organisation ?`)) return;
    void removeCompanyMember(uid);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>Sièges</h2>
          <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
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
              : subscribed
                ? `/ ${seatsAllowed} sièges utilisés`
                : active > 1 ? 'membres actifs' : 'membre actif'}
          </span>
        </div>

        {subscribed && (
          <div className="seats-cells">
            {cells.map((k, i) => (
              <span key={i} className={`seats-cell ${k}`}>
                {k === 'u' ? <IconUser /> : k === 'i' ? <IconMail /> : <IconPlus />}
              </span>
            ))}
          </div>
        )}

        {subscribed && (
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
          // Consulter un profil : soi-même, ou un admin/owner (aligné sur la RLS fix-21).
          const canOpen = isCompanyAdmin || you;
          const identity = (
            <>
              <span className="seats-avatar">{initials(m.displayName, m.email)}</span>
              <div className="seats-member-main">
                <div className="seats-member-name">
                  {name}
                  {you && <span className="you"> (vous)</span>}
                </div>
                {m.email && <div className="seats-member-sub">{m.email}</div>}
              </div>
            </>
          );
          return (
            <div key={m.userId} className="seats-member">
              {canOpen ? (
                <Link
                  href={`/equipe/${m.userId}`}
                  className="seats-member-btn"
                  title="Voir le profil"
                >
                  {identity}
                </Link>
              ) : (
                identity
              )}
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

      {isCompanyAdmin && !unlimited && (
        <div className="seats-foot">
          {subscribed ? (
            <>
              <span className={full ? 'danger-text' : 'muted'}>
                {full
                  ? 'Tous les sièges sont occupés.'
                  : `${free} siège(s) disponible(s) pour inviter votre équipe.`}
              </span>
              <Link className="btn btn-sm" href="/abonnement">Gérer l’abonnement</Link>
            </>
          ) : onTrial ? (
            <>
              <span className="muted">
                Essai gratuit en cours. Passez à un abonnement pour ajouter des sièges et inviter votre équipe.
              </span>
              <Link className="btn btn-sm" href="/abonnement">Voir l’abonnement</Link>
            </>
          ) : (
            <>
              <span className="muted">
                Accès par clé (1 clé = 1 siège). L’abonnement en ligne arrivera bientôt.
              </span>
              <Link className="btn btn-sm" href="/abonnement">En savoir plus</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
