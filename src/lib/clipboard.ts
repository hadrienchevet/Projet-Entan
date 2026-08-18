/**
 * Copie presse-papier tolérante.
 *
 * `navigator.clipboard.writeText` échoue dans plusieurs situations réelles et
 * fréquentes : permission refusée par le navigateur ou une politique
 * d'entreprise, page servie en HTTP non sécurisé (accès par IP réseau plutôt
 * que localhost), document non focalisé, navigateur intégré. L'échec est
 * silencieux côté utilisateur — le bouton « ne marche pas ».
 *
 * On retombe donc sur `execCommand('copy')` : déprécié, mais toujours
 * implémenté partout et **sans demande de permission** tant que l'appel part
 * d'un geste utilisateur. Et si les deux échouent, l'appelant doit le dire.
 */

/** @returns true si le texte est bien dans le presse-papier. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission refusée / contexte non sécurisé → on tente le repli.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    // Hors écran mais réellement rendu : `display:none` empêcherait la sélection.
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);

    // Préserver la sélection en cours de l'utilisateur : la lui voler serait
    // une régression visible (texte surligné qui disparaît).
    const previous = document.getSelection()?.rangeCount
      ? document.getSelection()!.getRangeAt(0)
      : null;

    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');

    document.body.removeChild(ta);
    if (previous) {
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(previous);
    }
    return ok;
  } catch {
    return false;
  }
}

/** Sélectionne le contenu d'un élément — dernier recours : l'utilisateur fait Ctrl+C. */
export function selectElementText(el: HTMLElement | null): void {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = document.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
