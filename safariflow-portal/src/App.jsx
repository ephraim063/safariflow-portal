import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Quotes from './pages/Quotes'
import NewQuote from './pages/NewQuote'
import Clients from './pages/Clients'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <SignedIn>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/dashboard" element={
          <>
            <SignedIn><Layout><Dashboard /></Layout></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/quotes" element={
          <>
            <SignedIn><Layout><Quotes /></Layout></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/quotes/new" element={
          <>
            <SignedIn><Layout><NewQuote /></Layout></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/clients" element={
          <>
            <SignedIn><Layout><Clients /></Layout></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        <Route path="/settings" element={
          <>
            <SignedIn><Layout><Settings /></Layout></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}
