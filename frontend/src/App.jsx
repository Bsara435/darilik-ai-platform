import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LoginModal from './components/LoginModal'
import Dashboard from './components/dashboard/Dashboard'
import './App.css'

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <>
      {!isAuthenticated && (
        <>
          <div className="ambient-bg" aria-hidden>
            <div className="ambient-bg__base" />
            <div className="ambient-bg__blob ambient-bg__blob--1" />
            <div className="ambient-bg__blob ambient-bg__blob--2" />
            <div className="ambient-bg__blob ambient-bg__blob--3" />
            <div className="ambient-bg__grid" />
          </div>
          <Navbar onOpenLogin={() => setLoginOpen(true)} />
          <main>
            <Hero onGetStarted={() => setLoginOpen(true)} />
          </main>
        </>
      )}
      {isAuthenticated && (
        <BrowserRouter>
          <Dashboard onLogout={() => setIsAuthenticated(false)} />
        </BrowserRouter>
      )}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setIsAuthenticated(true)}
      />
    </>
  )
}
