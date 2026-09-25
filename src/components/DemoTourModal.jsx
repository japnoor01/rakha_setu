import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDisaster } from '../context/DisasterContext';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Radio,
  Building,
  User,
  X
} from 'lucide-react';

export default function DemoTourModal({ isOpen, onClose }) {
  const {
    demoStep,
    setDemoStep,
    runNextDemoStep,
    resetDemo,
    setActiveTab,
    resources,
    responderTeam
  } = useDisaster();

  const [autoPlaying, setAutoPlaying] = useState(false);

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (autoPlaying && demoStep < 6) {
      timer = setTimeout(() => {
        runNextDemoStep();
      }, 3500);
    } else if (demoStep >= 6) {
      setAutoPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [autoPlaying, demoStep]);

  if (!isOpen) return null;

  const STEPS = [
    {
      num: 1,
      title: 'Admin Risk Analysis',
      role: 'Admin',
      icon: '🤖',
      desc: 'Admin inputs telemetry (180mm rainfall, 4.5m river gauge) into the AI model and triggers Risk Analysis.',
      result: 'Result: 🔴 HIGH RISK (87%) calculated with automated emergency recommendations.',
      actionText: 'Execute Step 1: Run Risk Analysis',
      actionRole: 'admin',
    },
    {
      num: 2,
      title: 'Create & Broadcast Alert',
      role: 'Admin',
      icon: '📢',
      desc: 'Command Center issues a high-priority "Flood Warning – Zone 3" alert to warning sirens, SMS, and citizen apps.',
      result: 'Alert dispatched across GIS layers and multi-channel notification buses.',
      actionText: 'Execute Step 2: Broadcast Alert',
      actionRole: 'admin',
    },
    {
      num: 3,
      title: 'Citizen Receives Alert',
      role: 'Citizen',
      icon: '👤',
      desc: 'Citizen dashboard immediately flashes the urgent ⚠️ ACTIVE ALERT: Flood Warning – Zone 3 banner with safety guidelines.',
      result: 'Citizen informed of rising waters and nearby evacuation shelter capacities.',
      actionText: 'Execute Step 3: Switch to Citizen View',
      actionRole: 'citizen',
    },
    {
      num: 4,
      title: 'Citizen Reports Emergency',
      role: 'Citizen',
      icon: '🚨',
      desc: 'Citizen clicks prominent [REPORT EMERGENCY] button for Riverdale Block 4 with 24 people stranded on rooftops.',
      result: 'Generated Incident ID: RS1024 dispatched to nearest emergency responders.',
      actionText: 'Execute Step 4: Submit SOS #RS1024',
      actionRole: 'citizen',
    },
    {
      num: 5,
      title: 'Responder Receives & Accepts Task',
      role: 'Responder',
      icon: '🚑',
      desc: 'NDRF Team Alpha terminal rings with new critical incident #RS1024. Team inspects boat/ambulance resources and clicks ACCEPT TASK.',
      result: 'Fast-response evacuation corridor plotted on map; team status changes to DEPLOYED.',
      actionText: 'Execute Step 5: Accept Response Task',
      actionRole: 'responder',
    },
    {
      num: 6,
      title: 'Admin Command Live Monitoring',
      role: 'Admin',
      icon: '🏛️',
      desc: 'Admin Command Center updates in real-time: Active Incidents increment to 13, and Team Alpha status changes from Available to Deployed.',
      result: 'Full situational awareness loop closed successfully!',
      actionText: 'Execute Step 6: View Command Sync',
      actionRole: 'admin',
    },
  ];

  const currentStepData = STEPS[Math.min(Math.max(0, demoStep - 1), 5)];

  return createPortal(
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-card demo-tour-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="demo-modal-header">
          <div className="title-area">
            <div className="sih-badge-pill">
              <Sparkles size={14} /> SIH 2026 OFFICIAL DEMO STORYLINE
            </div>
            <h2>End-to-End Interconnected Disaster Workflow</h2>
            <p className="storyline-formula">
              <strong>🤖 Predict</strong> → <strong>📢 Alert</strong> → <strong>👤 Report</strong> → <strong>🚑 Respond</strong> → <strong>🏛️ Monitor</strong>
            </p>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="stepper-track-wrapper">
          <div className="stepper-dots">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className={`step-circle ${demoStep === s.num ? 'current' : demoStep > s.num ? 'completed' : 'pending'}`}
                onClick={() => {
                  setDemoStep(s.num);
                  setActiveTab(s.actionRole);
                }}
              >
                <span className="step-num-text">{demoStep > s.num ? '✓' : s.num}</span>
                <span className="step-label-sub">{s.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Active Step Box */}
        <div className="step-detail-card animate-scale-up">
          <div className="step-card-header">
            <span className="step-icon-large">{currentStepData.icon}</span>
            <div>
              <span className="step-tag-pill">
                STEP {currentStepData.num} OF 6 • {currentStepData.role.toUpperCase()} PERSPECTIVE
              </span>
              <h3>{currentStepData.title}</h3>
            </div>
          </div>

          <p className="step-description">{currentStepData.desc}</p>

          <div className="step-result-callout">
            <strong>Key Outcome:</strong> {currentStepData.result}
          </div>

          {/* Live telemetry indicators for step 6 */}
          {demoStep >= 5 && (
            <div className="live-demo-stats-row">
              <div className="stat-box">
                <span>Active Incidents</span>
                <strong>{resources.activeIncidentsCount}</strong>
              </div>
              <div className="stat-box">
                <span>Team Alpha Status</span>
                <strong className={responderTeam.status === 'Deployed' ? 'amber-text' : 'green-text'}>
                  {responderTeam.status}
                </strong>
              </div>
              <div className="stat-box">
                <span>Task #RS1024</span>
                <strong className="blue-text">
                  {responderTeam.status === 'Deployed' ? 'Assigned to Alpha-1' : 'Awaiting'}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="demo-modal-footer">
          <button
            className="btn-reset-demo"
            onClick={() => {
              resetDemo();
              setAutoPlaying(false);
            }}
          >
            <RotateCcw size={15} /> Reset Baseline
          </button>

          <div className="next-actions-group">
            <button
              className={`btn-autoplay-demo ${autoPlaying ? 'active' : ''}`}
              onClick={() => setAutoPlaying(!autoPlaying)}
            >
              <Play size={15} /> {autoPlaying ? 'Pause Story' : 'Auto-Play 6 Steps'}
            </button>

            <button
              className="btn-next-step"
              onClick={() => {
                runNextDemoStep();
              }}
            >
              {demoStep === 0
                ? 'Start Step 1 (Admin Predict)'
                : demoStep >= 6
                ? 'Restart Demo Story'
                : `Next: Step ${demoStep + 1}`} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
