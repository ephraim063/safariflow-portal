import { useState } from 'react'
import { X, Send, Download, Edit2, CheckCircle, Clock, FileText } from 'lucide-react'
import { StatusBadge } from '../pages/Dashboard'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY
const fmtFull = (n) => `$ ${Number(n).toLocaleString()}`

export default function QuoteDetailModal({ quote, onClose }) {
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const total = quote.items?.reduce((s, i) => s + (i.unit_price * i.quantity), 0) || quote.total_amount

  const buildPayload = () => ({
    agency_name: 'SafariFlow',
    client_name: quote.client_name,
    client_email: quote.client_email,
    client_phone: quote.client_phone || '',
    quote_number: quote.id,
    quote_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    valid_until: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    agent_name: quote.agent_name || 'Ibrahim',
    agent_email: 'ephraim063@gmail.com',
    destination: quote.destination,
    travel_dates: quote.travel_dates,
    num_travelers: quote.num_travelers,
    currency: 'ZAR',
    currency_symbol: 'R',
    items: quote.items || [],
    notes: 'This quote is valid for 14 days. A 50% deposit is required to confirm your booking.',
  })

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quote.id}-${quote.client_name.replace(/\s/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      // In production this would call Make.com webhook or your API
      // For demo we just generate the PDF to show it works
      await handleDownload()
      setSent(true)
    } catch (e) {
      setError('Failed to send quote.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="modal-title">{quote.id}</h2>
              <StatusBadge status={sent ? 'Sent' : quote.status} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>
              Created {quote.date_created} · Agent: {quote.agent_name}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 8px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--ember)'
            }}>
              {error}
            </div>
          )}

          {sent && (
            <div style={{
              background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--sage-light)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle size={15} />
              Quote PDF downloaded successfully! In production, this would email the client.
            </div>
          )}

          {/* Client Info */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            background: 'var(--surface)', borderRadius: 10, padding: 20,
            border: '1px solid var(--border)', marginBottom: 20
          }}>
            {[
              { label: 'Client', value: quote.client_name },
              { label: 'Email', value: quote.client_email },
              { label: 'Phone', value: quote.client_phone || '—' },
              { label: 'Travelers', value: quote.num_travelers },
              { label: 'Destination', value: quote.destination },
              { label: 'Travel Dates', value: quote.travel_dates },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
              Quote Items
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>Description</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>Qty</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>Unit Price</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{item.details}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-mid)', fontSize: 13 }}>{item.quantity}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13 }}>{fmtFull(item.unit_price)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 15 }}>
                        {fmtFull(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', background: 'var(--card)',
                borderTop: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-mid)' }}>
                  Total Investment
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
                  {fmtFull(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button
            className="btn btn-secondary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Generating...</> : <><Download size={14} />Download PDF</>}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || sent}
          >
            {sent ? <><CheckCircle size={14} />Sent!</> :
             sending ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--night)' }} />Sending...</> :
             <><Send size={14} />Send to Client</>}
          </button>
        </div>
      </div>
    </div>
  )
}
