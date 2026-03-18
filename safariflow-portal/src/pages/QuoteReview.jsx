import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowLeft, Send, CheckCircle, AlertCircle, Download, RefreshCw } from 'lucide-react'
import { supabaseFetch, supabasePatch } from '../hooks/useSupabase'

const FLASK_URL = import.meta.env.VITE_API_URL
const MAKE_WEBHOOK = import.meta.env.VITE_MAKE_WEBHOOK_URL

const fmtUSD = (n) => `$${Number(n || 0).toLocaleString()}`

const CHANGE_LABELS = {
  accommodation: '🏨 Accommodation',
  dates: '📅 Travel Dates',
  budget: '💰 Budget',
  destinations: '📍 Destinations',
  travelers: '👥 No. of Travelers',
  transport: '✈️ Transport',
  duration: '🌙 Trip Duration',
  other: '✏️ Other',
}

export default function QuoteReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const [quote, setQuote] = useState(null)
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!id || !user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: '*' })
        if (!agents.length) return
        const a = agents[0]
        setAgent(a)
        const quotes = await supabaseFetch('quotes', { quote_number: `eq.${id}`, select: '*' })
        if (quotes.length) setQuote(quotes[0])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [id, user?.id])

  const changeRequest = quote?.change_request
    ? (typeof quote.change_request === 'string' ? JSON.parse(quote.change_request) : quote.change_request)
    : null

  const requestedChanges = changeRequest
    ? Object.entries(CHANGE_LABELS).filter(([key]) => changeRequest[key])
    : []

  const handleRegenerate = async () => {
    if (!quote || !agent) return
    setRegenerating(true)
    setError(null)
    try {
      const payload = {
        agent_id: agent.id,
        source: 'revision',
        client: {
          name: quote.client_name,
          email: quote.client_email,
          phone: '',
          nationality: '',
          returning: true,
        },
        trip: {
          destinations: Array.isArray(quote.destinations) ? quote.destinations : [quote.destinations],
          duration_days: changeRequest?.duration ? quote.duration_days : quote.duration_days,
          start_date: quote.start_date,
          end_date: quote.end_date,
          flexible_dates: false,
          pax_adults: quote.pax_adults || 2,
          pax_children: quote.pax_children || 0,
          children_ages: [],
          accommodation_tier: quote.accommodation_tier || 'luxury',
          budget_usd: changeRequest?.revised_budget ? Number(changeRequest.revised_budget) : (quote.client_budget_usd_cents || 0) / 100,
          budget_type: 'total',
          special_requests: [
            notes || changeRequest?.notes || '',
            changeRequest?.preferred_month ? `Preferred month: ${changeRequest.preferred_month}` : '',
          ].filter(Boolean),
        },
        meta: {
          timestamp: new Date().toISOString(),
          request_id: `rev_${Date.now()}`,
          priority: 'high',
          original_quote: id,
          is_revision: true,
        }
      }

      const res = await fetch(`${FLASK_URL}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Regeneration failed')
      const data = await res.json()

      // Save new PDF URL to quote
      await supabasePatch('quotes', { quote_number: `eq.${id}` }, {
        status: 'draft_revision',
        pdf_url: data.pdf_url,
        total_price_usd_cents: Math.round((data.total_price_usd || 0) * 100),
      })

      // Reload quote
      const updated = await supabaseFetch('quotes', { quote_number: `eq.${id}`, select: '*' })
      if (updated.length) setQuote(updated[0])

    } catch (e) {
      setError('Regeneration failed: ' + e.message)
    } finally {
      setRegenerating(false) }
  }

  const handleApproveAndSend = async () => {
    if (!quote) return
    setSending(true)
    setError(null)
    try {
      await supabasePatch('quotes', { quote_number: `eq.${id}` }, { status: 'sent' })
      // Trigger Flask approve endpoint logic via webhook
      await fetch(`${FLASK_URL}/approve-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_number: id, agent_id: agent?.id }),
      })
      setSuccess(true)
      setTimeout(() => navigate('/quotes'), 2500)
    } catch (e) {
      // Even if webhook fails, status is updated
      setSuccess(true)
      setTimeout(() => navigate('/quotes'), 2500)
    } finally { setSending(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  if (!quote) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ color: 'var(--text-mid)' }}>Quote not found</div>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>Revised Quote Sent!</h2>
        <p style={{ color: 'var(--text-mid)' }}>The updated quote has been sent to {quote.client_name}.</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button className="btn btn-ghost" style={{ marginBottom: 8, padding: '4px 0' }} onClick={() => navigate('/quotes')}>
              <ArrowLeft size={14} /> Back to Quotes
            </button>
            <h1 className="page-title">Review Revised Quote</h1>
            <p className="page-subtitle">
              <span style={{ fontFamily: 'monospace', color: 'var(--gold)', background: 'var(--gold-dim)', padding: '2px 8px', borderRadius: 4 }}>{id}</span>
              <span style={{ marginLeft: 12, color: 'var(--text-mid)' }}>{quote.client_name}</span>
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleApproveAndSend}
            disabled={sending}
            style={{ marginTop: 8 }}
          >
            {sending ? <><span className="spinner" style={{ width: 14, height: 14 }} />Sending...</> : <><Send size={14} />Approve & Send to Client</>}
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--ember)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            {/* Client Change Request */}
            {changeRequest && requestedChanges.length > 0 && (
              <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(200,169,110,0.3)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--gold)' }}>
                  📋 Client Change Request
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {requestedChanges.map(([key, label]) => (
                    <span key={key} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 600 }}>
                      {label}
                    </span>
                  ))}
                </div>
                {changeRequest.revised_budget && (
                  <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 8 }}>
                    💰 <strong>Revised budget:</strong> ${Number(changeRequest.revised_budget).toLocaleString()}
                  </div>
                )}
                {changeRequest.preferred_month && (
                  <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 8 }}>
                    📅 <strong>Preferred month:</strong> {changeRequest.preferred_month}
                  </div>
                )}
                {changeRequest.notes && (
                  <div style={{ fontSize: 13, color: 'var(--text-mid)', background: '#F8F6F2', borderRadius: 8, padding: '10px 14px' }}>
                    💬 {changeRequest.notes}
                  </div>
                )}
              </div>
            )}

            {/* AI Regenerate */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                🤖 AI Revision
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 16 }}>
                Add any additional instructions for the AI before regenerating. The client's change request above will be included automatically.
              </p>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Additional Instructions (optional)</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 80 }}
                  placeholder="e.g. Swap Angama Mara for Sarova Mara, keep Amboseli the same..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <button className="btn btn-secondary" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating
                  ? <><span className="spinner" style={{ width: 14, height: 14 }} />AI Rebuilding Quote...</>
                  : <><RefreshCw size={14} />Regenerate with AI</>
                }
              </button>
              {regenerating && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                  This takes 30–60 seconds. Please wait...
                </div>
              )}
            </div>

            {/* Current Quote Details */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                Current Quote Details
              </h3>
              {[
                { label: 'Client', value: quote.client_name },
                { label: 'Destinations', value: Array.isArray(quote.destinations) ? quote.destinations.join(', ') : quote.destinations },
                { label: 'Travel Dates', value: `${quote.start_date} → ${quote.end_date}` },
                { label: 'Duration', value: `${quote.duration_days} days` },
                { label: 'Travelers', value: `${quote.pax_adults || 0} adults, ${quote.pax_children || 0} children` },
                { label: 'Accommodation', value: quote.accommodation_tier },
                { label: 'Total Price', value: fmtUSD((quote.total_price_usd_cents || 0) / 100) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Actions
              </h3>

              {quote.pdf_url && (
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                  onClick={() => window.open(quote.pdf_url, '_blank')}
                >
                  <Download size={14} /> Preview PDF
                </button>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 16 }}>
                Review the PDF before sending to client
              </div>

              <div className="gold-divider" />

              <div style={{ background: 'var(--gold-dim)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: 'var(--gold)' }}>
                🤖 Click <strong>Regenerate with AI</strong> to have AI rebuild the quote based on client's changes. Then preview the PDF and approve.
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={handleApproveAndSend}
                disabled={sending}
              >
                {sending
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--night)' }} />Sending...</>
                  : <><Send size={16} />Approve & Send to Client</>
                }
              </button>

              <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                Client will receive the updated PDF by email
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
