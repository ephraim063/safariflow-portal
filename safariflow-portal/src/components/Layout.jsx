import { Link, useLocation } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import {
  LayoutDashboard, FileText, Plus, Users,
  Settings, LogOut, Globe, Bell
} from 'lucide-react'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'

export default function Layout({ children }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const location = useLocation()
  const { toasts, addToast, removeToast } = useToast()

  const initials = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'A'
  const name = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.emailAddresses?.[0]?.emailAddress

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/quotes', icon: FileText, label: 'All Quotes', badge: null },
    { path: '/quotes/new', icon: Plus, label: 'New Quote' },
    { path: '/clients', icon: Users, label: 'Clients' },
  ]

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">SafariFlow</div>
          <div className="sidebar-logo-sub">Agent Portal</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(({ path, icon: Icon, label, badge }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${location.pathname === path || (path === '/quotes' && location.pathname.startsWith('/quotes') && location.pathname !== '/quotes/new') ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
              {badge && <span className="nav-badge">{badge}</span>}
            </Link>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 12 }}>Account</div>
          <Link
            to="/settings"
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={16} />
            Settings
          </Link>
          <button
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}
            onClick={() => signOut()}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="agent-card">
            <div className="agent-avatar">{initials}</div>
            <div>
              <div className="agent-name">{name}</div>
              <div className="agent-role">Travel Agent</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
