import { useState } from 'react'
import { Search, Users, TrendingUp } from 'lucide-react'
import { MOCK_CLIENTS } from '../data/mockData'

const fmtFull = (n) => `$ ${n.toLocaleString()}`

export default function Clients() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = MOCK_CLIENTS.reduce((s, c) => s + c.value, 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Clients</h1>
            <p className="page-subtitle">
              {MOCK_CLIENTS.length} clients · Lifetime value:{' '}
              <span style={{ color: 'var(--gold)' }}>{fmtFull(totalValue)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Clients', value: MOCK_CLIENTS.length, icon: Users, color: 'var(--gold)' },
            { label: 'Total Bookings', value: MOCK_CLIENTS.reduce((s, c) => s + c.bookings, 0), icon: TrendingUp, color: 'var(--sage-light)' },
            { label: 'Lifetime Value', value: fmtFull(totalValue), icon: TrendingUp, color: 'var(--sky)' },
          ].map(stat => (
            <div key={stat.label} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar" style={{ display: 'inline-flex' }}>
            <Search size={14} color="var(--text-dim)" />
            <input
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Phone</th>
                <th>Quotes</th>
                <th>Bookings</th>
                <th>Lifetime Value</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr key={client.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--gold), var(--ember))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: 'var(--night)', fontSize: 13, flexShrink: 0
                      }}>
                        {client.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{client.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-mid)', fontSize: 13 }}>{client.phone}</td>
                  <td>
                    <span style={{
                      background: 'var(--gold-dim)', color: 'var(--gold)',
                      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
                    }}>
                      {client.quotes}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      background: 'rgba(74,124,89,0.15)', color: 'var(--sage-light)',
                      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
                    }}>
                      {client.bookings}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)' }}>
                      {fmtFull(client.value)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{client.added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
