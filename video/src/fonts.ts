import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

/** Inter chargée pour le rendu (sinon fallback système). Georgia reste en serif. */
const inter = loadInter();
export const SANS = inter.fontFamily;
export const SERIF = 'Georgia, "Times New Roman", serif';
