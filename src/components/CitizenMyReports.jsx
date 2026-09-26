import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Users,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Radio
} from 'lucide-react';

export default function CitizenMyReports({ refreshTrigger = 0 }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getMyReports();
      if (res.success) {
        setReports(res.reports || []);
        if (res.reports?.length > 0 && !selectedReport) {
          setSelectedReport(res.reports[0]);
        }
      }
    } catch (err) {
      console.warn('Failed loading my reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  return (
    <div className="citizen-my-reports-section animate-fade-in">
      <div className="reports-section-header">
        <div className="title-with-icon">
          <FileText size={20} className="text-red" />
          <div>
            <h3>📋 My Filed Emergency Reports &amp; SOS Tracker</h3>
            <p className="reports-sub">Real-time telemetry &amp; dispatch verification from NDRF Command</p>
          </div>
        </div>

        <button className="btn-refresh-reports" onClick={fetchReports} title="Refresh report statuses">
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          <span>Sync Status</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-reports-box">Connecting to National Disaster Incident Bus...</div>
      ) : reports.length === 0 ? (
        <div className="no-reports-box">
          <ShieldCheck size={32} className="text-green" />
          <h4>No Active Emergency Reports</h4>
          <p>You have not submitted any active SOS calls. If in danger, use the [REPORT EMERGENCY] button above.</p>
        </div>
      ) : (
        <div className="reports-tracker-grid">
          {/* Master Sidebar: List of Reports */}
          <div className="reports-list-cards" role="tablist" aria-label="Submitted Emergency Reports">
            {reports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              const isCritical = report.severity === 'Critical';
              return (
                <div
                  key={report.id}
                  className={`citizen-report-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedReport(report)}
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  <div className="card-top-row">
                    <span className="report-id-badge">#{report.id}</span>
                    <span
                      className={`status-pill-track ${
                        report.status === 'Resolved'
                          ? 'track-resolved'
                          : report.status === 'Accepted'
                          ? 'track-accepted'
                          : 'track-pending'
                      }`}
                    >
                      {report.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="report-card-title">{report.title}</h4>
                  <p className="report-card-desc">{report.description}</p>

                  <div className="card-meta-line">
                    <span>
                      <MapPin size={12} /> {report.location}
                    </span>
                    <span>
                      <Users size={12} /> {report.peopleAffected} people
                    </span>
                    <span>
                      <Clock size={12} /> {new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Report Status Inspector */}
          {selectedReport && (
            <div className="report-inspector-panel">
              <div className="inspector-head">
                <span className="inspector-badge">DISPATCH TRACKER • INCIDENT #{selectedReport.id}</span>
                <span className="inspector-type">{selectedReport.type}</span>
              </div>

              <div className="inspector-status-banner">
                <div className="status-label-group">
                  <span>Current Response State:</span>
                  <strong
                    className={
                      selectedReport.status === 'Resolved'
                        ? 'text-green'
                        : selectedReport.status === 'Accepted'
                        ? 'text-blue'
                        : 'text-orange'
                    }
                  >
                    {selectedReport.status === 'Accepted'
                      ? '⚡ RESCUE UNIT EN ROUTE (Accepted)'
                      : selectedReport.status === 'Resolved'
                      ? '✅ INCIDENT RESOLVED (All Safe)'
                      : '⏳ PENDING COMMAND DISPATCH'}
                  </strong>
                </div>

                {selectedReport.assignedTeamName && (
                  <div className="assigned-unit-box">
                    <Radio size={14} className="pulse-radio" />
                    <span>
                      Assigned Unit: <strong>{selectedReport.assignedTeamName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Lifecycle Progress Timeline */}
              <div className="status-timeline">
                <div className="timeline-step step-done">
                  <div className="timeline-dot">✓</div>
                  <div className="timeline-content">
                    <strong>1. Emergency Transmitted</strong>
                    <span>Received by Central Disaster Bus</span>
                  </div>
                </div>

                <div
                  className={`timeline-step ${
                    selectedReport.status === 'Accepted' || selectedReport.status === 'Resolved' ? 'step-done' : 'step-waiting'
                  }`}
                >
                  <div className="timeline-dot">
                    {selectedReport.status === 'Accepted' || selectedReport.status === 'Resolved' ? '✓' : '2'}
                  </div>
                  <div className="timeline-content">
                    <strong>2. Team Dispatched</strong>
                    <span>
                      {selectedReport.assignedTeamName
                        ? `${selectedReport.assignedTeamName} navigating high-ground corridor`
                        : 'Awaiting team assignment'}
                    </span>
                  </div>
                </div>

                <div className={`timeline-step ${selectedReport.status === 'Resolved' ? 'step-done' : 'step-waiting'}`}>
                  <div className="timeline-dot">{selectedReport.status === 'Resolved' ? '✓' : '3'}</div>
                  <div className="timeline-content">
                    <strong>3. Rescue & Evacuation Completed</strong>
                    <span>Evacuated to designated high-ground shelter</span>
                  </div>
                </div>
              </div>

              <div className="inspector-actions">
                <a href="tel:112" className="btn-call-emergency-direct">
                  📞 Connect Direct to Incident Commander (112)
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
