import { useState } from 'react'
import { Lock, FileText, Image, File } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { useNavigate } from 'react-router-dom'

export function BlurredDocuments({ documents, subscription }) {
  const navigate = useNavigate()
  const isFreemium = subscription?.plan?.plan_type === 'FREEMIUM'
  
  const handleUpgrade = () => {
    // Rediriger vers la page de gestion d'abonnement
    navigate('/company/management?tab=subscription')
  }
  
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (fileType?.includes('image')) return <Image className="h-8 w-8 text-blue-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }
  
  if (!isFreemium) {
    // Si pas Freemium, ne pas afficher ce composant
    return null
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">
              Documents justificatifs verrouillés
            </h3>
            <p className="text-xs text-yellow-700 mb-3">
              Passez à un plan supérieur pour accéder aux documents justificatifs des candidats.
            </p>
            <Button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="sm"
            >
              S'abonner pour voir les preuves
            </Button>
          </div>
        </div>
      </div>
      
      {/* Liste des documents floutés */}
      {documents && documents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {documents.map((doc, index) => (
            <Card key={doc.id || index} className="relative overflow-hidden">
              <div className="relative">
                {/* Image/document flouté */}
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  {doc.file_type?.includes('image') ? (
                    <div className="relative w-full h-full">
                      <img
                        src={doc.url || doc.file_url}
                        alt={doc.name || doc.file_name || 'Document'}
                        className="w-full h-full object-cover blur-md filter"
                        style={{ filter: 'blur(20px)' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getFileIcon(doc.file_type)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      {getFileIcon(doc.file_type)}
                    </div>
                  )}
                </div>
                
                {/* Overlay avec verrou */}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-8 w-8 text-white mx-auto mb-2" />
                    <p className="text-xs text-white font-medium">Verrouillé</p>
                  </div>
                </div>
              </div>
              
              {/* Nom du document */}
              <div className="p-3 border-t">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {doc.name || doc.file_name || 'Document'}
                </p>
                {doc.document_type && (
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {doc.document_type.replace('_', ' ')}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

