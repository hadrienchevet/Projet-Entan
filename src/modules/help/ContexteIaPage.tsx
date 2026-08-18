'use client';

/**
 * Page d'explication du « Contexte IA » — atteinte depuis le « ? » de la modale.
 *
 * Parti pris : la valeur n'est pas dans la description de la fonction (deux
 * phrases suffisent) mais dans les **exemples prêts à coller**. D'où des
 * prompts copiables en un clic plutôt qu'une liste de bénéfices.
 */

import { useRef, useState } from 'react';
import Link from 'next/link';
import { IconBulb, IconCheck, IconHelp, IconSparkles } from '@/components/icons';
import { copyText, selectElementText } from '@/lib/clipboard';

interface Recipe {
  title: string;
  when: string;
  why: string;
  prompt: string;
}

const RECIPES: Recipe[] = [
  {
    title: 'Préparer une revue ou un COPIL',
    when: 'Avant une réunion d’avancement.',
    why: 'Le document contient déjà les retards, les jalons, les risques et les décisions de la revue précédente. Le plus utile reste la dernière phrase : anticiper les questions difficiles avant d’être dans la salle.',
    prompt: `Tu es un chef de projet industriel senior. À partir du contexte ci-dessus, prépare l'ordre du jour de ma revue d'avancement de 45 minutes : 3 à 5 points maximum, classés par enjeu, avec pour chacun la décision attendue et qui doit la prendre. Termine par les 3 questions difficiles que ma direction risque de me poser, et la réponse factuelle à chacune.`,
  },
  {
    title: 'Rédiger le point d’avancement',
    when: 'Le mail hebdomadaire au manager ou au client.',
    why: 'Vingt minutes de rédaction qu’on repousse toujours. Le contexte contient tous les chiffres : il ne reste que la mise en forme.',
    prompt: `Rédige un point d'avancement de 10 lignes maximum pour ma direction, à partir du contexte ci-dessus. Ton factuel, pas commercial. Structure : où on en est, ce qui bloque, ce que j'attends d'eux. N'invente aucun chiffre qui ne figure pas dans le document.`,
  },
  {
    title: 'Challenger l’analyse de risques',
    when: 'Après une première AMDEC, avant de la présenter.',
    why: 'C’est ici que l’IA apporte de l’expertise et pas seulement de la mise en forme : lister les modes de défaillance auxquels on n’a pas pensé est justement l’exercice où l’on passe à côté de quelque chose.',
    prompt: `Voici mon analyse AMDEC dans le contexte ci-dessus. Quels modes de défaillance manquent, compte tenu du type de projet ? Pour chacun, propose une cotation Gravité / Occurrence / Détectabilité sur l'échelle 1–4 utilisée ici, avec ta justification. Signale aussi les cotations existantes qui te semblent optimistes.`,
  },
  {
    title: 'Chercher les incohérences',
    when: 'Quand on a le nez dans le guidon depuis des semaines.',
    why: 'Le document porte les dépendances entre actions, les jalons et le budget : une IA croise ces trois dimensions mieux qu’un humain fatigué.',
    prompt: `Cherche les incohérences dans ce projet : actions en retard qui mettent un jalon en danger, risques critiques sans action corrective, écart budgétaire au regard de ce qu'il reste à faire. Classe tes constats du plus au moins préoccupant et dis-moi ce que tu ferais en premier lundi matin.`,
  },
  {
    title: 'Reprendre un projet',
    when: 'Passation, retour de congés, arrivée d’un renfort.',
    why: 'Le seul usage qui ne nécessite même pas d’IA : le document se lit très bien tel quel. Avec une IA, on obtient en plus une mise à niveau ciblée.',
    prompt: `Je reprends ce projet et je ne le connais pas. Explique-moi en 15 lignes ce dont il s'agit, où ça en est, et les 3 choses que je dois comprendre avant ma première réunion.`,
  },
  {
    title: 'Débloquer une résolution de problème',
    when: 'Quand la démarche RDP tourne en rond.',
    why: 'Le contexte embarque le QQOQCP, les causes identifiées et la matrice de décision — de quoi faire compléter un Ishikawa ou challenger un arbitrage.',
    prompt: `À partir de la résolution de problème décrite ci-dessus : quelles causes 5M (Matière, Méthode, Machine, Main-d'œuvre, Milieu) n'ai-je pas listées ? Ensuite, challenge mon arbitrage de solutions : la solution retenue est-elle vraiment la meilleure au regard des causes racines identifiées ?`,
  },
];

