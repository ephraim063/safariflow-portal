import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Plus, Trash2, Edit2, Save, X, Building2, Plane, TreePine, Upload, Download, AlertCircle } from 'lucide-react'
import { supabaseFetch, supabaseInsert, supabasePatch } from '../hooks/useSupabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function supabaseDelete(table, match) {
  const query = new URLSearchParams(match).toString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  })
  if (!res.ok) throw new Error(`Delete error: ${res.status}`)
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',').map(v => v.trim())
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']))
  })
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
      borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
      background: active ? 'var(--gold-dim)' : 'var(--surface)',
      color: active ? 'var(--gold)' : 'var(--text-mid)',
    }}>
      <Icon size={15} /> {label}
      {count !== undefined && <span style={{ background: active ? 'var(--gold)' : 'var(--border)', color: active ? 'white' : 'var(--text-mid)', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{count}</span>}
    </button>
  )
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--ember)' }}>Delete?</span>
      <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11, color: 'var(--ember)' }} onClick={onConfirm}>Yes</button>
      <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={onCancel}>No</button>
    </div>
  )
}

function CSVSection({ onUpload, templatePath, templateName, importing, result }) {
  const ref = useRef()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <a href={templatePath} download={templateName} style={{ textDecoration: 'none' }}>
        <button className="btn btn-ghost" style={{ fontSize: 12 }}><Download size={13} /> Download Template</button>
      </a>
      <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => ref.current.click()} disabled={importing}>
        {importing ? <><span className="spinner" style={{ width: 12, height: 12 }} />Importing...</> : <><Upload size={13} /> Upload CSV</>}
      </button>
      <input ref={ref} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = '' }} />
      {result && <span style={{ fontSize: 12, color: result.error ? 'var(--ember)' : 'var(--sage-light)' }}>{result.error ? '✕ ' : '✓ '}{result.message}</span>}
    </div>
  )
}

