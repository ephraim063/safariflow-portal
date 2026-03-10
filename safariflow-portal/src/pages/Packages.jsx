import { useState } from 'react'
import { Search, Plus, Users, Clock, ChevronRight } from 'lucide-react'
import PackageDetailModal from '../components/PackageDetailModal'

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
    image_query: 'masai+mara+safari+kenya',
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
    image_query: 'serengeti+migration+tanzania+wildebeest',
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
    image_query: 'rwanda+gorilla+volcano+forest',
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
    image_query: 'uganda+gorilla+bwindi+forest',
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
    image_query: 'zanzibar+white+sand+beach+ocean',
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
    image_query: 'kenya+tanzania+safari+savanna+elephants',
    active: true
  },
]

const CATEGORIES = ['All', 'Safari & Wildlife', 'Beach & Romance', 'Luxury & Spa', 'Family Fun', 'Adventure & Hiking']

const fmtPrice = (n) => `$ ${Number(n).toLocaleString()}`

const categoryColors = {
  'Safari & Wildlife': { bg: 'rgba(74,124,89,0.15)', color: '#6AB07A' },
  'Beach & Romance': { bg: 'rgba(74,144,217,0.15)', color: '#4A90D9' },
  'Luxury & Spa': { bg: 'rgba(200,169,110,0.15)', color: '#C8A96E' },
  'Family Fun': { bg: 'rgba(224,92,42,0.15)', color: '#E05C2A' },
  'Adventure & Hiking': { bg: 'rgba(50,180,150,0.15)', color: '#32B496' },
}

function PackageCard({ pkg, onClick }) {
  const imgUrl = `https://source.unsplash.com/400x260/?${pkg.image_query}`
  const catStyle = categoryColors[pkg.category] || { bg: 'var(--gold-dim)', color: 'var(--gold)' }

  return (
    <div
      onClick={() => onClick(pkg)}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
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
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img src={imgUrl} alt={pkg.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'var(--surface)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: catStyle.bg, color: catStyle.color,
          backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 600, letterSpacing: 0.5
        }}>
          {pkg.category}
        </div>
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.5)', color: 'white', backdropFilter: 'blur(8px)',
          padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Clock size={10} /> {pkg.duration} nights
        </div>
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          color: 'white', fontSize: 13, fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)'
        }}>
          📍 {pkg.destination}, {pkg.country}
        </div>
      </div>

      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
          color: 'var(--text)', marginBottom: 8, lineHeight: 1.3
        }}>
          {pkg.name}
        </h3>
        <p style={{
          fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 14, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {pkg.highlights}
        </p>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingTop: 12, borderTop: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>FROM · {pkg.price_type}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
              {fmtPrice(pkg.base_price)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={11} /> Max {pkg.max_travelers}
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center'
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
            <p className="page-subtitle">{filtered.length} packages available · Click any package to quote</p>
          </div>
          <button className="btn btn-primary"><Plus size={15} /> Add Package</button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <Search size={14} color="var(--text-dim)" />
            <input placeholder="Search packages, destinations..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 160, padding: '8px 12px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid',
              borderColor: category === cat ? 'var(--gold)' : 'var(--border)',
              background: category === cat ? 'var(--gold-dim)' : 'transparent',
              color: category === cat ? 'var(--gold)' : 'var(--text-mid)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-body)'
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

      {selected && <PackageDetailModal pkg={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
