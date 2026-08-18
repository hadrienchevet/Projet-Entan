'use client';

/**
 * « Contexte IA » — génère un résumé Markdown du projet à coller dans un
 * assistant (ChatGPT, Claude, Copilot…).
 *
 * Copier est l'action principale, pas télécharger : on colle un contexte dans
 * une conversation bien plus souvent qu'on n'y téléverse un fichier.
 *
 * Tout est calculé côté client à partir du store — aucun appel réseau, donc
 * aucune donnée du projet ne sort de l'app tant que l'utilisateur ne colle pas
 * lui-même le texte quelque part.
 */

import { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { useWorkspace } from '@/lib/store';
import { todayISO } from '@/lib/date';
import { buildProjectContextMd, projectContextFilename } from '@/lib/projectContext';
import type { Project } from '@/lib/types';

export function ProjectContextModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const ws = useWorkspace();
  const [anonymize, setAnonymize] = useState(false);
  const [copied, setCopied] = useState(false);

  const today = todayISO();
  const markdown = useMemo(
    () =>
      buildProjectContextMd({
        project,
        actions: ws.actions,
        amdecs: ws.amdecs,
        costItems: ws.costItems,
        swotItems: ws.swotItems,
        a3Report: ws.a3Report,
        revues: ws.revues,
        revueDecisions: ws.revueDecisions,
        rdps: ws.rdps,
        rdpSubjects: ws.rdpSubjects,
        rdpProblems: ws.rdpProblems,
        rdpSolutions: ws.rdpSolutions,
        rdpIndicators: ws.rdpIndicators,
        fiveWhyAnalyses: ws.fiveWhyAnalyses,
        ishikawaAnalyses: ws.ishikawaAnalyses,
        today,
        anonymize,
      }),
    [
      project,
      ws.actions,
      ws.amdecs,
      ws.costItems,
      ws.swotItems,
      ws.a3Report,
      ws.revues,
      ws.revueDecisions,
      ws.rdps,
      ws.rdpSubjects,
      ws.rdpProblems,
      ws.rdpSolutions,
      ws.rdpIndicators,
      ws.fiveWhyAnalyses,
      ws.ishikawaAnalyses,
      today,
      anonymize,
    ],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Presse-papier refusé (contexte non sécurisé, permission) : le texte
      // reste sélectionnable dans l'aperçu, on ne bloque pas l'utilisateur.
      console.warn('Copie dans le presse-papier refusée', err);
    }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = projectContextFilename(project.name, today);
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = markdown.split('\n').length;
  const words = markdown.split(/\s+/).filter(Boolean).length;

  return (
    <Modal
      title="Contexte IA du projet"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={download}>
            Télécharger .md
          </button>
          <button className="btn btn-primary" onClick={() => void copy()}>
            {copied ? 'Copié ✓' : 'Copier le contexte'}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 13 }}>
        Un résumé structuré de l’état du projet — avancement, retards, jalons, risques, budget —
        à coller dans l’assistant IA de votre choix pour l’interroger, préparer une revue ou
        rédiger un point d’avancement.
      </p>

      <label
        className="list-row"
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={anonymize}
          onChange={(e) => setAnonymize(e.target.checked)}
          style={{ width: 'auto', flexShrink: 0 }}
        />
        <div className="row-main" style={{ flex: 1 }}>
          <div className="row-title">Anonymiser les personnes</div>
          <div className="row-sub">
            Remplace les noms de l’équipe par « Membre 1 », « Membre 2 »… Les adresses email ne
            sont jamais incluses.
          </div>
        </div>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ fontSize: 13 }}>Aperçu</strong>
        <span className="badge source">
          {lines} lignes · ~{words} mots
        </span>
      </div>
      <pre
        style={{
          maxHeight: 320,
          overflow: 'auto',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {markdown}
      </pre>

      <p className="muted" style={{ fontSize: 12 }}>
        Ces données sont internes à votre organisation : vérifiez la politique de votre entreprise
        avant de les transmettre à un service d’IA externe.
      </p>
    </Modal>
  );
}
