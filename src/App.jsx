import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DisasterProvider, useDisaster } from './context/DisasterContext';
import Header from './components/Header';
import CitizenDashboard from './components/CitizenDashboard';
import ResponderDashboard from './components/ResponderDashboard';
import AdminDashboard from './components/AdminDashboard';
import TriSplitView from './components/TriSplitView';
import LoginView from './components/LoginView';
import AccessDenied from './components/AccessDenied';
import { Activity, Terminal, ChevronUp, ChevronDown, ShieldAlert } from 'lucide-react';

function AuthenticatedApp() {
  const { user, isAuthenticated, isLoading, hasAccessToTab, getDefaultTabForRole } = useAuth();
  const { activeTab, setActiveTab, activityLogs } = useDisaster();
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  // Sync active tab when user changes or on first login
  useEffect(() => {
    if (user && !hasAccessToTab(activeTab)) {
      setActiveTab(getDefaultTabForRole(user.role));
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="auth-boot-loading-screen">
        <div className="boot-pulse-ring">
          <ShieldAlert size={48} className="pulse-cyan" />
        </div>
        <h3>RAKSHA-SETU CRYPTOGRAPHIC BUS</h3>
        <p>Verifying secure session token & initializing role permissions...</p>
      </div>
    );
  }

  // Unauthenticated: show Login/Registration Command Screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(loggedInUser) => {
          setActiveTab(getDefaultTabForRole(loggedInUser.role));
        }}
      />
    );
  }

  // Role Access Verification: If user lacks permission for the active tab, render 403 Access Denied
  const isAuthorizedForCurrentTab = hasAccessToTab(activeTab);

  return (
    <div className="app-main-layout">
      <Header />

      <main className="dashboard-content-viewport">
        {!isAuthorizedForCurrentTab ? (
          <AccessDenied
            attemptedTab={activeTab}
            onReturn={(fallbackTab) => setActiveTab(fallbackTab)}
          />
        ) : (
          <>
            {activeTab === 'citizen' && <CitizenDashboard />}
            {activeTab === 'responder' && <ResponderDashboard />}
            {activeTab === 'admin' && <AdminDashboard />}
            {activeTab === 'tri-view' && <TriSplitView />}
          </>
        )}
      </main>

      {/* Floating System Audit Log Ticker & Drawer */}
      <footer className="system-footer-bar">
        <div className="footer-left">
          <div className="log-toggle-pill" onClick={() => setShowLogsDrawer(!showLogsDrawer)}>
            <Activity size={15} className="pulse-green" />
            <span className="log-label">LIVE SYSTEM AUDIT BUS</span>
            {showLogsDrawer ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
          <div className="latest-log-ticker">
            <span className="time-badge">{activityLogs[0]?.time || '15:30'}</span>
            <span className="ticker-text">{activityLogs[0]?.text || 'System ready. Telemetry listening.'}</span>
          </div>
        </div>

        <div className="footer-right">
          <span className="sih-footer-tag">Smart India Hackathon 2026 • SIH26206 • Team Mavericks</span>
          <span className="ndma-sync">NDRF / DDMA PROTOCOL COMPLIANT</span>
        </div>
      </footer>

      {/* Activity Logs Drawer */}
      {showLogsDrawer && (
        <div className="logs-drawer animate-slide-up">
          <div className="logs-drawer-header">
            <div className="title-with-icon">
              <Terminal size={16} />
              <h4>Real-Time Event & Cross-Dashboard Message Bus Log</h4>
            </div>
            <button className="btn-close-drawer-sm" onClick={() => setShowLogsDrawer(false)}>✕</button>
          </div>
          <div className="logs-list-scroll">
            {activityLogs.map((log) => (
              <div key={log.id} className="log-row">
                <span className="log-time">{log.time}</span>
                <span className={`log-type-badge ${log.type}`}>{log.type.toUpperCase()}</span>
                <span className="log-text">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DisasterProvider>
        <AuthenticatedApp />
      </DisasterProvider>
    </AuthProvider>
  );
}
