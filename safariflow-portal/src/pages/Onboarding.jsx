import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Download, Upload } from 'lucide-react'
import { supabasePatch } from '../hooks/useSupabase'
import { COUNTRY_NAMES } from '../data/countryNames'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://web-production-4788f.up.railway.app'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const STEPS = [
  { id: 1, title: 'Agency Details', icon: '🏢' },
  { id: 2, title: 'Brand Colors',   icon: '🎨' },
  { id: 3, title: 'Pricing Setup',  icon: '💰' },
  { id: 4, title: 'Payment Terms',  icon: '📋' },
  { id: 5, title: 'Last Step!',     icon: '🦁' },
]

// ── Phone validation ──────────────────────────────────────────────────────────
function validatePhone(phone) {
  const clean = phone.replace(/[\s\-()]/g, '')
  if (!clean) return null
  if (!clean.startsWith('+')) return 'Must start with + and country code e.g. +254'
  if (!/^\+\d{9,14}$/.test(clean)) return 'Must be 10–15 digits including country code'
  return 'valid'
}

// ── Country picker ────────────────────────────────────────────────────────────
function CountryPicker({ value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const filtered = COUNTRY_NAMES.filter(c =>
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
        placeholder="Search country..."
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
          borderRadius: 8, maxHeight: 160, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginTop: 2,
        }}>
          {filtered.length === 0
            ? <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-dim)' }}>No results</div>
            : filtered.map(c => (
              <div
                key={c}
                onClick={() => { onChange(c); setOpen(false); setSearch('') }}
                style={{
                  padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                  color: c === value ? 'var(--gold)' : 'var(--text)',
                  background: c === value ? 'var(--gold-dim)' : 'transparent',
                  fontWeight: c === value ? 600 : 400,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = c === value ? 'var(--gold-dim)' : 'transparent'}
              >
                {c}
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── Logo uploader ─────────────────────────────────────────────────────────────
function LogoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || null)
  const ref = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2MB')
      return
    }

    setUploading(true)
    try {
      // Show local preview immediately
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(file)

      // Upload to Supabase storage
      const filename = `logos/${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/agent-assets/${filename}`

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: file,
      })

      if (res.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/agent-assets/${filename}`
        onChange(publicUrl)
      } else {
        // Fallback — use base64 data URL if storage fails
        onChange(preview)
      }
    } catch (e) {
      console.error('Logo upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Logo preview */}
        <div style={{
          width: 80, height: 80, borderRadius: 12,
          border: '2px dashed var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          background: 'var(--surface)',
        }}>
          {preview
            ? <img src={preview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 28 }}>🏢</span>
          }
        </div>

        {/* Upload button */}
        <div style={{ flex: 1 }}>
          <button
            type="button"
            onClick={() => ref.current.click()}
            disabled={uploading}
            className="btn btn-ghost"
            style={{ fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {uploading
              ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Uploading...</>
              : <><Upload size={13} /> {preview ? 'Change Logo' : 'Upload Logo'}</>
            }
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            PNG, JPG or SVG · Max 2MB<br />
            Appears on all quote PDFs and emails
          </div>
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = '' }}
      />
    </div>
  )
}

export default function Onboarding({ agentId }) {
  const { user } = useUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)

  const [form, setForm] = useState({
    agency_name: '',
    agent_name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    phone: '',
    country: '',
    logo_url: '',
    brand_color_primary: '#2E4A7A',
    brand_color_secondary: '#C4922A',
    deposit_percentage: 30,
    balance_due_days: 60,
    markup_type: 'overall',
    markup_overall_pct: 20,
    cancellation_terms: `• Cancellations 90+ days before departure: Deposit forfeited, balance refunded.
• Cancellations 60–89 days before departure: 25% of total safari cost forfeited.
• Cancellations 30–59 days before departure: 50% of total safari cost forfeited.
• Cancellations 14–29 days before departure: 75% of total safari cost forfeited.
• Cancellations less than 14 days before departure: 100% forfeited. No refund.`,
    amendment_terms: `• Amendments permitted up to 24 hours before trip start date.
• No amendments accepted once travel has commenced.
• Date changes subject to availability and may incur supplier fees.
• Administration fee of $50 applies per amendment request.
• Maximum of 2 amendments permitted per confirmed booking.`,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/[^0-9+\s\-()]/g, '')
    set('phone', cleaned)
    const result = validatePhone(cleaned)
    setPhoneError(result === 'valid' ? null : result)
  }

  const saveAndGo = async (destination) => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        agency_name:           form.agency_name,
        agent_name:            form.agent_name,
        phone:                 form.phone,
        country:               form.country,
        logo_url:              form.logo_url,
        brand_color_primary:   form.brand_color_primary,
        brand_color_secondary: form.brand_color_secondary,
        deposit_percentage:    Number(form.deposit_percentage),
        balance_due_days:      Number(form.balance_due_days),
        markup_type:           form.markup_type,
        markup_overall_pct:    Number(form.markup_overall_pct),
        cancellation_terms:    form.cancellation_terms,
        amendment_terms:       form.amendment_terms,
        subscription_status:   'trial',
      }

      if (agentId) {
        // Agent record exists — update it
        await supabasePatch('agents', { id: `eq.${agentId}` }, payload)
      } else {
        // Agent record missing — create it now
        const { supabaseInsert } = await import('../hooks/useSupabase')
        await supabaseInsert('agents', {
          ...payload,
          clerk_user_id: user?.id || '',
          email: user?.emailAddresses?.[0]?.emailAddress || '',
        })
      }
      navigate(destination)
    } catch (e) {
      console.error('Onboarding save error:', e)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: 620 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 2 }}>
            SafariFlow
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Set up your agency — takes about 3 minutes
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step > s.id ? 13 : 11, fontWeight: 700, flexShrink: 0,
                background: step > s.id ? 'var(--sage)' : step === s.id ? 'var(--gold)' : 'var(--surface)',
                color: step >= s.id ? 'white' : 'var(--text-dim)',
                border: `2px solid ${step === s.id ? 'var(--gold)' : step > s.id ? 'var(--sage)' : 'var(--border)'}`,
                transition: 'all 0.3s',
              }}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 32, height: 2, background: step > s.id ? 'var(--sage)' : 'var(--border)', transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
            {STEPS[step - 1].icon} {STEPS[step - 1].title}
          </h2>
          <div style={{ width: 32, height: 2, background: 'var(--gold)', marginBottom: 16 }} />

          {error && (
            <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'var(--ember)' }}>
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">Agency Name *</label>
                <input className="form-input" placeholder="Savanna Routes Travel" value={form.agency_name} onChange={e => set('agency_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Your Full Name *</label>
                <input className="form-input" placeholder="John Safari" value={form.agent_name} onChange={e => set('agent_name', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+254 722 000 000"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    style={{ borderColor: phoneError ? 'var(--ember)' : form.phone && !phoneError ? 'var(--sage)' : undefined }}
                  />
                  {phoneError && (
                    <div style={{ fontSize: 11, color: 'var(--ember)', marginTop: 4 }}>⚠ {phoneError}</div>
                  )}
                  {form.phone && !phoneError && (
                    <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 4 }}>✓ Valid format</div>
                  )}
                  {!form.phone && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Include country code e.g. +254 for Kenya, +255 for Tanzania</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <CountryPicker value={form.country} onChange={v => set('country', v)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Agency Logo *</label>
                <LogoUploader value={form.logo_url} onChange={v => set('logo_url', v)} />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>These colors appear on all your quote PDFs and client emails.</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.brand_color_primary} onChange={e => set('brand_color_primary', e.target.value)} style={{ width: 42, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                    <input className="form-input" value={form.brand_color_primary} onChange={e => set('brand_color_primary', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Secondary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.brand_color_secondary} onChange={e => set('brand_color_secondary', e.target.value)} style={{ width: 42, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                    <input className="form-input" value={form.brand_color_secondary} onChange={e => set('brand_color_secondary', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  </div>
                </div>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ background: form.brand_color_primary, padding: '12px 16px', color: 'white' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{form.agency_name || 'Your Agency'}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>SAFARI QUOTE PREVIEW</div>
                </div>
                <div style={{ background: form.brand_color_secondary, height: 3 }} />
                <div style={{ background: 'white', padding: '10px 16px', fontSize: 12, color: '#1A1A1A' }}>
                  This is how your quote PDF header will look
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>Applied automatically to every quote you generate.</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Overall Markup (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.markup_overall_pct} onChange={e => set('markup_overall_pct', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Your profit margin per safari</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Deposit Required (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.deposit_percentage} onChange={e => set('deposit_percentage', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>% required to confirm booking</div>
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 220, marginBottom: 12 }}>
                <label className="form-label">Balance Due (days before travel)</label>
                <input className="form-input" type="number" min="0" value={form.balance_due_days} onChange={e => set('balance_due_days', e.target.value)} />
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Example for a $10,000 safari:</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Client pays: ${Math.round(10000 * (1 + Number(form.markup_overall_pct) / 100)).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 3 }}>
                  Deposit: ${Math.round(10000 * (1 + Number(form.markup_overall_pct) / 100) * Number(form.deposit_percentage) / 100).toLocaleString()} · Balance due {form.balance_due_days} days before travel
                </div>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <div className="form-group">
                <label className="form-label">Cancellation Terms</label>
                <textarea className="form-textarea" value={form.cancellation_terms} onChange={e => set('cancellation_terms', e.target.value)} style={{ minHeight: 100, fontSize: 11, lineHeight: 1.6 }} />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>Appears on every quote PDF.</div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amendment Terms</label>
                <textarea className="form-textarea" value={form.amendment_terms} onChange={e => set('amendment_terms', e.target.value)} style={{ minHeight: 100, fontSize: 11, lineHeight: 1.6 }} />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>Appears on invoices after deposit is paid.</div>
              </div>
            </div>
          )}

          {/* Step 5 — Last Step */}
          {step === 5 && (
            <div>
              {/* Description */}
              <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.7, fontWeight: 500 }}>
                You're almost ready! Before generating quotes, upload your:
              </p>
              <div style={{ marginBottom: 20 }}>
                {[
                  { icon: '🏨', label: 'Accommodation Rates', desc: 'Your lodges, camps and hotels with nightly prices' },
                  { icon: '✈️', label: 'Transport Rates',      desc: 'Road vehicles, flights and train routes with pricing' },
                  { icon: '🌿', label: 'Park Fees',            desc: 'KWS, TANAPA and other park entry fees' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download templates */}
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  Step 1 — Download each template
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 14, lineHeight: 1.6 }}>
                  Each Excel file has column headers and an example row to guide you. Fill in your rates and save the file.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { type: 'accommodations', icon: '🏨', label: 'Accommodation Rates' },
                    { type: 'transport',       icon: '✈️', label: 'Transport Rates' },
                    { type: 'park_fees',       icon: '🌿', label: 'Park Fees' },
                  ].map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => window.open(`${API_BASE}/download-template/${type}`, '_blank')}
                      style={{
                        padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                        border: '2px solid var(--gold)', background: 'var(--gold-dim)',
                        fontFamily: 'var(--font-body)', textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--gold)', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Download size={11} /> Download Excel
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 instruction */}
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px 18px', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  Step 2 — Upload your filled templates
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
                  Go to the <strong style={{ color: 'var(--text)' }}>Inventory</strong> page, click <strong style={{ color: 'var(--text)' }}>Upload Excel</strong> on each tab and select your filled file. SafariFlow Agent will use your rates to build accurate quotes instantly.
                </div>
              </div>

              {/* Single action button */}
              <button
                onClick={() => saveAndGo('/inventory')}
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <>📋 Go to Inventory — Upload My Rates</>}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {step > 1 ? (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <ArrowLeft size={12} /> Back
              </button>
            ) : <div />}
            {step < 5 && (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={
                  (step === 1 && !form.agency_name) ||
                  (step === 1 && !!phoneError)
                }
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                Continue <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
          All settings can be updated anytime from your portal.
        </div>
      </div>
    </div>
  )
}
