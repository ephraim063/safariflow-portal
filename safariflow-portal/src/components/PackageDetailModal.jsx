import { useState } from 'react'
import { X, Clock, Users, CheckCircle, XCircle, Zap, ChevronRight } from 'lucide-react'
import QuickQuoteModal from './QuickQuoteModal'

const fmtPrice = (n) => `R ${Number(n).toLocaleString()}`

const categoryColors = {
  'Beach & Romance': { bg: 'rgba(74,144,217,0.15)', color: '#4A90D9' },
  'Safari & Wildlife': { bg: 'rgba(74,124,89,0.15)', color: '#6AB07A' },
  'Luxury & Spa': { bg: 'rgba(200,169,110,0.15)', color: '#C8A96E' },
  'Family Fun': { bg: 'rgba(224,92,42,0.15)', color: '#E05C2A' },
  'City & Culture': { bg: 'rgba(160,100,200,0.15)', color: '#A064C8' },
  'Adventure & Hiking': { bg: 'rgba(50,180,150,0.15)', color: '#32B496' },
}

export default function PackageDetailModal({ pkg, pkgImage, onClose }) {
  const [showQuickQuote, setShowQuickQuote] = useState(false)
  const catStyle = categoryColors[pkg.category] || { bg: 'var(--gold-dim)', color: 'var(--gold)' }
  const imgUrl = pkgImage || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80'

  const inclusions = pkg.inclusions.split(',').map(s => s.trim())
  const exclusions = pkg.exclusions.split(',').map(s => s.trim())
  const highlights = pkg.highlights.split(',').map(s => s.trim())

  if (showQuickQuote) {
    return (
      <QuickQuoteModal
        pkg={pkg}
        onClose={onClose}
        onBack={() => setShowQuickQuote(false)}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>

        {/* Hero Image */}
        <div style={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
          <img
            src={imgUrl}
            alt={pkg.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentElement.style.background = 'var(--surface)'
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)'
          }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'white',
              backdropFilter: 'blur(4px)'
            }}
          >
            <X size={16} />
          </button>
          <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
            <div style={{
              ...catStyle, padding: '3px 10px', borderRadius: 20,
              fontSize: 10, fontWeight: 600, display: 'inline-block', marginBottom: 6
            }}>
              {pkg.category}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
              color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              {pkg.name}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              📍 {pkg.destination}, {pkg.country}
            </div>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '24px 28px' }}>

          {/* Quick Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12, marginBottom: 24
          }}>
            {[
              { label: 'Duration', value: `${pkg.duration} nights`, icon: Clock },
              { label: 'Price Type', value: pkg.price_type, icon: Users },
              { label: 'Max Group', value: `${pkg.max_travelers} pax`, icon: Users },
              { label: 'Peak Season', value: pkg.peak_months.split(',')[0], icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{
                background: 'var(--surface)', borderRadius: 10,
                padding: '12px 14px', border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
              Highlights
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {highlights.map((h, i) => (
                <span key={i} style={{
                  background: 'var(--gold-dim)', color: 'var(--gold)',
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 500
                }}>
                  ✦ {h}
                </span>
              ))}
            </div>
          </div>

          {/* Inclusions / Exclusions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'rgba(74,124,89,0.08)', borderRadius: 10, padding: 16, border: '1px solid rgba(74,124,89,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--sage-light)', marginBottom: 10 }}>
                ✅ Included
              </div>
              {inclusions.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                  <CheckCircle size={12} color="var(--sage-light)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(224,92,42,0.08)', borderRadius: 10, padding: 16, border: '1px solid rgba(224,92,42,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ember)', marginBottom: 10 }}>
                ❌ Excluded
              </div>
              {exclusions.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                  <XCircle size={12} color="var(--ember)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div style={{
            background: 'var(--surface)', borderRadius: 10,
            padding: '16px 20px', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: 28 }}>
              {[
                { label: 'Base Price', value: fmtPrice(pkg.base_price), color: 'var(--gold)' },
                { label: 'Peak Season', value: fmtPrice(pkg.peak_price), color: 'var(--ember)' },
                { label: 'Low Season', value: fmtPrice(pkg.low_price), color: 'var(--sage-light)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
              {pkg.price_type}<br />
              {pkg.single_supplement > 0 && <span>Single supp: {fmtPrice(pkg.single_supplement)}</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: 14 }}
            onClick={() => setShowQuickQuote(true)}
          >
            <Zap size={15} />
            Quick Quote This Package
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
