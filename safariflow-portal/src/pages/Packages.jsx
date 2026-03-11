import { useState } from 'react'
import { Search, Plus, Users, Clock, ChevronRight } from 'lucide-react'
import PackageDetailModal from '../components/PackageDetailModal'

// Direct Unsplash photo IDs - reliable, no API key needed
const PKG_IMAGES = {
  'PKG-001': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80',
  'PKG-002': 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&q=80',
  'PKG-003': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=600&q=80',
  'PKG-004': 'https://images.unsplash.com/photo-1612686635542-2244ed9f8ddc?w=600&q=80',
  'PKG-005': 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=600&q=80',
  'PKG-006': 'https://images.unsplash.com/photo-1521651201144-634f700b36ef?w=600&q=80',
}

const SAMPLE_PACKAGES = [
  {
    id: 'PKG-001', name: 'Masai Mara Classic Safari', category: 'Safari & Wildlife',
    destination: 'Masai Mara', country: 'Kenya', duration: 7,
    base_price: 4200, price_type: 'Per Person', single_supplement: 800,
    peak_price: 5400, low_price: 3200, peak_months: 'July, August, September',
    max_travelers: 8,
    inclusions: 'Return flights NBO, 7 nights tented camp, full board, twice daily game drives, park fees, bush walk',
    exclusions: 'International flights, travel insurance, personal expenses, tips',
    highlights: 'Great Migration, Big Five, hot air balloon option, Maasai village visit, sundowner drives',
    active: true
  },
  {
    id: 'PKG-002', name: 'Serengeti Migration Experience', category: 'Safari & Wildlife',
    destination: 'Serengeti', country: 'Tanzania', duration: 8,
    base_price: 5800, price_type: 'Per Person', single_supplement: 1200,
    peak_price: 7200, low_price: 4400, peak_months: 'July, August, October',
    max_travelers: 6,
    inclusions: 'Return flights DAR, 8 nights luxury tented camp, full board, game drives, Ngorongoro crater day trip, park fees',
    exclusions: 'International flights, travel insurance, balloon safari, tips',
    highlights: 'Wildebeest migration, Ngorongoro crater, Olduvai Gorge, Big Five, hot air balloon option',
    active: true
  },
  {
    id: 'PKG-003', name: 'Rwanda Gorilla Trekking', category: 'Safari & Wildlife',
    destination: 'Volcanoes NP', country: 'Rwanda', duration: 5,
    base_price: 5500, price_type: 'Per Person', single_supplement: 600,
    peak_price: 6200, low_price: 4800, peak_months: 'June, July, August, December',
    max_travelers: 8,
    inclusions: 'Return flights KGL, gorilla trekking permits, 5 nights eco-lodge, full board, golden monkey trekking, Kigali city tour',
    exclusions: 'International flights, travel insurance, personal expenses, tips',
    highlights: 'Mountain gorilla families, golden monkey trek, Kigali Genocide Memorial, volcanic landscapes, Iby Iwacu village',
    active: true
  },
  {
    id: 'PKG-004', name: 'Uganda Gorilla & Chimp Trek', category: 'Safari & Wildlife',
    destination: 'Bwindi & Kibale', country: 'Uganda', duration: 7,
    base_price: 4800, price_type: 'Per Person', single_supplement: 700,
    peak_price: 5800, low_price: 3900, peak_months: 'June, July, August, December',
    max_travelers: 8,
    inclusions: 'Domestic flights, gorilla permits Bwindi, chimp trekking Kibale, 7 nights lodges, full board, Queen Elizabeth game drive',
    exclusions: 'International flights, travel insurance, personal expenses, tips',
    highlights: 'Gorilla trekking, chimpanzee habituation, tree-climbing lions, Kazinga channel boat cruise, Batwa cultural trail',
    active: true
  },
  {
    id: 'PKG-005', name: 'Zanzibar Beach Retreat', category: 'Beach & Romance',
    destination: 'Zanzibar', country: 'Tanzania', duration: 7,
    base_price: 2800, price_type: 'Per Couple', single_supplement: 600,
    peak_price: 3600, low_price: 2200, peak_months: 'December, January, July, August',
    max_travelers: 2,
    inclusions: 'Return flights ZNZ, 7 nights beach resort, breakfast included, spice tour, dhow sunset cruise, Stone Town tour, snorkeling trip',
    exclusions: 'International flights, travel insurance, lunches, dinners, personal expenses',
    highlights: 'White sand beaches, spice island tour, dhow sunset cruise, coral reef snorkeling, Stone Town UNESCO heritage',
    active: true
  },
  {
    id: 'PKG-006', name: 'Kenya & Tanzania Combo', category: 'Safari & Wildlife',
    destination: 'Masai Mara & Serengeti', country: 'Kenya & Tanzania', duration: 10,
    base_price: 7800, price_type: 'Per Person', single_supplement: 1400,
    peak_price: 9600, low_price: 6200, peak_months: 'July, August, September',
    max_travelers: 6,
    inclusions: 'All internal flights, 10 nights luxury camps, full board, game drives both parks, Ngorongoro crater, park fees',
    exclusions: 'International flights, travel insurance, personal expenses, tips, balloon safari',
    highlights: 'Best of two countries, Great Migration both sides, Big Five, Ngorongoro crater, Kilimanjaro views',
    active: true
  },
]

