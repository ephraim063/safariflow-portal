import { useState, useEffect } from 'react'
import { Search, Filter, Plus, Star, Users, Clock, ChevronRight } from 'lucide-react'
import PackageDetailModal from '../components/PackageDetailModal'

const UNSPLASH_ACCESS_KEY = 'demo' // Uses Unsplash source for free photos

// Sample packages matching Google Sheets structure
const SAMPLE_PACKAGES = [
  {
    id: 'PKG-001', name: 'Bali Honeymoon Escape', category: 'Beach & Romance',
    destination: 'Bali', country: 'Indonesia', duration: 7,
    base_price: 45000, price_type: 'Per Couple', single_supplement: 12000,
    peak_price: 54000, low_price: 40500, peak_months: 'December, January',
    max_travelers: 2,
    inclusions: 'Return flights, 7 nights accommodation, daily breakfast, airport transfers, couples spa treatment',
    exclusions: 'Travel insurance, visa fees, personal expenses',
    highlights: 'Sunset dinner, rice terrace walk, temple tour',
    image_query: 'bali+rice+terraces',
    active: true
  },
  {
    id: 'PKG-002', name: 'Maldives Luxury Retreat', category: 'Luxury & Spa',
    destination: 'Maldives', country: 'Maldives', duration: 7,
    base_price: 125000, price_type: 'Per Couple', single_supplement: 35000,
    peak_price: 145000, low_price: 110000, peak_months: 'December, January, July',
    max_travelers: 2,
    inclusions: 'Return flights, overwater villa 7 nights, full board, seaplane transfer, snorkeling gear, sunset cruise',
    exclusions: 'Travel insurance, visa fees, personal expenses, alcohol',
    highlights: 'Overwater villa, house reef snorkeling, dolphin cruise, stargazing deck',
    image_query: 'maldives+overwater+bungalow',
    active: true
  },
  {
    id: 'PKG-003', name: 'Kenya Safari Adventure', category: 'Safari & Wildlife',
    destination: 'Masai Mara', country: 'Kenya', duration: 8,
    base_price: 78000, price_type: 'Per Person', single_supplement: 15000,
    peak_price: 92000, low_price: 68000, peak_months: 'July, August, September',
    max_travelers: 8,
    inclusions: 'Return flights, 8 nights lodge, all meals, game drives, park fees, bush walk',
    exclusions: 'Travel insurance, personal expenses, tips, souvenirs',
    highlights: 'Big Five sightings, hot air balloon option, Maasai village visit, sundowner drives',
    image_query: 'kenya+safari+masai+mara',
    active: true
  },
  {
    id: 'PKG-004', name: 'Dubai Family Spectacular', category: 'Family Fun',
    destination: 'Dubai', country: 'UAE', duration: 6,
    base_price: 85000, price_type: 'Per Family', single_supplement: 0,
    peak_price: 98000, low_price: 72000, peak_months: 'December, January',
    max_travelers: 6,
    inclusions: 'Return flights for 4, 6 nights hotel, daily breakfast, desert safari, Burj Khalifa tickets, dhow cruise',
    exclusions: 'Travel insurance, lunches, dinners, personal expenses',
    highlights: 'Burj Khalifa at sunset, desert dune bashing, Dubai Mall, Palm Jumeirah',
    image_query: 'dubai+burj+khalifa+skyline',
    active: true
  },
  {
    id: 'PKG-005', name: 'Santorini Romance Escape', category: 'Beach & Romance',
    destination: 'Santorini', country: 'Greece', duration: 7,
    base_price: 98000, price_type: 'Per Couple', single_supplement: 28000,
    peak_price: 118000, low_price: 85000, peak_months: 'June, July, August',
    max_travelers: 2,
    inclusions: 'Return flights, cave suite 7 nights, daily breakfast, sunset wine tour, private transfers',
    exclusions: 'Travel insurance, visa fees, lunches, personal expenses',
    highlights: 'Oia sunset views, volcano hike, wine tasting, black sand beaches',
    image_query: 'santorini+white+blue+dome',
    active: true
  },
  {
    id: 'PKG-006', name: 'Zanzibar Beach Escape', category: 'Beach & Romance',
    destination: 'Zanzibar', country: 'Tanzania', duration: 5,
    base_price: 32000, price_type: 'Per Person', single_supplement: 8000,
    peak_price: 38000, low_price: 28000, peak_months: 'December, January, July, August',
    max_travelers: 10,
    inclusions: 'Return flights, 5 nights beach resort, daily breakfast, spice tour, snorkeling trip, Stone Town tour',
    exclusions: 'Travel insurance, personal expenses, tips',
    highlights: 'Pristine white beaches, spice island tour, dhow sunset cruise, coral reef snorkeling',
    image_query: 'zanzibar+beach+ocean',
    active: true
  },
]

