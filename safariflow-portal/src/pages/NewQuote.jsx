import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Download, ArrowLeft, CheckCircle, Calendar, Package } from 'lucide-react'
import { SAMPLE_PACKAGES } from './Packages'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY

const EMPTY_ITEM = { description: '', details: '', unit_price: '', quantity: 1 }

// Format date as "15 Mar 2025"
const fmtDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Calculate nights between two dates
const calcNights = (start, end) => {
  if (!start || !end) return null
  const diff = new Date(end) - new Date(start)
  const nights = Math.round(diff / 86400000)
  return nights > 0 ? nights : null
}

export default function NewQuote() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [quoteType, setQuoteType] = useState('tailor') // 'package' or 'tailor'
  const [selectedPackage, setSelectedPackage] = useState('')

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    destination: '',
    start_date: '',
    end_date: '',
    num_travelers: 2,
    notes: 'This quote is valid for 14 days. A 50% deposit is required to confirm your booking.',
    currency_symbol: '$',
  })

  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const nights = calcNights(form.start_date, form.end_date)
  const travel_dates = (form.start_date && form.end_date)
    ? `${fmtDate(form.start_date)} - ${fmtDate(form.end_date)}`
    : ''

  // When agent selects a package, auto-fill destination + items
  const handlePackageSelect = (pkgId) => {
    setSelectedPackage(pkgId)
    if (!pkgId) {
      setItems([{ ...EMPTY_ITEM }])
      return
    }
    const pkg = SAMPLE_PACKAGES.find(p => p.id === pkgId)
    if (!pkg) return

    set('destination', `${pkg.destination}, ${pkg.country}`)

    // Auto-populate items from package inclusions
    const autoItems = [
      {
        description: pkg.name,
        details: `${pkg.duration} nights · ${pkg.destination}, ${pkg.country}`,
        unit_price: pkg.base_price,
        quantity: pkg.price_type === 'Per Person' ? form.num_travelers : 1,
      },
      ...pkg.inclusions.split(',').slice(1, 4).map(inc => ({
        description: inc.trim(),
        details: '',
        unit_price: '',
        quantity: 1,
      }))
    ]
    setItems(autoItems)
  }

  const updateItem = (i, key, val) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const total = items.reduce((s, item) => {
    return s + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)
  }, 0)

  const quoteNumber = useMemo(() =>
    `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, [])

  const buildPayload = () => ({
    agency_name: 'SafariFlow',
    client_name: form.client_name,
    client_email: form.client_email,
    client_phone: form.client_phone,
    destination: form.destination,
    travel_dates,
    num_travelers: form.num_travelers,
    notes: form.notes,
    quote_number: quoteNumber,
    quote_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    valid_until: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    agent_name: 'Ibrahim',
    agent_email: 'ephraim063@gmail.com',
    currency: 'USD',
    currency_symbol: '$',
    items: items.map(i => ({
      ...i,
      unit_price: parseFloat(i.unit_price) || 0,
      quantity: parseInt(i.quantity) || 1,
    })),
  })

  const handleDownload = async () => {
    if (!form.client_name || !form.destination) {
      setError('Please fill in client name and destination.')
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
      if (!res.ok) throw new Error('API error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quoteNumber}-${form.client_name.replace(/\s/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (e) {
      setError('Failed to generate PDF. Make sure Render is awake and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Styled date input
  const DateInput = ({ label, value, onChange, min }) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">
        <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="date"
          className="form-input"
          value={value}
          min={min || new Date().toISOString().split('T')[0]}
          onChange={e => onChange(e.target.value)}
          style={{ colorScheme: 'dark', cursor: 'pointer' }}
        />
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
            <h1 className="page-title">New Quote</h1>
            <p className="page-subtitle">
              Quote ID: <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{quoteNumber}</span>
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleDownload} disabled={loading} style={{ marginTop: 8 }}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} />Generating...</>
              : <><Download size={14} />Download PDF</>
            }
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div style={{
            background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--ember)'
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--sage-light)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <CheckCircle size={15} /> PDF generated and downloaded successfully!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div>

            {/* Quote Type Selector */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Quote Type
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'package', icon: Package, label: 'From Package', desc: 'Select from your catalogue' },
                  { key: 'tailor', icon: Plus, label: 'Tailor Made', desc: 'Build custom from scratch' },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => { setQuoteType(key); setSelectedPackage(''); setItems([{ ...EMPTY_ITEM }]) }}
                    style={{
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1px solid ${quoteType === key ? 'var(--gold)' : 'var(--border)'}`,
                      background: quoteType === key ? 'var(--gold-dim)' : 'var(--surface)',
                      fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Icon size={15} color={quoteType === key ? 'var(--gold)' : 'var(--text-mid)'} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: quoteType === key ? 'var(--gold)' : 'var(--text)' }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</div>
                  </button>
                ))}
              </div>

              {/* Package Dropdown */}
              {quoteType === 'package' && (
                <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
                  <label className="form-label">Select Package *</label>
                  <select
                    className="form-select"
                    value={selectedPackage}
                    onChange={e => handlePackageSelect(e.target.value)}
                  >
                    <option value="">— Choose a package —</option>
                    {SAMPLE_PACKAGES.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} · {pkg.destination}, {pkg.country} · from ${pkg.base_price.toLocaleString()} {pkg.price_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Client Details */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Client Information
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="John & Jane Smith"
                    value={form.client_name} onChange={e => set('client_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" placeholder="client@email.com"
                    value={form.client_email} onChange={e => set('client_email', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" placeholder="+254 722 000 000"
                    value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Travelers</label>
                  <input className="form-input" type="number" min="1"
                    value={form.num_travelers} onChange={e => set('num_travelers', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Trip Details
              </h3>
              <div className="form-group">
                <label className="form-label">Destination *</label>
                <input className="form-input" placeholder="Masai Mara, Kenya"
                  value={form.destination} onChange={e => set('destination', e.target.value)} />
              </div>
              <div className="form-row">
                <DateInput
                  label="Start Date"
                  value={form.start_date}
                  onChange={val => set('start_date', val)}
                />
                <DateInput
                  label="End Date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={val => set('end_date', val)}
                />
              </div>

              {/* Nights badge */}
              {nights && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 10, background: 'var(--gold-dim)',
                  border: '1px solid rgba(200,169,110,0.25)',
                  borderRadius: 20, padding: '4px 14px'
                }}>
                  <Calendar size={12} color="var(--gold)" />
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                    {nights} night{nights !== 1 ? 's' : ''} · {travel_dates}
                  </span>
                </div>
              )}
            </div>

            {/* Quote Items */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Quote Items</h3>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={addItem}>
                  <Plus size={13} /> Add Item
                </button>
              </div>

              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '34%' }}>Description</th>
                    <th style={{ width: '29%' }}>Details</th>
                    <th style={{ width: '14%' }}>Unit Price</th>
                    <th style={{ width: '8%' }}>Qty</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Total</th>
                    <th style={{ width: '3%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <input placeholder="Safari package / Flight..."
                          value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                      </td>
                      <td>
                        <input placeholder="Details..."
                          value={item.details} onChange={e => updateItem(i, 'details', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" placeholder="0"
                          value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                          style={{ textAlign: 'right' }} />
                      </td>
                      <td>
                        <input type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                          style={{ textAlign: 'center', width: '100%' }} />
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                        $ {((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)).toLocaleString()}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)', marginRight: 16 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
                  $ {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Notes & Conditions
              </h3>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <textarea className="form-textarea" style={{ minHeight: 100 }}
                  value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Quote Summary
              </h3>

              {[
                { label: 'Client', value: form.client_name || '—' },
                { label: 'Destination', value: form.destination || '—' },
                { label: 'Start Date', value: form.start_date ? fmtDate(form.start_date) : '—' },
                { label: 'End Date', value: form.end_date ? fmtDate(form.end_date) : '—' },
                { label: 'Duration', value: nights ? `${nights} nights` : '—' },
                { label: 'Travelers', value: form.num_travelers },
                { label: 'Items', value: items.filter(i => i.description).length },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textAlign: 'right', maxWidth: 160 }}>{value}</span>
                </div>
              ))}

              <div className="gold-divider" />

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Total Value</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>
                  $ {total.toLocaleString()}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={handleDownload}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--night)' }} />Generating PDF...</>
                  : <><Download size={16} />Generate & Download PDF</>
                }
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 10 }}>
                PDF will be downloaded to your device
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