const CATEGORIES = ['All', 'Safari & Wildlife', 'Beach & Romance', 'Luxury & Spa', 'Family Fun', 'Adventure & Hiking']
const fmtPrice = (n) => `$ ${Number(n).toLocaleString()}`

const categoryColors = {
  'Safari & Wildlife': { bg: 'rgba(74,124,89,0.2)', color: '#6AB07A' },
  'Beach & Romance': { bg: 'rgba(74,144,217,0.2)', color: '#4A90D9' },
  'Luxury & Spa': { bg: 'rgba(200,169,110,0.2)', color: '#C8A96E' },
  'Family Fun': { bg: 'rgba(224,92,42,0.2)', color: '#E05C2A' },
  'Adventure & Hiking': { bg: 'rgba(50,180,150,0.2)', color: '#32B496' },
}

function PackageCard({ pkg, onClick }) {
  const imgUrl = PKG_IMAGES[pkg.id]
  const catStyle = categoryColors[pkg.category] || { bg: '#FBF6EE', color: '#C8A96E' }
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onClick(pkg)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#C8A96E' : '#E8E4DE'}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 50px rgba(13,30,53,0.15), 0 4px 12px rgba(200,169,110,0.2)'
          : '0 2px 12px rgba(13,30,53,0.07)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#F0EDE8' }}>
        {!imgError ? (
          <img
            src={imgUrl}
            alt={pkg.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.4s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 48, background: 'linear-gradient(135deg, #F0EDE8, #E8E4DC)'
          }}>🌍</div>
        )}

        {/* Subtle gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,30,53,0.55) 0%, transparent 50%)'
        }} />

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(255,255,255,0.92)',
          color: catStyle.color,
          backdropFilter: 'blur(8px)',
          padding: '4px 11px', borderRadius: 20,
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          border: `1px solid ${catStyle.color}30`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {pkg.category}
        </div>

        {/* Duration badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(13,30,53,0.75)',
          color: '#E8C98E',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid rgba(200,169,110,0.25)',
        }}>
          <Clock size={10} /> {pkg.duration} nights
        </div>

        {/* Location on image */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          color: 'white', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          📍 {pkg.destination}, {pkg.country}
        </div>
      </div>

      {/* Card Content — light background */}
      <div style={{
        padding: '18px 20px', flex: 1,
        display: 'flex', flexDirection: 'column',
        background: '#FFFFFF',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
          color: '#0D1E35', marginBottom: 7, lineHeight: 1.3,
        }}>
          {pkg.name}
        </h3>

        <p style={{
          fontSize: 12.5, color: '#777770', lineHeight: 1.65,
          marginBottom: 16, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {pkg.highlights}
        </p>

        {/* Price + CTA row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 14, borderTop: '1px solid #F0EDE8',
        }}>
          <div>
            <div style={{
              fontSize: 9.5, color: '#AAAAAA', marginBottom: 2,
              letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase',
            }}>
              From · {pkg.price_type}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              fontWeight: 700, color: '#C8A96E', lineHeight: 1,
            }}>
              {fmtPrice(pkg.base_price)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              fontSize: 11, color: '#AAAAAA',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Users size={11} /> max {pkg.max_travelers}
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: hovered ? '#C8A96E' : '#FBF6EE',
              border: `1px solid ${hovered ? '#C8A96E' : '#E8C98E'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: hovered ? '0 4px 12px rgba(200,169,110,0.4)' : 'none',
            }}>
              <ChevronRight size={15} color={hovered ? '#fff' : '#C8A96E'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SAMPLE_PACKAGES, PKG_IMAGES }

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
            <p className="page-subtitle">{filtered.length} packages available · Click any package to quote</p>
          </div>
          <button className="btn btn-primary"><Plus size={15} /> Add Package</button>
        </div>
      </div>

      <div className="page-body">
        {/* Search + Sort row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FFFFFF', border: '1px solid #E8E4DE',
            borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 220,
            boxShadow: '0 1px 4px rgba(13,30,53,0.06)',
          }}>
            <Search size={14} color="#AAAAAA" />
            <input
              placeholder="Search packages, destinations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, color: '#0D1E35', width: '100%',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 10, border: '1px solid #E8E4DE',
              background: '#FFFFFF', fontSize: 13, color: '#0D1E35',
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(13,30,53,0.06)',
            }}
          >
            <option value="name">Sort: Name</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 26, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '7px 18px', borderRadius: 20,
              border: `1px solid ${category === cat ? '#C8A96E' : '#E8E4DE'}`,
              background: category === cat ? '#C8A96E' : '#FFFFFF',
              color: category === cat ? '#FFFFFF' : '#777770',
              fontSize: 12, fontWeight: category === cat ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.2s ease',
              fontFamily: 'var(--font-body)',
              boxShadow: category === cat ? '0 4px 12px rgba(200,169,110,0.3)' : 'none',
            }}>
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No packages found</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
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
          pkgImage={PKG_IMAGES[selected.id]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
