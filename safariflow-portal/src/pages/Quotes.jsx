import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Download, Edit2 } from 'lucide-react'
import { supabaseFetch } from '../hooks/useSupabase'
import { StatusBadge } from './Dashboard'
import { useUser } from '@clerk/clerk-react'

const fmtFull = (n) => `$ ${Number(n || 0).toLocaleString()}`

export default function Quotes() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [agentId, setAgentId] = useState(null)

  const statuses = ['All', 'generated', 'sent', 'accepted', 'revision_requested', 'confirmed']
  const statusLabels = {
    All: 'All',
    generated: 'Generated',
    sent: 'Sent',
    accepted: 'Accepted',
    revision_requested: 'Revision',
    confirmed: 'Confirmed'
  }

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: 'id' })
        if (!agents.length) return
        const aid = agents[0].id
        setAgentId(aid)
        const q = await supabaseFetch('quotes', {
          agent_id: `eq.${aid}`,
          select: '*',
          order: 'created_at.desc'
        })
        setQuotes(q)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const filtered = quotes.filter(q => {
    const matchSearch =
      (q.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.quote_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(q.destinations) ? q.destinations.join(', ') : q.destinations || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || q.status === filter
    return matchSearch && matchFilter
  })

  const totalValue = filtered.reduce((s, q) => s + (q.total_price_usd_cents || 0) / 100, 0)

  const handleDownloadPDF = async (quote) => {
    if (!quote.pdf_url) return alert('PDF not available for this quote.')
    window.open(quote.pdf_url, '_blank')
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">All Quotes</h1>
            <p className="page-subtitle">
              {filtered.length} quotes · Pipeline: <span style={{ color: 'var(--gold)' }}>{fmtFull(totalValue)}</span>
            </p>
          </div>
          <Link to="/quotes/new" className="btn btn-primary">
            <Plus size={15} /> New Quote
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-dim)" />
            <input
              placeholder="Search client, destination, quote ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button
                key={s}
                className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '7px 14px', fontSize: 12 }}
                onClick={() => setFilter(s)}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
              <div className="empty-state-text">Loading quotes...</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Client</th>
                  <th>Destination</th>
                  <th>Travel Dates</th>
                  <th>Travelers</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🗂️</div>
                        <div className="empty-state-text">No quotes found</div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((quote, i) => (
                  <tr key={quote.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)', background: 'var(--gold-dim)', padding: '2px 8px', borderRadius: 4 }}>
                        {quote.quote_number || quote.id.slice(0, 8)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{quote.client_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{quote.client_email || ''}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {Array.isArray(quote.destinations) ? quote.destinations.join(', ') : quote.destinations || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                      {quote.start_date} {quote.end_date ? `→ ${quote.end_date}` : ''}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {(quote.pax_adults || 0) + (quote.pax_children || 0) || '—'}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>
                        {fmtFull((quote.total_price_usd_cents || 0) / 100)}
                      </span>
                    </td>
                    <td><StatusBadge status={quote.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(quote.status === 'revision_requested' || quote.status === 'draft_revision') && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: 11 }}
                            onClick={() => navigate(`/quotes/review/${quote.quote_number}`)}
                            title="Review & Revise"
                          >
                            <Edit2 size={12} /> Review
                          </button>
                        )}
                        {quote.pdf_url && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '5px 8px' }}
                            onClick={() => handleDownloadPDF(quote)}
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '5px 8px' }}
                          onClick={() => setSelected(quote)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quote Detail Modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setSelected(null)}
        >
          <div
            className="modal"
            style={{ background: 'var(--card)', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)', background: 'var(--gold-dim)', padding: '2px 8px', borderRadius: 4 }}>
                  {selected.quote_number}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginTop: 8 }}>
                  {selected.client_name}
                </h2>
              </div>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setSelected(null)}>✕</button>
            </div>

            {[
              { label: 'Destination', value: Array.isArray(selected.destinations) ? selected.destinations.join(', ') : selected.destinations },
              { label: 'Travel Dates', value: `${selected.start_date} → ${selected.end_date}` },
              { label: 'Duration', value: `${selected.duration_days} days` },
              { label: 'Travelers', value: `${selected.pax_adults || 0} adults, ${selected.pax_children || 0} children` },
              { label: 'Accommodation', value: selected.accommodation_tier },
              { label: 'Total Value', value: fmtFull((selected.total_price_usd_cents || 0) / 100) },
              { label: 'Status', value: <StatusBadge status={selected.status} /> },
              { label: 'Created', value: new Date(selected.created_at).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</span>
              </div>
            ))}

            {selected.pdf_url && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
                onClick={() => window.open(selected.pdf_url, '_blank')}
              >
                <Download size={15} /> Download PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
