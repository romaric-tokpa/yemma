import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Image, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DocumentViewer({ documents, selectedDocument, onSelectDocument }) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const getDocumentIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5" />
    if (mimeType?.includes('image')) return <Image className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const renderDocument = () => {
    if (!selectedDocument) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Sélectionnez un document pour le visualiser</p>
          </div>
        </div>
      )
    }

    const isPDF = selectedDocument.mimeType?.includes('pdf')
    const isImage = selectedDocument.mimeType?.includes('image')

    return (
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-xs">
              {selectedDocument.originalFilename}
            </span>
            <Badge variant="outline">{selectedDocument.documentType}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {isImage && (
              <Button variant="ghost" size="sm" onClick={handleRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(selectedDocument.viewUrl, '_blank')}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4 flex items-center justify-center">
          {isPDF ? (
            <iframe
              src={selectedDocument.viewUrl}
              className="w-full h-full border rounded"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          ) : isImage ? (
            <img
              src={selectedDocument.viewUrl}
              alt={selectedDocument.originalFilename}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s',
              }}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Type de document non supporté</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.open(selectedDocument.viewUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Liste des documents */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-3 border-b">
          <h3 className="text-sm font-medium">Documents disponibles</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {documents.length} document(s)
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {documents.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">
                Aucun document disponible
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDocument?.id === doc.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getDocumentIcon(doc.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.originalFilename}</p>
                      <p className="text-xs opacity-70 mt-1">{doc.documentType}</p>
                      <p className="text-xs opacity-70">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Visionneuse */}
      <div className="flex-1 flex flex-col">
        {renderDocument()}
      </div>
    </div>
  )
}

