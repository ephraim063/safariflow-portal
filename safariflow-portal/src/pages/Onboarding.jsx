import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, ArrowLeft, Download } from 'lucide-react'
import { supabasePatch } from '../hooks/useSupabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://web-production-4788f.up.railway.app'

const STEPS = [
  { id: 1, title: 'Agency Details', icon: '🏢' },
  { id: 2, title: 'Brand Colors',   icon: '🎨' },
  { id: 3, title: 'Pricing Setup',  icon: '💰' },
  { id: 4, title: 'Payment Terms',  icon: '📋' },
  { id: 5, title: 'Last Step!',     icon: '🦁' },
]

const WORKFLOW = [
  { icon: '📋', label: 'Add Inventory',      color: '#2E4A7A' },
  { icon: '✨', label: 'AI Quote Generated', color: '#3A6B4A' },
  { icon: '📧', label: 'Send to Client',     color: '#C4922A' },
  { icon: '✅', label: 'Client Accepts',     color: '#3A6B4A' },
  { icon: '🧾', label: 'Invoice Generated',  color: '#2E4A7A' },
  { icon: '💳', label: 'Payment Confirmed',  color: '#C4922A' },
  { icon: '🎫', label: 'Vouchers Generated', color: '#3A6B4A' },
]

export default function Onboarding({ agentId }) {
  const { user } = useUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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

  const saveAndGo = async (destination) => {
    setSaving(true)
    setError(null)
    try {
      await supabasePatch('agents', { id: `eq.${agentId}` }, {
        agency_name:            form.agency_name,
        agent_name:             form.agent_name,
        phone:                  form.phone,
        country:                form.country,
        logo_url:               form.logo_url,
        brand_color_primary:    form.brand_color_primary,
        brand_color_secondary:  form.brand_color_secondary,
        deposit_percentage:     Number(form.deposit_percentage),
        balance_due_days:       Number(form.balance_due_days),
        markup_type:            form.markup_type,
        markup_overall_pct:     Number(form.markup_overall_pct),
        cancellation_terms:     form.cancellation_terms,
        amendment_terms:        form.amendment_terms,
        subscription_status:    'trial',
      })
      navigate(destination)
    } catch (e) {
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
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="tel" placeholder="+254 722 000 000" value={form.phone} onChange={e => set('phone', e.target.value.replace(/[^0-9+\s\-()]/g, ''))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" placeholder="Kenya" value={form.country} onChange={e => set('country', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Agency Logo URL</label>
                <input className="form-input" placeholder="https://youragency.com/logo.png" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Direct link to your logo. You can add this later in Settings.</div>
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
              <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 14, lineHeight: 1.6 }}>
                You're almost ready! Upload your safari inventory — your{' '}
                <strong style={{ color: 'var(--text)' }}>accommodations</strong>,{' '}
                <strong style={{ color: 'var(--text)' }}>transport routes</strong> and{' '}
                <strong style={{ color: 'var(--text)' }}>park fees</strong>.
                Once uploaded, SafariFlow AI will use your data to generate complete itineraries and quotes in minutes.
              </p>

              {/* Workflow diagram */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  Your complete SafariFlow workflow:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                  {WORKFLOW.map((w, i) => (
                    <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{
                        background: `${w.color}12`,
                        border: `1px solid ${w.color}35`,
                        borderRadius: 6, padding: '4px 8px',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ fontSize: 12 }}>{w.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: w.color, whiteSpace: 'nowrap' }}>{w.label}</span>
                      </div>
                      {i < WORKFLOW.length - 1 && (
                        <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 700 }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Download templates */}
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                  Step 1 — Download & fill your inventory templates:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { type: 'accommodations', icon: '🏨', label: 'Accommodations' },
                    { type: 'transport',       icon: '✈️', label: 'Transport' },
                    { type: 'park_fees',       icon: '🌿', label: 'Park Fees' },
                  ].map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => window.open(`${API_BASE}/download-template/${type}`, '_blank')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid var(--gold)', background: 'var(--gold-dim)',
                        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                        color: 'var(--gold)', transition: 'all 0.2s',
                      }}
                    >
                      <span>{icon}</span>
                      <Download size={11} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8 }}>
                  Each template has column headers and example rows. Fill in your data and upload from the Inventory page.
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { icon: '📋', label: 'Add Inventory',   sub: 'Start here ←',  dest: '/inventory', primary: true },
                  { icon: '✨', label: 'New Quote',       sub: 'Skip for now',  dest: '/quotes/new', primary: false },
                  { icon: '⚙️', label: 'Dashboard',       sub: 'Explore first', dest: '/dashboard',  primary: false },
                ].map(({ icon, label, sub, dest, primary }) => (
                  <button
                    key={dest}
                    onClick={() => saveAndGo(dest)}
                    disabled={saving}
                    style={{
                      background: primary ? 'var(--gold-dim)' : 'var(--surface)',
                      borderRadius: 10, padding: '10px 6px',
                      border: `2px solid ${primary ? 'var(--gold)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: 'var(--font-body)', textAlign: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = primary ? 'var(--gold)' : 'var(--border)'}
                  >
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: primary ? 'var(--gold)' : 'var(--text)', marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sub}</div>
                  </button>
                ))}
              </div>
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
                disabled={step === 1 && !form.agency_name}
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
