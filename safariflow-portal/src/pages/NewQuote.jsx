import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Send, Download, ArrowLeft, CheckCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY

const EMPTY_ITEM = { description: '', details: '', unit_price: '', quantity: 1 }

export default function NewQuote() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    destination: '',
    travel_dates: '',
    num_travelers: 2,
    notes: 'This quote is valid for 14 days. A 50% deposit is required to confirm your booking.',
    currency_symbol: '$',
  })

  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const updateItem = (i, key, val) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  }

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const total = items.reduce((s, item) => {
    const price = parseFloat(item.unit_price) || 0
    const qty = parseInt(item.quantity) || 0
    return s + price * qty
  }, 0)

  const quoteNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const buildPayload = () => ({
    agency_name: 'SafariFlow',
    ...form,
    quote_number: quoteNumber,
    quote_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    valid_until: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    agent_name: 'Ibrahim',
    agent_email: 'ephraim063@gmail.com',
    currency: 'USD',
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

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button
              className="btn btn-ghost"
              style={{ marginBottom: 8, padding: '4px 0' }}
              onClick={() => navigate('/quotes')}
            >
              <ArrowLeft size={14} /> Back to Quotes
            </button>
            <h1 className="page-title">New Quote</h1>
            <p className="page-subtitle">
              Quote ID: <span style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{quoteNumber}</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={handleDownload} disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 14, height: 14 }} />Generating...</>
                : <><Download size={14} />Download PDF</>
              }
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div style={{
            background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--ember)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--sage-light)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <CheckCircle size={15} />
            PDF generated and downloaded successfully!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Left — Main Form */}
          <div>
            {/* Client Details */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
              }}>
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
                  <input className="form-input" placeholder="+27 82 555 0100"
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
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
              }}>
                Trip Details
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Destination *</label>
                  <input className="form-input" placeholder="Bali, Indonesia"
                    value={form.destination} onChange={e => set('destination', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Travel Dates</label>
                  <input className="form-input" placeholder="15 Mar - 25 Mar 2025"
                    value={form.travel_dates} onChange={e => set('travel_dates', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Quote Items */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>
                  Quote Items
                </h3>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={addItem}>
                  <Plus size={13} /> Add Item
                </button>
              </div>

              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Description</th>
                    <th style={{ width: '30%' }}>Details</th>
                    <th style={{ width: '14%' }}>Unit Price</th>
                    <th style={{ width: '8%' }}>Qty</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                    <th style={{ width: '3%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          placeholder="Return Flights JNB → DPS"
                          value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          placeholder="Economy class"
                          value={item.details}
                          onChange={e => updateItem(i, 'details', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="15500"
                          value={item.unit_price}
                          onChange={e => updateItem(i, 'unit_price', e.target.value)}
                          style={{ textAlign: 'right' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                          style={{ textAlign: 'center', width: '100%' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                        R {((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)).toLocaleString()}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}
                          >
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
                  R {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)'
              }}>
                Notes & Conditions
              </h3>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 100 }}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
              }}>
                Quote Summary
              </h3>

              {[
                { label: 'Client', value: form.client_name || '—' },
                { label: 'Destination', value: form.destination || '—' },
                { label: 'Dates', value: form.travel_dates || '—' },
                { label: 'Travelers', value: form.num_travelers },
                { label: 'Items', value: items.filter(i => i.description).length },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                </div>
              ))}

              <div className="gold-divider" />

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Total Value</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>
                  R {total.toLocaleString()}
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
