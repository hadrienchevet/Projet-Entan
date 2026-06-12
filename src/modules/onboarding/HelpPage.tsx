import { IconHelp } from '../../components/icons';

export function HelpPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconHelp /> Aide & Tutoriel
          </h1>
          <p className="subtitle">Apprenez à maîtriser Project Ops Hub en quelques minutes.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="help-content">
            <h2 style={{ marginBottom: '12px' }}>Bienvenue dans votre Hub de gestion de projet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Découvrez comment utiliser Project Ops Hub pour piloter vos projets industriels.
            </p>
            
            <div className="video-container" style={{ 
              aspectRatio: '16/9', 
              background: '#000', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-modal)'
            }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
                <h3 style={{ margin: 0 }}>Vidéo de présentation</h3>
                <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
                  Intégrez votre lien YouTube, Vimeo ou Loom ici.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>•</span> RACI
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Définissez qui est Responsable, Accountable, Consulté ou Informé pour chaque action.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>•</span> AMDEC
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Analysez les risques techniques et générez des actions correctives directement.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>•</span> Planning
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Visualisez vos échéances sur un calendrier ou un diagramme de Gantt interactif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
