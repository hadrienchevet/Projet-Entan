import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  IconA3,
  IconActions,
  IconAmdec,
  IconCost,
  IconPlanning,
  IconTarget,
} from '@/components/icons';

export const metadata: Metadata = {
  title: { absolute: 'ENTAN — Le logiciel de gestion de projet pour l’industrie' },
  description:
    'Centralisez planning, actions, risques et reporting de vos projets industriels dans un seul outil. Conçu pour les chefs de projet, responsables méthodes et industrialisation. Essai gratuit 14 jours, sans carte.',
  keywords: [
    'gestion de projet industriel',
    'logiciel gestion de projet industrie',
    'responsable méthodes',
    'industrialisation',
    'AMDEC',
    'matrice RACI',
    'plan d’action',
    'revue de projet',
    'planning industriel',
    'amélioration continue',
    'PME industrielle',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ENTAN — Le logiciel de gestion de projet pour l’industrie',
    description:
      'Planning, actions, risques et reporting de vos projets industriels au même endroit. Essai gratuit 14 jours.',
    url: '/',
    type: 'website',
  },
};

/** Bandeau défilant : les méthodes métier embarquées. */
const METHODS = [
  'AMDEC',
  'RACI',
  'Gantt',
  'Ishikawa',
  '5 Pourquoi',
  'Charte A3',
  'SWOT',
  'PDCA',
  'Plan d’action',
  'Suivi des coûts',
];

const PAINS = [
  'Le planning est dans un fichier, les actions dans un autre, les risques dans un troisième — jamais à jour en même temps.',
  'Chaque revue de projet, c’est une soirée à consolider des tableaux déjà périmés le lendemain.',
  'Une action se perd entre deux mails, et personne ne sait qui devait la traiter.',
  'Les risques sont identifiés en réunion… puis oubliés, jusqu’à ce qu’ils coûtent cher.',
  'Impossible de dire en un coup d’œil si le projet tient les délais.',
];

const FEATURES = [
  { icon: <IconTarget />, title: 'Sachez où en est le projet en un coup d’œil', text: 'Tableau de bord et indicateurs d’avancement à jour en temps réel.' },
  { icon: <IconActions />, title: 'Ne perdez plus jamais une action', text: 'Plan d’action : responsable, échéance, statut — avec RACI intégré.' },
  { icon: <IconAmdec />, title: 'Anticipez les risques au lieu de les subir', text: 'AMDEC : cotation de la criticité et actions correctives tracées jusqu’à leur résolution.' },
  { icon: <IconPlanning />, title: 'Tenez vos délais', text: 'Planning Gantt et calendrier, retards visibles immédiatement.' },
  { icon: <IconA3 />, title: 'Vos revues de projet prêtes en un clic', text: 'Reporting et charte A3 générés à partir de vos données.' },
  { icon: <IconCost />, title: 'Gardez le budget sous contrôle', text: 'Suivi des coûts : prévu vs réel, écart et consommation.' },
];

const COMPARE = [
  { label: 'Pensé pour', gen: 'Tout et n’importe quoi', jira: 'Le développement logiciel', entan: 'Les projets industriels' },
  { label: 'Méthodes métier (AMDEC, RACI, Ishikawa, A3)', gen: 'À reconstruire soi-même', jira: 'Absentes', entan: 'Intégrées et connectées' },
  { label: 'Mise en route', gen: 'Des heures de configuration', jira: 'Complexe', entan: 'Opérationnel en minutes' },
  { label: 'Reporting de revue de projet', gen: 'Manuel', jira: 'Orienté sprint / dev', entan: 'Généré automatiquement' },
];

const TRUST = [
  { title: 'Créé par un ingénieur du terrain', text: 'ENTAN est né d’un constat vécu : des projets industriels pilotés dans Excel et des mails. Il répond à des problématiques réelles, pas à un business plan.' },
  { title: 'Bâti sur des standards reconnus', text: 'AMDEC, RACI, Ishikawa, PDCA, A3 : des méthodes que vos pairs utilisent déjà. Rien d’inventé, tout est connecté.' },
  { title: 'Construit avec ses premiers utilisateurs', text: 'Startup française en amorçage. Votre retour façonne directement le produit — vous ne subissez pas la roadmap, vous l’orientez.' },
  { title: 'Vos données restent les vôtres', text: 'Hébergement dans l’Union européenne, conforme RGPD, essai sans carte, résiliable à tout moment.' },
];

