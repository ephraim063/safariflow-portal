import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Search, Users, Mail, Phone, Globe } from 'lucide-react'
import { supabaseFetch } from '../hooks/useSupabase'

export default function Clients() {
  const { user } = useUser()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        // Get unique clients from quotes table
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: 'id' })
        if (!agents.length) return
        const aid = agents[0].id

        const quotes = await supabaseFetch('quotes', {
          agent_id: `eq.${aid}`,
          select: 'client_name,client_email,destinations,created_at,status,total_price_usd_cents',
          order: 'created_at.desc'
        })

        // Deduplicate by email
        const seen = new Set()
        const unique = []
        quotes.forEach(q => {
          if (q.client_email && !seen.has(q.client_email)) {
            seen.add(q.client_email)
            unique.push(q)
          } else if (!q.client_email && q.client_name && !seen.has(q.client_name)) {
            seen.add(q.client_name)
            unique.push(q)
          }
        })
        setClients(unique)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const filtered = clients.filter(c =>
    (c.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.client_email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Clients</h1>
            <p className="page-subtitle">{filtered.length} clients in your database</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="search-bar" style={{ marginBottom: 20, maxWidth: 400 }}>
          <Search size={14} color="var(--text-dim)" />
          <input
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
            <div className="empty-state-text">Loading clients...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={40} color="var(--text-dim)" /></div>
            <div className="empty-state-text">No clients yet — they appear automatically when quotes are generated.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((client, i) => (
              <div key={i} className="card" style={{ animationDelay: `${i * 40}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--gold)'
                  }}>
                    {(client.client_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{client.client_name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {client.client_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-mid)', marginBottom: 8 }}>
                    <Mail size={12} color="var(--gold)" />
                    {client.client_email}
                  </div>
                )}

                {client.destinations && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-mid)', marginBottom: 8 }}>
                    <Globe size={12} color="var(--gold)" />
                    {Array.isArray(client.destinations) ? client.destinations.join(', ') : client.destinations}
                  </div>
                )}

                <div style={{
                  marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Last quote</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 12,
                    background: client.status === 'accepted' ? 'rgba(74,124,89,0.15)' : 'var(--gold-dim)',
                    color: client.status === 'accepted' ? 'var(--sage-light)' : 'var(--gold)',
                    fontWeight: 600
                  }}>
                    {client.status || 'generated'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
