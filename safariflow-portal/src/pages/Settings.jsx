import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Save, CheckCircle } from 'lucide-react'

export default function Settings() {
  const { user } = useUser()
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    agency_name: 'SafariFlow',
    agent_name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    agent_email: user?.emailAddresses?.[0]?.emailAddress || '',
    agent_phone: '',
    currency: 'ZAR',
    currency_symbol: 'R',
    quote_validity: '14',
    deposit_percent: '50',
    api_url: import.meta.env.VITE_API_URL || '',
  })

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const handleSave = () => {
    // In production: save to backend/localStorage
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your agency and quote defaults</p>
      </div>

      <div className="page-body" style={{ maxWidth: 700 }}>
        {saved && (
          <div style={{
            background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: 'var(--sage-light)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <CheckCircle size={15} />
            Settings saved successfully!
          </div>
        )}

        {/* Agency */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
          }}>
            Agency Details
          </h3>
          <div className="form-group">
            <label className="form-label">Agency Name</label>
            <input className="form-input" value={settings.agency_name}
              onChange={e => set('agency_name', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" value={settings.agent_name}
                onChange={e => set('agent_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Your Email</label>
              <input className="form-input" value={settings.agent_email}
                onChange={e => set('agent_email', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" placeholder="+27 XX XXX XXXX"
              value={settings.agent_phone} onChange={e => set('agent_phone', e.target.value)} />
          </div>
        </div>

        {/* Quote Defaults */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
          }}>
            Quote Defaults
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={settings.currency}
                onChange={e => set('currency', e.target.value)}>
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="KES">KES - Kenyan Shilling</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input className="form-input" value={settings.currency_symbol}
                onChange={e => set('currency_symbol', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quote Valid For (days)</label>
              <input className="form-input" type="number"
                value={settings.quote_validity} onChange={e => set('quote_validity', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Deposit Required (%)</label>
              <input className="form-input" type="number"
                value={settings.deposit_percent} onChange={e => set('deposit_percent', e.target.value)} />
            </div>
          </div>
        </div>

        {/* API Config */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)'
          }}>
            API Configuration
          </h3>
          <div className="form-group">
            <label className="form-label">Flask API URL</label>
            <input className="form-input" value={settings.api_url}
              onChange={e => set('api_url', e.target.value)} />
          </div>
          <div style={{
            background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.2)',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--gold)'
          }}>
            💡 API Key is stored as an environment variable on Netlify for security.
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '11px 24px' }} onClick={handleSave}>
          <Save size={15} />
          Save Settings
        </button>
      </div>
    </div>
  )
}
