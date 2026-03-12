import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AdminAuthProvider } from '@/components/admin/AdminAuthProvider';
import RouteTracker from '@/components/analytics/RouteTracker';
import RouteLoadingBar from '@/components/ui/RouteLoadingBar';
import { installDebugAuthBlocker } from '@/components/auth/debugAuthBlocker';
import './globals.css';

// Build signature for production verification
const APP_BUILD_SIGNATURE = 'LON-2026-01-05-PROD-CLEAN';

// Expose build signature for production verification (localhost only)
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.__APP_BUILD_SIGNATURE = APP_BUILD_SIGNATURE;
  console.info('[BUILD]', APP_BUILD_SIGNATURE);
}

// Install debug auth blocker (only active if DEBUG_AUTH_PROBE=1)
if (typeof window !== 'undefined') {
  installDebugAuthBlocker();
}

export default function Layout({ children, currentPageName }) {
  const noLayoutPages = ['Entrar', 'LoginRedirect', 'Registrar', 'AdminAuth', 'AdminDashboard', 'HomeNevareth', 'NotFound'];
  
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <AuthProvider>
      <AdminAuthProvider>
        <title>Legacy of Nevareth — Private CABAL Online Server</title>
        <meta name="description" content="Private CABAL Online Server. Rankings, Dungeons, TG, RMT Market and much more. Enter Nevareth now!" />
        <meta name="keywords" content="cabal online, private server, legacy of nevareth, mmorpg, nevareth, rmt, alz" />
        <meta property="og:title" content="Legacy of Nevareth — Your Portal to Nevareth" />
        <meta property="og:description" content="Private CABAL Online Server with Dungeons, ranked TG, RMT Market and active community." />
        <meta property="og:type" content="website" />
        <div className="min-h-screen bg-[#05070B]">
          <Toaster position="top-right" theme="dark" richColors />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </AdminAuthProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
    <AdminAuthProvider>
      <title>Legacy of Nevareth — Private CABAL Online Server</title>
      <meta name="description" content="Private CABAL Online Server. Rankings, Dungeons, TG, RMT Market and much more. Enter Nevareth now!" />
      <meta name="keywords" content="cabal online, private server, legacy of nevareth, mmorpg, nevareth, rmt, alz, tg, dungeons" />
      <meta name="author" content="Legacy of Nevareth Team" />
      <meta property="og:title" content="Legacy of Nevareth — Your Portal to Nevareth" />
      <meta property="og:description" content="Private CABAL Online Server with Dungeons, ranked TG, RMT Market and active community." />
      <meta property="og:type" content="website" />
      <div className="min-h-screen bg-[#05070B] flex flex-col">
        <Toaster position="top-right" theme="dark" richColors />
        <RouteLoadingBar />
        <RouteTracker />
        <ErrorBoundary>
        <style>{`
          :root {
            --bg-main: #05070B;
            --bg-panel: #0C121C;
            --accent-primary: #19E0FF;
            --accent-secondary: #1A9FE8;
            --accent-danger: #FF4B6A;
            --accent-honor: #F7CE46;
            --text-primary: #FFFFFF;
            --text-muted: #A9B2C7;
          }
          
          body {
            background-color: var(--bg-main);
          }
          
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: var(--bg-main);
          }
          
          ::-webkit-scrollbar-thumb {
            background: var(--accent-primary);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-secondary);
          }
        `}</style>
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
        </ErrorBoundary>
      </div>
    </AdminAuthProvider>
    </AuthProvider>
  );
}