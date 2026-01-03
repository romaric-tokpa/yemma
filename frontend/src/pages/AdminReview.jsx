import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CandidateDataView from '@/components/admin/CandidateDataView'
import DocumentViewer from '@/components/admin/DocumentViewer'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { candidateApi, documentApi } from '@/services/api'
import { Loader2 } from 'lucide-react'

export default function AdminReview() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidateData, setCandidateData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        setLoading(true)
        // Récupérer les données du candidat depuis Candidate Service
        const profile = await candidateApi.getProfile(candidateId)
        setCandidateData(profile)

        // Récupérer les documents depuis Document Service
        const docs = await documentApi.getCandidateDocuments(candidateId)
        // Générer les URLs de visualisation pour chaque document
        const docsWithUrls = await Promise.all(
          docs.map(async (doc) => {
            try {
              const viewData = await documentApi.getDocumentViewUrl(doc.id)
              return { ...doc, viewUrl: viewData.view_url }
            } catch (err) {
              console.error(`Error getting view URL for document ${doc.id}:`, err)
              return { ...doc, viewUrl: null }
            }
          })
        )
        setDocuments(docsWithUrls.filter(doc => doc.viewUrl))
        if (docsWithUrls.length > 0 && docsWithUrls[0].viewUrl) {
          setSelectedDocument(docsWithUrls[0])
        }
      } catch (err) {
        console.error('Error fetching candidate data:', err)
        setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    if (candidateId) {
      fetchCandidateData()
    }
  }, [candidateId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Erreur: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Validation de Profil Candidat</h1>
          <p className="text-sm text-muted-foreground">
            Candidat ID: {candidateId} | {candidateData?.email || 'N/A'}
          </p>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Côté gauche - Données candidat */}
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="border-b p-4 bg-muted/50">
              <h2 className="font-semibold">Informations du Candidat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CandidateDataView data={candidateData} />
            </div>
          </div>

          {/* Côté droit - Visionneuse de documents */}
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="border-b p-4 bg-muted/50">
              <h2 className="font-semibold">Documents</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <DocumentViewer
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={setSelectedDocument}
              />
            </div>
          </div>
        </div>

        {/* Formulaire de Grille d'Évaluation */}
        <div className="mt-6 bg-card border rounded-lg shadow-sm">
          <div className="border-b p-4 bg-muted/50">
            <h2 className="font-semibold">Grille d'Évaluation</h2>
          </div>
          <div className="p-6">
            <EvaluationForm
              candidateId={candidateId}
              candidateData={candidateData}
              onSuccess={() => {
                // Rediriger ou afficher un message de succès
                alert('Profil validé avec succès ! L\'indexation est en cours.')
                navigate('/admin')
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

