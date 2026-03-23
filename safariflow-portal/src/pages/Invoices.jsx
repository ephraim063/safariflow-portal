import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { FileText, CheckCircle, Clock, AlertCircle, Download, DollarSign, X } from 'lucide-react'
import { supabaseFetch, supabasePatch } from '../hooks/useSupabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://web-production-4788f.up.railway.app'

const STATUS_CONFIG = {
  draft:        { label: 'Draft',         color: '#888888', bg: '#F0F0F0',                  icon: Clock },
  sent:         { label: 'Sent',           color: '#2E4A7A', bg: 'rgba(46,74,122,0.1)',      icon: FileText },
  deposit_paid: { label: 'Deposit Paid',   color: '#3A6B4A', bg: 'rgba(58,107,74,0.1)',      icon: CheckCircle },
  balance_due:  { label: 'Balance Due',    color: '#C4922A', bg: 'rgba(196,146,42,0.1)',     icon: AlertCircle },
  balance_paid: { label: 'Fully Paid',     color: '#3A6B4A', bg: 'rgba(58,107,74,0.15)',     icon: CheckCircle },
  cancelled:    { label: 'Cancelled',      color: '#CC0000', bg: 'rgba(204,0,0,0.08)',       icon: X },
}

const fmtUSD  = (cents) => `$${((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
    }}>
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

function PaymentModal({ invoice, agentId, onClose, onConfirmed }) {
  const [form, setForm] = useState({
    payment_type:   invoice.amount_paid_usd_cents >= invoice.deposit_usd_cents ? 'balance' : 'deposit',
    payment_method: 'bank_transfer',
    amount_usd:     '',
    reference:      '',
    notes:          '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-fill amount
  useEffect(() => {
    if (form.payment_type === 'deposit') {
      set('amount_usd', (invoice.deposit_usd_cents / 100).toFixed(2))
    } else {
      set('amount_usd', (invoice.balance_usd_cents / 100).toFixed(2))
    }
  }, [form.payment_type])

  const handleConfirm = async () => {
    if (!form.amount_usd || Number(form.amount_usd) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id:     invoice.id,
          agent_id:       agentId,
          payment_type:   form.payment_type,
          payment_method: form.payment_method,
          amount_usd:     Number(form.amount_usd),
          reference:      form.reference,
          notes:          form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onConfirmed(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>
            Confirm Payment
          </h3>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Invoice {invoice.invoice_number}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{invoice.client_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>
            Total: {fmtUSD(invoice.total_usd_cents)} ·
            Paid: {fmtUSD(invoice.amount_paid_usd_cents)} ·
            Due: {fmtUSD(invoice.amount_due_usd_cents)}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--ember)' }}>
            {error}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Payment Type</label>
            <select className="form-select" value={form.payment_type} onChange={e => set('payment_type', e.target.value)}>
              <option value="deposit">Deposit</option>
              <option value="balance">Balance</option>
              <option value="full">Full Payment</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (USD) *</label>
            <input className="form-input" type="number" step="0.01" min="0" value={form.amount_usd} onChange={e => set('amount_usd', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Reference / Receipt No.</label>
            <input className="form-input" placeholder="e.g. TRF-123456" value={form.reference} onChange={e => set('reference', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <button className="btn btn-primary" onClick={handleConfirm} disabled={saving} style={{ width: '100%', padding: '12px' }}>
          {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Confirming...</> : <><CheckCircle size={14} /> Confirm Payment Received</>}
        </button>
      </div>
    </div>
  )
}

export default function Invoices() {
  const { user } = useUser()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [payModal, setPayModal] = useState(null)

  const load = async () => {
    if (!user?.id) return
    try {
      const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: 'id' })
      if (!agents.length) return
      const aid = agents[0].id
      setAgentId(aid)
      const data = await supabaseFetch('invoices', {
        agent_id: `eq.${aid}`,
        select: '*',
        order: 'created_at.desc',
      })
      setInvoices(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  // Stats
  const totalRevenue   = invoices.reduce((s, i) => s + (i.amount_paid_usd_cents || 0), 0)
  const totalOutstanding = invoices.reduce((s, i) => s + (i.amount_due_usd_cents || 0), 0)
  const pendingDeposit = invoices.filter(i => i.status === 'sent').length
  const fullyPaid      = invoices.filter(i => i.status === 'balance_paid').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  return (
    <div>
      {payModal && (
        <PaymentModal
          invoice={payModal}
          agentId={agentId}
          onClose={() => setPayModal(null)}
          onConfirmed={() => { setPayModal(null); load() }}
        />
      )}

      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <p className="page-subtitle">Track payments and manage client invoices</p>
      </div>

      <div className="page-body">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Received',    value: fmtUSD(totalRevenue),    color: 'var(--sage-light)',  icon: '💰' },
            { label: 'Outstanding',       value: fmtUSD(totalOutstanding), color: 'var(--ember)',       icon: '⏳' },
            { label: 'Awaiting Deposit',  value: pendingDeposit,           color: 'var(--gold)',        icon: '📨' },
            { label: 'Fully Paid',        value: fullyPaid,                color: 'var(--sage-light)',  icon: '✅' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'sent', 'deposit_paid', 'balance_due', 'balance_paid', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn btn-ghost"
              style={{
                fontSize: 12, padding: '6px 14px',
                background: filter === f ? 'var(--gold-dim)' : undefined,
                borderColor: filter === f ? 'var(--gold)' : undefined,
                color: filter === f ? 'var(--gold)' : undefined,
                fontWeight: filter === f ? 700 : 400,
              }}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-text">
              {filter === 'all'
                ? 'No invoices yet — invoices are generated automatically when a client accepts a quote'
                : `No ${STATUS_CONFIG[filter]?.label} invoices`}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Safari</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-display)' }}>{inv.invoice_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{fmtDate(inv.issued_at)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{inv.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{inv.client_email}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                      <div>{inv.destinations}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{fmtDate(inv.start_date)}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                      {fmtUSD(inv.total_usd_cents)}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--sage-light)', fontWeight: 600 }}>
                      {fmtUSD(inv.amount_paid_usd_cents)}
                    </td>
                    <td style={{ fontSize: 13, color: inv.amount_due_usd_cents > 0 ? 'var(--ember)' : 'var(--sage-light)', fontWeight: 600 }}>
                      {fmtUSD(inv.amount_due_usd_cents)}
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {inv.pdf_url && (
                          <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '5px 8px' }} title="Download Invoice">
                            <Download size={13} />
                          </a>
                        )}
                        {['sent', 'deposit_paid', 'balance_due'].includes(inv.status) && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '5px 12px', fontSize: 11 }}
                            onClick={() => setPayModal(inv)}
                          >
                            <DollarSign size={11} /> Confirm Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
