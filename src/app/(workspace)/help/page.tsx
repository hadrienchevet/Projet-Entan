import { IconHelp } from '@/components/icons';

export default function HelpPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconHelp /> Aide & Tutoriel
          </h1>
          <p className="subtitle">Apprenez Ã  maÃ®triser Projet Entan en quelques minutes.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="help-content">
            <h2 style={{ marginBottom: '12px' }}>Bienvenue dans votre Hub de gestion de projet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              DÃ©couvrez comment utiliser Projet Entan pour piloter vos projets industriels.
            </p>
            
            <div className="video-container" style={{ 
              aspectRatio: '16/9', 
              background: '#000', 
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border)'
            }}>
              <iframe 
                src="/lancement.html" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  display: 'block'
                }}
                title="Animation de prÃ©sentation"
                allowFullScreen
              />
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <a 
                href="/lancement.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Ouvrir l'animation en plein Ã©cran â†—
              </a>
            </div>

            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>â€¢</span> RACI
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  DÃ©finissez qui est Responsable, Accountable, ConsultÃ© ou InformÃ© pour chaque action.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>â€¢</span> AMDEC
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Analysez les risques techniques et gÃ©nÃ©rez des actions correctives directement.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>â€¢</span> Planning
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Visualisez vos Ã©chÃ©ances sur un calendrier ou un diagramme de Gantt interactif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
