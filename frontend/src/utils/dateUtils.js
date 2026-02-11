/**
 * Formatage des dates et heures pour l'affichage (locale fr-FR).
 * Utilisé pour le tracking : inscription, modifications, validation, rejet.
 */

/**
 * Formate une date ISO en "jj/mm/aaaa HH:mm" (ex. 15/01/2024 10:30).
 * @param {string|null|undefined} isoString - Date au format ISO 8601
 * @returns {string} Date formatée ou chaîne vide
 */
export function formatDateTime(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Formate une date ISO en "jj/mm/aaaa" (sans heure).
 * @param {string|null|undefined} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