const HABITS: { title: string; text: string }[] = [
  {
    title: 'Régénérez plutôt que de reprendre une vieille conversation',
    text: 'Le document est un instantané daté. Au bout de deux semaines, l’IA raisonne sur un projet qui n’existe plus. La date du jour figure en en-tête précisément pour ça.',
  },
  {
    title: 'Ajoutez ce que l’outil ne sait pas',
    text: 'Le document ne connaît que les données saisies : ni la tension avec un fournisseur, ni le départ d’un sponsor en septembre. Un paragraphe de contexte libre collé à la suite double souvent la pertinence de la réponse.',
  },
  {
    title: 'Interdisez l’invention de chiffres',
    text: 'Tous les calculs sont déjà faits dans le document — avancement, jours de retard, écarts. Le préciser dans votre demande réduit nettement les approximations.',
  },
  {
    title: 'Demandez-lui ce qui lui manque',
    text: '« Qu’est-ce qui manque dans ce document pour répondre correctement ? » fonctionne bien : le document annonce lui-même ses coupes. La réponse vous dit souvent quoi compléter dans ENTAN.',
  },
];

const css = `
.cia h2 { font-size: 18px; margin: 0 0 4px; }
.cia .lead { color: var(--text-secondary); margin: 0 0 16px; line-height: 1.7; }
.cia .page-header h1 .ic { color: var(--accent); display: inline-flex; }
.cia .page-header h1 .ic svg { width: 22px; height: 22px; flex-shrink: 0; }

.cia-steps { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin: 0; padding: 0; list-style: none; counter-reset: s; }
.cia-steps li { counter-increment: s; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
.cia-steps li::before { content: counter(s); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.cia-steps b { display: block; font-size: 13.5px; margin-bottom: 3px; }
.cia-steps span { color: var(--text-secondary); font-size: 12.5px; line-height: 1.55; }

.cia-recipe { border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 14px; }
.cia-recipe:last-child { margin-bottom: 0; }
.cia-recipe h3 { font-size: 15px; margin: 0 0 2px; }
.cia-recipe .when { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 9px; }
.cia-recipe p { color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0 0 11px; }

.cia-prompt { position: relative; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 13px; }
.cia-prompt pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12.5px; line-height: 1.6; color: var(--text); font-family: var(--font); }
.cia-prompt .bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
.cia-prompt .cap { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.cia-copyfail { margin: 9px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--warning); }
.cia-copyfail kbd { background: var(--surface); border: 1px solid var(--border-strong); border-radius: 4px; padding: 1px 5px; font-size: 11px; font-family: var(--font); color: var(--text); }

.cia-habits { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.cia-habit { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 13px; }
.cia-habit b { display: block; font-size: 13.5px; margin-bottom: 4px; }
.cia-habit span { color: var(--text-secondary); font-size: 12.5px; line-height: 1.6; }

.cia-two { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
@media (max-width: 720px) { .cia-two { grid-template-columns: 1fr; } }
.cia-list { margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8; font-size: 13.5px; }
.cia-list strong { color: var(--text); }
`;

