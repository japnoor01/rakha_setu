import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDisaster } from '../context/DisasterContext';
import InteractiveMap from './InteractiveMap';
import MlHydrologyPredictor from './MlHydrologyPredictor';
import CvSceneScanner from './CvSceneScanner';
import UserManagementModal from './UserManagementModal';
import {
  ShieldAlert,
  Send,
  Cpu,
  Activity,
  Users,
  AlertTriangle,
  Building,
  CheckCircle,
  TrendingUp,
  X,
  Play,
  ArrowUpRight,
  Flame,
  Waves,
  Scan,
  Camera
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    resources,
    alerts,
    incidents,
    shelters,
    responderTeam,
    riskInputs,
    setRiskInputs,
    riskResult,
    runRiskAnalysis,
    createAlert,
    activityLogs,
    userLocation,
    detectPresentLocation,
    applyCoordinates,
  } = useDisaster();

  // Create alert modal state
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [showDroneCvModal, setShowDroneCvModal] = useState(false);
  const [showUserMgmtModal, setShowUserMgmtModal] = useState(false);
  const [newAlertType, setNewAlertType] = useState('Flood Warning');
  const [newAlertZone, setNewAlertZone] = useState(userLocation.area || 'Zone 3');
  const [newAlertMsg, setNewAlertMsg] = useState(`Heavy flooding expected near ${userLocation.address}. Immediate evacuation advised.`);
  const [alertSuccessNotice, setAlertSuccessNotice] = useState(false);

  // Broadcast alert directly from ML Hydrology Predictor
  const handleBroadcastMlAlert = (mlRes) => {
    createAlert({
      type: 'Flash Flood Emergency',
      zone: userLocation.area || 'Zone 3',
      title: `⚡ ML Prediction Alert: ${mlRes.riskCategory} (${mlRes.floodProbability}% Probability)`,
      message: `Hydrological ML Early Warning: ${mlRes.keyHazardDrivers[0]}. Peak surge estimated in ${mlRes.timeToPeakFormatted} (+${mlRes.predictedSurgeMeters}m). Immediate evacuation of low-lying areas activated.`,
      severity: mlRes.severityLevel || 'Critical',
    });
  };

  // Sync alert zone with location
  React.useEffect(() => {
    if (userLocation.area) {
      setNewAlertZone(userLocation.area);
      setNewAlertMsg(`Heavy flooding expected near ${userLocation.address}. Immediate evacuation advised.`);
    }
  }, [userLocation.area, userLocation.address]);

  // Risk analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      runRiskAnalysis(riskInputs);
      setIsAnalyzing(false);
    }, 600);
  };

  const handleSendAlert = (e) => {
    e.preventDefault();
    createAlert({
      type: newAlertType,
      zone: newAlertZone,
      title: `${newAlertType} – ${newAlertZone}`,
      message: newAlertMsg,
      severity: 'Critical',
    });
    setAlertSuccessNotice(true);
    setTimeout(() => {
      setAlertSuccessNotice(false);
      setShowCreateAlertModal(false);
    }, 1800);
  };

  // One-click quick broadcast from AI recommendations
  const handleExecuteAiRecommendations = () => {
    createAlert({
      type: 'Flash Flood Warning',
      zone: userLocation.area,
      title: `Flash Flood Warning – ${userLocation.area} (Automated AI Advisory)`,
      message: `AI Early Warning: River & drainage telemetry near ${userLocation.address} exceeded danger threshold. Prepare for immediate relocation to safe shelters.`,
      severity: 'Critical'
    });
  };

  return (
    <div className="admin-dashboard-container animate-fade-in">
      {/* Top Command Center Header */}
      <header className="admin-header">
        <div className="header-branding">
          <div className="command-icon-badge">
            <span className="badge-emblem">🏛️</span>
          </div>
          <div>
            <div className="title-row-top">
              <h1 className="admin-title">RAKSHA-SETU COMMAND CENTER</h1>
              <span className="hq-tag">NATIONAL DISASTER SURVEILLANCE & AI DISPATCH</span>
            </div>
            <p className="admin-sub">
              Integrated Multi-Agency Operations Console • Smart India Hackathon 2026 (Team Mavericks)
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="system-health-pill">
            <span className="pulsing-green"></span>
            <span>SYSTEM HEALTH: 99.98% OPTIMAL</span>
          </div>

          <button
            className="btn-admin-manage-users"
            onClick={() => setShowUserMgmtModal(true)}
            title="Open Central User Management and Role Provisioning"
          >
            <Users size={16} />
            <span>Manage Users & Roles</span>
          </button>

          <div className="admin-profile-badge">
            <div className="avatar-shield">NDMA</div>
            <div>
              <span className="user-name">Chief Officer (Admin)</span>
              <span className="user-role">Central Command Authority</span>
            </div>
          </div>
        </div>
      </header>

      {/* ACTIVE PRESENT LOCATION COMMAND BAR */}
      <section className="location-command-bar">
        <div className="location-meta-left">
          <span className="location-radar-dot"></span>
          <span className="location-title">ACTIVE DISASTER JURISDICTION:</span>
          <strong className="location-name">{userLocation.address}</strong>
          <span className="coords-code">({userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E)</span>
        </div>

        <div className="location-presets-right">
          <button
            className={`btn-preset-loc ${userLocation.isLiveGps ? 'active-loc' : ''}`}
            onClick={detectPresentLocation}
            title="Lock to your current device GPS position"
          >
            📍 Present GPS (Live)
          </button>
          <button
            className="btn-preset-loc"
            onClick={() => applyCoordinates(28.6139, 77.2090, 'Yamuna Basin (Zone 3)', 'New Delhi')}
          >
            Delhi
          </button>
          <button
            className="btn-preset-loc"
            onClick={() => applyCoordinates(12.9716, 77.5946, 'Koramangala Sector', 'Bengaluru')}
          >
            Bengaluru
          </button>
          <button
            className="btn-preset-loc"
            onClick={() => applyCoordinates(19.0760, 72.8777, 'Mithi River Corridor', 'Mumbai')}
          >
            Mumbai
          </button>
          <button
            className="btn-preset-loc"
            onClick={() => applyCoordinates(30.7333, 76.7794, 'Sukhna Basin Sector', 'Chandigarh')}
          >
            Chandigarh
          </button>
        </div>
      </section>

      {/* TOP STATS KPI CARDS (ACTIVE, HIGH-RISK, TEAMS, SHELTERS) */}
      <section className="admin-stats-grid">
        <div className="kpi-card card-incidents">
          <div className="kpi-icon-wrap icon-red">
            <ShieldAlert size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">ACTIVE INCIDENTS</span>
            <div className="kpi-value-row">
              <span className="kpi-num">{resources.activeIncidentsCount}</span>
              <span className="kpi-trend trend-up">
                <TrendingUp size={14} /> Live Sync
              </span>
            </div>
            <span className="kpi-sub">
              {incidents.filter(i => i.status === 'Critical' || i.severity === 'Critical').length} Critical Unresolved
            </span>
          </div>
        </div>

        <div className="kpi-card card-risk">
          <div className="kpi-icon-wrap icon-orange">
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">HIGH-RISK ZONES</span>
            <div className="kpi-value-row">
              <span className="kpi-num">{resources.highRiskZonesCount}</span>
              <span className="zone-pill-indicator">Zone 3 Inundated</span>
            </div>
            <span className="kpi-sub">Monitored via Satellite & IoT</span>
          </div>
        </div>

        <div className="kpi-card card-teams">
          <div className="kpi-icon-wrap icon-blue">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">TEAMS DEPLOYED</span>
            <div className="kpi-value-row">
              <span className="kpi-num">{resources.teamsDeployedCount}</span>
              <span className={`team-status-tag ${responderTeam.status === 'Deployed' ? 'deployed-tag' : 'available-tag'}`}>
                Team Alpha: {responderTeam.status}
              </span>
            </div>
            <span className="kpi-sub">NDRF, SDRF & Civil Defense</span>
          </div>
        </div>

        <div className="kpi-card card-shelters">
          <div className="kpi-icon-wrap icon-green">
            <Building size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">ACTIVE SHELTERS</span>
            <div className="kpi-value-row">
              <span className="kpi-num">{resources.sheltersCount}</span>
              <span className="kpi-trend trend-neutral">
                {shelters.reduce((acc, s) => acc + s.available, 0)} Beds Free
              </span>
            </div>
            <span className="kpi-sub">Overall Capacity: {resources.shelterCapacityPercent}% Filled</span>
          </div>
        </div>
      </section>

      {/* CENTER ROW: LIVE DISASTER MAP (Centrepiece) & ACTIVE ALERTS / CREATE ALERT */}
      <section className="admin-map-alerts-layout">
        {/* 🗺️ LIVE DISASTER MAP (CENTREPIECE) */}
        <div className="admin-map-container">
          <div className="map-top-bar">
            <div className="map-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3>🗺️ LIVE DISASTER MAP</h3>
                <span className="map-feed-pill">
                  <Activity size={13} className="spin-slow" /> MULTI-LAYER GIS BROADCAST
                </span>
              </div>
              <button
                type="button"
                className="btn-drone-cv-quick"
                onClick={() => setShowDroneCvModal(true)}
              >
                <Scan size={14} /> 🚁 Drone Aerial CV Scan
              </button>
            </div>
            <div className="map-legend-pills-row">
              <span className="leg-item"><span className="dot dot-red"></span> Zone 3 (Danger)</span>
              <span className="leg-item"><span className="dot dot-orange"></span> Zone 5 (Medium)</span>
              <span className="leg-item"><span className="dot dot-green"></span> Safe Sectors</span>
              <span className="leg-item">🏠 Shelters</span>
              <span className="leg-item">🚑 NDRF Units</span>
            </div>
          </div>

          <InteractiveMap
            mode="admin"
            height="460px"
            showRoute={responderTeam.status === 'Deployed'}
            activeIncidentId="RS1024"
          />
        </div>

        {/* 🚨 ACTIVE ALERTS & CREATE ALERT PANEL */}
        <div className="admin-alerts-sidebar">
          <div className="alerts-sidebar-header">
            <div className="sidebar-title">
              <span className="alert-badge-icon">🚨</span>
              <div>
                <h3>ACTIVE ALERTS</h3>
                <span className="sub-text">Broadcasted to Citizen Devices</span>
              </div>
            </div>

            {/* CREATE ALERT BUTTON */}
            <button
              className="btn-create-alert-main pulse-btn"
              onClick={() => setShowCreateAlertModal(true)}
            >
              <Send size={15} /> CREATE ALERT
            </button>
          </div>

          <div className="alerts-feed-list">
            {alerts.map((al) => (
              <div key={al.id} className="admin-alert-item-card">
                <div className="alert-item-top">
                  <span className={`al-tag ${al.severity === 'Critical' ? 'tag-critical' : 'tag-moderate'}`}>
                    {al.severity === 'Critical' ? '🔴' : '🟠'} {al.type}
                  </span>
                  <span className="al-zone">{al.zone}</span>
                </div>
                <h4 className="al-title">{al.title}</h4>
                <p className="al-desc">{al.desc}</p>
                <div className="al-footer">
                  <span className="al-time">{al.timestamp}</span>
                  <span className="al-source">{al.source}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Dispatch Telemetry */}
          <div className="quick-dispatch-summary">
            <h4>📡 Multi-Channel Alert Dispatch</h4>
            <div className="channel-indicators">
              <span className="chan active">✓ Citizen App Push</span>
              <span className="chan active">✓ SMS Gateway (1070)</span>
              <span className="chan active">✓ Sirens & IVR</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOWER SECTION: INCIDENTS TABLE & 🤖 AI RISK ANALYSIS */}
      <section className="admin-lower-grid">
        {/* INCIDENTS TABLE */}
        <div className="admin-card-box incidents-table-box">
          <div className="box-title-row">
            <div>
              <h3>📋 REAL-TIME INCIDENTS LOG</h3>
              <span className="box-sub">Citizen SOS reports and field response statuses</span>
            </div>
            <div className="filter-pill">
              <span>{incidents.length} Recorded</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>INCIDENT ID</th>
                  <th>TYPE & ZONE</th>
                  <th>SEVERITY</th>
                  <th>AFFECTED</th>
                  <th>STATUS</th>
                  <th>ASSIGNED TEAM</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className={inc.id === 'RS1024' ? 'highlight-row' : ''}>
                    <td className="mono-code">
                      <strong>{inc.id}</strong>
                    </td>
                    <td>
                      <div className="type-with-icon">
                        {inc.type === 'Flood' ? <Waves size={15} color="#38BDF8" /> : inc.type === 'Fire' ? <Flame size={15} color="#F97316" /> : '🚨'}
                        <span>{inc.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sev-badge ${inc.severity === 'Critical' ? 'sev-crit' : inc.severity === 'High' ? 'sev-high' : 'sev-med'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <strong className="affected-num">{inc.peopleAffected}</strong>
                    </td>
                    <td>
                      <span className={`status-pill-table ${inc.status.toLowerCase()}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <span className="team-text">
                        {inc.assignedTeam ? inc.assignedTeam : '⚠️ Unassigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🤖 ADVANCED HYDROLOGICAL MACHINE LEARNING PREDICTION ENGINE */}
        <div style={{ gridColumn: 'span 2' }}>
          <MlHydrologyPredictor
            userLocation={userLocation}
            onBroadcastAlert={handleBroadcastMlAlert}
          />
        </div>
      </section>

      {/* BOTTOM RESOURCE & VOLUNTEER STATUS BAR */}
      <section className="admin-resources-bar">
        <div className="res-bar-title">
          <Activity size={18} color="#3B82F6" />
          <h4>RESPONSE STATUS & RESOURCE INVENTORY</h4>
        </div>

        <div className="res-gauges-grid">
          <div className="gauge-item">
            <div className="gauge-top">
              <span>🚑 Ambulances</span>
              <strong>{resources.ambulances.active} / {resources.ambulances.total}</strong>
            </div>
            <div className="gauge-track">
              <div
                className="gauge-fill fill-blue"
                style={{ width: `${Math.round((resources.ambulances.active / resources.ambulances.total) * 100)}%` }}
              ></div>
            </div>
            <span className="sub-label">6 on Standby at Base</span>
          </div>

          <div className="gauge-item">
            <div className="gauge-top">
              <span>🚤 Rescue Boats</span>
              <strong>{resources.rescueBoats.active} / {resources.rescueBoats.total}</strong>
            </div>
            <div className="gauge-track">
              <div
                className="gauge-fill fill-cyan"
                style={{ width: `${Math.round((resources.rescueBoats.active / resources.rescueBoats.total) * 100)}%` }}
              ></div>
            </div>
            <span className="sub-label">Including Team Alpha Amphibian</span>
          </div>

          <div className="gauge-item">
            <div className="gauge-top">
              <span>👥 Registered Volunteers</span>
              <strong className="green-text">{resources.volunteers} Active</strong>
            </div>
            <div className="gauge-track">
              <div className="gauge-fill fill-green" style={{ width: '85%' }}></div>
            </div>
            <span className="sub-label">Red Cross & Civil Volunteers</span>
          </div>

          <div className="gauge-item">
            <div className="gauge-top">
              <span>🏠 Shelter Capacity</span>
              <strong>{resources.shelterCapacityPercent}% Filled</strong>
            </div>
            <div className="gauge-track">
              <div
                className="gauge-fill fill-orange"
                style={{ width: `${resources.shelterCapacityPercent}%` }}
              ></div>
            </div>
            <span className="sub-label">645 Beds Remaining</span>
          </div>
        </div>
      </section>

      {/* CREATE ALERT MODAL */}
      {showCreateAlertModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowCreateAlertModal(false)}>
          <div className="modal-card create-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header danger-header">
              <div className="title-with-icon">
                <Send size={22} />
                <div>
                  <h2>Create & Broadcast Alert</h2>
                  <p>Instantly broadcasts warning to Citizen Dashboard and field responders</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowCreateAlertModal(false)}>
                <X size={20} />
              </button>
            </div>

            {alertSuccessNotice ? (
              <div className="success-report-view animate-scale-up">
                <CheckCircle size={52} color="#10B981" />
                <h3>Alert Broadcasted to Citizens!</h3>
                <p>The emergency alert is now live on Citizen dashboards across Zone 3.</p>
              </div>
            ) : (
              <form onSubmit={handleSendAlert} className="alert-create-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Alert Type</label>
                    <select
                      value={newAlertType}
                      onChange={e => setNewAlertType(e.target.value)}
                      className="custom-select"
                    >
                      <option value="Flood Warning">🌊 Flood Warning</option>
                      <option value="Severe Fire Hazard">🔥 Severe Fire Hazard</option>
                      <option value="Landslide Warning">⛰️ Landslide Warning</option>
                      <option value="Heavy Rainfall">🌧️ Heavy Rainfall Advisory</option>
                      <option value="Cyclone / Wind Storm">🌀 Cyclone / Gale Wind Alert</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Zone</label>
                    <select
                      value={newAlertZone}
                      onChange={e => setNewAlertZone(e.target.value)}
                      className="custom-select"
                    >
                      <option value="Zone 3">🔴 Zone 3 (River Basin)</option>
                      <option value="Zone 5">🟠 Zone 5 (Arterial Bypass)</option>
                      <option value="Industrial Area">🟡 Industrial Sector 5</option>
                      <option value="All Zones">🌐 All Sectors (Citywide Broadcast)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Emergency Message</label>
                  <textarea
                    rows={4}
                    value={newAlertMsg}
                    onChange={e => setNewAlertMsg(e.target.value)}
                    placeholder="Enter urgent instructions, evacuation corridors, or shelter directions..."
                    className="custom-textarea"
                    required
                  />
                </div>

                <div className="broadcast-channels-check">
                  <span className="check-item">✓ Push to all Citizen Mobile Dashboards</span>
                  <span className="check-item">✓ Sync with District Responders</span>
                  <span className="check-item">✓ Publish to Emergency GIS Layer</span>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCreateAlertModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-send-broadcast">
                    <Send size={16} /> SEND ALERT TO CITIZENS
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 🚁 RECON DRONE LIVE COMPUTER VISION MODAL */}
      {showDroneCvModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowDroneCvModal(false)}>
          <div className="modal-card cv-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.3)', padding: '16px 22px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div className="title-with-icon">
                <span className="modal-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', padding: '6px 10px', borderRadius: '8px', fontSize: '1.4rem' }}>🚁</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                    Live Aerial Computer Vision Telemetry • RS-DRONE-01
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Autonomous Sector Reconnaissance & Stranded Civilian Detection
                  </p>
                </div>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setShowDroneCvModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="cv-modal-body-scroll">
              <CvSceneScanner initialPresetId="rooftop_trapped" />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* User Directory Management Modal */}
      <UserManagementModal
        isOpen={showUserMgmtModal}
        onClose={() => setShowUserMgmtModal(false)}
      />
    </div>
  );
}