const FAQ = [
  { q: 'ENTAN est-il un logiciel de gestion de projet adapté à l’industrie ?', a: 'Oui. ENTAN est conçu pour les chefs de projet, responsables méthodes et industrialisation. Les méthodes industrielles (AMDEC, RACI, Ishikawa, PDCA, A3) sont intégrées, là où les outils généralistes vous laissent tout reconstruire.' },
  { q: 'En quoi ENTAN est-il différent de Trello, Notion, Monday ou Jira ?', a: 'Ces outils sont génériques : vous partez d’une page blanche et bâtissez votre méthode vous-même. Jira est pensé pour le développement logiciel. ENTAN embarque les méthodes de pilotage industriel, reliées entre elles.' },
  { q: 'Faut-il installer quelque chose ou suivre une formation ?', a: 'Non. ENTAN est 100 % web, la prise en main se fait en quelques minutes, et des exercices pratiques intégrés vous accompagnent.' },
  { q: 'Où sont hébergées mes données ?', a: 'Dans l’Union européenne, en conformité avec le RGPD. Vos données restent votre propriété.' },
  { q: 'Puis-je inviter mon équipe ?', a: 'Oui. ENTAN est collaboratif en temps réel : chaque membre a son accès et vous partagez vos projets par siège.' },
  { q: 'Qu’est-ce que l’AMDEC et le RACI dans ENTAN ?', a: 'L’AMDEC analyse et cote la criticité des risques (Gravité × Occurrence × Détectabilité). Le RACI clarifie qui est Responsible, Accountable, Consulté et Informé sur chaque action. Les deux sont intégrés et reliés au plan d’action.' },
  { q: 'Y a-t-il un engagement ?', a: 'Non. L’essai est gratuit pendant 14 jours, sans carte bancaire, et l’abonnement est résiliable à tout moment.' },
  { q: 'Qu’est-ce que la certification ENTAN ?', a: 'Une dimension formation en construction : des parcours pédagogiques et une certification pour apprendre la gestion de projet industrielle en utilisant directement l’outil.' },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ENTAN',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Logiciel de gestion de projet pour l’industrie : planning, plan d’action, risques (AMDEC), RACI, reporting et A3.',
    url: 'https://projetentan.fr',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Essai gratuit 14 jours' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
];

