import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Quotes from './pages/Quotes'
import NewQuote from './pages/NewQuote'
import Clients from './pages/Clients'
import Packages from './pages/Packages'
import Settings from './pages/Settings'
import Inventory from './pages/Inventory'
import QuoteReview from './pages/QuoteReview'
import Onboarding from './pages/Onboarding'
import Invoices from './pages/Invoices'
import { supabaseFetch } from './hooks/useSupabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function ProtectedApp() {
  const { user, isLoaded } = useUser()
  const [agentId, setAgentId] = useState(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user?.id) return
    const check = async () => {
      try {
        const agents = await supabaseFetch('agents', {
          clerk_user_id: `eq.${user.id}`,
          select: 'id,agency_name'
        })
        if (!agents.length) {
          // No agent record — create one and show onboarding
          setNeedsOnboarding(true)
        } else {
          const agent = agents[0]
          setAgentId(agent.id)
          // Show onboarding if agency_name not set
          if (!agent.agency_name) {
            setNeedsOnboarding(true)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [user?.id, isLoaded])

  if (!isLoaded || checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (needsOnboarding) {
    return <Onboarding agentId={agentId} onComplete={() => setNeedsOnboarding(false)} />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/packages" element={<Layout><Packages /></Layout>} />
      <Route path="/quotes" element={<Layout><Quotes /></Layout>} />
      <Route path="/quotes/new" element={<Layout><NewQuote /></Layout>} />
      <Route path="/quotes/review/:id" element={<Layout><QuoteReview /></Layout>} />
      <Route path="/clients" element={<Layout><Clients /></Layout>} />
      <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
      <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
    </Routes>
  )
}

const Protected = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><RedirectToSignIn /></SignedOut>
  </>
)

export default function App() {
  return (
    <BrowserRouter>
      <Protected>
        <ProtectedApp />
      </Protected>
    </BrowserRouter>
  )
}
