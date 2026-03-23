import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Save, CheckCircle, Palette, TrendingUp, FileX, FilePen } from 'lucide-react'
import { supabaseFetch, supabasePatch } from '../hooks/useSupabase'

export default function Settings() {
  const { user } = useUser()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agentId, setAgentId] = useState(null)
  const [error, setError] = useState(null)

  const [settings, setSettings] = useState({
    agency_name: '',
    agent_name: '',
    email: '',
    phone: '',
    country: '',
    logo_url: '',
    brand_color_primary: '#2E4A7A',
    brand_color_secondary: '#C4922A',
    deposit_percentage: 30,
    balance_due_days: 60,
    markup_type: 'overall',
    markup_overall_pct: 20,
    markup_accommodation_pct: 15,
    markup_transport_pct: 10,
    markup_park_fees_pct: 0,
    markup_activities_pct: 25,
    cancellation_terms: `• Cancellations made 90+ days before departure: Deposit forfeited, balance refunded in full.
• Cancellations made 60–89 days before departure: 25% of total safari cost forfeited.
• Cancellations made 30–59 days before departure: 50% of total safari cost forfeited.
• Cancellations made 14–29 days before departure: 75% of total safari cost forfeited.
• Cancellations made less than 14 days before departure: 100% of total safari cost forfeited. No refund.`,
    amendment_terms: `• Amendments are permitted up to 24 hours before the trip start date.
• No amendments will be accepted once travel has commenced.
• Date changes are subject to availability and may incur supplier amendment fees.
• An administration fee of $50 applies per amendment request.
• A maximum of 2 amendments are permitted per confirmed booking.`,
  })

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: '*' })
        if (agents.length) {
          const a = agents[0]
          setAgentId(a.id)
          setSettings(s => ({
            ...s,
            agency_name: a.agency_name || '',
            agent_name: a.agent_name || user?.firstName || '',
            email: a.email || user?.emailAddresses?.[0]?.emailAddress || '',
            phone: a.phone || '',
            country: a.country || '',
            logo_url: a.logo_url || '',
            brand_color_primary: a.brand_color_primary || '#2E4A7A',
            brand_color_secondary: a.brand_color_secondary || '#C4922A',
            deposit_percentage: a.deposit_percentage || 30,
            balance_due_days: a.balance_due_days || 60,
            markup_type: a.markup_type || 'overall',
            markup_overall_pct: a.markup_overall_pct || 20,
            markup_accommodation_pct: a.markup_accommodation_pct || 15,
            markup_transport_pct: a.markup_transport_pct || 10,
            markup_park_fees_pct: a.markup_park_fees_pct || 0,
            markup_activities_pct: a.markup_activities_pct || 25,
            cancellation_terms: a.cancellation_terms || s.cancellation_terms,
            amendment_terms: a.amendment_terms || s.amendment_terms,
          }))
        } else {
          setSettings(s => ({
            ...s,
            agent_name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
            email: user?.emailAddresses?.[0]?.emailAddress || '',
          }))
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user?.id])

  const handleSave = async () => {
    if (!agentId) { setError('Agent record not found.'); return }
    setSaving(true); setError(null)
    try {
      await supabasePatch('agents', { id: `eq.${agentId}` }, {
        agency_name: settings.agency_name,
        agent_name: settings.agent_name,
        phone: settings.phone,
        country: settings.country,
        logo_url: settings.logo_url,
        brand_color_primary: settings.brand_color_primary,
        brand_color_secondary: settings.brand_color_secondary,
        deposit_percentage: Number(settings.deposit_percentage),
        balance_due_days: Number(settings.balance_due_days),
        markup_type: settings.markup_type,
        markup_overall_pct: Number(settings.markup_overall_pct),
        markup_accommodation_pct: Number(settings.markup_accommodation_pct),
        markup_transport_pct: Number(settings.markup_transport_pct),
        markup_park_fees_pct: Number(settings.markup_park_fees_pct),
        markup_activities_pct: Number(settings.markup_activities_pct),
        cancellation_terms: settings.cancellation_terms,
        amendment_terms: settings.amendment_terms,
      })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e) { setError('Failed to save. Please try again.') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your agency profile, pricing markup and quote defaults</p>
      </div>

      <div className="page-body" style={{ maxWidth: 700 }}>
        {saved && <div style={{ background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--sage-light)', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={15} /> Settings saved successfully!</div>}
        {error && <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--ember)' }}>{error}</div>}

        {/* Agency Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>Agency Details</h3>
          <div className="form-group"><label className="form-label">Agency Name</label><input className="form-input" value={settings.agency_name} onChange={e => set('agency_name', e.target.value)} placeholder="Savanna Routes Travel" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" value={settings.agent_name} onChange={e => set('agent_name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={settings.email} disabled style={{ opacity: 0.6 }} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" placeholder="+254 722 000 000" value={settings.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Country</label><input className="form-input" placeholder="Kenya" value={settings.country} onChange={e => set('country', e.target.value)} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input className="form-input" placeholder="https://youragency.com/logo.png" value={settings.logo_url} onChange={e => set('logo_url', e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Direct link to your agency logo. Appears on all quote PDFs and emails.</div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={18} color="var(--gold)" /> Brand Colors
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 20 }}>These colors appear on all your quote PDFs and client emails.</p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="color" value={settings.brand_color_primary} onChange={e => set('brand_color_primary', e.target.value)} style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                <input className="form-input" value={settings.brand_color_primary} onChange={e => set('brand_color_primary', e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Secondary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="color" value={settings.brand_color_secondary} onChange={e => set('brand_color_secondary', e.target.value)} style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                <input className="form-input" value={settings.brand_color_secondary} onChange={e => set('brand_color_secondary', e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
            </div>
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ background: settings.brand_color_primary, padding: '16px 20px', color: 'white' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{settings.agency_name || 'Your Agency Name'}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>SAFARI QUOTE PREVIEW</div>
            </div>
            <div style={{ background: settings.brand_color_secondary, height: 3 }} />
            <div style={{ background: 'white', padding: '12px 20px', fontSize: 13, color: '#1A1A1A' }}>Quote header preview with your brand colors</div>
          </div>
        </div>

        {/* Markup / Profit */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--gold)" /> Markup & Profit
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 20 }}>
            Markup is applied automatically by the AI on all quotes. Clients only see the final price — never your cost breakdown.
          </p>

          {/* Markup type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { key: 'overall', label: 'Overall Markup', desc: 'Single % applied to total safari cost' },
              { key: 'per_category', label: 'Per Category', desc: 'Different % per accommodation, transport etc.' },
            ].map(({ key, label, desc }) => (
              <button key={key} onClick={() => set('markup_type', key)} style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                border: `1px solid ${settings.markup_type === key ? 'var(--gold)' : 'var(--border)'}`,
                background: settings.markup_type === key ? 'var(--gold-dim)' : 'var(--surface)',
                fontFamily: 'var(--font-body)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: settings.markup_type === key ? 'var(--gold)' : 'var(--text)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</div>
              </button>
            ))}
          </div>

          {settings.markup_type === 'overall' ? (
            <div className="form-group" style={{ maxWidth: 200 }}>
              <label className="form-label">Overall Markup (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="form-input" type="number" min="0" max="100" value={settings.markup_overall_pct} onChange={e => set('markup_overall_pct', e.target.value)} />
                <span style={{ fontSize: 13, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>% profit</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Example: $10,000 cost + {settings.markup_overall_pct}% = ${Math.round(10000 * (1 + Number(settings.markup_overall_pct) / 100)).toLocaleString()} client price
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 12 }}>Set markup % per service category:</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Accommodation (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={settings.markup_accommodation_pct} onChange={e => set('markup_accommodation_pct', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={settings.markup_transport_pct} onChange={e => set('markup_transport_pct', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Park Fees (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={settings.markup_park_fees_pct} onChange={e => set('markup_park_fees_pct', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Usually 0% — passed through at cost</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Activities & Extras (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={settings.markup_activities_pct} onChange={e => set('markup_activities_pct', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quote Defaults */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>Quote Defaults</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Deposit Required (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={settings.deposit_percentage} onChange={e => set('deposit_percentage', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Balance Due (days before travel)</label>
              <input className="form-input" type="number" min="0" value={settings.balance_due_days} onChange={e => set('balance_due_days', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Cancellation Terms */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileX size={18} color="var(--gold)" /> Cancellation Terms
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>
            These terms appear on every quote PDF. Enter 4–5 lines outlining your cancellation policy.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              className="form-textarea"
              value={settings.cancellation_terms}
              onChange={e => set('cancellation_terms', e.target.value)}
              style={{ minHeight: 140, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.7 }}
              placeholder="• Cancellations made 90+ days before departure: Deposit forfeited..."
            />
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
              Use • at the start of each line for bullet points on the PDF.
            </div>
          </div>
        </div>

        {/* Amendment Terms */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilePen size={18} color="var(--gold)" /> Amendment Terms
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>
            These terms appear on invoices and booking confirmations after a deposit has been paid. They outline the conditions under which clients may request changes to a confirmed booking.
          </p>
          <div style={{ background: 'rgba(196,146,42,0.08)', border: '1px solid rgba(196,146,42,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text-mid)' }}>
            ⚠ Amendments are not permitted once travel has commenced. This is enforced automatically by SafariFlow.
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              className="form-textarea"
              value={settings.amendment_terms}
              onChange={e => set('amendment_terms', e.target.value)}
              style={{ minHeight: 140, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.7 }}
              placeholder="• Amendments are permitted up to 24 hours before the trip start date..."
            />
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
              Use • at the start of each line for bullet points on the invoice.
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔗 Integrations
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 20 }}>
            Connect SafariFlow to your external platforms to automatically generate quotes from incoming enquiries.
          </p>

          {/* SafariBookings connector */}
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 28 }}>🦁</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>SafariBookings Email Connector</div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Auto-generate AI quotes from SafariBookings enquiries</div>
              </div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 8, padding: '12px 14px', marginBottom: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                How it works:
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
                1. Register this email address with SafariBookings as your notification email<br />
                2. Every new enquiry from SafariBookings triggers an automatic AI quote<br />
                3. You receive the quote for approval within minutes — no manual work
              </div>
            </div>
            <div style={{ background: 'var(--gold-dim)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(196,146,42,0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Your SafariBookings Notification Email:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <code style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', flex: 1 }}>
                  {agentId ? `${agentId.split('-')[0]}@inbound.safariflow.com` : 'Loading...'}
                </code>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => {
                    const email = `${agentId?.split('-')[0]}@inbound.safariflow.com`
                    navigator.clipboard.writeText(email)
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                ⚙ Setup coming soon — this feature is being activated. Contact support to enable early access.
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '11px 24px' }} onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--night)' }} />Saving...</> : <><Save size={15} />Save Settings</>}
        </button>
      </div>
    </div>
  )
}
