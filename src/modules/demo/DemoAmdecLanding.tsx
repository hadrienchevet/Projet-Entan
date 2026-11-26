'use client';

/**
 * Atterrissage du lien « voir l'exemple » de l'article AMDEC.
 *
 * Amorce le projet de démonstration — déjà rempli de risques cotés — puis
 * ouvre directement l'AMDEC. Le nouvel arrivant tombe sur des données, pas sur
 * une page vide : c'est là qu'un outil se comprend.
 *
 * Garde-fou : si le projet de démo existe déjà (visite répétée), on le
 * sélectionne au lieu d'en créer un second.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/store';
import { DEMO_PROJECT_NAME } from '@/lib/demo';
import { IconAmdec } from '@/components/icons';

export function DemoAmdecLanding() {
  const router = useRouter();
  const { loading, projects, seedDemoProject, setCurrentProject } = useWorkspace();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // On attend que le store ait chargé : sans ça, `projects` est vide et on
    // recréerait un projet de démo à chaque visite.
    if (loading || started.current) return;
    started.current = true;

    void (async () => {
      try {
        const existing = projects.find((p) => p.name === DEMO_PROJECT_NAME);
        if (existing) setCurrentProject(existing.id);
        else await seedDemoProject();
        router.replace('/amdec');
      } catch {
        setFailed(true);
      }
    })();
  }, [loading, projects, seedDemoProject, setCurrentProject, router]);

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520, margin: '12vh auto 0' }}>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              marginBottom: 14,
            }}
          >
            <IconAmdec />
          </span>

          {failed ? (
            <>
              <h1 style={{ fontSize: 19, marginBottom: 8 }}>L’exemple n’a pas pu être préparé</h1>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
                Vous pouvez créer le projet de démonstration vous-même depuis la liste de vos projets.
              </p>
              <Link className="btn btn-primary btn-sm" href="/projets">
                Aller à mes projets
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 19, marginBottom: 8 }}>Préparation de votre exemple…</h1>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                On met en place un projet de démonstration avec une AMDEC déjà cotée. Vous y serez dans
                un instant.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
