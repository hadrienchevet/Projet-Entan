'use client';

/**
 * « Par où commencer » — la seule section non repliable de l'aide, en haut.
 *
 * Elle affiche l'avancement RÉEL du projet courant, pas une liste générique :
 * une progression déjà entamée se termine bien plus souvent qu'une progression
 * à zéro, et la première étape est acquise dès qu'on a un projet. Chaque ligne
 * mène à l'écran concerné — c'est un point de départ, pas une explication.
 *
 * Client-only : la page publique `/methodes` n'a ni projet ni store.
 */

import Link from 'next/link';
import { useCurrentProject, useWorkspace } from '@/lib/store';
import { IconCheck } from '@/components/icons';

interface Step {
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

export function StartChecklist() {
  const project = useCurrentProject();
  const { actions, amdecs, revues } = useWorkspace();

  const steps: Step[] = project
    ? [
        {
          label: 'Créer un projet',
          hint: project.name,
          href: '/projets',
          done: true,
        },
        {
          label: 'Constituer l’équipe',
          hint: 'Invitez vos coéquipiers pour leur attribuer des actions.',
          href: '/access',
          done: project.members.length >= 2,
        },
        {
          label: 'Poser le plan d’action',
          hint: 'Trois actions suffisent pour que le projet devienne pilotable.',
          href: '/actions',
          done: actions.length >= 3,
        },
        {
          label: 'Marquer un jalon',
          hint: 'Un point de passage clé, pour que le planning ait un cap.',
          href: '/planning',
          done: actions.some((a) => a.milestone),
        },
        {
          label: 'Coter les risques',
          hint: 'Une AMDEC, même courte, révèle ce qui va vous retarder.',
          href: '/amdec',
          done: amdecs.length > 0,
        },
        {
          label: 'Tenir une revue',
          hint: 'Le compte-rendu s’écrit tout seul à la clôture.',
          href: '/revue',
          done: revues.length > 0,
        },
      ]
    : [
        {
          label: 'Créer un projet',
          hint: 'Tout part de là — les outils ci-dessous s’activent ensuite.',
          href: '/projets',
          done: false,
        },
      ];

  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const allDone = done === steps.length;

  return (
    <div className="card start-card">
      <div className="card-body">
        <div className="start-head">
          <div>
            <h2>Par où commencer</h2>
            <p className="lead" style={{ marginBottom: 0 }}>
              {allDone
                ? 'Tout est en place. Les fiches ci-dessous vont plus loin sur chaque outil.'
                : 'Six étapes pour rendre un projet pilotable. Chaque ligne vous emmène au bon endroit.'}
            </p>
          </div>
          <span className={`start-count${allDone ? ' done' : ''}`}>
            {done}/{steps.length}
          </span>
        </div>

        <div className="start-bar" role="img" aria-label={`Progression : ${done} étapes sur ${steps.length}`}>
          <span style={{ width: `${pct}%` }} />
        </div>

        <ol className="start-steps">
          {steps.map((s) => (
            <li key={s.label} className={s.done ? 'done' : undefined}>
              <span className="tick" aria-hidden="true">
                {s.done ? <IconCheck /> : null}
              </span>
              <span className="txt">
                <Link href={s.href}>{s.label}</Link>
                <small>{s.hint}</small>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
