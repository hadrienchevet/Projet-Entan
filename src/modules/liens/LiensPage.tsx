'use client';

import type { ReactNode } from 'react';
import { useCurrentProject, useProjectActions, useProjectAmdecs, useProjectRdps, useWorkspace } from '@/lib/store';
import type { Rdp } from '@/lib/types';
import { criticality, residualCriticality, solutionScore, subjectScore, STATUS_LABELS } from '@/lib/types';
import { CriticalityBadge } from '@/components/Badges';

/**
 * Arborescence des liens — vue schématique de toutes les relations entre
 * entités du projet, à la manière d'un arbre fonctionnel :
 *
 *   Projet → risques AMDEC → actions correctives liées (+ actions autonomes)
 *          → une branche par résolution de problème : sujet retenu → problème
 *            → causes (Ishikawa) → solutions → plan d'action.
 *
 * Depuis fix-32 les deux arbres ne s'excluent plus : la RDP étant un outil du
 * projet et non un type de projet, ses démarches se rattachent au projet parent
 * — c'est ici que ce rattachement devient visible.
 */

interface TreeNodeData {
  id: string;
  /** Nature du nœud — pilote la couleur du libellé (data-kind en CSS). */
  kind: string;
  kindLabel: string;
  label: string;
  sub?: string;
  badge?: ReactNode;
  children?: TreeNodeData[];
}

