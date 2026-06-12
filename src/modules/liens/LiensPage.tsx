'use client';

import type { ReactNode } from 'react';
import { useCurrentProject, useProjectActions, useProjectAmdecs, useProjectCapa, useProjectIshikawa, useProjectSolutions, useProjectSubjects, useWorkspace } from '@/lib/store';
import { CAPA_STATUS_LABELS, criticality, residualCriticality, solutionScore, subjectScore, STATUS_LABELS } from '@/lib/types';
import { CriticalityBadge } from '@/components/Badges';

/**
 * Arborescence des liens — vue schématique de toutes les relations entre
 * entités du projet, à la manière d'un arbre fonctionnel :
 * - gestion : Projet → risques AMDEC → actions correctives liées (+ actions autonomes) ;
 * - RDP    : Projet → sujet retenu → problème → causes (Ishikawa) → solutions → plan d'action.
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
  const ishikawa = useProjectIshikawa(project?.id);
  const solutions = useProjectSolutions(project?.id);
  const subjects = useProjectSubjects(project?.id);
  const capa = useProjectCapa(project?.id);
  const { rdpProblem } = useWorkspace();

  if (!project) return null;

  const memberName = (id?: string) =>
    project.members.find((m) => m.id === id)?.name;

  let root: TreeNodeData;

  if (project.projectType === 'rdp') {
    const retained = subjects.find((s) => s.retained);
    const capaNode = (phase: 5 | 6): TreeNodeData[] =>
      capa
        .filter((a) => a.phase === phase)
        .map((a) => ({
          id: a.id,
          kind: 'capa',
          kindLabel: phase === 5 ? 'Action' : 'Standardisation',
          label: a.title,
          sub:
            [memberName(a.responsibleId), CAPA_STATUS_LABELS[a.status]]
              .filter(Boolean)
              .join(' · ') || undefined,
        }));

    const children: TreeNodeData[] = [];

    if (retained) {
      children.push({
        id: retained.id,
        kind: 'subject',
        kindLabel: 'Phase 0 · Sujet retenu',
        label: retained.label,
        sub: `score ${subjectScore(retained)} (fréquence ${retained.frequency} × impact ${retained.impact})`,
      });
    }

    if (rdpProblem && (rdpProblem.quoi || rdpProblem.ecart)) {
      children.push({
        id: 'problem',
        kind: 'problem',
        kindLabel: 'Phase 1 · Problème',
        label: rdpProblem.quoi || '(QQOQCP en cours)',
        sub: rdpProblem.ecart ? `écart : ${rdpProblem.ecart}` : undefined,
      });
    }

    // Phase 2 → 4 : chaque diagramme porte ses causes, chaque cause ses solutions.
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
        id: 'orphan-solutions',
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

    const phase5 = capaNode(5);
    const phase6 = capaNode(6);
    if (phase5.length > 0) {
      children.push({
        id: 'phase5',
        kind: 'capa',
        kindLabel: 'Phase 5',
        label: 'Mise en œuvre',
        children: phase5,
      });
    }
    if (phase6.length > 0) {
      children.push({
        id: 'phase6',
        kind: 'capa',
        kindLabel: 'Phase 6',
        label: 'Standardisation',
        children: phase6,
      });
    }

    root = {
      id: project.id,
      kind: 'project',
      kindLabel: 'Projet RDP',
      label: project.name,
      children,
    };
  } else {
    const actionNode = (a: (typeof actions)[number]): TreeNodeData => ({
      id: a.id,
      kind: 'action',
      kindLabel: `Action · ${STATUS_LABELS[a.status]}`,
      label: a.title,
      sub: memberName(a.responsibleId),
    });

    const standalone = actions.filter((a) => !a.amdecId);
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

    root = {
      id: project.id,
      kind: 'project',
      kindLabel: 'Projet',
      label: project.name,
      children,
    };
  }

  const isEmpty = !root.children || root.children.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Liens</h1>
          <p className="subtitle">
            {project.projectType === 'rdp'
              ? 'Arborescence de la démarche : sujet → problème → causes → solutions → plan d’action.'
              : 'Arborescence du projet : risques AMDEC et actions correctives qui en découlent.'}
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
