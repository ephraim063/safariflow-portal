import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Download, Send, Eye, Filter } from 'lucide-react'
import { MOCK_QUOTES } from '../data/mockData'
import { StatusBadge } from './Dashboard'
import QuoteDetailModal from '../components/QuoteDetailModal'

const fmtFull = (n) => `R ${n.toLocaleString()}`

export default function Quotes() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  const statuses = ['All', 'Draft', 'Sent', 'Accepted']

  const filtered = MOCK_QUOTES.filter(q => {
    const matchSearch =
      q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.destination.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || q.status === filter
    return matchSearch && matchFilter
  })

  const totalValue = filtered.reduce((s, q) => s + q.total_amount, 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Quotes</h1>
            <p className="page-subtitle">
              {filtered.length} quotes · Pipeline value: <span style={{ color: 'var(--gold)' }}>{fmtFull(totalValue)}</span>
            </p>
          </div>
          <Link to="/quotes/new" className="btn btn-primary">
            <Plus size={15} />
            New Quote
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={14} color="var(--text-dim)" />
            <input
              placeholder="Search client, destination, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {statuses.map(s => (
              <button
                key={s}
                className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '7px 14px', fontSize: 12 }}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
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
                <tr
                  key={quote.id}
                  onClick={() => setSelected(quote)}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)', background: 'var(--gold-dim)', padding: '2px 8px', borderRadius: 4 }}>
                      {quote.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{quote.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{quote.client_email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{quote.destination}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{quote.travel_dates}</td>
                  <td style={{ textAlign: 'center' }}>{quote.num_travelers}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>
                      {fmtFull(quote.total_amount)}
                    </span>
                  </td>
                  <td><StatusBadge status={quote.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '5px 8px' }}
                        onClick={() => setSelected(quote)}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <QuoteDetailModal
          quote={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
