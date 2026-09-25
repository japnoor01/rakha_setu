import React, { useState } from 'react';
import { DisasterProvider, useDisaster } from './context/DisasterContext';
import Header from './components/Header';
import CitizenDashboard from './components/CitizenDashboard';
import ResponderDashboard from './components/ResponderDashboard';
import AdminDashboard from './components/AdminDashboard';
import TriSplitView from './components/TriSplitView';
import { Activity, ShieldCheck, Cpu, Terminal, ChevronUp, ChevronDown } from 'lucide-react';

function DashboardRenderer() {
  const { activeTab, activityLogs } = useDisaster();
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  return (
    <div className="app-main-layout">
      <Header />

      <main className="dashboard-content-viewport">
        {activeTab === 'citizen' && <CitizenDashboard />}
        {activeTab === 'responder' && <ResponderDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'tri-view' && <TriSplitView />}
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
    <DisasterProvider>
      <DashboardRenderer />
    </DisasterProvider>
  );
}
