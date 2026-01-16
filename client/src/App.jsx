import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import VideoConverters from './components/VideoConverters'
import AudioConverters from './components/AudioConverters'
import ImageConverters from './components/ImageConverters'
import DocumentConverters from './components/DocumentConverters'
import Footer from './components/Footer'

function App() {
  useEffect(() => {
    // Remove hash from URL on page load
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    // Prevent hash from being added to URL on navigation
    const handleHashChange = () => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <Hero />
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 max-w-7xl mx-auto">
          <VideoConverters />
          <AudioConverters />
          <ImageConverters />
          <DocumentConverters />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default App
