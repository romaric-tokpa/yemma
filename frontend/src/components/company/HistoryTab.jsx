import { useState, useEffect } from 'react'
import { FileText, Download } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { paymentApi } from '../../services/api'

export function HistoryTab({ companyId }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (companyId) loadInvoices()
  }, [companyId])

  const loadInvoices = async () => {
    try {
      const data = await paymentApi.getInvoices(companyId)
      setInvoices(data)
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = (invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank')
    } else {
      alert('Le PDF n\'est pas encore disponible')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <span className="text-xs text-[#9ca3af]">Chargement...</span>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card className="border-[#e5e7eb] border-dashed shadow-none">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-[#F4F6F8] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-[#9ca3af]" />
          </div>
          <p className="text-sm font-medium text-[#2C2C2C]">Aucune facture</p>
          <p className="text-xs text-[#9ca3af] mt-1">Vos factures apparaîtront ici</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#e5e7eb] shadow-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#F4F6F8]/50">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                N° Facture
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Montant
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#F4F6F8]/30 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#2C2C2C]">{invoice.invoice_number}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-[#9ca3af]">
                  {new Date(invoice.invoice_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-semibold text-[#2C2C2C]">{invoice.total_amount.toFixed(2)}€</span>
                  {invoice.tax_amount > 0 && (
                    <span className="text-[10px] text-[#9ca3af] ml-1">dont TVA {invoice.tax_amount.toFixed(2)}€</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Badge className="h-5 text-[10px] px-1.5 bg-[#E8F4F3] text-[#226D68] border-0">
                    Payée
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="h-7 text-xs text-[#226D68] hover:bg-[#E8F4F3]"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
