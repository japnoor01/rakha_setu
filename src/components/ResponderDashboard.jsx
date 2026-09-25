import React, { useState } from 'react';
import { useDisaster } from '../context/DisasterContext';
import InteractiveMap from './InteractiveMap';
import confetti from 'canvas-confetti';
import { calculateDistance } from '../utils/locationService';
import CvSceneScanner from './CvSceneScanner';
import {
  Navigation,
  CheckCircle2,
  Clock,
  Users,
  Radio,
  MapPin,
  Flame,
  Waves,
  ShieldCheck,
  ChevronRight,
  LifeBuoy,
  Scan,
  Eye,
  Camera
} from 'lucide-react';

export default function ResponderDashboard() {
  const {
    incidents,
    responderTeam,
    acceptTask,
    updateIncidentStatus,
    userLocation
  } = useDisaster();

  // Selected incident to view or focus
  const [selectedIncidentId, setSelectedIncidentId] = useState(
    responderTeam.currentTaskId || 'RS1024'
  );
  const [showRouteAnimation, setShowRouteAnimation] = useState(
    responderTeam.status === 'Deployed' || responderTeam.status === 'On Scene'
  );
  const [showCvBriefing, setShowCvBriefing] = useState(false);

  const activeTask = incidents.find(i => i.id === selectedIncidentId) || incidents[0];
  const isAccepted = responderTeam.status === 'Deployed' || responderTeam.status === 'On Scene' || activeTask?.status === 'Accepted';

  // Live geodesic ground distance from Team Alpha's base to target incident (Haversine formula)
  const distanceMeters = (responderTeam.location && activeTask?.coords)
    ? calculateDistance(
        responderTeam.location[0],
        responderTeam.location[1],
        activeTask.coords[0],
        activeTask.coords[1]
      )
    : 900;

  const distanceFormatted = distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : `${distanceMeters} m`;

  const estimatedMinutes = Math.max(2, Math.round(((distanceMeters / 1000) / 32) * 60)); // ~32 km/h response speed

  const handleAccept = () => {
    acceptTask(activeTask.id);
    setShowRouteAnimation(true);
  };

  const handleStatusAdvance = (nextStatus) => {
    updateIncidentStatus(activeTask.id, nextStatus);
    if (nextStatus === 'Resolved') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="responder-dashboard-container animate-fade-in">
      {/* Responder Header */}
      <header className="responder-header">
        <div className="header-left">
          <div className="team-callsign-badge">
            <Radio size={18} className="pulse-radio" />
            <span className="unit-label">CALLSIGN</span>
          </div>
          <div>
            <h1 className="responder-title">RAKSHA-SETU • {responderTeam.name}</h1>
            <p className="responder-sub">
              {responderTeam.specialty} • Stationed near {userLocation.area}
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className={`status-pill ${responderTeam.status === 'Available' ? 'status-available' : 'status-deployed'}`}>
            <span className="status-dot"></span>
            <span>STATUS: {responderTeam.status.toUpperCase()}</span>
          </div>

          <div className="responder-gps">
            <MapPin size={15} />
            <span>
              GPS: {responderTeam.location ? `${responderTeam.location[0].toFixed(4)}°N, ${responderTeam.location[1].toFixed(4)}°E` : 'LOCATING...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Responsive Layout */}
      <div className="responder-grid-layout">
        {/* LEFT COLUMN: ACTIVE INCIDENTS FEED */}
        <section className="incidents-sidebar">
          <div className="sidebar-header">
            <div className="title-row">
              <h3>🚨 ACTIVE INCIDENTS</h3>
              <span className="count-badge">{incidents.filter(i => i.status !== 'Resolved').length} Active</span>
            </div>
            <p className="sidebar-sub">Tap incident to inspect dispatch briefing & coordinates</p>
          </div>

          <div className="incidents-list-scroll">
            {incidents.map((incident) => {
              const isSelected = incident.id === selectedIncidentId;
              const isCritical = incident.severity === 'Critical';

              return (
                <div
                  key={incident.id}
                  className={`incident-item-card ${isSelected ? 'selected' : ''} ${isCritical ? 'critical-border' : ''}`}
                  onClick={() => {
                    setSelectedIncidentId(incident.id);
                    if (responderTeam.status === 'Deployed' && incident.id === responderTeam.currentTaskId) {
                      setShowRouteAnimation(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="incident-card-top">
                    <span className="incident-type-tag">
                      {incident.type === 'Flood' ? <Waves size={15} color="#38BDF8" /> : incident.type === 'Fire' ? <Flame size={15} color="#F97316" /> : '⚠️'}
                      <strong>{incident.type}</strong> – {incident.zone}
                    </span>
                    <span className={`severity-tag ${isCritical ? 'tag-critical' : incident.severity === 'High' ? 'tag-high' : 'tag-medium'}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="incident-title">{incident.title}</h4>
                  <p className="incident-desc-brief">{incident.description}</p>

                  <div className="incident-card-meta">
                    <span className="meta-item"><Users size={13} /> {incident.peopleAffected} affected</span>
                    <span className="meta-item"><Clock size={13} /> {incident.reportedAt}</span>
                    <span className={`status-badge-sm ${incident.status === 'Resolved' ? 'resolved' : incident.status === 'Accepted' ? 'accepted' : 'pending'}`}>
                      {incident.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Team Readiness Card */}
          <div className="team-readiness-card">
            <h4>📋 Team Roster & Gear</h4>
            <div className="roster-stats">
              <div><strong>8</strong> Responders Ready</div>
              <div><strong>1</strong> Amphibious Boat</div>
              <div><strong>3</strong> Sat-Comms Synced</div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: INCIDENT MAP & ASSIGNED TASK */}
        <section className="map-and-task-area">
          {/* 🗺️ INCIDENT MAP */}
          <div className="responder-map-panel">
            <div className="panel-header-bar">
              <div className="panel-title-with-pill">
                <h3>🗺️ INCIDENT MAP & FAST RESPONSE CORRIDOR</h3>
                <span className="geo-pill">SATELLITE TELEMETRY LIVE</span>
              </div>
              <div className="map-markers-summary">
                <span>📍 YOU (Team Alpha)</span>
                <span>🔴 Target Emergency</span>
                <span>🏠 Safe Shelters</span>
                <span>🚑 Other Units</span>
              </div>
            </div>

            <InteractiveMap
              mode="responder"
              height="360px"
              activeIncidentId={activeTask ? activeTask.id : null}
              showRoute={showRouteAnimation}
              targetDestination={activeTask ? activeTask.coords : null}
            />
          </div>

          {/* ⭐ ASSIGNED TASK & REQUIRED RESOURCES (Responder's Main Action) */}
          {activeTask && (
            <div className="task-action-panel">
              <div className="task-card-header">
                <div className="task-id-badge">
                  <span className="task-num">TASK #{activeTask.id}</span>
                  <span className="priority-pill priority-critical">
                    Priority: {activeTask.severity}
                  </span>
                </div>

                <div className="dispatch-time-indicator">
                  <Clock size={15} /> Reported: {activeTask.reportedAt}
                </div>
              </div>

              <div className="task-body-grid">
                {/* Task Details */}
                <div className="task-details-col">
                  <h3 className="task-headline">{activeTask.title}</h3>
                  <p className="task-full-desc">{activeTask.description}</p>

                  <div className="task-highlights-row">
                    <div className="highlight-cell">
                      <span className="cell-label">People Affected</span>
                      <span className="cell-value danger-text">
                        <Users size={16} /> {activeTask.peopleAffected} civilians stranded
                      </span>
                    </div>

                    <div className="highlight-cell">
                      <span className="cell-label">Target Zone</span>
                      <span className="cell-value">
                        <MapPin size={16} /> {activeTask.location}
                      </span>
                    </div>

                    <div className="highlight-cell">
                      <span className="cell-label">Assigned Status</span>
                      <span className="cell-value">
                        {activeTask.assignedTeam ? activeTask.assignedTeam : 'Awaiting Acceptance'}
                      </span>
                    </div>

                    <div className="highlight-cell">
                      <span className="cell-label">Distance to Target</span>
                      <span className="cell-value" style={{ color: '#38BDF8', fontWeight: 600 }}>
                        <Navigation size={15} style={{ display: 'inline', marginRight: 4 }} />
                        {distanceFormatted} (~{estimatedMinutes} min ETA)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 📦 Required Resources Card */}
                <div className="resources-needed-col">
                  <h4 className="res-title">📦 REQUIRED RESOURCES</h4>
                  <div className="resource-list-pills">
                    <div className="res-pill">
                      <span className="res-icon">🚑</span>
                      <span className="res-name">Ambulance:</span>
                      <span className="res-count">1 Unit</span>
                    </div>
                    <div className="res-pill">
                      <span className="res-icon">🚤</span>
                      <span className="res-name">Rescue Boat:</span>
                      <span className="res-count">1 Unit (Alpha-1)</span>
                    </div>
                    <div className="res-pill">
                      <span className="res-icon">🩹</span>
                      <span className="res-name">Medical Kit:</span>
                      <span className="res-count">5 Kits</span>
                    </div>
                  </div>
                  <p className="res-note">
                    ✓ Equipment verified onboard Team Alpha Rescue Vehicle.
                  </p>
                </div>
              </div>

              {/* 📸 COMPUTER VISION INCIDENT BRIEFING TOGGLE */}
              <div className="cv-responder-briefing-toggle-row" style={{ margin: '14px 0 6px 0' }}>
                <button
                  type="button"
                  className={`btn-toggle-cv-briefing ${showCvBriefing ? 'active' : ''}`}
                  onClick={() => setShowCvBriefing(!showCvBriefing)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    background: showCvBriefing ? '#38bdf8' : 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: showCvBriefing ? '#0f172a' : '#38bdf8',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Scan size={16} />
                  <span>
                    {showCvBriefing
                      ? 'Hide Computer Vision Scene Intel'
                      : '📸 View Computer Vision Tactical Recon & Water Depth Briefing'}
                  </span>
                </button>
              </div>

              {showCvBriefing && (
                <div className="cv-responder-briefing-container animate-fade-in" style={{ margin: '12px 0 16px 0' }}>
                  <CvSceneScanner
                    embeddedMode={true}
                    initialPresetId={activeTask.type === 'Flood' ? 'submerged_car' : 'embankment_breach'}
                  />
                </div>
              )}

              {/* ACTION BUTTONS & LIFECYCLE WORKFLOW (ACCEPT / UPDATE TASK) */}
              <div className="task-action-footer">
                {!isAccepted ? (
                  <div className="accept-task-action-wrapper">
                    {/* ⭐ RESPONDER DASHBOARD'S MAIN ACTION */}
                    <button
                      className="btn-accept-task pulse-btn"
                      onClick={handleAccept}
                    >
                      <LifeBuoy size={20} /> ACCEPT TASK & INITIATE DISPATCH
                    </button>
                    <button
                      className="btn-view-route-resp"
                      onClick={() => setShowRouteAnimation(true)}
                    >
                      <Navigation size={18} /> VIEW ROUTE (ETA 4 MINS)
                    </button>
                  </div>
                ) : (
                  <div className="accepted-workflow-controls">
                    <div className="workflow-status-indicator">
                      <span className="badge-accepted">
                        <CheckCircle2 size={16} /> TASK ACCEPTED & ACTIVE
                      </span>
                      <span className="eta-badge-live">
                        🚀 ETA TO ZONE 3: <strong>3 MINS</strong> (Corridor Clear)
                      </span>
                    </div>

                    {/* Stepper for advancing status */}
                    <div className="status-stepper-buttons">
                      <button
                        className={`step-btn ${activeTask.status === 'Accepted' ? 'active-step' : ''}`}
                        onClick={() => handleStatusAdvance('En Route')}
                      >
                        1. En Route <ChevronRight size={14} />
                      </button>

                      <button
                        className={`step-btn ${activeTask.status === 'En Route' ? 'active-step' : ''}`}
                        onClick={() => handleStatusAdvance('On Scene')}
                      >
                        2. On Scene (Rescue in Progress) <ChevronRight size={14} />
                      </button>

                      <button
                        className="step-btn resolve-btn"
                        onClick={() => handleStatusAdvance('Resolved')}
                      >
                        <ShieldCheck size={16} /> 3. Mark Civilians Rescued (Resolved)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
