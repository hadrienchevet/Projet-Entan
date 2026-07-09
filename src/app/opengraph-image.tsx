import { ImageResponse } from 'next/og';

export const alt = 'ENTAN — Le logiciel de gestion de projet pour l’industrie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Image de partage (Open Graph / Twitter) générée à la volée. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#faf9f5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '44px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: '#c15f3c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              fontWeight: 700,
              marginRight: '22px',
            }}
          >
            EN
          </div>
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
