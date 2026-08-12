'use client';

/**
 * Presence (qui est là) + Broadcast (payload éphémère, throttlé) sur un canal
 * Realtime privé scopé projet+vue : `project:<projectId>:presence:<scope>`.
 * Générique en `P` — la sémantique des coordonnées reste dans l'appelant
 * (cf. `GanttView.tsx`), ce hook ne fait que le transport. RLS : voir
 * `supabase/fix-31-realtime-cursors.sql`.
 */

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/lib/store';
import { colorForUser } from '@/lib/presenceColor';

export interface PresentCursor<P> {
  userId: string;
  name: string;
  color: string;
  payload: P | null;
}

export function useCursorPresence<P>(projectId: string | undefined, scope: string) {
  const { userId, userEmail, companyMembers } = useWorkspace();
  const [others, setOthers] = useState<Map<string, PresentCursor<P>>>(new Map());
  const lastSentRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId || !userId) return;
    const supabase = createClient();
    const name = companyMembers.find((m) => m.userId === userId)?.displayName || userEmail || 'Quelqu’un';
    const color = colorForUser(userId);
    const channel = supabase.channel(`project:${projectId}:presence:${scope}`, {
      config: { private: true, presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string; color: string }>();
        setOthers((prev) => {
          const next = new Map<string, PresentCursor<P>>();
          for (const [uid, metas] of Object.entries(state)) {
            if (uid === userId || metas.length === 0) continue;
            const meta = metas[0];
            next.set(uid, { userId: uid, name: meta.name, color: meta.color, payload: prev.get(uid)?.payload ?? null });
          }
          return next;
        });
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }: { payload: { userId: string; data: P } }) => {
        if (payload.userId === userId) return;
        setOthers((prev) => {
          const existing = prev.get(payload.userId);
          if (!existing) return prev;
          const next = new Map(prev);
          next.set(payload.userId, { ...existing, payload: payload.data });
          return next;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void channel.track({ name, color });
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, userId, userEmail, companyMembers, scope]);

  const reportCursor = (data: P) => {
    const now = performance.now();
    if (now - lastSentRef.current < 50) return; // throttle ~20/s
    lastSentRef.current = now;
    void channelRef.current?.send({ type: 'broadcast', event: 'cursor', payload: { userId, data } });
  };

  return { others: [...others.values()], reportCursor };
}
