import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import {
  LayoutDashboard, FileText, Plus, Users,
  Settings, LogOut, Globe, Menu, X, Database, Sun, Moon
} from 'lucide-react'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'

export default function Layout({ children }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const location = useLocation()
  const { toasts, addToast, removeToast } = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('sf_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const initials = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'A'
  const name = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.emailAddresses?.[0]?.emailAddress

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/packages', icon: Globe, label: 'Packages' },
    { path: '/quotes', icon: FileText, label: 'All Quotes' },
    { path: '/quotes/new', icon: Plus, label: 'New Quote' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/inventory', icon: Database, label: 'My Inventory' },
  ]

  const isActive = (path) => {
    if (path === '/quotes') return location.pathname === '/quotes'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">SafariFlow</div>
        <div className="sidebar-logo-sub">Agent Portal</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`nav-item ${isActive(path) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 12 }}>Account</div>
        <Link
          to="/settings"
          className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}
          onClick={() => signOut()}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </nav>

      <div className="sidebar-footer">
        {/* Theme toggle */}
        <div className="theme-toggle" style={{ marginBottom: 8 }}>
          <span className="theme-toggle-label">
            {theme === 'dark' ? <><Moon size={11} style={{ display: 'inline', marginRight: 4 }} />Dark Mode</> : <><Sun size={11} style={{ display: 'inline', marginRight: 4 }} />Light Mode</>}
          </span>
          <button
            className={`theme-toggle-btn ${theme === 'light' ? 'light' : ''}`}
            onClick={toggleTheme}
            title="Toggle theme"
          />
        </div>
        <div className="agent-card">
          <div className="agent-avatar">{initials}</div>
          <div>
            <div className="agent-name">{name}</div>
            <div className="agent-role">Travel Agent</div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ display: 'flex' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--deep)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
      }} className="mobile-topbar">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
          SafariFlow
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px', cursor: 'pointer',
            color: 'var(--text)', display: 'flex', alignItems: 'center'
          }}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 98, display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className="mobile-drawer"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 260, background: 'var(--deep)',
          borderRight: '1px solid var(--border)',
          zIndex: 99, display: 'flex', flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none'
        }}
      >
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text)'
            }}
          >
            <X size={15} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ paddingTop: 0 }} id="main-content">
        {children}
      </main>

      <Toast toasts={toasts} removeToast={removeToast} />

      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-overlay { display: block !important; }
          #main-content { padding-top: 56px !important; }
          .page-header { padding: 20px 16px 0 !important; }
          .page-body { padding: 16px 16px 32px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .form-row { grid-template-columns: 1fr !important; }
          .modal { margin: 8px !important; max-height: 95vh !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>
    </div>
  )
}