const css = `
.lp {
  --bg: #faf9f5; --surface: #ffffff; --surface-2: #ece9e0;
  --border: #e6e4db; --border-strong: #d5d2c6;
  --text: #1f1e1d; --text-secondary: #5d5c56; --text-muted: #9d9a8f;
  --accent: #c15f3c; --accent-hover: #a84f2f; --accent-soft: #f5e9e2;
  --accent-text: #a84f2f; --accent-faint: #ecd0c2;
  --hover: rgb(0 0 0 / 0.05); --stripe: rgb(0 0 0 / 0.03);
  --danger: #b3372e; --success: #2e7d4f;
  background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: clip;
}
@media (prefers-reduced-motion: no-preference) { html:has(.lp) { scroll-behavior: smooth; } }
.lp a { text-decoration: none; }
.lp-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

/* Micro-interactions boutons */
.lp .btn { transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.15s ease, border-color 0.15s ease; }
.lp .btn:active { transform: scale(0.97); }
.lp .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgb(193 95 60 / 0.32); }

/* Header collant, translucide */
.lp-header { position: sticky; top: 0; z-index: 50; background: rgba(250, 249, 245, 0.85); background: color-mix(in srgb, #faf9f5 85%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgb(0 0 0 / 0.05); }
.lp-nav { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
.lp-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 17px; letter-spacing: 0.02em; color: var(--text); }
.lp-logo { mix-blend-mode: multiply; }
.lp-nav-actions { display: flex; align-items: center; gap: 10px; }

/* Animations */
@keyframes lp-up { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@keyframes lp-float { from { transform: translateY(-6px); } to { transform: translateY(8px); } }
@keyframes lp-spin { to { transform: rotate(360deg); } }
@keyframes lp-growbar { from { width: 0; } }
@keyframes lp-scroll { to { transform: translateX(-50%); } }
@keyframes lp-glow { 0%, 100% { box-shadow: 0 10px 34px rgb(0 0 0 / 0.06); } 50% { box-shadow: 0 14px 44px rgb(193 95 60 / 0.2); } }

/* Apparition au défilement — 100 % CSS (scroll-driven animations).
   Sans support navigateur : aucun masquage, la page reste entièrement visible. */
@keyframes lp-reveal { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .lp [data-reveal] { animation: lp-reveal both; animation-timeline: view(); animation-range: entry 5% entry 45%; }
  }
}

/* Héros */
.lp-hero { position: relative; text-align: center; padding: 64px 0 40px; }
.lp-hero > * { position: relative; z-index: 1; }
.lp-hero-flower { position: absolute; top: -90px; right: -130px; z-index: 0 !important; opacity: 0.07; pointer-events: none; mix-blend-mode: multiply; user-select: none; }
.lp-hero-flower.small { top: auto; right: auto; bottom: -30px; left: -120px; opacity: 0.05; }
@media (prefers-reduced-motion: no-preference) {
  .lp-hero-flower { animation: lp-spin 150s linear infinite; }
  .lp-hero-flower.small { animation-duration: 200s; animation-direction: reverse; }
  .lp-hero .lp-eyebrow { animation: lp-up 0.6s ease both; }
  .lp-hero h1 { animation: lp-up 0.6s ease 0.08s both; }
  .lp-hero p.sub { animation: lp-up 0.6s ease 0.16s both; }
  .lp-hero .lp-cta { animation: lp-up 0.6s ease 0.24s both; }
  .lp-hero .lp-trust-line { animation: lp-up 0.6s ease 0.32s both; }
  .lp-mock { animation: lp-up 0.7s ease 0.4s both; }
}
.lp-eyebrow { display: inline-block; font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-text); background: var(--accent-soft); border-radius: 999px; padding: 5px 14px; margin-bottom: 22px; }
.lp-hero h1 { font-size: 44px; line-height: 1.08; letter-spacing: -0.025em; margin: 0 auto 18px; max-width: 760px; }
.lp-hero p.sub { font-size: 17.5px; line-height: 1.6; color: var(--text-secondary); max-width: 660px; margin: 0 auto 30px; }
.lp-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.lp-hero .btn { font-size: 15px; padding: 12px 24px; border-radius: 10px; }
.lp-trust-line { margin-top: 18px; font-size: 13px; color: var(--text-muted); }

/* Aperçu produit flottant (pur CSS, aucun asset) */
.lp-mock { display: flex; justify-content: center; align-items: stretch; gap: 16px; margin: 46px auto 8px; max-width: 880px; }
.lp-mock-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; box-shadow: 0 14px 38px rgb(31 30 27 / 0.09); text-align: left; flex: 1; min-width: 0; }
.lp-mock-card.wide { flex: 1.35; }
@media (prefers-reduced-motion: no-preference) {
  .lp-mock-card { animation: lp-float 5.5s ease-in-out infinite alternate; }
  .lp-mock-card:nth-child(2) { animation-delay: 1.4s; }
  .lp-mock-card:nth-child(3) { animation-delay: 2.6s; }
}
.mk-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 12px; }
.mk-row { display: flex; align-items: center; gap: 8px; margin: 9px 0; }
.mk-label { width: 42px; height: 7px; border-radius: 4px; background: var(--surface-2); flex-shrink: 0; }
.mk-bar { height: 10px; border-radius: 5px; display: block; }
@media (prefers-reduced-motion: no-preference) { .mk-bar, .mk-progress span { animation: lp-growbar 1.1s cubic-bezier(0.22, 1, 0.36, 1) both; } }
.mk-num { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.mk-num small { font-size: 16px; font-weight: 600; color: var(--text-muted); }
.mk-progress { height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; margin-top: 12px; }
.mk-progress span { display: block; height: 100%; width: 72%; background: var(--success); border-radius: 999px; }
.mk-sub { font-size: 12px; color: var(--text-muted); margin-top: 10px; line-height: 1.4; }
.mk-badge { display: inline-block; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: rgb(179 55 46 / 0.09); color: var(--danger); }
.mk-check { font-size: 13px; color: var(--success); font-weight: 500; margin-top: 12px; }

/* Bandeau des méthodes (défilement infini) */
.lp-marquee { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 14px 0; overflow: hidden; background: var(--surface); -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.lp-marquee-track { display: flex; gap: 44px; width: max-content; }
.lp-marquee-track > span { display: flex; align-items: center; gap: 44px; white-space: nowrap; }
.lp-marquee em { font-style: normal; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); }
.lp-marquee i { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); opacity: 0.55; flex-shrink: 0; }
@media (prefers-reduced-motion: no-preference) {
  .lp-marquee-track { animation: lp-scroll 36s linear infinite; }
  .lp-marquee:hover .lp-marquee-track { animation-play-state: paused; }
}

.lp-section { padding: 52px 0; border-top: 1px solid var(--border); }
.lp-section h2 { text-align: center; font-size: 28px; letter-spacing: -0.015em; line-height: 1.2; margin: 0 auto 8px; max-width: 720px; }
.lp-section .lead { text-align: center; color: var(--text-secondary); font-size: 15.5px; max-width: 640px; margin: 0 auto 34px; line-height: 1.6; }
.lp-section .lp-grid, .lp-section .lp-trust, .lp-section .lp-ba, .lp-section .lp-pain { margin-top: 30px; }

.lp-pain { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.lp-pain li { display: flex; gap: 12px; align-items: flex-start; font-size: 15px; color: var(--text-secondary); line-height: 1.5; list-style: none; }
.lp-pain li::before { content: "✕"; color: var(--danger); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.lp-quote { text-align: center; font-size: 20px; font-weight: 500; color: var(--text); max-width: 640px; margin: 36px auto 0; line-height: 1.4; }
.lp-quote span { color: var(--accent-text); }

.lp-ba { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; max-width: 840px; margin: 0 auto; }
.lp-ba-col { border: 1px solid var(--border); border-radius: 14px; padding: 22px; background: var(--surface); }
.lp-ba-col.after { border-color: var(--accent-faint); background: var(--accent-soft); }
.lp-ba-col h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 14px; color: var(--text-muted); }
.lp-ba-col.after h3 { color: var(--accent-text); }
.lp-ba-col ul { margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.lp-ba-col li { list-style: none; font-size: 14px; color: var(--text-secondary); line-height: 1.45; }

.lp-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.lp-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 22px; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.lp-card:hover { transform: translateY(-4px); border-color: var(--accent-faint); box-shadow: 0 12px 28px rgb(31 30 27 / 0.07); }
.lp-card .ic { width: 40px; height: 40px; border-radius: 10px; background: var(--accent-soft); color: var(--accent); display: grid; place-items: center; margin-bottom: 14px; }
.lp-card .ic svg { width: 20px; height: 20px; }
.lp-card h3 { font-size: 16px; margin: 0 0 6px; line-height: 1.3; }
.lp-card p { font-size: 14px; color: var(--text-secondary); line-height: 1.55; margin: 0; }

.lp-compare-wrap { overflow-x: auto; max-width: 920px; margin: 0 auto; }
.lp-compare { width: 100%; border-collapse: collapse; min-width: 620px; }
.lp-compare th, .lp-compare td { text-align: left; padding: 13px 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
.lp-compare thead th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); font-weight: 600; }
.lp-compare thead th.hl { color: var(--accent-text); }
.lp-compare td:first-child, .lp-compare th:first-child { color: var(--text); font-weight: 500; }
.lp-compare td { color: var(--text-secondary); }
.lp-compare .col-entan { background: var(--accent-soft); color: var(--accent-text); font-weight: 500; }
.lp-compare-close { text-align: center; font-size: 18px; font-weight: 500; margin: 28px auto 0; color: var(--text); }

.lp-trust { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.lp-trust-card { border: 1px solid var(--border); border-radius: 14px; padding: 20px; background: var(--surface); transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.lp-trust-card:hover { transform: translateY(-4px); border-color: var(--accent-faint); box-shadow: 0 12px 28px rgb(31 30 27 / 0.07); }
.lp-trust-card h3 { font-size: 15.5px; margin: 0 0 7px; }
.lp-trust-card p { font-size: 13.5px; color: var(--text-secondary); line-height: 1.55; margin: 0; }

.lp-price { max-width: 460px; margin: 0 auto; background: var(--surface); border: 2px solid var(--accent); border-radius: 18px; padding: 32px; text-align: center; box-shadow: 0 10px 34px rgb(0 0 0 / 0.06); }
@media (prefers-reduced-motion: no-preference) { .lp-price { animation: lp-glow 5s ease-in-out infinite; } }
.lp-price .free { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text); }
.lp-price .price { font-size: 40px; font-weight: 700; margin: 8px 0 2px; }
.lp-price .price small { font-size: 15px; font-weight: 400; color: var(--text-muted); }
.lp-price .then { font-size: 13.5px; color: var(--text-secondary); }
.lp-price ul { text-align: left; margin: 22px 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.lp-price li { list-style: none; font-size: 14px; color: var(--text-secondary); display: flex; gap: 9px; }
.lp-price li::before { content: "✓"; color: var(--success); font-weight: 700; }
.lp-price .founder { margin-top: 14px; font-size: 12.5px; color: var(--text-muted); }
.lp-price .btn { width: 100%; justify-content: center; }

.lp-soon { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text); background: var(--accent-soft); border-radius: 999px; padding: 3px 10px; margin-left: 8px; vertical-align: middle; }

.lp-faq { max-width: 760px; margin: 0 auto; }
.lp-faq details { border-bottom: 1px solid var(--border); padding: 4px 0; }
.lp-faq summary { cursor: pointer; padding: 15px 4px; font-size: 15.5px; font-weight: 500; color: var(--text); list-style: none; display: flex; justify-content: space-between; gap: 12px; }
.lp-faq summary::-webkit-details-marker { display: none; }
.lp-faq summary::after { content: "+"; color: var(--text-muted); font-size: 20px; line-height: 1; }
.lp-faq details[open] summary::after { content: "−"; }
.lp-faq details p { margin: 0 4px 16px; font-size: 14.5px; color: var(--text-secondary); line-height: 1.6; }

.lp-band { position: relative; overflow: hidden; text-align: center; background: var(--accent-soft); border: 1px solid var(--accent-faint); border-radius: 18px; padding: 44px 24px; margin: 52px 0; }
.lp-band > * { position: relative; z-index: 1; }
.lp-band h2 { font-size: 28px; margin: 0 0 10px; letter-spacing: -0.01em; }
.lp-band p { color: var(--text-secondary); font-size: 15px; margin: 0 auto 22px; max-width: 520px; line-height: 1.6; }
.lp-band-flower { position: absolute; right: -60px; bottom: -70px; z-index: 0 !important; opacity: 0.12; mix-blend-mode: multiply; pointer-events: none; user-select: none; }
@media (prefers-reduced-motion: no-preference) { .lp-band-flower { animation: lp-spin 130s linear infinite; } }

.lp-foot { border-top: 1px solid var(--border); padding: 28px 0 52px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.lp-foot-links { display: flex; gap: 18px; flex-wrap: wrap; }
.lp-foot a { color: var(--text-secondary); font-size: 13px; }
.lp-foot a:hover { color: var(--text); }
.lp-foot .cr { color: var(--text-muted); font-size: 13px; }

@media (max-width: 720px) {
  .lp-hero h1 { font-size: 32px; }
  .lp-ba { grid-template-columns: 1fr; }
  .lp-mock { flex-direction: column; align-items: stretch; max-width: 360px; }
  .lp-hero-flower { width: 220px !important; height: 220px !important; right: -90px; top: -60px; }
  .lp-hero-flower.small { display: none; }
}
`;

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/projets');

  const year = new Date().getFullYear();

  return (
    <main className="lp">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="lp-header">
        <div className="lp-wrap">
          <nav className="lp-nav">
            <span className="lp-brand">
              <Image src="/entan-logo.png" alt="" width={34} height={34} className="lp-logo" priority />
              ENTAN
            </span>
            <span className="lp-nav-actions">
              <Link href="/login" className="btn btn-sm">Se connecter</Link>
              <Link href="/login?mode=signup" className="btn btn-primary btn-sm">Essai gratuit</Link>
            </span>
          </nav>
        </div>
      </header>

      <div className="lp-wrap">
        <header className="lp-hero">
          <Image src="/entan-logo.png" alt="" width={380} height={380} className="lp-hero-flower" aria-hidden />
          <Image src="/entan-logo.png" alt="" width={240} height={240} className="lp-hero-flower small" aria-hidden />
          <span className="lp-eyebrow">Logiciel de gestion de projet pour l’industrie</span>
          <h1>Pilotez vos projets industriels. Pas vos fichiers Excel.</h1>
          <p className="sub">
            ENTAN réunit planning, plan d’actions, risques et indicateurs d’avancement dans un seul
            outil, conçu pour les chefs de projet, responsables méthodes et industrialisation. Fini
            les fichiers dispersés et les revues de projet préparées à la main.
          </p>
          <div className="lp-cta">
            <Link href="/login?mode=signup" className="btn btn-primary">Démarrer gratuitement</Link>
            <a href="#solution" className="btn">Voir ce que fait ENTAN</a>
          </div>
          <p className="lp-trust-line">Essai 14 jours · sans carte bancaire · opérationnel en 2 minutes</p>

          <div className="lp-mock" aria-hidden="true">
            <div className="lp-mock-card wide">
              <div className="mk-title">Planning</div>
              <div className="mk-row"><span className="mk-label" /><i className="mk-bar" style={{ width: '62%', background: 'var(--success)', animationDelay: '.5s' }} /></div>
              <div className="mk-row"><span className="mk-label" /><i className="mk-bar" style={{ width: '78%', background: 'var(--accent)', animationDelay: '.65s' }} /></div>
              <div className="mk-row"><span className="mk-label" /><i className="mk-bar" style={{ width: '46%', background: 'var(--accent)', opacity: 0.55, animationDelay: '.8s' }} /></div>
              <div className="mk-row"><span className="mk-label" /><i className="mk-bar" style={{ width: '30%', background: 'var(--danger)', animationDelay: '.95s' }} /></div>
            </div>
            <div className="lp-mock-card">
              <div className="mk-title">Avancement</div>
              <div className="mk-num">72<small> %</small></div>
              <div className="mk-progress"><span style={{ animationDelay: '.7s' }} /></div>
              <div className="mk-sub">12 actions terminées cette semaine</div>
            </div>
            <div className="lp-mock-card">
              <div className="mk-title">Risques — AMDEC</div>
              <span className="mk-badge">Criticité 32 — critique</span>
              <div className="mk-check">✓ Action corrective assignée</div>
            </div>
          </div>
        </header>
      </div>

      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {METHODS.map((m) => (
                <Fragment key={m}>
                  <em>{m}</em>
                  <i />
                </Fragment>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>Piloter un projet industriel avec Excel et des mails, c’est piloter à l’aveugle.</h2>
          <ul className="lp-pain" data-reveal>
            {PAINS.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <p className="lp-quote" data-reveal>
            Le problème, ce n’est pas votre rigueur. <span>C’est que vos outils n’ont jamais été faits pour l’industrie.</span>
          </p>
        </div>
      </section>

      <section className="lp-section" id="solution">
        <div className="lp-wrap">
          <h2 data-reveal>ENTAN réunit tout votre pilotage au même endroit.</h2>
          <p className="lead" data-reveal>
            Une donnée saisie une seule fois : une action apparaît dans le planning, le plan
            d’action et le RACI. Un risque coté en AMDEC génère son action corrective, tracée jusqu’à
            sa résolution. Et votre reporting se construit tout seul.
          </p>
          <div className="lp-ba">
            <div className="lp-ba-col" data-reveal>
              <h3>Sans ENTAN</h3>
              <ul>
                <li>Planning dans un fichier Excel</li>
                <li>Actions éparpillées dans les mails</li>
                <li>Risques oubliés dans un PowerPoint</li>
                <li>Reporting refait à la main avant chaque revue</li>
              </ul>
            </div>
            <div className="lp-ba-col after" data-reveal>
              <h3>Avec ENTAN</h3>
              <ul>
                <li>Tout au même endroit, une seule source de vérité</li>
                <li>À jour en temps réel pour toute l’équipe</li>
                <li>Du risque à l’action corrective, tracé de bout en bout</li>
                <li>Reporting et A3 générés automatiquement</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>Ce que vous y gagnez, concrètement</h2>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <article className="lp-card" data-reveal key={f.title}>
                <span className="ic">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>Trello, Notion ou Monday ne parlent pas industrie. ENTAN, si.</h2>
          <p className="lead" data-reveal>
            Avec un outil généraliste, vous partez d’une page blanche et vous rebâtissez la méthode
            vous-même. ENTAN embarque la méthode métier.
          </p>
          <div className="lp-compare-wrap" data-reveal>
            <table className="lp-compare">
              <thead>
                <tr>
                  <th></th>
                  <th>Outils généralistes</th>
                  <th>Jira</th>
                  <th className="hl">ENTAN</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.gen}</td>
                    <td>{r.jira}</td>
                    <td className="col-entan">{r.entan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lp-compare-close" data-reveal>Vous ne configurez pas un outil. Vous pilotez un projet.</p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>
            Apprenez la gestion de projet industrielle en la pratiquant
            <span className="lp-soon">Bientôt</span>
          </h2>
          <p className="lead" style={{ marginBottom: 0 }} data-reveal>
            ENTAN n’est pas qu’un outil, c’est aussi une école. Des parcours pédagogiques et des
            exercices pratiques intégrés (SWOT, AMDEC, RACI…) permettent à vos ingénieurs, techniciens
            et alternants de monter en compétence directement dans l’outil, sur de vrais projets — avec
            à la clé la <strong>certification ENTAN</strong>. Formez votre équipe pendant qu’elle travaille.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>Construit sur le terrain, pas dans un open space</h2>
          <div className="lp-trust">
            {TRUST.map((t) => (
              <div className="lp-trust-card" data-reveal key={t.title}>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>Un tarif simple, par utilisateur</h2>
          <div className="lp-price" data-reveal>
            <div className="free">Essai gratuit — 14 jours</div>
            <div className="price">0 €<small> / sans carte bancaire</small></div>
            <div className="then">Tarif par utilisateur communiqué avant la fin de votre essai — jamais de prélèvement surprise.</div>
            <ul>
              <li>Accès complet à tous les outils</li>
              <li>Projets illimités, toute l’équipe</li>
              <li>Reporting et A3 inclus</li>
              <li>Résiliable à tout moment</li>
            </ul>
            <Link href="/login?mode=signup" className="btn btn-primary">Démarrer gratuitement</Link>
            <div className="founder">Les tout premiers utilisateurs bénéficient d’un tarif préférentiel.</div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2 data-reveal>Questions fréquentes</h2>
          <div className="lp-faq" data-reveal>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-wrap">
        <div className="lp-band" data-reveal>
          <Image src="/entan-logo.png" alt="" width={230} height={230} className="lp-band-flower" aria-hidden />
          <h2>Reprenez le pilotage de vos projets industriels.</h2>
          <p>Créez votre compte et testez tous les outils gratuitement pendant 14 jours. Sans carte, sans engagement.</p>
          <Link href="/login?mode=signup" className="btn btn-primary">Démarrer gratuitement</Link>
        </div>

        <footer className="lp-foot">
          <span className="lp-brand">
            <Image src="/entan-logo.png" alt="" width={34} height={34} className="lp-logo" />
            ENTAN
          </span>
          <span className="lp-foot-links">
            <Link href="/methodes">Méthodes</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/login">Connexion</Link>
            <Link href="/cgv">CGV</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </span>
          <span className="cr">© {year} ENTAN</span>
        </footer>
      </div>
    </main>
  );
}