function PricingBox({ children }) {
  return <div style={{ background: 'var(--gold-dim)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 12 }}>💰 PRICING</div>{children}</div>
}

function AgeRange({ minVal, maxVal, onMinChange, onMaxChange, label = 'Child Age Range' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="form-input" type="number" placeholder="2" value={minVal} onChange={e => onMinChange(e.target.value)} style={{ width: 70 }} />
        <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>to</span>
        <input className="form-input" type="number" placeholder="12" value={maxVal} onChange={e => onMaxChange(e.target.value)} style={{ width: 70 }} />
        <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>yrs</span>
      </div>
    </div>
  )
}

const fmtUSD = (cents) => cents ? `$${(cents / 100).toLocaleString()}` : '—'
const MEAL_PLANS = ['Room Only', 'Bed & Breakfast', 'Half Board', 'Full Board', 'All Inclusive']
const TRANSPORT_LABELS = { fly: '✈️ Local Flight', road: '🚙 Land Cruiser 4x4 / Van', boat: '⛵ Boat', train: '🚂 SGR Train' }
const VEHICLE_TYPES = ['Cessna', 'Caravan', 'Helicopter', 'Land Cruiser 4x4', 'Van/Minibus', 'SGR Train', 'Speed Boat', 'Dhow']
const VISITOR_LABELS = { citizen: '🇰🇪 Local (Citizen)', resident: '🌍 East African (Resident)', non_resident: '✈️ Foreign (Non-Resident)' }

// ─── Properties ───────────────────────────────────────────────────────────────
function PropertiesTab({ agentId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const empty = { name: '', destination: '', country: 'Kenya', category: 'luxury', star_rating: 4, room_type: 'Standard Room', meal_plan: 'Full Board', season_type: 'high', price_per_person_usd_cents: '', child_price_per_person_usd_cents: '', child_age_min: 2, child_age_max: 12, single_supplement_usd_cents: '', min_nights: 1, highlights: '', contact_email: '', contact_phone: '', is_active: true }
  const [form, setForm] = useState(empty)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try { const data = await supabaseFetch('accommodations', { agent_id: `eq.${agentId}`, select: '*', order: 'name.asc' }); setItems(data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { if (agentId) load() }, [agentId])

  const toPayload = (f) => ({ ...f, agent_id: agentId, price_per_person_usd_cents: Math.round(Number(f.price_per_person_usd_cents) * 100), child_price_per_person_usd_cents: f.child_price_per_person_usd_cents ? Math.round(Number(f.child_price_per_person_usd_cents) * 100) : null, single_supplement_usd_cents: f.single_supplement_usd_cents ? Math.round(Number(f.single_supplement_usd_cents) * 100) : 0, child_age_min: Number(f.child_age_min) || 2, child_age_max: Number(f.child_age_max) || 12, star_rating: Number(f.star_rating), min_nights: Number(f.min_nights) })

  const handleSave = async () => {
    if (!form.name || !form.destination || !form.price_per_person_usd_cents) return alert('Please fill property name, destination and price.')
    setSaving(true)
    try { if (editId) await supabasePatch('accommodations', { id: `eq.${editId}` }, toPayload(form)); else await supabaseInsert('accommodations', toPayload(form)); setShowForm(false); setEditId(null); setForm(empty); await load() }
    catch (e) { alert('Save failed: ' + e.message) } finally { setSaving(false) }
  }

  const handleEdit = (item) => { setForm({ ...item, price_per_person_usd_cents: item.price_per_person_usd_cents / 100, child_price_per_person_usd_cents: item.child_price_per_person_usd_cents ? item.child_price_per_person_usd_cents / 100 : '', single_supplement_usd_cents: item.single_supplement_usd_cents ? item.single_supplement_usd_cents / 100 : '' }); setEditId(item.id); setShowForm(true) }
  const handleDelete = async (id) => { try { await supabaseDelete('accommodations', { id: `eq.${id}` }); setConfirmDelete(null); await load() } catch (e) { alert('Delete failed') } }

  const handleCSV = async (file) => {
    setImporting(true); setImportResult(null)
    try {
      const rows = parseCSV(await file.text()); let count = 0
      for (const r of rows) {
        if (!r.name || !r.destination) continue
        await supabaseInsert('accommodations', { agent_id: agentId, name: r.name, destination: r.destination, country: r.country || 'Kenya', category: r.category || 'luxury', star_rating: Number(r.star_rating) || 4, room_type: r.room_type || 'Standard Room', meal_plan: r.meal_plan || 'Full Board', season_type: r.season_type || 'high', price_per_person_usd_cents: Math.round(Number(r.price_per_person_usd) * 100), child_price_per_person_usd_cents: r.child_price_per_person_usd ? Math.round(Number(r.child_price_per_person_usd) * 100) : null, child_age_min: Number(r.child_age_min) || 2, child_age_max: Number(r.child_age_max) || 12, single_supplement_usd_cents: r.single_supplement_usd ? Math.round(Number(r.single_supplement_usd) * 100) : 0, min_nights: Number(r.min_nights) || 1, highlights: r.highlights || '', contact_email: r.contact_email || '', contact_phone: r.contact_phone || '', is_active: r.is_active !== 'false' }); count++
      }
      setImportResult({ message: `${count} properties imported` }); await load()
    } catch (e) { setImportResult({ error: true, message: 'Import failed: ' + e.message }) } finally { setImporting(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <CSVSection onUpload={handleCSV} templatePath="/templates/properties_template.csv" templateName="properties_template.csv" importing={importing} result={importResult} />
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }}><Plus size={14} /> Add Property</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid var(--gold)', background: 'rgba(200,169,110,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{editId ? 'Edit' : 'Add'} Property</h4>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => { setShowForm(false); setEditId(null) }}><X size={14} /></button>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Property Name *</label><input className="form-input" placeholder="Angama Mara" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Destination *</label><input className="form-input" placeholder="Masai Mara" value={form.destination} onChange={e => set('destination', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Country</label><input className="form-input" placeholder="Kenya" value={form.country} onChange={e => set('country', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Star Rating</label><select className="form-select" value={form.star_rating} onChange={e => set('star_rating', e.target.value)}>{[1,2,3,4,5].map(s=><option key={s} value={s}>{s} Star{s>1?'s':''}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>{['budget','mid','luxury'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Room Type</label><input className="form-input" placeholder="Tented Suite" value={form.room_type} onChange={e => set('room_type', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Meal Plan</label><select className="form-select" value={form.meal_plan} onChange={e => set('meal_plan', e.target.value)}>{MEAL_PLANS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Season</label><select className="form-select" value={form.season_type} onChange={e => set('season_type', e.target.value)}><option value="high">High Season</option><option value="low">Low Season</option><option value="peak">Peak Season</option><option value="shoulder">Shoulder Season</option></select></div>
          </div>
          <PricingBox>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Adult Price/Person (USD) *</label><input className="form-input" type="number" placeholder="1950" value={form.price_per_person_usd_cents} onChange={e => set('price_per_person_usd_cents', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Single Supplement (USD)</label><input className="form-input" type="number" placeholder="500" value={form.single_supplement_usd_cents} onChange={e => set('single_supplement_usd_cents', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Child Price/Person (USD)</label><input className="form-input" type="number" placeholder="975" value={form.child_price_per_person_usd_cents} onChange={e => set('child_price_per_person_usd_cents', e.target.value)} /></div>
              <AgeRange minVal={form.child_age_min} maxVal={form.child_age_max} onMinChange={v => set('child_age_min', v)} onMaxChange={v => set('child_age_max', v)} />
            </div>
          </PricingBox>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Contact Email</label><input className="form-input" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Contact Phone</label><input className="form-input" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Highlights</label><input className="form-input" placeholder="Infinity pool, Big Five views..." value={form.highlights} onChange={e => set('highlights', e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><input type="checkbox" id="pa" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /><label htmlFor="pa" style={{ fontSize: 13, color: 'var(--text-mid)' }}>Active (included in AI quotes)</label></div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><Save size={14} />Save Property</>}</button>
        </div>
      )}

      <div className="table-container">
        {loading ? <div className="empty-state"><div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
        : items.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏨</div><div className="empty-state-text">No properties yet — add one or upload a CSV</div></div>
        : <table><thead><tr><th>Property</th><th>Destination</th><th>Category</th><th>Room / Meal</th><th>Adult Price</th><th>Child Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}><td><div style={{ fontWeight: 500 }}>{item.name}</div><div style={{ fontSize: 11, color: 'var(--gold)' }}>{'★'.repeat(item.star_rating||0)}</div></td><td style={{ color: 'var(--text-mid)', fontSize: 13 }}>{item.destination}, {item.country}</td><td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 600 }}>{item.category}</span></td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.room_type}<br/>{item.meal_plan}</td><td style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 600 }}>{fmtUSD(item.price_per_person_usd_cents)}</td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.child_price_per_person_usd_cents ? `${fmtUSD(item.child_price_per_person_usd_cents)} (${item.child_age_min}-${item.child_age_max}yrs)` : 'Not set'}</td><td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: item.is_active ? 'rgba(74,124,89,0.15)' : 'var(--border)', color: item.is_active ? 'var(--sage-light)' : 'var(--text-dim)', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span></td><td>{confirmDelete===item.id?<ConfirmDelete onConfirm={()=>handleDelete(item.id)} onCancel={()=>setConfirmDelete(null)}/>:<div style={{display:'flex',gap:4}}><button className="btn btn-ghost" style={{padding:'5px 8px'}} onClick={()=>handleEdit(item)}><Edit2 size={13}/></button><button className="btn btn-ghost" style={{padding:'5px 8px',color:'var(--ember)'}} onClick={()=>setConfirmDelete(item.id)}><Trash2 size={13}/></button></div>}</td></tr>)}</tbody>
          </table>}
      </div>
    </div>
  )
}

// ─── Transport ────────────────────────────────────────────────────────────────
function TransportTab({ agentId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const empty = { from_location: '', to_location: '', transport_type: 'fly', operator_name: '', vehicle_type: 'Cessna', price_per_person_usd_cents: '', child_price_per_person_usd_cents: '', child_age_min: 2, child_age_max: 12, max_pax_per_vehicle: 4, duration_hours: 1, is_shared: false, is_active: true, notes: '' }
  const [form, setForm] = useState(empty)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => { try { const data = await supabaseFetch('transport_routes', { agent_id: `eq.${agentId}`, select: '*', order: 'from_location.asc' }); setItems(data) } catch (e) { console.error(e) } finally { setLoading(false) } }
  useEffect(() => { if (agentId) load() }, [agentId])

  const toPayload = (f) => ({ ...f, agent_id: agentId, price_per_person_usd_cents: Math.round(Number(f.price_per_person_usd_cents) * 100), child_price_per_person_usd_cents: f.child_price_per_person_usd_cents ? Math.round(Number(f.child_price_per_person_usd_cents) * 100) : null, child_age_min: Number(f.child_age_min) || 2, child_age_max: Number(f.child_age_max) || 12, max_pax_per_vehicle: Number(f.max_pax_per_vehicle), duration_hours: Number(f.duration_hours) })

  const handleSave = async () => {
    if (!form.from_location || !form.to_location || !form.price_per_person_usd_cents) return alert('Please fill origin, destination and price.')
    setSaving(true)
    try { if (editId) await supabasePatch('transport_routes', { id: `eq.${editId}` }, toPayload(form)); else await supabaseInsert('transport_routes', toPayload(form)); setShowForm(false); setEditId(null); setForm(empty); await load() }
    catch (e) { alert('Save failed: ' + e.message) } finally { setSaving(false) }
  }

  const handleEdit = (item) => { setForm({ ...item, price_per_person_usd_cents: item.price_per_person_usd_cents / 100, child_price_per_person_usd_cents: item.child_price_per_person_usd_cents ? item.child_price_per_person_usd_cents / 100 : '' }); setEditId(item.id); setShowForm(true) }
  const handleDelete = async (id) => { try { await supabaseDelete('transport_routes', { id: `eq.${id}` }); setConfirmDelete(null); await load() } catch (e) { alert('Delete failed') } }

  const handleCSV = async (file) => {
    setImporting(true); setImportResult(null)
    try {
      const rows = parseCSV(await file.text()); let count = 0
      for (const r of rows) {
        if (!r.from_location || !r.to_location) continue
        await supabaseInsert('transport_routes', { agent_id: agentId, from_location: r.from_location, to_location: r.to_location, transport_type: r.transport_type || 'fly', operator_name: r.operator_name || '', vehicle_type: r.vehicle_type || 'Cessna', price_per_person_usd_cents: Math.round(Number(r.price_per_person_usd) * 100), child_price_per_person_usd_cents: r.child_price_per_person_usd ? Math.round(Number(r.child_price_per_person_usd) * 100) : null, child_age_min: Number(r.child_age_min) || 2, child_age_max: Number(r.child_age_max) || 12, max_pax_per_vehicle: Number(r.max_pax_per_vehicle) || 4, duration_hours: Number(r.duration_hours) || 1, is_shared: r.is_shared === 'true', is_active: r.is_active !== 'false', notes: r.notes || '' }); count++
      }
      setImportResult({ message: `${count} routes imported` }); await load()
    } catch (e) { setImportResult({ error: true, message: 'Import failed: ' + e.message }) } finally { setImporting(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <CSVSection onUpload={handleCSV} templatePath="/templates/transport_template.csv" templateName="transport_template.csv" importing={importing} result={importResult} />
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }}><Plus size={14} /> Add Route</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid var(--gold)', background: 'rgba(200,169,110,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{editId ? 'Edit' : 'Add'} Transport Route</h4>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => { setShowForm(false); setEditId(null) }}><X size={14} /></button>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">From *</label><input className="form-input" placeholder="Nairobi (Wilson)" value={form.from_location} onChange={e => set('from_location', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">To *</label><input className="form-input" placeholder="Masai Mara" value={form.to_location} onChange={e => set('to_location', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Transport Type</label><select className="form-select" value={form.transport_type} onChange={e => set('transport_type', e.target.value)}>{Object.entries(TRANSPORT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Vehicle Type</label><select className="form-select" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>{VEHICLE_TYPES.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Operator</label><input className="form-input" placeholder="SafariAir" value={form.operator_name} onChange={e => set('operator_name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Duration (hours)</label><input className="form-input" type="number" placeholder="1" value={form.duration_hours} onChange={e => set('duration_hours', e.target.value)} /></div>
          </div>
          <PricingBox>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Adult Price/Person (USD) *</label><input className="form-input" type="number" placeholder="450" value={form.price_per_person_usd_cents} onChange={e => set('price_per_person_usd_cents', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Max Pax Per Vehicle</label><input className="form-input" type="number" placeholder="4" value={form.max_pax_per_vehicle} onChange={e => set('max_pax_per_vehicle', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Child Price/Person (USD)</label><input className="form-input" type="number" placeholder="225" value={form.child_price_per_person_usd_cents} onChange={e => set('child_price_per_person_usd_cents', e.target.value)} /></div>
              <AgeRange minVal={form.child_age_min} maxVal={form.child_age_max} onMinChange={v=>set('child_age_min',v)} onMaxChange={v=>set('child_age_max',v)} />
            </div>
          </PricingBox>
          <div className="form-group"><label className="form-label">Notes</label><input className="form-input" placeholder="Includes 15kg luggage..." value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" id="ts" checked={form.is_shared} onChange={e => set('is_shared', e.target.checked)} /><label htmlFor="ts" style={{ fontSize: 13, color: 'var(--text-mid)' }}>Shared transfer</label></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" id="ta" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /><label htmlFor="ta" style={{ fontSize: 13, color: 'var(--text-mid)' }}>Active</label></div>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><Save size={14} />Save Route</>}</button>
        </div>
      )}

      <div className="table-container">
        {loading ? <div className="empty-state"><div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
        : items.length === 0 ? <div className="empty-state"><div className="empty-state-icon">✈️</div><div className="empty-state-text">No transport routes yet</div></div>
        : <table><thead><tr><th>Route</th><th>Type</th><th>Vehicle</th><th>Adult Price</th><th>Child Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}><td><div style={{ fontWeight: 500 }}>{item.from_location} → {item.to_location}</div>{item.operator_name&&<div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.operator_name}</div>}</td><td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(74,144,217,0.15)', color: 'var(--sky)', fontWeight: 600 }}>{TRANSPORT_LABELS[item.transport_type]||item.transport_type}</span></td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.vehicle_type}</td><td style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 600 }}>{fmtUSD(item.price_per_person_usd_cents)}</td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.child_price_per_person_usd_cents?`${fmtUSD(item.child_price_per_person_usd_cents)} (${item.child_age_min}-${item.child_age_max}yrs)`:'—'}</td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.duration_hours}h</td><td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: item.is_active?'rgba(74,124,89,0.15)':'var(--border)', color: item.is_active?'var(--sage-light)':'var(--text-dim)', fontWeight: 600 }}>{item.is_active?'Active':'Inactive'}</span></td><td>{confirmDelete===item.id?<ConfirmDelete onConfirm={()=>handleDelete(item.id)} onCancel={()=>setConfirmDelete(null)}/>:<div style={{display:'flex',gap:4}}><button className="btn btn-ghost" style={{padding:'5px 8px'}} onClick={()=>handleEdit(item)}><Edit2 size={13}/></button><button className="btn btn-ghost" style={{padding:'5px 8px',color:'var(--ember)'}} onClick={()=>setConfirmDelete(item.id)}><Trash2 size={13}/></button></div>}</td></tr>)}</tbody>
          </table>}
      </div>
    </div>
  )
}

// ─── Park Fees ────────────────────────────────────────────────────────────────
function ParkFeesTab({ agentId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const empty = { park_name: '', destination: '', country: 'Kenya', visitor_category: 'non_resident', fee_per_person_per_day_usd_cents: '', child_fee_per_person_per_day_usd_cents: '', child_age_min: 3, child_age_max: 17, notes: '' }
  const [form, setForm] = useState(empty)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => { try { const data = await supabaseFetch('park_fees', { agent_id: `eq.${agentId}`, select: '*', order: 'park_name.asc' }); setItems(data) } catch (e) { console.error(e) } finally { setLoading(false) } }
  useEffect(() => { if (agentId) load() }, [agentId])

  const toPayload = (f) => ({ ...f, agent_id: agentId, fee_per_person_per_day_usd_cents: Math.round(Number(f.fee_per_person_per_day_usd_cents) * 100), child_fee_per_person_per_day_usd_cents: f.child_fee_per_person_per_day_usd_cents ? Math.round(Number(f.child_fee_per_person_per_day_usd_cents) * 100) : null, child_age_min: Number(f.child_age_min) || 3, child_age_max: Number(f.child_age_max) || 17 })

  const handleSave = async () => {
    if (!form.park_name || !form.destination || !form.fee_per_person_per_day_usd_cents) return alert('Please fill park name, destination and fee.')
    setSaving(true)
    try { if (editId) await supabasePatch('park_fees', { id: `eq.${editId}` }, toPayload(form)); else await supabaseInsert('park_fees', toPayload(form)); setShowForm(false); setEditId(null); setForm(empty); await load() }
    catch (e) { alert('Save failed: ' + e.message) } finally { setSaving(false) }
  }

  const handleEdit = (item) => { setForm({ ...item, fee_per_person_per_day_usd_cents: item.fee_per_person_per_day_usd_cents / 100, child_fee_per_person_per_day_usd_cents: item.child_fee_per_person_per_day_usd_cents ? item.child_fee_per_person_per_day_usd_cents / 100 : '' }); setEditId(item.id); setShowForm(true) }
  const handleDelete = async (id) => { try { await supabaseDelete('park_fees', { id: `eq.${id}` }); setConfirmDelete(null); await load() } catch (e) { alert('Delete failed') } }

  const handleCSV = async (file) => {
    setImporting(true); setImportResult(null)
    try {
      const rows = parseCSV(await file.text()); let count = 0
      for (const r of rows) {
        if (!r.park_name || !r.destination) continue
        await supabaseInsert('park_fees', { agent_id: agentId, park_name: r.park_name, destination: r.destination, country: r.country || 'Kenya', visitor_category: r.visitor_category || 'non_resident', fee_per_person_per_day_usd_cents: Math.round(Number(r.fee_per_person_per_day_usd) * 100), child_fee_per_person_per_day_usd_cents: r.child_fee_per_person_per_day_usd ? Math.round(Number(r.child_fee_per_person_per_day_usd) * 100) : null, child_age_min: Number(r.child_age_min) || 3, child_age_max: Number(r.child_age_max) || 17, notes: r.notes || '' }); count++
      }
      setImportResult({ message: `${count} fees imported` }); await load()
    } catch (e) { setImportResult({ error: true, message: 'Import failed: ' + e.message }) } finally { setImporting(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <CSVSection onUpload={handleCSV} templatePath="/templates/park_fees_template.csv" templateName="park_fees_template.csv" importing={importing} result={importResult} />
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: 'var(--gold-dim)', color: 'var(--gold)' }}>📋 Template includes KWS 2025/26 rates</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }}><Plus size={14} /> Add Fee</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid var(--gold)', background: 'rgba(200,169,110,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{editId ? 'Edit' : 'Add'} Park Fee</h4>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => { setShowForm(false); setEditId(null) }}><X size={14} /></button>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Park Name *</label><input className="form-input" placeholder="Masai Mara National Reserve" value={form.park_name} onChange={e => set('park_name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Destination *</label><input className="form-input" placeholder="Masai Mara" value={form.destination} onChange={e => set('destination', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Country</label><input className="form-input" placeholder="Kenya" value={form.country} onChange={e => set('country', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Visitor Category</label><select className="form-select" value={form.visitor_category} onChange={e => set('visitor_category', e.target.value)}>{Object.entries(VISITOR_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
          </div>
          <PricingBox>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Adult Fee/Day (USD) *</label><input className="form-input" type="number" placeholder="200" value={form.fee_per_person_per_day_usd_cents} onChange={e => set('fee_per_person_per_day_usd_cents', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Child Fee/Day (USD)</label><input className="form-input" type="number" placeholder="100 (blank = free)" value={form.child_fee_per_person_per_day_usd_cents} onChange={e => set('child_fee_per_person_per_day_usd_cents', e.target.value)} /></div>
            </div>
            <AgeRange minVal={form.child_age_min} maxVal={form.child_age_max} onMinChange={v=>set('child_age_min',v)} onMaxChange={v=>set('child_age_max',v)} label="Child Age Range (under min age = free)" />
          </PricingBox>
          <div className="form-group"><label className="form-label">Notes</label><input className="form-input" placeholder="Children under 3 free. Student rates available..." value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><Save size={14} />Save Fee</>}</button>
        </div>
      )}

      <div className="table-container">
        {loading ? <div className="empty-state"><div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
        : items.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🌿</div><div className="empty-state-text">No park fees yet — download and upload the KWS template to get started instantly</div></div>
        : <table><thead><tr><th>Park</th><th>Destination</th><th>Visitor Category</th><th>Adult Fee/Day</th><th>Child Fee/Day</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}><td style={{ fontWeight: 500 }}>{item.park_name}</td><td style={{ color: 'var(--text-mid)', fontSize: 13 }}>{item.destination}, {item.country}</td><td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(74,124,89,0.15)', color: 'var(--sage-light)', fontWeight: 600 }}>{VISITOR_LABELS[item.visitor_category]||item.visitor_category}</span></td><td style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 600 }}>{fmtUSD(item.fee_per_person_per_day_usd_cents)}</td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.child_fee_per_person_per_day_usd_cents?`${fmtUSD(item.child_fee_per_person_per_day_usd_cents)} (${item.child_age_min}-${item.child_age_max}yrs)`:'Free'}</td><td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.notes||'—'}</td><td>{confirmDelete===item.id?<ConfirmDelete onConfirm={()=>handleDelete(item.id)} onCancel={()=>setConfirmDelete(null)}/>:<div style={{display:'flex',gap:4}}><button className="btn btn-ghost" style={{padding:'5px 8px'}} onClick={()=>handleEdit(item)}><Edit2 size={13}/></button><button className="btn btn-ghost" style={{padding:'5px 8px',color:'var(--ember)'}} onClick={()=>setConfirmDelete(item.id)}><Trash2 size={13}/></button></div>}</td></tr>)}</tbody>
          </table>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Inventory() {
  const { user } = useUser()
  const [tab, setTab] = useState('properties')
  const [agentId, setAgentId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ properties: 0, transport: 0, parkfees: 0 })

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const agents = await supabaseFetch('agents', { clerk_user_id: `eq.${user.id}`, select: 'id' })
        if (!agents.length) return
        const aid = agents[0].id; setAgentId(aid)
        const [a, t, p] = await Promise.all([
          supabaseFetch('accommodations', { agent_id: `eq.${aid}`, select: 'id' }),
          supabaseFetch('transport_routes', { agent_id: `eq.${aid}`, select: 'id' }),
          supabaseFetch('park_fees', { agent_id: `eq.${aid}`, select: 'id' }),
        ])
        setCounts({ properties: a.length, transport: t.length, parkfees: p.length })
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [user?.id])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Inventory</h1>
        <p className="page-subtitle">Manage your properties, transport and park fees — this data powers the AI quote engine. Upload CSV files for fast onboarding.</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <TabButton active={tab==='properties'} onClick={()=>setTab('properties')} icon={Building2} label="Properties" count={counts.properties} />
          <TabButton active={tab==='transport'} onClick={()=>setTab('transport')} icon={Plane} label="Transport" count={counts.transport} />
          <TabButton active={tab==='parkfees'} onClick={()=>setTab('parkfees')} icon={TreePine} label="Park Fees" count={counts.parkfees} />
        </div>
        {tab==='properties' && <PropertiesTab agentId={agentId} />}
        {tab==='transport' && <TransportTab agentId={agentId} />}
        {tab==='parkfees' && <ParkFeesTab agentId={agentId} />}
      </div>
    </div>
  )
}