function PromptBlock({ prompt }: { prompt: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const pre = useRef<HTMLPreElement>(null);

  const copy = async () => {
    const ok = await copyText(prompt);
    setState(ok ? 'ok' : 'fail');
    // En cas d'échec, on sélectionne le texte : l'utilisateur n'a plus qu'à
    // faire Ctrl+C, au lieu de se retrouver devant un bouton inerte.
    if (!ok) selectElementText(pre.current);
    window.setTimeout(() => setState('idle'), ok ? 2500 : 8000);
  };

  return (
    <div className="cia-prompt">
      <div className="bar">
        <span className="cap">À coller après le contexte</span>
        <button className="btn btn-ghost btn-sm" onClick={() => void copy()}>
          {state === 'ok' ? (
            <>
              <IconCheck /> Copié
            </>
          ) : (
            'Copier'
          )}
        </button>
      </div>
      <pre ref={pre}>{prompt}</pre>
      {state === 'fail' && (
        <p className="cia-copyfail">
          Votre navigateur bloque l’accès au presse-papier. Le texte a été sélectionné : faites{' '}
          <kbd>Ctrl</kbd> + <kbd>C</kbd> pour le copier.
        </p>
      )}
    </div>
  );
}

export function ContexteIaPage() {
  return (
    <div className="page guide cia">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ic">
              <IconSparkles />
            </span>{' '}
            Contexte IA
          </h1>
          <p className="subtitle">
            Résumer votre projet en un document que n’importe quel assistant IA comprend.
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-sm" href="/help">
            <IconHelp /> Retour à l’aide
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>À quoi ça sert</h2>
          <p className="lead" style={{ marginBottom: 0 }}>
            Une IA ne peut rien dire d’utile sur votre projet si vous ne lui donnez pas le projet. Coller
            des bouts d’Excel et de mails donne des réponses vagues, parce que l’information est
            incomplète et sans structure. Le bouton <strong>Contexte IA</strong> produit en un clic un
            résumé structuré de votre projet — avancement, retards, jalons, risques, budget, résolutions
            de problème, dernière revue — que vous collez dans l’assistant de votre choix pour
            l’interroger, préparer une réunion ou rédiger un point d’avancement.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>Comment faire</h2>
          <p className="lead">Trois étapes, moins d’une minute.</p>
          <ol className="cia-steps">
            <li>
              <b>Générez</b>
              <span>
                Depuis le tableau de bord de votre projet, cliquez sur « Contexte IA ». Un aperçu du
                document s’affiche.
              </span>
            </li>
            <li>
              <b>Copiez</b>
              <span>
                « Copier le contexte » place tout le document dans le presse-papier. Collez-le dans votre
                assistant. (« Télécharger .md » sert plutôt à l’archivage ou à une passation.)
              </span>
            </li>
            <li>
              <b>Demandez</b>
              <span>
                À la suite du document, écrivez votre demande. Les exemples ci-dessous sont prêts à
                l’emploi.
              </span>
            </li>
          </ol>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>Six usages concrets</h2>
          <p className="lead">
            Chaque exemple se colle <strong>après</strong> le contexte, dans le même message.
          </p>
          {RECIPES.map((r) => (
            <div key={r.title} className="cia-recipe">
              <h3>{r.title}</h3>
              <div className="when">{r.when}</div>
              <p>{r.why}</p>
              <PromptBlock prompt={r.prompt} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>Les réflexes qui changent la qualité des réponses</h2>
          <p className="lead">
            La différence entre une réponse générique et une réponse exploitable tient à quatre
            habitudes.
          </p>
          <div className="cia-habits">
            {HABITS.map((h) => (
              <div key={h.title} className="cia-habit">
                <b>{h.title}</b>
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2>Ce que contient le document — et ce qu’il ne contient pas</h2>
          <p className="lead">
            C’est une <strong>sélection</strong>, pas un export complet : un document trop long noie
            l’assistant et dégrade sa réponse.
          </p>
          <div className="cia-two">
            <div>
              <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>Inclus</h3>
              <ul className="cia-list">
                <li>
                  <strong>Une synthèse chiffrée</strong> : avancement, retards en jours, écart budgétaire
                  — tout est calculé, l’assistant n’a rien à compter.
                </li>
                <li>
                  <strong>Les échéances qui comptent</strong> : jalons, actions en retard avec ce qu’elles
                  bloquent, actions à venir.
                </li>
                <li>
                  <strong>Les risques au-dessus des seuils</strong>, avec le barème expliqué.
                </li>
                <li>
                  <strong>Vos analyses</strong> : résolutions de problème, dernière revue et ses décisions,
                  SWOT, charte A3.
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>Volontairement exclu</h3>
              <ul className="cia-list">
                <li>
                  <strong>Le détail des actions terminées</strong> et des risques faibles — comptés, pas
                  listés.
                </li>
                <li>
                  <strong>Les adresses email</strong> et tout identifiant technique.
                </li>
                <li>
                  <strong>Les outils non activés</strong> sur le projet : leur section n’apparaît pas.
                </li>
              </ul>
              <p className="lead" style={{ margin: '10px 0 0', fontSize: 13 }}>
                Chaque coupe est annoncée dans le document (« 11 risques non listés »), pour que
                l’assistant sache qu’il lit une sélection et n’en tire pas de fausses conclusions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
              <IconBulb />
            </span>
            Confidentialité
          </h2>
          <p className="lead">
            Le document est fabriqué <strong>dans votre navigateur</strong>, à partir de données déjà
            chargées. Il n’est envoyé nulle part : ni à ENTAN, ni à un service tiers. Rien ne sort tant
            que vous ne collez pas le texte vous-même.
          </p>
          <p className="lead" style={{ marginBottom: 0 }}>
            À partir du moment où vous le collez dans un assistant, en revanche, ce sont les règles de ce
            service qui s’appliquent. Il s’agit de données internes à votre entreprise :{' '}
            <strong>vérifiez sa politique en matière d’IA</strong> avant de les transmettre. La case{' '}
            <strong>« Anonymiser les personnes »</strong> remplace les noms de l’équipe par « Membre 1 »,
            « Membre 2 »… — utile dès que vous sortez du périmètre interne.
          </p>
        </div>
      </div>
    </div>
  );
}
