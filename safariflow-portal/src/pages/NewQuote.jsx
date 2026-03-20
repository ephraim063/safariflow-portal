import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Plus, Trash2, ArrowLeft, CheckCircle, Calendar, Send, Star } from 'lucide-react'
import { COUNTRIES } from '../data/countries'
import { supabaseFetch } from '../hooks/useSupabase'

// ─── Searchable nationality picker ───────────────────────────────────────────
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
        readOnly={!open}
        style={{ cursor: 'pointer' }}
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

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL

const DESTINATIONS = [
  'Masai Mara, Kenya', 'Amboseli, Kenya', 'Samburu, Kenya', 'Lake Nakuru, Kenya',
  'Serengeti, Tanzania', 'Ngorongoro, Tanzania', 'Zanzibar, Tanzania', 'Kilimanjaro, Tanzania',
  'Bwindi, Uganda', 'Queen Elizabeth NP, Uganda',
  'Volcanoes NP, Rwanda',
  'Okavango Delta, Botswana', 'Chobe, Botswana',
  'Kruger, South Africa', 'Cape Town, South Africa',
  'Victoria Falls, Zimbabwe/Zambia',
]

export default function NewQuote() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [extras, setExtras] = useState([])
  const [selectedExtras, setSelectedExtras] = useState([])
  const [agentId, setAgentId] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: 'id' })
        if (!agents.length) return
        const aid = agents[0].id
        setAgentId(aid)
        const ex = await supabaseFetch('optional_extras', { agent_id: `eq.${aid}`, is_active: 'eq.true', select: '*', order: 'category.asc,name.asc' })
        setExtras(ex)
      } catch (e) { console.error(e) }
    }
    load()
  }, [user?.id])

  const toggleExtra = (extra) => {
    setSelectedExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    )
  }

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_nationality: '',
    destinations: [],
    start_date: '',
    end_date: '',
    pax_adults: 2,
    pax_children: 0,
    children_ages: '',
    accommodation_tier: 'luxury',
    budget_usd: '',
    budget_type: 'total',
    flexible_dates: false,
    special_requests: '',
    priority: 'normal',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleDestination = (dest) => {
    setForm(f => ({
      ...f,
      destinations: f.destinations.includes(dest)
        ? f.destinations.filter(d => d !== dest)
        : [...f.destinations, dest]
    }))
  }

  const calcNights = (start, end) => {
    if (!start || !end) return null
    const diff = new Date(end) - new Date(start)
    const n = Math.round(diff / 86400000)
    return n > 0 ? n : null
  }
  const nights = calcNights(form.start_date, form.end_date)

  const handleSubmit = async () => {
    if (!form.client_name || !form.client_email || form.destinations.length === 0) {
      setError('Please fill in client name, email, and at least one destination.')
      return
    }
    if (!form.start_date || !form.end_date) {
      setError('Please select travel dates.')
      return
    }
    if (!WEBHOOK_URL) {
      setError('Webhook URL not configured. Please add VITE_MAKE_WEBHOOK_URL to your .env file.')
      return
    }

    setLoading(true)
    setError(null)

    const payload = {
      agent_id: user?.publicMetadata?.supabase_agent_id || import.meta.env.VITE_AGENT_ID || '',
      source: 'portal',
      client: {
        name: form.client_name,
        email: form.client_email,
        phone: form.client_phone,
        nationality: form.client_nationality,
        returning: false,
      },
      trip: {
        destinations: form.destinations,
        duration_days: nights || 7,
        start_date: form.start_date,
        end_date: form.end_date,
        flexible_dates: form.flexible_dates,
        pax_adults: Number(form.pax_adults),
        pax_children: Number(form.pax_children),
        children_ages: form.children_ages ? form.children_ages.split(',').map(a => a.trim()) : [],
        accommodation_tier: form.accommodation_tier,
        budget_usd: Number(form.budget_usd) || 0,
        budget_type: form.budget_type,
        special_requests: form.special_requests ? [form.special_requests] : [],
        optional_extras: selectedExtras.map(e => ({ id: e.id, name: e.name, price_usd: e.price_per_person_usd_cents / 100, price_type: e.price_type })),
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: `portal_${Date.now()}`,
        priority: form.priority,
      }
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Webhook error')
      setSuccess(true)
      setTimeout(() => navigate('/quotes'), 3000)
    } catch (e) {
      setError('Failed to submit quote request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🦁</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Quote Request Submitted!</h2>
          <p style={{ color: 'var(--text-mid)', fontSize: 15, marginBottom: 24 }}>
            The AI is building the itinerary and pricing. You'll receive an email shortly with the quote for review.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--sage-light)', fontSize: 13 }}>
            <CheckCircle size={15} /> Redirecting to quotes...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button className="btn btn-ghost" style={{ marginBottom: 8, padding: '4px 0' }} onClick={() => navigate('/quotes')}>
              <ArrowLeft size={14} /> Back to Quotes
            </button>
            <h1 className="page-title">New Quote Request</h1>
            <p className="page-subtitle">AI will build the itinerary and pricing automatically</p>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} />Submitting...</>
              : <><Send size={14} />Submit for AI Processing</>
            }
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--ember)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            {/* Client Details */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Client Information
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="John & Jane Smith" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" placeholder="client@email.com" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
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
                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <NationalityPicker
                    value={form.client_nationality}
                    onChange={v => set('client_nationality', v)}
                  />
                </div>
              </div>
            </div>

            {/* Destinations */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Destinations *
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DESTINATIONS.map(dest => (
                  <button
                    key={dest}
                    onClick={() => toggleDestination(dest)}
                    style={{
                      padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${form.destinations.includes(dest) ? 'var(--gold)' : 'var(--border)'}`,
                      background: form.destinations.includes(dest) ? 'var(--gold-dim)' : 'var(--surface)',
                      color: form.destinations.includes(dest) ? 'var(--gold)' : 'var(--text-mid)',
                      fontWeight: form.destinations.includes(dest) ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Details */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Trip Details
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Start Date *</label>
                  <input type="date" className="form-input" value={form.start_date} min={new Date().toISOString().split('T')[0]} onChange={e => set('start_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />End Date *</label>
                  <input type="date" className="form-input" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} />
                </div>
              </div>

              {nights && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.25)', borderRadius: 20, padding: '4px 14px' }}>
                  <Calendar size={12} color="var(--gold)" />
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{nights} nights</span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Adults</label>
                  <input className="form-input" type="number" min="1" value={form.pax_adults} onChange={e => set('pax_adults', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Children</label>
                  <input className="form-input" type="number" min="0" value={form.pax_children} onChange={e => set('pax_children', e.target.value)} />
                </div>
              </div>

              {Number(form.pax_children) > 0 && (
                <div className="form-group">
                  <label className="form-label">Children Ages (comma separated)</label>
                  <input className="form-input" placeholder="8, 12" value={form.children_ages} onChange={e => set('children_ages', e.target.value)} />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Accommodation Tier</label>
                  <select className="form-select" value={form.accommodation_tier} onChange={e => set('accommodation_tier', e.target.value)}>
                    <option value="budget">Budget</option>
                    <option value="mid">Mid Range</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget (USD)</label>
                  <input className="form-input" type="number" placeholder="12000" value={form.budget_usd} onChange={e => set('budget_usd', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Requests</label>
                <textarea className="form-textarea" placeholder="Honeymoon couple, dietary requirements, accessibility needs..." value={form.special_requests} onChange={e => set('special_requests', e.target.value)} style={{ minHeight: 80 }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="flex" checked={form.flexible_dates} onChange={e => set('flexible_dates', e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="flex" style={{ fontSize: 13, color: 'var(--text-mid)', cursor: 'pointer' }}>Dates are flexible</label>
              </div>
            </div>

            {/* Optional Extras */}
            {extras.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={16} color="var(--gold)" /> Optional Extras
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>Select any additional experiences or services for this client.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {extras.map(extra => {
                    const selected = selectedExtras.find(e => e.id === extra.id)
                    return (
                      <div key={extra.id} onClick={() => toggleExtra(extra)} style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                        background: selected ? 'var(--gold-dim)' : 'var(--surface)',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: selected ? 'var(--gold)' : 'var(--text)' }}>{extra.name}</div>
                          {selected && <span style={{ fontSize: 10, background: 'var(--gold)', color: 'white', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{extra.category} · {extra.duration_hours}h</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                          ${(extra.price_per_person_usd_cents / 100).toLocaleString()}
                          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}> / {extra.price_type === 'per_person' ? 'person' : 'group'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedExtras.length > 0 && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--gold-dim)', borderRadius: 8, fontSize: 12, color: 'var(--gold)' }}>
                    ✓ {selectedExtras.length} extra{selectedExtras.length > 1 ? 's' : ''} selected: {selectedExtras.map(e => e.name).join(', ')}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'none' }}>{/* close trip details card */}
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Request Summary
              </h3>

              {[
                { label: 'Client', value: form.client_name || '—' },
                { label: 'Destinations', value: form.destinations.length ? form.destinations.join(', ') : '—' },
                { label: 'Start Date', value: form.start_date || '—' },
                { label: 'Duration', value: nights ? `${nights} nights` : '—' },
                { label: 'Travelers', value: `${form.pax_adults} adults${Number(form.pax_children) > 0 ? `, ${form.pax_children} children` : ''}` },
                { label: 'Tier', value: form.accommodation_tier || '—' },
                { label: 'Budget', value: form.budget_usd ? `$${Number(form.budget_usd).toLocaleString()}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right', maxWidth: 160 }}>{value}</span>
                </div>
              ))}

              <div className="gold-divider" />

              <div style={{ background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: 'var(--gold)' }}>
                🤖 AI will automatically build the full itinerary, pricing, and PDF quote. You'll receive an email for review.
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--night)' }} />Processing...</>
                  : <><Send size={16} />Submit for AI Processing</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
