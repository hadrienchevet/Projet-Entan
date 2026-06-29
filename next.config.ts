import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les routes.
 * - X-Frame-Options / frame-ancestors : anti-clickjacking (l'app ne peut pas
 *   être chargée dans une iframe tierce).
 * - nosniff, Referrer-Policy, Permissions-Policy, HSTS : durcissement standard.
 * NB : pas de CSP `script-src` stricte ici car le thème est initialisé par un
 *   <script> inline (layout.tsx) ; une vraie CSP nécessiterait un nonce + tests.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
