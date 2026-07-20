import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const alt = 'ENTAN — Le logiciel de gestion de projet pour l’industrie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const logoDataUrl = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/entan-logo.png')).toString('base64')}`;

/** Image de partage (Open Graph / Twitter) générée à la volée. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#faf9f5',
          overflow: 'hidden',
        }}
      >
        <img
          src={logoDataUrl}
          alt=""
          width={700}
          height={700}
          style={{ position: 'absolute', top: '-160px', right: '-180px', opacity: 0.09 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '44px' }}>
          <img src={logoDataUrl} alt="" width={64} height={64} style={{ marginRight: '18px' }} />
          <div style={{ fontSize: '44px', fontWeight: 700, color: '#1f1e1d', letterSpacing: '3px' }}>
            ENTAN
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: '64px', fontWeight: 700, color: '#1f1e1d', lineHeight: 1.1, maxWidth: '940px' }}>
          Le logiciel de gestion de projet pour l’industrie
        </div>
        <div style={{ display: 'flex', fontSize: '30px', color: '#5d5c56', marginTop: '30px' }}>
          Planning · actions · risques · reporting — au même endroit.
        </div>
      </div>
    ),
    { ...size },
  );
}
