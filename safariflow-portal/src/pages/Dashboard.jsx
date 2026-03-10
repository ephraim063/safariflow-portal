import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  FileText, Users, TrendingUp, Clock,
  ArrowRight, Plus, CheckCircle
} from 'lucide-react'
import { MOCK_QUOTES, MONTHLY_DATA } from '../data/mockData'

const fmt = (n) => `$ ${(n / 1000).toFixed(0)}k`
const fmtFull = (n) => `$ ${n.toLocaleString()}`

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12
      }}>
        <div style={{ color: 'var(--text-mid)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--gold)', fontWeight: 600 }}>
          R {payload[0].value.toLocaleString()}
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

  const totalRevenue = MOCK_QUOTES.reduce((s, q) => s + q.total_amount, 0)
  const sentCount = MOCK_QUOTES.filter(q => q.status === 'Sent').length
  const acceptedCount = MOCK_QUOTES.filter(q => q.status === 'Accepted').length
  const draftCount = MOCK_QUOTES.filter(q => q.status === 'Draft').length
  const conversionRate = Math.round((acceptedCount / MOCK_QUOTES.length) * 100)

  const recent = MOCK_QUOTES.slice(0, 4)

  const stats = [
    {
      label: 'Total Quotes',
      value: MOCK_QUOTES.length,
      icon: FileText,
      iconColor: 'var(--gold)',
      iconBg: 'var(--gold-dim)',
      accentColor: 'var(--gold)',
      delta: '+12% this month',
      deltaType: 'up',
      delay: '0ms'
    },
    {
      label: 'Revenue Pipeline',
      value: fmt(totalRevenue),
      icon: TrendingUp,
      iconColor: 'var(--sage-light)',
      iconBg: 'rgba(74,124,89,0.15)',
      accentColor: 'var(--sage-light)',
      delta: '+18% this month',
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
      delta: `${draftCount} drafts pending`,
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

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 2,
              textTransform: 'uppercase', color: 'var(--gold)',
              marginBottom: 6
            }}>
              Good morning
            </div>
            <h1 className="page-title">{firstName} 👋</h1>
            <p className="page-subtitle">Here's what's happening with your quotes today.</p>
          </div>
          <Link to="/quotes/new" className="btn btn-primary" style={{ marginTop: 8 }}>
            <Plus size={15} />
            New Quote
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="stat-card"
              style={{
                '--accent-color': stat.accentColor,
                animationDelay: stat.delay
              }}
            >
              <div className="stat-icon" style={{ background: stat.iconBg }}>
                <stat.icon size={18} color={stat.iconColor} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-delta ${stat.deltaType}`}>
                {stat.deltaType === 'up' && '↑ '}
                {stat.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Recent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Revenue Chart */}
          <div className="card" style={{ animationDelay: '320ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Revenue Pipeline</h3>
                <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>Last 6 months</p>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--gold)',
                background: 'var(--gold-dim)', padding: '4px 12px', borderRadius: 20
              }}>
                {fmt(totalRevenue)} total
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A96E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8A96E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  fill="url(#goldGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quote Status Breakdown */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              Quote Status
            </h3>
            {[
              { label: 'Accepted', count: acceptedCount, color: 'var(--sage-light)', pct: conversionRate },
              { label: 'Sent', count: sentCount, color: 'var(--sky)', pct: Math.round((sentCount / MOCK_QUOTES.length) * 100) },
              { label: 'Draft', count: draftCount, color: 'var(--text-dim)', pct: Math.round((draftCount / MOCK_QUOTES.length) * 100) },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.count}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%', width: `${item.pct}%`,
                    background: item.color, borderRadius: 2,
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            ))}

            <div className="gold-divider" />

            <div style={{ fontSize: 12, color: 'var(--text-mid)', textAlign: 'center' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-display)' }}>
                {conversionRate}%
              </span>
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
                    <div style={{ fontWeight: 500 }}>{quote.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{quote.id}</div>
                  </td>
                  <td style={{ color: 'var(--text-mid)' }}>{quote.destination}</td>
                  <td style={{ color: 'var(--text-mid)', fontSize: 12 }}>{quote.travel_dates}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)' }}>
                      {fmtFull(quote.total_amount)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={quote.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    Sent: 'badge-sent',
    Draft: 'badge-draft',
    Accepted: 'badge-accepted',
    Pending: 'badge-pending',
  }
  return (
    <span className={`badge ${map[status] || 'badge-draft'}`}>
      <span className="badge-dot" />
      {status}
    </span>
  )
}
