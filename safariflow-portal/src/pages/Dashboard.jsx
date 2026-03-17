import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  FileText, TrendingUp, Clock, CheckCircle, ArrowRight, Plus
} from 'lucide-react'
import { supabaseFetch } from '../hooks/useSupabase'

const fmt = (n) => `$ ${(n / 1000).toFixed(0)}k`
const fmtFull = (n) => `$ ${Number(n || 0).toLocaleString()}`

const STATUS_MAP = {
  generated: { label: 'Generated', cls: 'badge-draft' },
  sent: { label: 'Sent', cls: 'badge-sent' },
  accepted: { label: 'Accepted', cls: 'badge-accepted' },
  revision_requested: { label: 'Revision', cls: 'badge-pending' },
  pending_deposit: { label: 'Deposit Due', cls: 'badge-sent' },
  confirmed: { label: 'Confirmed', cls: 'badge-accepted' },
  cancelled: { label: 'Cancelled', cls: 'badge-draft' },
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'badge-draft' }
  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge-dot" />
      {s.label}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12
      }}>
        <div style={{ color: 'var(--text-mid)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--gold)', fontWeight: 600 }}>
          {fmtFull(payload[0]?.value)}
        </div>
        <div style={{ color: 'var(--text-mid)' }}>{payload[1]?.value} quotes</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useUser()
  const firstName = user?.firstName || 'Agent'
  const clerkId = user?.id

  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState(null)

  useEffect(() => {
    if (!clerkId) return
    const load = async () => {
      try {
        // Fetch agent record
        const agents = await supabaseFetch('agents', {
          clerk_user_id: `eq.${clerkId}`,
          select: 'id'
        })
        if (!agents.length) return
        const aid = agents[0].id
        setAgentId(aid)

        // Fetch quotes
        const q = await supabaseFetch('quotes', {
          agent_id: `eq.${aid}`,
          select: '*',
          order: 'created_at.desc',
          limit: 50
        })
        setQuotes(q)
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clerkId])

  // Stats
  const totalValue = quotes.reduce((s, q) => s + (q.total_price_usd_cents || 0) / 100, 0)
  const sentCount = quotes.filter(q => q.status === 'sent').length
  const acceptedCount = quotes.filter(q => q.status === 'accepted' || q.status === 'confirmed').length
  const pendingCount = quotes.filter(q => q.status === 'generated' || q.status === 'revision_requested').length
  const conversionRate = quotes.length ? Math.round((acceptedCount / quotes.length) * 100) : 0

  // Monthly chart data
  const monthlyData = (() => {
    const months = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short' })
      months[key] = { month: key, revenue: 0, quotes: 0 }
    }
    quotes.forEach(q => {
      const d = new Date(q.created_at)
      const key = d.toLocaleString('default', { month: 'short' })
      if (months[key]) {
        months[key].revenue += (q.total_price_usd_cents || 0) / 100
        months[key].quotes += 1
      }
    })
    return Object.values(months)
  })()

  const stats = [
    {
      label: 'Total Quotes',
      value: quotes.length,
      icon: FileText,
      iconColor: 'var(--gold)',
      iconBg: 'var(--gold-dim)',
      accentColor: 'var(--gold)',
      delta: `${pendingCount} pending`,
      deltaType: 'neutral',
      delay: '0ms'
    },
    {
      label: 'Revenue Pipeline',
      value: fmt(totalValue),
      icon: TrendingUp,
      iconColor: 'var(--sage-light)',
      iconBg: 'rgba(74,124,89,0.15)',
      accentColor: 'var(--sage-light)',
      delta: fmtFull(totalValue) + ' total',
      deltaType: 'up',
      delay: '80ms'
    },
    {
      label: 'Awaiting Response',
      value: sentCount,
      icon: Clock,
      iconColor: 'var(--sky)',
      iconBg: 'rgba(74,144,217,0.15)',
      accentColor: 'var(--sky)',
      delta: 'quotes sent to clients',
      deltaType: 'neutral',
      delay: '160ms'
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: CheckCircle,
      iconColor: 'var(--sage-light)',
      iconBg: 'rgba(74,124,89,0.15)',
      accentColor: 'var(--sage-light)',
      delta: `${acceptedCount} accepted`,
      deltaType: 'up',
      delay: '240ms'
    },
  ]

  const recent = quotes.slice(0, 5)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-mid)', fontSize: 13 }}>Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 2,
              textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6
            }}>
              Good morning
            </div>
            <h1 className="page-title">{firstName} 👋</h1>
            <p className="page-subtitle">Here's what's happening with your quotes today.</p>
          </div>
          <Link to="/quotes/new" className="btn btn-primary" style={{ marginTop: 8 }}>
            <Plus size={15} /> New Quote
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card" style={{ '--accent-color': stat.accentColor, animationDelay: stat.delay }}>
              <div className="stat-icon" style={{ background: stat.iconBg }}>
                <stat.icon size={18} color={stat.iconColor} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-delta ${stat.deltaType}`}>
                {stat.deltaType === 'up' && '↑ '}{stat.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ animationDelay: '320ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Revenue Pipeline</h3>
                <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>Last 6 months</p>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', background: 'var(--gold-dim)', padding: '4px 12px', borderRadius: 20 }}>
                {fmt(totalValue)} total
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A96E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8A96E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              Quote Status
            </h3>
            {[
              { label: 'Accepted', count: acceptedCount, color: 'var(--sage-light)', pct: conversionRate },
              { label: 'Sent to Client', count: sentCount, color: 'var(--sky)', pct: quotes.length ? Math.round((sentCount / quotes.length) * 100) : 0 },
              { label: 'In Progress', count: pendingCount, color: 'var(--text-dim)', pct: quotes.length ? Math.round((pendingCount / quotes.length) * 100) : 0 },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.count}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
            <div className="gold-divider" />
            <div style={{ fontSize: 12, color: 'var(--text-mid)', textAlign: 'center' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-display)' }}>{conversionRate}%</span>
              <br />conversion rate
            </div>
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="table-container animate-fade-up">
          <div className="table-header">
            <h3 className="table-title">Recent Quotes</h3>
            <Link to="/quotes" className="btn btn-ghost" style={{ fontSize: 12 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No quotes yet — create your first one!</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Destination</th>
                  <th>Travel Dates</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(quote => (
                  <tr key={quote.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{quote.client_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{quote.quote_number}</div>
                    </td>
                    <td style={{ color: 'var(--text-mid)' }}>
                      {Array.isArray(quote.destinations) ? quote.destinations.join(', ') : quote.destinations || '—'}
                    </td>
                    <td style={{ color: 'var(--text-mid)', fontSize: 12 }}>
                      {quote.start_date} {quote.end_date ? `→ ${quote.end_date}` : ''}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)' }}>
                        {fmtFull((quote.total_price_usd_cents || 0) / 100)}
                      </span>
                    </td>
                    <td><StatusBadge status={quote.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
