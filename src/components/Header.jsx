import React, { useState } from 'react';
import { useDisaster } from '../context/DisasterContext';
import DemoTourModal from './DemoTourModal';
import ApiSettingsModal from './ApiSettingsModal';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  PhoneCall,
  LayoutGrid,
  Shield,
  Radio,
  Building2,
  UserCheck,
  Key,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function Header() {
  const {
    activeTab,
    setActiveTab,
    soundEnabled,
    setSoundEnabled,
    resetDemo,
    resources,
    alerts,
    userLocation,
    detectPresentLocation,
  } = useDisaster();

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundFx.muted = !nextVal;
    if (nextVal) {
      soundFx.playBeep(880, 'sine', 0.1, 0.1);
    }
  };

  return (
    <>
      <header className="global-system-header">
        {/* Top Hackathon & Branding Bar */}
        <div className="sih-meta-bar">
          <div className="sih-brand-left">
            <span className="sih-tag">SMART INDIA HACKATHON 2026</span>
            <span className="ps-id">PS ID: SIH26206 • Disaster Management</span>
            <span className="team-badge">TEAM MAVERICKS</span>
          </div>

          <div className="sih-meta-right">
            <button
              className="header-gps-btn"
              onClick={detectPresentLocation}
              title="Click to detect & lock to your present GPS location"
            >
              <span className="pulse-network-dot"></span>
              <span>📍 {userLocation.area ? `${userLocation.area}, ${userLocation.city}` : 'GPS: Detecting Location...'}</span>
            </button>
            <a href="tel:112" className="emergency-call-badge">
              <PhoneCall size={12} /> NDRF / DDMA HELPLINE: 112 / 1070
            </a>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="main-navbar-row">
          <div className="brand-logo-area">
            <div className="brand-emblem-wrap">
              <span className="shield-icon">🛡️</span>
            </div>
            <div>
              <div className="brand-name-row">
                <h1 className="brand-heading">RAKSHA-SETU</h1>
                <span className="system-pill">रक्षा-सेतु v2.6</span>
              </div>
              <p className="brand-caption">
                Unified Disaster Intelligence & Interconnected Emergency Response Platform
              </p>
            </div>
          </div>

          {/* 3 DISTINCT PURPOSE DASHBOARDS SWITCHER + TRI-SPLIT */}
          <nav className="dashboard-navigation-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'citizen' ? 'active citizen-active' : ''}`}
              onClick={() => setActiveTab('citizen')}
            >
              <UserCheck size={18} />
              <div className="tab-text-group">
                <span className="tab-title">1. 👤 Citizen</span>
                <span className="tab-desc">Danger & SOS Help</span>
              </div>
              {alerts.some(a => a.active) && <span className="tab-alert-badge">!</span>}
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'responder' ? 'active responder-active' : ''}`}
              onClick={() => setActiveTab('responder')}
            >
              <Radio size={18} />
              <div className="tab-text-group">
                <span className="tab-title">2. 🚑 Responder</span>
                <span className="tab-desc">Team Alpha Terminal</span>
              </div>
              <span className="tab-counter-badge">{resources.activeIncidentsCount}</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'admin' ? 'active admin-active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Building2 size={18} />
              <div className="tab-text-group">
                <span className="tab-title">3. 🏛️ Admin Command</span>
                <span className="tab-desc">Predict, Alert & Control</span>
              </div>
            </button>

            <button
              className={`nav-tab-btn tri-view-tab ${activeTab === 'tri-view' ? 'active tri-active' : ''}`}
              onClick={() => setActiveTab('tri-view')}
              title="Show all 3 Dashboards on a single screen"
            >
              <LayoutGrid size={18} />
              <div className="tab-text-group">
                <span className="tab-title">⚡ Tri-Split View</span>
                <span className="tab-desc">Live Sim Wall</span>
              </div>
            </button>
          </nav>

          {/* Action Bar */}
          <div className="navbar-action-buttons">
            <button
              className="btn-storyline-demo pulse-btn"
              onClick={() => setShowDemoModal(true)}
              title="Open the 6-Step Storyline Interactive Simulation"
            >
              <Sparkles size={16} />
              <span className="demo-btn-label">▶️ SIH Demo</span>
            </button>

            <button
              className="btn-tool-icon"
              onClick={() => setShowApiModal(true)}
              title="API Keys & External Cloud Connectors"
            >
              <Key size={18} />
            </button>

            <button
              className={`btn-tool-icon ${soundEnabled ? 'sound-on' : 'sound-off'}`}
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Alert Sound FX' : 'Enable Alert Sound FX'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              className="btn-tool-icon reset-btn"
              onClick={resetDemo}
              title="Reset All Dashboards to Initial Readiness State"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Demo Tour Modal & API Keys Modal */}
      <DemoTourModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
      <ApiSettingsModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
    </>
  );
}
