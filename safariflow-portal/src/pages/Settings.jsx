import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Save, CheckCircle, Upload, Palette } from 'lucide-react'
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
  })

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', {
          clerk_user_id: `eq.${user.id}`,
          select: '*'
        })
        if (agents.length) {
          const a = agents[0]
          setAgentId(a.id)
          setSettings({
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
          })
        } else {
          // Pre-fill from Clerk
          setSettings(s => ({
            ...s,
            agent_name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
            email: user?.emailAddresses?.[0]?.emailAddress || '',
          }))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const handleSave = async () => {
    if (!agentId) {
      setError('Agent record not found. Please contact support.')
      return
    }
    setSaving(true)
    setError(null)
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
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your agency profile and quote defaults</p>
      </div>

      <div className="page-body" style={{ maxWidth: 700 }}>
        {saved && (
          <div style={{ background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--sage-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={15} /> Settings saved successfully!
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(224,92,42,0.1)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--ember)' }}>
            {error}
          </div>
        )}

        {/* Agency Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            Agency Details
          </h3>
          <div className="form-group">
            <label className="form-label">Agency Name</label>
            <input className="form-input" value={settings.agency_name} onChange={e => set('agency_name', e.target.value)} placeholder="Savanna Routes Travel" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" value={settings.agent_name} onChange={e => set('agent_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={settings.email} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+254 722 000 000" value={settings.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" placeholder="Kenya" value={settings.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input className="form-input" placeholder="https://youragency.com/logo.png" value={settings.logo_url} onChange={e => set('logo_url', e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              Paste a direct link to your agency logo. This will appear on all quote PDFs and emails.
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={18} color="var(--gold)" /> Brand Colors
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 20 }}>
            These colors appear on all your quote PDFs and client emails.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={settings.brand_color_primary}
                  onChange={e => set('brand_color_primary', e.target.value)}
                  style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                />
                <input
                  className="form-input"
                  value={settings.brand_color_primary}
                  onChange={e => set('brand_color_primary', e.target.value)}
                  placeholder="#2E4A7A"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Secondary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={settings.brand_color_secondary}
                  onChange={e => set('brand_color_secondary', e.target.value)}
                  style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                />
                <input
                  className="form-input"
                  value={settings.brand_color_secondary}
                  onChange={e => set('brand_color_secondary', e.target.value)}
                  placeholder="#C4922A"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{ background: settings.brand_color_primary, padding: '16px 20px', color: 'white' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Your Agency Name</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>SAFARI QUOTE PREVIEW</div>
            </div>
            <div style={{ background: settings.brand_color_secondary, height: 3 }} />
            <div style={{ background: 'white', padding: '12px 20px', fontSize: 13, color: '#1A1A1A' }}>
              Quote header preview with your brand colors
            </div>
          </div>
        </div>

        {/* Quote Defaults */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            Quote Defaults
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Deposit Required (%)</label>
              <input className="form-input" type="number" min="0" max="100"
                value={settings.deposit_percentage} onChange={e => set('deposit_percentage', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Balance Due (days before travel)</label>
              <input className="form-input" type="number" min="0"
                value={settings.balance_due_days} onChange={e => set('balance_due_days', e.target.value)} />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '11px 24px' }} onClick={handleSave} disabled={saving}>
          {saving
            ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--night)' }} />Saving...</>
            : <><Save size={15} />Save Settings</>
          }
        </button>
      </div>
    </div>
  )
}
