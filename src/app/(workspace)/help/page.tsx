import { IconAmdec, IconHelp, IconPlanning, IconRaci } from '@/components/icons';

export default function HelpPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconHelp /> Aide & Tutoriel
          </h1>
          <p className="subtitle">Apprenez à maîtriser Projet Entan en quelques minutes.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="help-content">
            <h2 style={{ marginBottom: '12px' }}>Bienvenue dans votre Hub de gestion de projet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Découvrez comment utiliser Projet Entan pour piloter vos projets industriels.
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
              <video
                src="/projet-entan.mp4"
                style={{ width: '100%', height: '100%', display: 'block' }}
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <a
                href="/projet-entan.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Ouvrir la vidéo en plein écran →
              </a>
            </div>

            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconRaci /></span> RACI
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Définissez qui est Responsable, Accountable, Consulté ou Informé pour chaque action.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconAmdec /></span> AMDEC
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Analysez les risques techniques et générez des actions correctives directement.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconPlanning /></span> Planning
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
