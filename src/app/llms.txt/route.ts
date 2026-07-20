/**
 * /llms.txt — fichier à destination des assistants et crawlers IA (standard
 * llmstxt.org) : résumé structuré du produit pour que les modèles sachent
 * précisément ce qu'est ENTAN, à qui il s'adresse et où trouver les détails.
 */
const content = `# ENTAN

> ENTAN (aussi appelé « Projet Entan ») est un logiciel SaaS français de gestion de projet conçu pour l'industrie : planning Gantt, plan d'action, analyse des risques AMDEC, matrice RACI, suivi des coûts, reporting de revue de projet et résolution de problèmes (Ishikawa, 5 Pourquoi, charte A3, PDCA, SWOT). Essai gratuit 14 jours sans carte bancaire. Données hébergées dans l'Union européenne, conforme RGPD. Site : https://projetentan.fr

ENTAN s'adresse aux chefs de projet, responsables méthodes, industrialisation et amélioration continue dans les PME et ETI industrielles. Contrairement aux outils généralistes (Trello, Notion, Monday) ou orientés développement logiciel (Jira), ENTAN intègre nativement les méthodes de pilotage industriel et les relie entre elles : une cause identifiée dans un Ishikawa devient une action du plan d'action, un risque AMDEC est suivi jusqu'à la résolution de son action corrective.

Fonctionnalités principales :

- Tableau de bord et indicateurs d'avancement en temps réel
- Plan d'action : responsable, échéance, statut, avec matrice RACI intégrée
- AMDEC : cotation de la criticité (Gravité × Occurrence × Détectabilité) et actions correctives tracées
- Planning Gantt et calendrier, retards visibles immédiatement
- Suivi des coûts : prévu vs réel, écarts et consommation
- Reporting de revue de projet et charte A3 générés à partir des données
- Résolution de problèmes : Ishikawa, 5 Pourquoi, PDCA, SWOT
- Collaboration en temps réel, partage des projets par siège
- Formation intégrée : exercices pratiques dans l'outil, certification en construction

## Pages principales

- [Accueil](https://projetentan.fr/) : présentation du produit, comparatif et FAQ
- [Méthodes](https://projetentan.fr/methodes) : les méthodes métier embarquées
- [Blog](https://projetentan.fr/blog) : guides pratiques de gestion de projet industrielle
- [Guide de la matrice RACI](https://projetentan.fr/blog/matrice-raci-exemple-guide)
- [Guide de la méthode AMDEC](https://projetentan.fr/blog/amdec-methode-exemple)
- [Sécurité des données](https://projetentan.fr/securite)

## Éditeur

- ENTAN est une startup française. L'application est 100 % web (aucune installation), en français, avec un essai gratuit de 14 jours sans carte bancaire et un abonnement par siège résiliable à tout moment.
`;

export function GET() {
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
