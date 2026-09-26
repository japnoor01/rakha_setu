import React from 'react';
import CitizenDashboard from './CitizenDashboard';
import ResponderDashboard from './ResponderDashboard';
import AdminDashboard from './AdminDashboard';
import { Sparkles, Eye } from 'lucide-react';

export default function TriSplitView() {
  const [mobileActivePane, setMobileActivePane] = React.useState('all');

  return (
    <div className="tri-split-view-container animate-fade-in">
      <div className="tri-split-banner">
        <div className="banner-badge">
          <Sparkles size={16} />
          <span>SIH 2026 LIVE SYNCHRONIZATION COMMAND WALL</span>
        </div>
        <h2>Unified 3-Dashboard Tri-View (Real-time Cross-Role Interaction)</h2>
        <p>
          Witness the core loop in action: <strong>🤖 Predict (Admin) → 📢 Alert → 👤 Report (Citizen) → 🚑 Respond (Team Alpha) → 🏛️ Monitor (Command HQ)</strong>.
          Every action taken in any panel synchronizes across all three dashboards instantly.
        </p>

        {/* Mobile View Toggle Pills (visible on phones/tablets) */}
        <div className="tri-mobile-filter-bar">
          <span className="tri-mobile-label">Active Panel:</span>
          <div className="tri-mobile-pills">
            <button
              className={`tri-pill-btn ${mobileActivePane === 'all' ? 'active' : ''}`}
              onClick={() => setMobileActivePane('all')}
            >
              ⚡ All 3
            </button>
            <button
              className={`tri-pill-btn ${mobileActivePane === 'citizen' ? 'active' : ''}`}
              onClick={() => setMobileActivePane('citizen')}
            >
              👤 Citizen
            </button>
            <button
              className={`tri-pill-btn ${mobileActivePane === 'responder' ? 'active' : ''}`}
              onClick={() => setMobileActivePane('responder')}
            >
              🚑 Responder
            </button>
            <button
              className={`tri-pill-btn ${mobileActivePane === 'admin' ? 'active' : ''}`}
              onClick={() => setMobileActivePane('admin')}
            >
              🏛️ Admin
            </button>
          </div>
        </div>
      </div>

      <div className="tri-split-grid">
        {/* Pane 1: Citizen Mobile View */}
        {(mobileActivePane === 'all' || mobileActivePane === 'citizen') && (
          <div className="split-column citizen-col">
            <div className="column-title-bar bar-citizen">
              <span className="role-icon">👤</span>
              <div>
                <h3>1. Citizen Dashboard</h3>
                <p>Danger awareness, Shelter routing, SOS reporting</p>
              </div>
              <span className="live-tag">LIVE SYNC</span>
            </div>
            <div className="column-content-scroller">
              <CitizenDashboard />
            </div>
          </div>
        )}

        {/* Pane 2: Responder Field Terminal */}
        {(mobileActivePane === 'all' || mobileActivePane === 'responder') && (
          <div className="split-column responder-col">
            <div className="column-title-bar bar-responder">
              <span className="role-icon">🚑</span>
              <div>
                <h3>2. Responder Dashboard</h3>
                <p>Team Alpha dispatch, Navigation corridor, Task acceptance</p>
              </div>
              <span className="live-tag">LIVE SYNC</span>
            </div>
            <div className="column-content-scroller">
              <ResponderDashboard />
            </div>
          </div>
        )}

        {/* Pane 3: Admin Command Center */}
        {(mobileActivePane === 'all' || mobileActivePane === 'admin') && (
          <div className="split-column admin-col">
            <div className="column-title-bar bar-admin">
              <span className="role-icon">🏛️</span>
              <div>
                <h3>3. Admin / Command Center</h3>
                <p>AI Risk prediction, Alert broadcasting, Resource gauges</p>
              </div>
              <span className="live-tag">LIVE SYNC</span>
            </div>
            <div className="column-content-scroller">
              <AdminDashboard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
