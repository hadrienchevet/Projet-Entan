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

import { useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/Modal';
import { IconHelp } from '@/components/icons';
import { useWorkspace } from '@/lib/store';
import { copyText, selectElementText } from '@/lib/clipboard';
import { todayISO } from '@/lib/date';
import { buildProjectContextMd, projectContextFilename } from '@/lib/projectContext';
import type { Project } from '@/lib/types';

export function ProjectContextModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const ws = useWorkspace();
  const [anonymize, setAnonymize] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const preview = useRef<HTMLPreElement>(null);

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
    const ok = await copyText(markdown);
    setCopyState(ok ? 'ok' : 'fail');
    // Échec : on sélectionne l'aperçu pour que Ctrl+C prenne le relais, plutôt
    // que de laisser un bouton qui ne fait rien.
    if (!ok) selectElementText(preview.current);
    window.setTimeout(() => setCopyState('idle'), ok ? 2500 : 8000);
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
      // Nouvel onglet : ouvrir l'aide dans le même onglet fermerait la modale et
      // perdrait le contexte généré, alors qu'on veut lire un exemple ET copier.
      titleAction={
        <a
          className="icon-btn"
          href="/help/contexte-ia"
          target="_blank"
          rel="noopener noreferrer"
          title="Comment s’en servir : exemples et bonnes pratiques"
          aria-label="Aide : comment utiliser le contexte IA"
        >
          <IconHelp />
        </a>
      }
      footer={
        <>
          <button className="btn" onClick={download}>
            Télécharger .md
          </button>
          <button className="btn btn-primary" onClick={() => void copy()}>
            {copyState === 'ok' ? 'Copié ✓' : 'Copier le contexte'}
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
        ref={preview}
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

      {copyState === 'fail' && (
        <p className="form-error" style={{ fontSize: 12.5, margin: 0 }}>
          Votre navigateur bloque l’accès au presse-papier. L’aperçu a été sélectionné : faites Ctrl+C
          pour le copier, ou utilisez « Télécharger .md ».
        </p>
      )}

      <p className="muted" style={{ fontSize: 12 }}>
        Ces données sont internes à votre organisation : vérifiez la politique de votre entreprise
        avant de les transmettre à un service d’IA externe.
      </p>
    </Modal>
  );
}
