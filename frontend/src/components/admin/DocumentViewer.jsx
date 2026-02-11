import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Image, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, FileStack } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Libellés et ordre pour l'évaluation recruteur (charte Yemma)
const DOC_TYPE_LABELS = {
  CV: 'Curriculum Vitae',
  DIPLOMA: 'Diplôme',
  CERTIFICATE: 'Certificat',
  ATTESTATION: 'Attestation',
  RECOMMENDATION_LETTER: 'Lettre de recommandation',
  OTHER: 'Autre',
}
const DOC_TYPE_ORDER = ['CV', 'DIPLOMA', 'CERTIFICATE', 'ATTESTATION', 'RECOMMENDATION_LETTER', 'OTHER']

const DOC_TYPE_BADGE_CLASS = {
  CV: 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/40',
  DIPLOMA: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  CERTIFICATE: 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/40',
  ATTESTATION: 'bg-[#226D68]/10 text-[#226D68] border-[#226D68]/30',
  RECOMMENDATION_LETTER: 'bg-purple-50 text-purple-800 border-purple-200',
  OTHER: 'bg-muted text-muted-foreground border-border',
}

function formatFileSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function getDocType(doc) {
  return doc.documentType || doc.document_type || 'OTHER'
}

export default function DocumentViewer({ documents, selectedDocument, onSelectDocument }) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  // Réinitialiser zoom/rotation à chaque changement de document
  useEffect(() => {
    setZoom(100)
    setRotation(0)
  }, [selectedDocument?.id])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const filteredDocuments = documents.filter((doc) => {
    const docType = getDocType(doc)
    const mimeType = doc.mimeType || doc.mime_type
    if (docType === 'PROFILE_PHOTO' || docType === 'COMPANY_LOGO') return false
    if (docType === 'OTHER' && mimeType?.startsWith('image/')) return false
    return true
  })

  // Grouper par type (ordre recruteur : CV en premier)
  const groupedByType = DOC_TYPE_ORDER.reduce((acc, type) => {
    const list = filteredDocuments.filter((d) => getDocType(d) === type)
    if (list.length) acc[type] = list
    return acc
  }, {})

  const getDocumentIcon = (mimeType) => {
    const m = mimeType || ''
    if (m.includes('pdf')) return <FileText className="w-4 h-4 shrink-0 text-[#226D68]" />
    if (m.includes('image')) return <Image className="w-4 h-4 shrink-0 text-[#e76f51]" />
    return <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
  }

  const handleDownload = (doc) => {
    const link = document.createElement('a')
    link.href = doc.viewUrl
    link.download = doc.originalFilename || doc.original_filename || `document_${doc.id}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenNewTab = (doc) => {
    window.open(doc.viewUrl, '_blank', 'noopener,noreferrer')
  }

  const renderDocument = () => {
    if (!selectedDocument) {
      return (
        <div className="flex items-center justify-center h-full min-h-[320px] bg-muted/20 rounded-r-lg">
          <div className="text-center px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#226D68]/10 text-[#226D68] mb-4">
              <FileStack className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-gray-anthracite">Aucun document sélectionné</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
              Choisissez un document dans la liste pour le prévisualiser ou le télécharger.
            </p>
          </div>
        </div>
      )
    }

    const mimeType = selectedDocument.mimeType || selectedDocument.mime_type
    const isPDF = mimeType?.includes('pdf')
    const isImage = mimeType?.includes('image')
    const typeKey = getDocType(selectedDocument)
    const typeLabel = DOC_TYPE_LABELS[typeKey] || typeKey
    const badgeClass = DOC_TYPE_BADGE_CLASS[typeKey] || DOC_TYPE_BADGE_CLASS.OTHER

    return (
      <div className="h-full flex flex-col min-w-0">
        {/* Barre d'outils */}
        <div className="shrink-0 border-b border-border bg-white px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {getDocumentIcon(mimeType)}
            <span className="text-sm font-medium text-gray-anthracite truncate" title={selectedDocument.originalFilename || selectedDocument.original_filename}>
              {selectedDocument.originalFilename || selectedDocument.original_filename}
            </span>
            <Badge variant="outline" className={`text-xs shrink-0 ${badgeClass}`}>
              {typeLabel}
            </Badge>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatFileSize(selectedDocument.fileSize ?? selectedDocument.file_size)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-[#226D68]"
              onClick={() => handleOpenNewTab(selectedDocument)}
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            {(isPDF || isImage) && (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut} disabled={zoom <= 50} title="Réduire">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-9 text-center">{zoom}%</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn} disabled={zoom >= 200} title="Agrandir">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                {isImage && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleRotate} title="Pivoter">
                    <RotateCw className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-[#226D68]"
              onClick={() => handleDownload(selectedDocument)}
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-center justify-center min-h-[280px]">
          {isPDF ? (
            <iframe
              src={selectedDocument.viewUrl}
              className="w-full h-full min-h-[320px] border-0 rounded-lg shadow-sm"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
              title={selectedDocument.originalFilename || selectedDocument.original_filename}
            />
          ) : isImage ? (
            <img
              src={selectedDocument.viewUrl}
              alt={selectedDocument.originalFilename || selectedDocument.original_filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aperçu non disponible pour ce type de fichier.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-[#226D68]/40 text-[#226D68] hover:bg-[#226D68]/10"
                onClick={() => handleDownload(selectedDocument)}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le fichier
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex min-h-0">
      {/* Panneau latéral : liste par type */}
      <div className="w-72 shrink-0 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-3 border-b border-border bg-white">
          <h3 className="text-sm font-semibold text-gray-anthracite">Documents à évaluer</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredDocuments.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 px-4 text-center">
                <FileStack className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Aucun document disponible</p>
                <p className="text-xs mt-1">CV et pièces jointes apparaîtront ici.</p>
              </div>
            ) : (
              Object.entries(groupedByType).map(([typeKey, list]) => {
                const label = DOC_TYPE_LABELS[typeKey] || typeKey
                const badgeClass = DOC_TYPE_BADGE_CLASS[typeKey] || DOC_TYPE_BADGE_CLASS.OTHER
                return (
                  <div key={typeKey} className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${badgeClass}`}>
                        {list.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {list.map((doc) => {
                        const isSelected = selectedDocument?.id === doc.id
                        const name = doc.originalFilename || doc.original_filename || `Document ${doc.id}`
                        const size = formatFileSize(doc.fileSize ?? doc.file_size)
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => onSelectDocument(doc)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-[#226D68] text-white border-[#226D68] shadow-sm'
                                : 'bg-white hover:bg-muted/50 border-border hover:border-[#226D68]/30'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {getDocumentIcon(doc.mimeType || doc.mime_type)}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-anthracite'}`}>{name}</p>
                                <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>{size}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Visionneuse */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderDocument()}
      </div>
    </div>
  )
}
