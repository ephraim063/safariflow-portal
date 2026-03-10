import { useState } from 'react'
import { ArrowLeft, Download, CheckCircle, Users, Calendar, DollarSign } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY
const fmtPrice = (n) => `$ ${Number(n).toLocaleString()}`

export default function QuickQuoteModal({ pkg, onClose, onBack }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [season, setSeason] = useState('base')

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    travel_dates: '',
    num_travelers: pkg.price_type === 'Per Couple' ? 2 : 1,
    override_price: '',
    notes: 'This quote is valid for 14 days. A 50% deposit is required to confirm your booking.',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Calculate price based on season and travelers
  const getBasePrice = () => {
    if (season === 'peak') return pkg.peak_price
    if (season === 'low') return pkg.low_price
    return pkg.base_price
  }

  const calculateTotal = () => {
    if (form.override_price) return parseFloat(form.override_price)
    const base = getBasePrice()
    if (pkg.price_type === 'Per Person') {
      return base * (parseInt(form.num_travelers) || 1)
    }
    if (pkg.price_type === 'Per Couple') {
      const travelers = parseInt(form.num_travelers) || 2
      if (travelers === 1) return base + pkg.single_supplement
      return base
    }
    return base // Per Family / flat rate
  }

  const total = calculateTotal()
  const quoteNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const buildItems = () => {
    const items = []
    const inclusions = pkg.inclusions.split(',').map(s => s.trim())

    // Main package line item
    items.push({
      description: pkg.name,
      details: `${pkg.duration} nights · ${pkg.destination}, ${pkg.country}`,
      unit_price: getBasePrice(),
      quantity: pkg.price_type === 'Per Person' ? (parseInt(form.num_travelers) || 1) : 1,
    })

    // Single supplement if applicable
    if (pkg.price_type === 'Per Couple' && parseInt(form.num_travelers) === 1 && pkg.single_supplement > 0) {
      items.push({
        description: 'Single Traveler Supplement',
        details: 'Additional fee for solo occupancy',
        unit_price: pkg.single_supplement,
        quantity: 1,
      })
    }

    return items
  }

  const buildPayload = () => ({
    agency_name: 'SafariFlow',
    client_name: form.client_name,
    client_email: form.client_email,
    client_phone: form.client_phone,
    quote_number: quoteNumber,
    quote_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    valid_until: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    agent_name: 'Ibrahim',
    agent_email: 'ephraim063@gmail.com',
    destination: `${pkg.destination}, ${pkg.country}`,
    travel_dates: form.travel_dates,
    num_travelers: form.num_travelers,
    currency: 'USD',
    currency_symbol: '$',
    items: buildItems(),
    notes: `${form.notes}\n\nPackage includes: ${pkg.inclusions}\n\nNot included: ${pkg.exclusions}`,
  })

  const handleGenerate = async () => {
    if (!form.client_name || !form.client_email) {
      setError('Please enter client name and email.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(buildPayload()),
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quoteNumber}-${form.client_name.replace(/\s/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (e) {
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <button
                onClick={onBack}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <ArrowLeft size={13} /> Back
              </button>
            </div>
            <h2 className="modal-title">Quick Quote</h2>
            <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>📦 {pkg.name}</div>
          </div>
          <div style={{
            background: 'var(--gold-dim)', borderRadius: 8, padding: '6px 14px',
            fontSize: 12, color: 'var(--gold)', fontFamily: 'monospace'
          }}>
            {quoteNumber}
          </div>
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

          {success && (
            <div style={{
              background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--sage-light)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle size={15} />
              PDF downloaded! Ready to send to client.
            </div>
          )}

          {/* Client Details */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 12 }}>
              Client Details
            </div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="John & Jane Smith"
                  value={form.client_name} onChange={e => set('client_name', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="client@email.com"
                  value={form.client_email} onChange={e => set('client_email', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+27 82 555 0100"
                  value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Travel Dates</label>
                <input className="form-input" placeholder="15 Mar - 22 Mar 2025"
                  value={form.travel_dates} onChange={e => set('travel_dates', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="gold-divider" />

          {/* Pricing Options */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 12 }}>
              Pricing
            </div>

            {/* Season selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { key: 'low', label: 'Low Season', price: pkg.low_price, color: 'var(--sage-light)' },
                { key: 'base', label: 'Standard', price: pkg.base_price, color: 'var(--gold)' },
                { key: 'peak', label: 'Peak Season', price: pkg.peak_price, color: 'var(--ember)' },
              ].map(({ key, label, price, color }) => (
                <button
                  key={key}
                  onClick={() => setSeason(key)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10,
                    border: `1px solid ${season === key ? color : 'var(--border)'}`,
                    background: season === key ? `${color}18` : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <div style={{ fontSize: 10, color: season === key ? color : 'var(--text-dim)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: season === key ? color : 'var(--text-mid)' }}>
                    {fmtPrice(price)}
                  </div>
                </button>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Users size={11} style={{ display: 'inline', marginRight: 4 }} />
                  Travelers · {pkg.price_type}
                </label>
                <input className="form-input" type="number" min="1" max={pkg.max_travelers}
                  value={form.num_travelers} onChange={e => set('num_travelers', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <DollarSign size={11} style={{ display: 'inline', marginRight: 4 }} />
                  Override Price (optional)
                </label>
                <input className="form-input" type="number" placeholder="Leave blank to auto-calculate"
                  value={form.override_price} onChange={e => set('override_price', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Total */}
          <div style={{
            background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.25)',
            borderRadius: 10, padding: '14px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', opacity: 0.7, marginBottom: 2 }}>TOTAL QUOTE VALUE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>
                {fmtPrice(total)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {pkg.duration} nights<br />
              {form.num_travelers} traveler{form.num_travelers > 1 ? 's' : ''}<br />
              {pkg.price_type}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onBack}>Back</button>
          <button
            className="btn btn-primary"
            style={{ padding: '10px 24px' }}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--night)' }} />Generating...</>
              : <><Download size={14} />Generate PDF Quote</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