const CATEGORIES = ['All', 'Beach & Romance', 'Safari & Wildlife', 'Luxury & Spa', 'Family Fun', 'City & Culture', 'Adventure & Hiking']

const fmtPrice = (n) => `R ${Number(n).toLocaleString()}`

const categoryColors = {
  'Beach & Romance': { bg: 'rgba(74,144,217,0.15)', color: '#4A90D9' },
  'Safari & Wildlife': { bg: 'rgba(74,124,89,0.15)', color: '#6AB07A' },
  'Luxury & Spa': { bg: 'rgba(200,169,110,0.15)', color: '#C8A96E' },
  'Family Fun': { bg: 'rgba(224,92,42,0.15)', color: '#E05C2A' },
  'City & Culture': { bg: 'rgba(160,100,200,0.15)', color: '#A064C8' },
  'Adventure & Hiking': { bg: 'rgba(50,180,150,0.15)', color: '#32B496' },
}

function PackageCard({ pkg, onClick }) {
  const imgUrl = `https://source.unsplash.com/400x260/?${pkg.image_query}`
  const catStyle = categoryColors[pkg.category] || { bg: 'var(--gold-dim)', color: 'var(--gold)' }

  return (
    <div
      onClick={() => onClick(pkg)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={imgUrl}
          alt={pkg.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.parentElement.style.background = 'var(--surface)'
          }}
        />
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
        }} />
        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: catStyle.bg, color: catStyle.color,
          backdropFilter: 'blur(8px)',
          padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 600, letterSpacing: 0.5
        }}>
          {pkg.category}
        </div>
        {/* Duration badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.5)', color: 'white',
          backdropFilter: 'blur(8px)',
          padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Clock size={10} /> {pkg.duration} nights
        </div>
        {/* Destination on image */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          color: 'white', fontSize: 13, fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)'
        }}>
          📍 {pkg.destination}, {pkg.country}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
          color: 'var(--text)', marginBottom: 8, lineHeight: 1.3
        }}>
          {pkg.name}
        </h3>

        {/* Highlights */}
        <p style={{
          fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5,
          marginBottom: 14, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {pkg.highlights}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: 12, borderTop: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>
              FROM · {pkg.price_type}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              fontWeight: 700, color: 'var(--gold)', lineHeight: 1
            }}>
              {fmtPrice(pkg.base_price)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={11} /> Max {pkg.max_travelers}
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--gold-dim)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <ChevronRight size={14} color="var(--gold)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Packages() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('name')

  const filtered = SAMPLE_PACKAGES
    .filter(p => p.active)
    .filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.destination.toLowerCase().includes(search.toLowerCase()) ||
        p.country.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'All' || p.category === category
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.base_price - b.base_price
      if (sortBy === 'price_desc') return b.base_price - a.base_price
      if (sortBy === 'duration') return a.duration - b.duration
      return a.name.localeCompare(b.name)
    })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Package Catalogue</h1>
            <p className="page-subtitle">
              {filtered.length} packages available · Click any package to quote
            </p>
          </div>
          <button className="btn btn-primary">
            <Plus size={15} /> Add Package
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <Search size={14} color="var(--text-dim)" />
            <input
              placeholder="Search packages, destinations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 160, padding: '8px 12px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: '1px solid',
                borderColor: category === cat ? 'var(--gold)' : 'var(--border)',
                background: category === cat ? 'var(--gold-dim)' : 'transparent',
                color: category === cat ? 'var(--gold)' : 'var(--text-mid)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-body)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Package Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No packages found</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20
          }}>
            {filtered.map((pkg, i) => (
              <div key={pkg.id} style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}>
                <PackageCard pkg={pkg} onClick={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PackageDetailModal
          pkg={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