function TreeNode({ node }: { node: TreeNodeData }) {
  return (
    <li>
      <div className="tree-card" data-kind={node.kind}>
        <span className="tree-kind">{node.kindLabel}</span>
        <span className="tree-label">{node.label}</span>
        {node.sub && <span className="tree-sub">{node.sub}</span>}
        {node.badge}
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LiensPage() {
  const project = useCurrentProject();
  const amdecs = useProjectAmdecs(project?.id);
  const actions = useProjectActions(project?.id);
  const rdps = useProjectRdps(project?.id);
  /* Données RDP brutes : on les refiltre par résolution, un hook ne pouvant pas
     être appelé dans une boucle. */
  const { ishikawaAnalyses, rdpSolutions, rdpSubjects, rdpProblems } = useWorkspace();

  if (!project) return null;

  const memberName = (id?: string) => project.members.find((m) => m.id === id)?.name;

  /** La branche d'une résolution de problème : phases 0 → 6. */
  const rdpNode = (rdp: Rdp): TreeNodeData => {
    const subjects = rdpSubjects.filter((x) => x.rdpId === rdp.id);
    const ishikawa = ishikawaAnalyses.filter((x) => x.rdpId === rdp.id);
    const solutions = rdpSolutions.filter((x) => x.rdpId === rdp.id);
    // fix-33 : les actions CAPA sont désormais des actions du projet.
    const capa = actions.filter((x) => x.rdpId === rdp.id);
    const problem = rdpProblems.find((x) => x.rdpId === rdp.id) ?? null;

    const children: TreeNodeData[] = [];
    const retained = subjects.find((s) => s.retained);

    if (retained) {
      children.push({
        id: retained.id,
        kind: 'subject',
        kindLabel: 'Phase 0 · Sujet retenu',
        label: retained.label,
        sub: `score ${subjectScore(retained)} (fréquence ${retained.frequency} × impact ${retained.impact})`,
      });
    }

    if (problem && (problem.quoi || problem.ecart)) {
      children.push({
        id: `problem-${rdp.id}`,
        kind: 'problem',
        kindLabel: 'Phase 1 · Problème',
        label: problem.quoi || '(QQOQCP en cours)',
        sub: problem.ecart ? `écart : ${problem.ecart}` : undefined,
      });
    }

    for (const analysis of ishikawa) {
      children.push({
        id: analysis.id,
        kind: 'ishikawa',
        kindLabel: 'Phase 2 · Ishikawa',
        label: analysis.title,
        sub: analysis.effect || undefined,
        children: analysis.causes.map((cause) => ({
          id: cause.id,
          kind: 'cause',
          kindLabel: `Cause · ${cause.category}`,
          label: cause.causeText,
          children: solutions
            .filter((s) => s.causeId === cause.id)
            .map((s) => ({
              id: s.id,
              kind: 'solution',
              kindLabel: s.retained ? 'Solution retenue' : 'Solution',
              label: s.title,
              sub: `score ${solutionScore(s)}/12`,
            })),
        })),
      });
    }

    const orphanSolutions = solutions.filter(
      (s) => !s.causeId || !ishikawa.some((a) => a.causes.some((c) => c.id === s.causeId)),
    );
    if (orphanSolutions.length > 0) {
      children.push({
        id: `orphan-solutions-${rdp.id}`,
        kind: 'solution',
        kindLabel: 'Phases 3-4',
        label: 'Solutions sans cause liée',
        children: orphanSolutions.map((s) => ({
          id: s.id,
          kind: 'solution',
          kindLabel: s.retained ? 'Solution retenue' : 'Solution',
          label: s.title,
          sub: `score ${solutionScore(s)}/12`,
        })),
      });
    }

    for (const phase of [5, 6] as const) {
      const list = capa
        .filter((a) => a.rdpPhase === phase)
        .map((a) => ({
          id: a.id,
          kind: 'capa',
          kindLabel: phase === 5 ? 'Action' : 'Standardisation',
          label: a.title,
          sub:
            [memberName(a.responsibleId), STATUS_LABELS[a.status] + (a.capaVerified ? ' · vérifiée' : '')]
              .filter(Boolean)
              .join(' · ') || undefined,
        }));
      if (list.length > 0) {
        children.push({
          id: `phase${phase}-${rdp.id}`,
          kind: 'capa',
          kindLabel: `Phase ${phase}`,
          label: phase === 5 ? 'Mise en œuvre' : 'Standardisation',
          children: list,
        });
      }
    }

    return {
      id: rdp.id,
      kind: 'problem',
      kindLabel: `Résolution · phase ${rdp.currentPhase}/6`,
      label: rdp.title,
      children,
    };
  };

  const actionNode = (a: (typeof actions)[number]): TreeNodeData => ({
    id: a.id,
    kind: 'action',
    kindLabel: `Action · ${STATUS_LABELS[a.status]}`,
    label: a.title,
    sub: memberName(a.responsibleId),
  });

  // Ni AMDEC ni RDP : les actions RDP figurent déjà dans leur propre branche.
  const standalone = actions.filter((a) => !a.amdecId && !a.rdpId);
  const children: TreeNodeData[] = amdecs
    .slice()
    .sort((a, b) => criticality(b) - criticality(a))
    .map((entry) => ({
      id: entry.id,
      kind: 'risk',
      kindLabel: 'Risque AMDEC',
      label: `${entry.element} — ${entry.failureMode}`,
      sub: `cause : ${entry.cause}`,
      badge: (
        <span className="tree-badges">
          <CriticalityBadge score={criticality(entry)} />
          {residualCriticality(entry) !== null && (
            <>
              <span className="muted" style={{ fontSize: 11 }}>→</span>
              <CriticalityBadge score={residualCriticality(entry)!} />
            </>
          )}
        </span>
      ),
      children: actions.filter((a) => a.amdecId === entry.id).map(actionNode),
    }));

  if (standalone.length > 0) {
    children.push({
      id: 'standalone',
      kind: 'action',
      kindLabel: 'Hors AMDEC',
      label: 'Actions autonomes',
      children: standalone.map(actionNode),
    });
  }

  // Les résolutions de problème du projet, chacune avec sa démarche complète.
  for (const rdp of rdps) children.push(rdpNode(rdp));

  const root: TreeNodeData = {
    id: project.id,
    kind: 'project',
    kindLabel: 'Projet',
    label: project.name,
    children,
  };

  const isEmpty = children.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Liens</h1>
          <p className="subtitle">
            Arborescence du projet : risques AMDEC, actions correctives, et les résolutions de
            problème rattachées.
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="card">
          <div className="empty">
            <p>
              Rien à relier pour le moment — l&apos;arbre se construit automatiquement à
              partir des données saisies dans les autres modules.
            </p>
          </div>
        </div>
      ) : (
        <div className="card tree-wrap">
          <div className="tree">
            <ul>
              <TreeNode node={root} />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
