'use client';

/**
 * Partage du compte-rendu : on voit qui va recevoir avant d'envoyer — cet écran
 * EST la confirmation (l'envoi d'email est une action sortante irréversible).
 *
 * Anti-abus : le client n'envoie que des IDENTIFIANTS, jamais d'adresse email.
 * Un destinataire ajouté ici est d'abord enregistré sur la revue
 * (`snapshot.sharedWith`), puis l'envoi le référence par son id — le serveur
 * résout les adresses lui-même. Sans ça, la clé anon publique suffirait à faire
 * de l'app un relais d'envoi. Même règle que `/api/invite/send`.
 */

import { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { useWorkspace } from '@/lib/store';
import type { Id, Revue } from '@/lib/types';

interface Row {
  id: string;
  name: string;
  email?: string;
  origin: 'membre' | 'invité' | 'ajouté';
  wasPresent: boolean;
}

export function ShareCrModal({
  revue,
  projectName,
  onClose,
}: {
  revue: Revue;
  projectName: string;
  onClose: () => void;
}) {
  const { projects, companyMembers, updateRevueSnapshot } = useWorkspace();
  const project = projects.find((p) => p.id === revue.projectId);
  const snap = revue.snapshot;

  const [addingOpen, setAddingOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const rows: Row[] = useMemo(() => {
    const present = new Set(snap?.participantIds ?? []);
    const members: Row[] = (project?.members ?? [])
      .filter((m) => m.userId) // sans compte = pas d'adresse connue
      .map((m) => ({
        id: m.userId as string,
        name: m.name,
        email: companyMembers.find((cm) => cm.userId === m.userId)?.email,
        origin: 'membre' as const,
        wasPresent: present.has(m.id),
      }));
    const guests: Row[] = (snap?.guests ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      email: g.email,
      origin: 'invité' as const,
      wasPresent: true,
    }));
    const added: Row[] = (snap?.sharedWith ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      origin: 'ajouté' as const,
      wasPresent: false,
    }));
    return [...members, ...guests, ...added];
  }, [project, companyMembers, snap]);

  /** Pré-cochés : les présents joignables. On ne coche jamais quelqu'un sans adresse. */
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(rows.filter((r) => r.wasPresent && r.email).map((r) => r.id)),
  );

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addRecipient = async () => {
    const name = newName.trim();
    const email = newEmail.trim();
    if (!name || !email) return;
    const id = crypto.randomUUID() as Id;
    await updateRevueSnapshot(revue.id, {
      sharedWith: [...(snap?.sharedWith ?? []), { id, name, email }],
    });
    setSelected((s) => new Set(s).add(id));
    setNewName('');
    setNewEmail('');
    setAddingOpen(false);
  };

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/revue/send-cr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revueId: revue.id, recipientIds: [...selected] }),
      });
      // Session expirée : le middleware redirige vers /login, donc on reçoit une
      // page HTML en 200 — sans ce garde-fou on afficherait « envoyé à 0 personne ».
      if (res.redirected || res.url.includes('/login')) {
        setResult({ ok: false, message: 'Votre session a expiré. Reconnectez-vous puis réessayez.' });
        setSending(false);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; sent?: number; error?: string };
      if (!res.ok || !data.ok) {
        const map: Record<string, string> = {
          unauthorized: 'Vous devez être connecté pour envoyer le compte-rendu.',
          forbidden: 'Vous n’avez pas accès à ce projet.',
          resend_non_configure: 'L’envoi d’email n’est pas configuré sur ce déploiement.',
          aucun_destinataire: 'Aucun destinataire joignable dans la sélection.',
          trop_de_destinataires: 'Trop de destinataires sélectionnés (30 maximum).',
        };
        setResult({ ok: false, message: map[data.error ?? ''] ?? 'L’envoi a échoué. Réessayez plus tard.' });
      } else {
        setResult({ ok: true, message: `Compte-rendu envoyé à ${data.sent ?? 0} personne(s).` });
      }
    } catch {
      setResult({ ok: false, message: 'L’envoi a échoué (réseau). Réessayez plus tard.' });
    }
    setSending(false);
  };

  const selectable = rows.filter((r) => r.email);
  const count = selectable.filter((r) => selected.has(r.id)).length;

  return (
    <Modal
      title={`Partager le compte-rendu · ${projectName}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Fermer
          </button>
          <button className="btn btn-primary" onClick={send} disabled={sending || count === 0}>
            {sending ? 'Envoi…' : `Envoyer (${count})`}
          </button>
        </>
      }
    >
      {rows.length === 0 ? (
        <div className="empty">
          <p>Personne à qui partager : l’équipe du projet n’a aucun membre avec un compte.</p>
        </div>
      ) : (
        rows.map((r) => (
          <label
            key={r.id}
            className="list-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: r.email ? 'pointer' : 'default',
              opacity: r.email ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              disabled={!r.email}
              onChange={() => toggle(r.id)}
              style={{ width: 'auto', flexShrink: 0 }}
            />
            <div className="row-main" style={{ flex: 1 }}>
              <div className="row-title">{r.name}</div>
              <div className="row-sub">{r.email ?? 'pas d’adresse'}</div>
            </div>
            {r.wasPresent && <span className="badge done">présent</span>}
            {r.origin !== 'membre' && <span className="badge source">{r.origin}</span>}
          </label>
        ))
      )}

      {addingOpen ? (
        <div className="list-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nom"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: '1 1 140px', width: 'auto' }}
          />
          <input
            type="text"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addRecipient()}
            style={{ flex: '1 1 200px', width: 'auto' }}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={() => void addRecipient()}
            disabled={!newName.trim() || !newEmail.trim()}
          >
            Ajouter
          </button>
          <button className="btn btn-sm" onClick={() => setAddingOpen(false)}>
            Annuler
          </button>
        </div>
      ) : (
        <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => setAddingOpen(true)}>
          + Ajouter un destinataire
        </button>
      )}

      {result && (
        <p className={result.ok ? 'form-success' : 'form-error'} style={{ marginTop: 12 }}>
          {result.message}
        </p>
      )}
    </Modal>
  );
}
