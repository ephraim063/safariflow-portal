import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Quotes from './pages/Quotes'
import NewQuote from './pages/NewQuote'
import Clients from './pages/Clients'
import Packages from './pages/Packages'
import Settings from './pages/Settings'
import Inventory from './pages/Inventory'

const Protected = ({ children }) => (
  <>
    <SignedIn><Layout>{children}</Layout></SignedIn>
    <SignedOut><RedirectToSignIn /></SignedOut>
  </>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Protected><Navigate to="/dashboard" replace /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/packages" element={<Protected><Packages /></Protected>} />
        <Route path="/quotes" element={<Protected><Quotes /></Protected>} />
        <Route path="/quotes/new" element={<Protected><NewQuote /></Protected>} />
        <Route path="/clients" element={<Protected><Clients /></Protected>} />
        <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}
