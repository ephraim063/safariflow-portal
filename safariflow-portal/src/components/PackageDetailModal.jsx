import { useState, useEffect, useRef } from 'react'
import { X, Calendar, Users, Clock, CheckCircle, Send, Star } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { supabaseFetch } from '../hooks/useSupabase'
import { COUNTRIES } from '../data/countries'

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL
const fmtPrice = (n) => `$ ${Number(n).toLocaleString()}`

// ─── Searchable nationality picker — always opens downward ────────────────────
function NationalityPicker({ value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const filtered = COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-input"
        placeholder="Search nationality..."
        value={open ? search : value}
        onFocus={() => { setOpen(true); setSearch('') }}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        style={{ cursor: 'pointer' }}
        readOnly={!open}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: 'var(--card)', border: '1px solid var(--gold)',
          borderRadius: 8, maxHeight: 180, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginTop: 2,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-dim)' }}>No results</div>
          ) : filtered.map(c => (
            <div
              key={c}
              onClick={() => { onChange(c); setOpen(false); setSearch('') }}
              style={{
                padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                color: c === value ? 'var(--gold)' : 'var(--text)',
                background: c === value ? 'var(--gold-dim)' : 'transparent',
                fontWeight: c === value ? 600 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = c === value ? 'var(--gold-dim)' : 'transparent'}
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PackageDetailModal({ pkg, pkgImage, onClose }) {
  const { user } = useUser()
  const [tab, setTab] = useState('overview')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [extras, setExtras] = useState([])
  const [selectedExtras, setSelectedExtras] = useState([])
  const [agentId, setAgentId] = useState(null)

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_nationality: '',
    start_date: '',
    pax_adults: 2,
    pax_children: 0,
    special_requests: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: 'id' })
        if (!agents.length) return
        const aid = agents[0].id
        setAgentId(aid)
        const ex = await supabaseFetch('optional_extras', {
          agent_id: `eq.${aid}`, is_active: 'eq.true',
          select: '*', order: 'category.asc,name.asc'
        })
        setExtras(ex)
      } catch (e) { console.error(e) }
    }
    load()
  }, [user?.id])

  // Calculate end date from start date + duration
  const calcEndDate = (startDate) => {
    if (!startDate) return ''
    const d = new Date(startDate)
    d.setDate(d.getDate() + pkg.duration)
    return d.toISOString().split('T')[0]
  }

  const endDate = calcEndDate(form.start_date)

  // Determine price based on month
  const getPriceForMonth = () => {
    if (!form.start_date) return pkg.base_price
    const month = new Date(form.start_date).toLocaleString('default', { month: 'long' })
    if (pkg.peak_months?.includes(month)) return pkg.peak_price
    return pkg.base_price
  }

  const pricePerPerson = getPriceForMonth()
  const extrasTotal = selectedExtras.reduce((s, e) => s + (e.price_per_person_usd_cents / 100) * (e.price_type === 'per_person' ? Number(form.pax_adults) : 1), 0)
  const totalPrice = (pricePerPerson * Number(form.pax_adults)) + extrasTotal

  const toggleExtra = (extra) => {
    setSelectedExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    )
  }

  const handleSubmit = async () => {
    if (!form.client_name || !form.client_email || !form.start_date) {
      setError('Please fill in client name, email and start date.')
      return
    }
    if (!WEBHOOK_URL) {
      setError('Webhook URL not configured.')
      return
    }
    setSubmitting(true)
    setError(null)

    const payload = {
      agent_id: agentId || import.meta.env.VITE_AGENT_ID,
      source: 'portal_package',
      client: {
        name: form.client_name,
        email: form.client_email,
        phone: form.client_phone,
        nationality: form.client_nationality,
        returning: false,
      },
      trip: {
        destinations: [pkg.destination],
        duration_days: pkg.duration,
        start_date: form.start_date,
        end_date: endDate,
        flexible_dates: false,
        pax_adults: Number(form.pax_adults),
        pax_children: Number(form.pax_children),
        children_ages: [],
        accommodation_tier: 'luxury',
        budget_usd: totalPrice,
        budget_type: 'total',
        special_requests: form.special_requests ? [form.special_requests] : [],
        optional_extras: selectedExtras.map(e => ({ id: e.id, name: e.name, price_usd: e.price_per_person_usd_cents / 100, price_type: e.price_type })),
        package_id: pkg.id,
        package_name: pkg.name,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: `pkg_${Date.now()}`,
        priority: 'normal',
        is_package: true,
      }
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Webhook error')
      setSubmitted(true)
    } catch (e) {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--card)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', overflowX: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image header */}
        <div style={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
          {pkgImage ? (
            <img src={pkgImage} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1B2A47, #2E4A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🌍</div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={16} />
          </button>
          <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 4 }}>{pkg.name}</h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>📍 {pkg.destination}, {pkg.country} · {pkg.duration} nights</div>
          </div>
        </div>

        {submitted ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🦁</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Quote Submitted!</h3>
            <p style={{ color: 'var(--text-mid)', marginBottom: 20 }}>The AI is building the quote for {form.client_name}. You'll receive it by email shortly.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'quote', label: '✈️ Quick Quote' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '8px 18px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? 'var(--gold)' : 'var(--text-mid)',
                  background: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.2s'
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div>
                {/* Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Low Season', price: pkg.low_price, color: 'var(--sage-light)' },
                    { label: 'Standard', price: pkg.base_price, color: 'var(--gold)' },
                    { label: 'Peak Season', price: pkg.peak_price, color: 'var(--ember)' },
                  ].map(({ label, price, color }) => (
                    <div key={label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-mid)', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>
                        {fmtPrice(price)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{pkg.price_type}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, textAlign: 'center' }}>
                  Peak months: {pkg.peak_months} · Max {pkg.max_travelers} travelers
                </div>

                <div className="gold-divider" style={{ margin: '12px 0' }} />

                {/* Highlights */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Highlights</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {pkg.highlights.split(',').map((h, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 500 }}>
                        {h.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Inclusions / Exclusions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: 'rgba(74,124,89,0.08)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(74,124,89,0.2)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sage-light)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>✓ Included</div>
                    {pkg.inclusions.split(',').map((inc, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 3 }}>• {inc.trim()}</div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(224,92,42,0.06)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(224,92,42,0.15)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ember)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>✕ Excluded</div>
                    {pkg.exclusions.split(',').map((exc, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 3 }}>• {exc.trim()}</div>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => setTab('quote')}>
                  ✈️ Generate Quick Quote
                </button>
              </div>
            )}

            {tab === 'quote' && (
              <div>
                {error && (
                  <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: 'var(--ember)' }}>
                    {error}
                  </div>
                )}

                {/* Client details */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Client Information</div>
                  <div className="form-row" style={{ gap: 10, marginBottom: 10 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" placeholder="John & Jane Smith" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Email *</label>
                      <input className="form-input" type="email" placeholder="client@email.com" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row" style={{ gap: 10, marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phone</label>
                      <input
                        className="form-input"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9+\s\-()]+"
                        placeholder="+44 7700 000000"
                        value={form.client_phone}
                        onChange={e => set('client_phone', e.target.value.replace(/[^0-9+\s\-()]/g, ''))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Nationality</label>
                      <NationalityPicker
                        value={form.client_nationality}
                        onChange={v => set('client_nationality', v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Travel dates */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Travel Details</div>
                  <div className="form-row" style={{ gap: 10, marginBottom: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label"><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Start Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={form.start_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => set('start_date', e.target.value)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">End Date (auto)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={endDate}
                        disabled
                        style={{ opacity: 0.6 }}
                      />
                    </div>
                  </div>
                  {form.start_date && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.25)', borderRadius: 20, padding: '3px 12px', marginBottom: 8 }}>
                      <Calendar size={11} color="var(--gold)" />
                      <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{pkg.duration} nights · {form.start_date} → {endDate}</span>
                    </div>
                  )}
                  <div className="form-row" style={{ gap: 10, marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Adults</label>
                      <input className="form-input" type="number" min="1" max={pkg.max_travelers} value={form.pax_adults} onChange={e => set('pax_adults', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Children</label>
                      <input className="form-input" type="number" min="0" value={form.pax_children} onChange={e => set('pax_children', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Optional Extras */}
                {extras.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={12} color="var(--gold)" /> Optional Extras
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                      {extras.map(extra => {
                        const selected = selectedExtras.find(e => e.id === extra.id)
                        return (
                          <div key={extra.id} onClick={() => toggleExtra(extra)} style={{
                            padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                            background: selected ? 'var(--gold-dim)' : 'var(--surface)',
                            transition: 'all 0.2s',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontWeight: 600, fontSize: 12, color: selected ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>{extra.name}</div>
                              {selected && <span style={{ fontSize: 9, background: 'var(--gold)', color: 'white', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{extra.duration_hours}h</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                              ${(extra.price_per_person_usd_cents / 100).toLocaleString()}
                              <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}> /{extra.price_type === 'per_person' ? 'pp' : 'grp'}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Special requests */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Special Requests</label>
                  <textarea className="form-textarea" style={{ minHeight: 50 }} placeholder="Honeymoon, dietary requirements..." value={form.special_requests} onChange={e => set('special_requests', e.target.value)} />
                </div>

                {/* Price summary */}
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Price Summary</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-mid)' }}>{pkg.name} × {form.pax_adults} adults</span>
                    <span style={{ fontWeight: 600 }}>{fmtPrice(pricePerPerson * Number(form.pax_adults))}</span>
                  </div>
                  {selectedExtras.map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-mid)' }}>{e.name}</span>
                      <span style={{ fontWeight: 600 }}>{fmtPrice(e.price_per_person_usd_cents / 100 * (e.price_type === 'per_person' ? Number(form.pax_adults) : 1))}</span>
                    </div>
                  ))}
                  {form.start_date && pkg.peak_months?.includes(new Date(form.start_date).toLocaleString('default', { month: 'long' })) && (
                    <div style={{ fontSize: 11, color: 'var(--ember)', marginBottom: 8 }}>⚠ Peak season pricing applies</div>
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Estimated Total</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{fmtPrice(totalPrice)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Final price subject to AI itinerary and markup</div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} />Generating Quote...</>
                    : <><Send size={15} />Generate & Send Quote</>
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
