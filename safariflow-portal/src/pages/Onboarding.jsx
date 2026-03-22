import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, ArrowLeft, Upload } from 'lucide-react'
import { supabasePatch } from '../hooks/useSupabase'

const STEPS = [
  { id: 1, title: 'Agency Details',   icon: '🏢' },
  { id: 2, title: 'Brand Colors',     icon: '🎨' },
  { id: 3, title: 'Pricing Setup',    icon: '💰' },
  { id: 4, title: 'Payment Terms',    icon: '📋' },
  { id: 5, title: 'You\'re Ready!',   icon: '🦁' },
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
    cancellation_terms: `• Cancellations made 90+ days before departure: Deposit forfeited, balance refunded in full.
• Cancellations made 60–89 days before departure: 25% of total safari cost forfeited.
• Cancellations made 30–59 days before departure: 50% of total safari cost forfeited.
• Cancellations made 14–29 days before departure: 75% of total safari cost forfeited.
• Cancellations made less than 14 days before departure: 100% of total safari cost forfeited.`,
    amendment_terms: `• Amendments are permitted up to 24 hours before the trip start date.
• No amendments will be accepted once travel has commenced.
• Date changes are subject to availability and may incur supplier amendment fees.
• An administration fee of $50 applies per amendment request.
• A maximum of 2 amendments are permitted per confirmed booking.`,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleFinish = async () => {
    setSaving(true)
    setError(null)
    try {
      await supabasePatch('agents', { id: `eq.${agentId}` }, {
        agency_name:          form.agency_name,
        agent_name:           form.agent_name,
        phone:                form.phone,
        country:              form.country,
        logo_url:             form.logo_url,
        brand_color_primary:  form.brand_color_primary,
        brand_color_secondary: form.brand_color_secondary,
        deposit_percentage:   Number(form.deposit_percentage),
        balance_due_days:     Number(form.balance_due_days),
        markup_type:          form.markup_type,
        markup_overall_pct:   Number(form.markup_overall_pct),
        cancellation_terms:   form.cancellation_terms,
        amendment_terms:      form.amendment_terms,
        subscription_status:  'trial',
      })
      navigate('/dashboard')
    } catch (e) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>
            SafariFlow
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>
            Let's set up your agency — takes about 3 minutes
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step > s.id ? 16 : 13,
                fontWeight: 700,
                background: step > s.id ? 'var(--sage)' : step === s.id ? 'var(--gold)' : 'var(--surface)',
                color: step >= s.id ? 'white' : 'var(--text-dim)',
                border: `2px solid ${step === s.id ? 'var(--gold)' : step > s.id ? 'var(--sage)' : 'var(--border)'}`,
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 40, height: 2,
                  background: step > s.id ? 'var(--sage)' : 'var(--border)',
                  transition: 'all 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            {STEPS[step - 1].icon} {STEPS[step - 1].title}
          </h2>
          <div style={{ width: 40, height: 2, background: 'var(--gold)', marginBottom: 24 }} />

          {error && (
            <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--ember)' }}>
              {error}
            </div>
          )}

          {/* Step 1 — Agency Details */}
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
              <div className="form-group">
                <label className="form-label">Agency Logo URL</label>
                <input className="form-input" placeholder="https://youragency.com/logo.png" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Direct link to your logo — appears on all quote PDFs. You can add this later.</div>
              </div>
            </div>
          )}

          {/* Step 2 — Brand Colors */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>These colors appear on all your quote PDFs and client emails.</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.brand_color_primary} onChange={e => set('brand_color_primary', e.target.value)} style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                    <input className="form-input" value={form.brand_color_primary} onChange={e => set('brand_color_primary', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Secondary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.brand_color_secondary} onChange={e => set('brand_color_secondary', e.target.value)} style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                    <input className="form-input" value={form.brand_color_secondary} onChange={e => set('brand_color_secondary', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 8 }}>
                <div style={{ background: form.brand_color_primary, padding: '16px 20px', color: 'white' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{form.agency_name || 'Your Agency'}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>SAFARI QUOTE PREVIEW</div>
                </div>
                <div style={{ background: form.brand_color_secondary, height: 3 }} />
                <div style={{ background: 'white', padding: '12px 20px', fontSize: 13, color: '#1A1A1A' }}>
                  Quote header preview — this is how your PDF will look
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Pricing Setup */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>
                Set your default markup and payment terms. These are applied automatically to every quote.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Overall Markup (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.markup_overall_pct} onChange={e => set('markup_overall_pct', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    Your profit margin on each safari
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Deposit Required (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.deposit_percentage} onChange={e => set('deposit_percentage', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    % of total required to confirm booking
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 220 }}>
                <label className="form-label">Balance Due (days before travel)</label>
                <input className="form-input" type="number" min="0" value={form.balance_due_days} onChange={e => set('balance_due_days', e.target.value)} />
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)', marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Example for a $10,000 safari:</div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                  Client pays: ${Math.round(10000 * (1 + Number(form.markup_overall_pct) / 100)).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>
                  Deposit: ${Math.round(10000 * (1 + Number(form.markup_overall_pct) / 100) * Number(form.deposit_percentage) / 100).toLocaleString()} · Balance due {form.balance_due_days} days before travel
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Payment Terms */}
          {step === 4 && (
            <div>
              <div className="form-group">
                <label className="form-label">Cancellation Terms</label>
                <textarea
                  className="form-textarea"
                  value={form.cancellation_terms}
                  onChange={e => set('cancellation_terms', e.target.value)}
                  style={{ minHeight: 120, fontSize: 12, lineHeight: 1.7 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Appears on every quote PDF. Use • for bullet points.</div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amendment Terms</label>
                <textarea
                  className="form-textarea"
                  value={form.amendment_terms}
                  onChange={e => set('amendment_terms', e.target.value)}
                  style={{ minHeight: 120, fontSize: 12, lineHeight: 1.7 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Appears on invoices after deposit is paid. Use • for bullet points.</div>
              </div>
            </div>
          )}

          {/* Step 5 — Ready */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🦁</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)', marginBottom: 12 }}>
                You're all set, {form.agent_name.split(' ')[0]}!
              </h3>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Your SafariFlow account is configured and ready. You can now generate AI-powered safari quotes in minutes.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: '📋', label: 'Add your inventory' },
                  { icon: '✨', label: 'Generate a quote' },
                  { icon: '📧', label: 'Send to client' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px 10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            {step > 1 ? (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.agency_name}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleFinish}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {saving ? 'Setting up...' : <><CheckCircle size={14} /> Go to Dashboard</>}
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-dim)' }}>
          You can update all of these settings anytime from your portal.
        </div>
      </div>
    </div>
  )
}
