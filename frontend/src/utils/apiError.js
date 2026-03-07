/**
 * Extrait un message d'erreur lisible depuis la réponse API (422, 400, etc.).
 * FastAPI retourne { detail: string | Array<{msg, loc, ...}> }
 * Admin service peut retourner { details: { validation_errors: [...] } }
 */
export function getApiErrorDetail(err, fallback = 'Erreur inconnue') {
  const data = err?.response?.data
  const detail = data?.detail
  const details = data?.details?.validation_errors

  if (detail != null) {
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => (typeof d === 'object' && d?.msg ? d.msg : String(d))).join('. ')
    }
    if (typeof detail === 'object' && detail?.msg) return detail.msg
  }
  if (Array.isArray(details) && details.length > 0) {
    return details.map((d) => d?.message || d?.field || String(d)).join('. ')
  }
  if (data?.message) return data.message
  return err?.message || fallback
}
