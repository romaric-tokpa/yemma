/**
 * Extrait un message d'erreur lisible depuis la réponse API (422, 400, etc.).
 * FastAPI retourne { detail: string | Array<{msg, loc, ...}> }
 */
export function getApiErrorDetail(err, fallback = 'Erreur inconnue') {
  const detail = err?.response?.data?.detail
  if (detail == null) return err?.message || fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => (typeof d === 'object' && d?.msg ? d.msg : String(d))).join('. ')
  }
  if (typeof detail === 'object' && detail?.msg) return detail.msg
  return fallback
}
