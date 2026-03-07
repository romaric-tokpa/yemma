/**
 * Utilitaires pour le système de validation Yemma (grille 16 critères, score 0-100).
 * Priorité : total_score_100 > overall_score > admin_score.
 */

const DECISION_LABELS = {
  retenu: 'Retenu',
  reserve: 'En réserve',
  non_retenu: 'Non retenu',
}

/**
 * Extrait le score affichable depuis un profil/candidat.
 * @param {object} data - Profil ou candidat (admin_report, admin_score)
 * @returns {{ score100: number|null, score5: number|null, decision: string|null }}
 */
export function getValidationScore(data) {
  if (!data) return { score100: null, score5: null, decision: null }
  const report = data.admin_report || {}
  const score100 = report.total_score_100 != null ? Number(report.total_score_100) : null
  const score5 = data.admin_score != null
    ? Number(data.admin_score)
    : (report.overall_score != null ? Number(report.overall_score) : null)
  const decision = report.decision && String(report.decision).trim() ? report.decision : null
  return { score100, score5, decision }
}

/**
 * Retourne le score à afficher (préfère 0-100 si disponible, sinon 0-5).
 * @param {object} data - Profil ou candidat
 * @returns {{ label: string, value: number, scale: '100'|'5' }|null}
 */
export function getDisplayScore(data) {
  const { score100, score5 } = getValidationScore(data)
  if (score100 != null) {
    return { label: `${Math.round(score100)}/100`, value: score100, scale: '100' }
  }
  if (score5 != null) {
    return { label: `${Number(score5).toFixed(1)}/5`, value: score5, scale: '5' }
  }
  return null
}

/**
 * Couleur du badge selon le score (0-100 ou 0-5).
 * @param {number} value - Score (0-100 ou 0-5 selon scale)
 * @param {'100'|'5'} scale - Échelle du score
 * @param {boolean} compact - Si true, retourne des styles légers (texte + bordure)
 */
export function getScoreColor(value, scale = '100', compact = false) {
  const v = scale === '100' ? value : (value * 20) // 5 -> 100 pour comparaison
  if (compact) {
    if (v >= 80) return 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30'
    if (v >= 65) return 'bg-[#226D68]/12 text-[#1a5a55] border-[#226D68]/25'
    if (v >= 50) return 'bg-amber-100 text-amber-800 border-amber-200'
    if (v >= 35) return 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30'
    return 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30'
  }
  if (v >= 80) return 'bg-[#226D68]'
  if (v >= 65) return 'bg-[#226D68]/90'
  if (v >= 50) return 'bg-amber-500'
  if (v >= 35) return 'bg-[#e76f51]/90'
  return 'bg-[#e76f51]'
}

/**
 * Libellé de la décision.
 */
export function getDecisionLabel(decision) {
  return (decision && DECISION_LABELS[decision]) || null
}

/**
 * Styles du badge décision (Retenu, En réserve).
 */
export function getDecisionBadgeStyle(decision) {
  switch (decision) {
    case 'retenu':
      return 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30'
    case 'reserve':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'non_retenu':
      return 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30'
    default:
      return 'bg-gray-100 text-[#6b7280] border-gray-200'
  }
}
