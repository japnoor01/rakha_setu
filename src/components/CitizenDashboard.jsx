import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDisaster } from '../context/DisasterContext';
import InteractiveMap from './InteractiveMap';
import CvSceneScanner from './CvSceneScanner';
import { soundFx } from '../utils/audio';
import { generateCitizenSafetyAssessment } from '../utils/aiService';
import { api } from '../services/api';
import CitizenMyReports from './CitizenMyReports';
import {
  AlertTriangle,
  Home,
  MapPin,
  Bell,
  User,
  CheckCircle,
  Navigation,
  Phone,
  ShieldAlert,
  ArrowRight,
  X,
  Cpu,
  Sparkles,
  CheckSquare,
  Square,
  Waves,
  Zap,
  ShieldCheck,
  LifeBuoy,
  Scan,
  Camera
} from 'lucide-react';

export default function CitizenDashboard() {
  const {
    alerts,
    shelters,
    reportEmergency,
    language,
    setLanguage,
    userLocation,
    detectPresentLocation,
    locationStatus
  } = useDisaster();

  // Active view states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCvScannerModal, setShowCvScannerModal] = useState(false);
  const [showCvInReport, setShowCvInReport] = useState(false);
  const [cvSuccessNotice, setCvSuccessNotice] = useState(false);
  const [showShelterDrawer, setShowShelterDrawer] = useState(false);
  const [showAlertDetailsModal, setShowAlertDetailsModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null); // { id: 'RS1024' }
  const [selectedShelterForRoute, setSelectedShelterForRoute] = useState(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState('all');

  // Citizen AI Personal Safety Advisor State
  const [citizenAiInput, setCitizenAiInput] = useState({
    floorLevel: 'ground', // 'ground' | 'basement' | 'upper' | 'highrise'
    waterObservation: 'entering', // 'dry' | 'pooling' | 'entering' | 'deep'
    vulnerableMembers: ['elderly'], // 'elderly', 'infants', 'patients', 'pets'
  });

  const [citizenAiResult, setCitizenAiResult] = useState({
    source: 'Google Gemini 2.5 Flash / Hydrological Model',
    score: 86,
    level: 'CRITICAL DANGER – EVACUATE IMMEDIATELY',
    color: '#EF4444',
    headline: 'Evacuate immediately via elevated bypass toward Government Senior Model School before water exceeds 1 meter!',
    guidance: 'You are residing on the ground floor with flood water entering the premises. Because you have an elderly household member, water access will rapidly cut off safe mobility within the hour.',
    checklist: [
      'Switch off main electrical circuit breaker (MCB) and LPG cylinder valve',
      'Transfer elderly dependents and essential prescription medicines to higher dry elevation',
      'Pack waterproof emergency grab bag (Aadhaar/IDs, torch, power bank, drinking water)',
      'Follow flood-safe elevated corridor to Government Senior Model School (650m away)'
    ],
    evacuationTiming: 'Complete evacuation within 30-45 minutes before local underpasses become impassable.',
    shelterTarget: 'Government Senior Model School',
    shelterDistance: '650m away',
  });

  const [isAnalyzingCitizenRisk, setIsAnalyzingCitizenRisk] = useState(false);
  const [checkedChecklist, setCheckedChecklist] = useState([0]); // Item 0 checked by default

  // Form State initialized to present location
  const [disasterType, setDisasterType] = useState('Flood Rescue');
  const [location, setLocation] = useState(userLocation.address || 'Present Location');
  const [severity, setSeverity] = useState('Critical');
  const [description, setDescription] = useState('Water level rapidly rising. 24 people trapped on building roof.');
  const [peopleAffected, setPeopleAffected] = useState(24);

  // Sync form location when userLocation updates
  React.useEffect(() => {
    if (userLocation.address) {
      setLocation(userLocation.address);
    }
  }, [userLocation.address]);

  // Active top alert
  const primaryAlert = alerts.find(a => a.active) || alerts[0];

  const handleSubmitEmergency = async (e) => {
    e.preventDefault();
    const id = reportEmergency({
      disasterType,
      location,
      severity,
      description,
      peopleAffected,
      coords: [userLocation.lat, userLocation.lng]
    });

    try {
      await api.reportDisaster({
        title: `${disasterType} at ${location}`,
        disasterType,
        location,
        severity,
        description,
        peopleAffected: Number(peopleAffected) || 1,
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    } catch (err) {
      console.warn('API report persistence warning:', err);
    }

    setReportSuccess({ id });
    setTimeout(() => {
      setShowReportModal(false);
    }, 2800);
  };

  const handleRunCitizenAiAnalysis = async () => {
    setIsAnalyzingCitizenRisk(true);
    soundFx.playAiAnalyze();

    try {
      const savedKey = localStorage.getItem('RAKSHA_GEMINI_KEY');
      const assessment = await generateCitizenSafetyAssessment({
        locationName: userLocation.area || 'Present Sector',
        lat: userLocation.lat,
        lng: userLocation.lng,
        floorLevel: citizenAiInput.floorLevel,
        waterObservation: citizenAiInput.waterObservation,
        vulnerableMembers: citizenAiInput.vulnerableMembers,
        nearestShelter: shelters && shelters.length > 0 ? shelters[0] : null,
        activeAlert: primaryAlert,
        geminiApiKey: savedKey,
        language,
      });

      setCitizenAiResult(assessment);
      soundFx.playSuccess();
    } catch (err) {
      console.warn('Citizen AI assessment error:', err);
    } finally {
      setIsAnalyzingCitizenRisk(false);
    }
  };

  const toggleChecklist = (index) => {
    setCheckedChecklist(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleVulnerableMember = (member) => {
    setCitizenAiInput(prev => ({
      ...prev,
      vulnerableMembers: prev.vulnerableMembers.includes(member)
        ? prev.vulnerableMembers.filter(m => m !== member)
        : [...prev.vulnerableMembers, member]
    }));
  };

  const isHindi = language === 'hi';

  return (
    <div className="citizen-dashboard-container animate-fade-in">
      {/* Top Citizen Header Bar */}
      <header className="citizen-header">
        <div className="header-brand">
          <span className="brand-badge-icon">🚨</span>
          <div>
            <h2 className="brand-title">RAKSHA-SETU</h2>
            <span className="brand-sub">
              {isHindi ? 'नागरिक सुरक्षा एवं आपदा सहायता पोर्टल' : 'Citizen Safety & Disaster Relief Portal'}
            </span>
          </div>
        </div>

        <div className="header-actions">
          {/* Live Present Location GPS Indicator */}
          <div
            className="live-gps-pill cursor-pointer"
            onClick={detectPresentLocation}
            title="Click to detect & refresh present GPS location"
          >
            <span className="gps-dot"></span>
            <span>
              📍 {isHindi ? 'वर्तमान स्थान:' : 'GPS:'} <strong>{userLocation.area ? `${userLocation.area}` : 'Detecting GPS...'}</strong>
            </span>
            <button
              className="btn-refresh-gps"
              onClick={(e) => {
                e.stopPropagation();
                detectPresentLocation();
              }}
              title="Refresh present location"
            >
              {locationStatus === 'detecting' ? '⌛' : '🔄'}
            </button>
          </div>

          <button
            className="lang-toggle-btn"
            onClick={() => setLanguage(isHindi ? 'en' : 'hi')}
            title="Toggle Language / भाषा बदलें"
          >
            🌐 {isHindi ? 'English' : 'हिंदी'}
          </button>

          <button className="icon-btn" title="Emergency Notifications">
            <Bell size={18} />
            <span className="notification-dot"></span>
          </button>

          <div className="profile-pill">
            <User size={16} />
            <span>{isHindi ? 'नागरिक' : 'Citizen'}</span>
          </div>
        </div>
      </header>

      {/* ⚠️ ACTIVE ALERT BANNER (Prominently placed as requested) */}
      {primaryAlert && (
        <section className="active-alert-banner pulse-glow">
          <div className="alert-content-left">
            <div className="alert-pill-tag">
              <AlertTriangle size={18} className="alert-icon-anim" />
              <span>{isHindi ? '⚠️ सक्रिय चेतावनी' : '⚠️ Active Alert'}</span>
            </div>
            <h2 className="alert-headline">{primaryAlert.title}</h2>
            <p className="alert-body-text">{primaryAlert.desc}</p>
          </div>
          <div className="alert-actions-right">
            <a href="tel:112" className="btn-call-helpline" aria-label="Immediate 112 SOS Emergency Call">
              <Phone size={15} /> 112 SOS
            </a>
            <button
              className="btn-alert-details"
              onClick={() => setShowAlertDetailsModal(true)}
              aria-label="View Alert Details"
            >
              {isHindi ? 'विवरण देखें' : 'View Details'} <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* Citizen Reported Emergency Notification Status Banner (if just reported) */}
      {reportSuccess && (
        <div className="emergency-dispatched-card animate-slide-down">
          <div className="dispatch-header">
            <CheckCircle className="check-icon" size={24} />
            <div>
              <h3>{isHindi ? 'आपातकाल सफलतापूर्वक दर्ज किया गया' : 'Emergency Reported Successfully'}</h3>
              <p className="incident-mono">Incident ID: <strong>{reportSuccess.id}</strong></p>
            </div>
          </div>
          <p className="dispatch-desc">
            {isHindi
              ? 'आपकी आपातकालीन रिपोर्ट एनडीआरएफ टीम अल्फा और नियंत्रण कक्ष को प्रेषित कर दी गई है। निकटतम बचाव नौका रवाना हो चुकी है।'
              : 'Your SOS signal has been dispatched to NDRF Team Alpha & Central Command. Relief units are en route.'}
          </p>
          <div className="eta-badge">
            <span>⚡ {isHindi ? 'अनुमानित आगमन समय' : 'Estimated Arrival'}: <strong>4-7 mins</strong></span>
          </div>
        </div>
      )}

      {/* 3 QUICK ACTION CARDS (Report Emergency, Find Shelter, Safe Zones) */}
      <section className="quick-actions-grid">
        {/* ⭐ 1. REPORT EMERGENCY (VISUALLY PROMINENT BUTTON) */}
        <div
          className="action-card report-emergency-card"
          onClick={() => {
            setShowReportModal(true);
            setReportSuccess(null);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="card-badge pulse-badge">
            {isHindi ? 'तत्काल कार्रवाई' : 'MAIN ACTION'}
          </div>
          <div className="action-icon-wrapper danger-glow">
            <span className="big-symbol">🚨</span>
          </div>
          <div className="action-text">
            <h3>{isHindi ? 'आपातकाल रिपोर्ट करें' : 'Report Emergency'}</h3>
            <p>{isHindi ? 'फंसे लोगों, बाढ़ या आग की सूचना तुरंत भेजें' : 'Report trapped people, flood water, or urgent SOS'}</p>
          </div>
          <button className="btn-primary-sos">
            <ShieldAlert size={18} /> {isHindi ? 'आपातकालीन सहायता मांगें' : 'Request Immediate Help'}
          </button>
        </div>

        {/* 2. FIND SHELTER */}
        <div
          className="action-card shelter-card"
          onClick={() => setShowShelterDrawer(true)}
          role="button"
          tabIndex={0}
        >
          <div className="card-badge safe-badge">
            {shelters.reduce((acc, s) => acc + s.available, 0)} {isHindi ? 'स्थान उपलब्ध' : 'Beds Open'}
          </div>
          <div className="action-icon-wrapper shelter-glow">
            <span className="big-symbol">🏠</span>
          </div>
          <div className="action-text">
            <h3>{isHindi ? 'आश्रय खोजें' : 'Find Shelter'}</h3>
            <p>{isHindi ? 'निकटतम सुरक्षित राहत शिविर और भोजन केंद्र' : 'Locate nearby designated safe camps & food relief'}</p>
          </div>
          <div className="shelter-preview-pill">
            <span>🏫 {isHindi ? 'राजकीय विद्यालय: 180 उपलब्ध' : 'Govt School: 180 available'}</span>
          </div>
        </div>

        {/* 3. SAFE ZONES */}
        <div
          className="action-card safe-zones-card"
          onClick={() => {
            setActiveZoneFilter(activeZoneFilter === 'safe' ? 'all' : 'safe');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="card-badge info-badge">
            {isHindi ? 'लाइव जीआईएस' : 'LIVE GIS'}
          </div>
          <div className="action-icon-wrapper safe-glow">
            <span className="big-symbol">🗺️</span>
          </div>
          <div className="action-text">
            <h3>{isHindi ? 'सुरक्षित क्षेत्र' : 'Safe Zones'}</h3>
            <p>{isHindi ? 'ग्रीन सुरक्षित जोन और लाल खतरे वाले क्षेत्रों का नक्शा' : 'Color-coded danger and safe evacuation sectors'}</p>
          </div>
          <div className="zone-status-pills">
            <span className="z-pill z-red">🔴 {isHindi ? 'जोन 3: खतरा' : 'Zone 3: Danger'}</span>
            <span className="z-pill z-green">🟢 {isHindi ? 'जोन 1/2: सुरक्षित' : 'Zone 1/2: Safe'}</span>
          </div>
        </div>

        {/* 4. ⭐ AI COMPUTER VISION SCENE & DAMAGE SCANNER */}
        <div
          className="action-card cv-quick-action-card"
          onClick={() => setShowCvScannerModal(true)}
          role="button"
          tabIndex={0}
        >
          <div className="card-badge" style={{ background: '#0284c7', color: '#fff' }}>
            {isHindi ? 'कंप्यूटर विज़न' : 'Computer Vision'}
          </div>
          <div className="action-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.25)', border: '1px solid #38bdf8' }}>
            <span className="big-symbol">📸</span>
          </div>
          <div className="action-text">
            <h3>{isHindi ? 'एआई फोटो व क्षति स्कैनर' : 'AI Photo & Damage Scanner'}</h3>
            <p>{isHindi ? 'तस्वीर स्कैन कर जल-स्तर व फंसे लोगों का पता लगाएं' : 'Scan flood photos to detect stranded civilians & water depth'}</p>
          </div>
          <button
            type="button"
            className="btn-primary-cv"
            onClick={(e) => {
              e.stopPropagation();
              setShowCvScannerModal(true);
            }}
          >
            <Scan size={18} /> {isHindi ? 'कैमरा व फोटो स्कैन करें' : 'Scan Photo with AI'}
          </button>
        </div>
      </section>

      {/* 🤖 CITIZEN PERSONAL AI SAFETY & EVACUATION ADVISOR */}
      <section className="citizen-ai-advisor-section">
        <div className="ai-advisor-card">
          <div className="advisor-header-row">
            <div className="advisor-title-wrap">
              <div className="ai-advisor-icon-pulse">
                <Cpu size={22} className="ai-icon-neon" />
              </div>
              <div>
                <div className="advisor-badge-pill">
                  <Sparkles size={13} className="text-cyan" />
                  <span>{isHindi ? 'जेमिनी 2.5 फ्लैश और हाइड्रोलॉजिकल एआई द्वारा संचालित' : 'Powered by Gemini 2.5 Flash & Hydromet ML'}</span>
                </div>
                <h3 className="advisor-title">
                  🤖 {isHindi ? 'एआई व्यक्तिगत सुरक्षा एवं जोखिम सलाहकार' : 'AI Personal Safety & Evacuation Advisor'}
                </h3>
                <p className="advisor-subtitle">
                  {isHindi
                    ? 'आपके निवास स्थल, जलस्तर और परिवार की स्थिति के आधार पर स्वचालित व्यक्तिगत सुरक्षा मूल्यांकन'
                    : 'Personalized survival intelligence & evacuation timing calculated for your household'}
                </p>
              </div>
            </div>

            <div className="advisor-top-right">
              <button
                className={`btn-run-citizen-ai ${isAnalyzingCitizenRisk ? 'analyzing' : ''}`}
                onClick={handleRunCitizenAiAnalysis}
                disabled={isAnalyzingCitizenRisk}
                title="Re-run AI risk assessment with current inputs"
              >
                <Zap size={16} />
                <span>{isAnalyzingCitizenRisk ? (isHindi ? 'विश्लेषण जारी...' : 'Analyzing Household Risk...') : (isHindi ? 'सुरक्षा का विश्लेषण करें' : 'Analyze My Risk')}</span>
              </button>
            </div>
          </div>

          {/* Interactive Household Condition Selectors */}
          <div className="advisor-inputs-bar">
            <div className="input-group-col">
              <label>🏠 {isHindi ? 'आपकी मंजिल / आवास:' : 'Living Floor:'}</label>
              <select
                value={citizenAiInput.floorLevel}
                onChange={(e) => setCitizenAiInput({ ...citizenAiInput, floorLevel: e.target.value })}
                className="ai-citizen-select"
              >
                <option value="ground">{isHindi ? 'ग्राउंड फ्लोर (उच्च जोखिम)' : 'Ground Floor (High Risk)'}</option>
                <option value="basement">{isHindi ? 'बेसमेंट (अत्यधिक जोखिम)' : 'Basement (Extreme Risk)'}</option>
                <option value="upper">{isHindi ? '1ली - 2री मंजिल (मध्यम)' : '1st / 2nd Floor (Moderate)'}</option>
                <option value="highrise">{isHindi ? 'ऊपरी मंजिल / बहुमंजिला (सुरक्षित)' : 'High-rise 3rd+ Floor (Safe)'}</option>
              </select>
            </div>

            <div className="input-group-col">
              <label>🌊 {isHindi ? 'घर के बाहर जलभराव:' : 'Outside Water Level:'}</label>
              <select
                value={citizenAiInput.waterObservation}
                onChange={(e) => setCitizenAiInput({ ...citizenAiInput, waterObservation: e.target.value })}
                className="ai-citizen-select"
              >
                <option value="entering">{isHindi ? 'पानी परिसर में आ रहा है (+0.5m)' : 'Water Entering Compound (+0.5m)'}</option>
                <option value="deep">{isHindi ? 'गंभीर जलभराव (+1.2m)' : 'Street Submerged / Deep (+1.2m)'}</option>
                <option value="pooling">{isHindi ? 'सड़क पर पानी जमा हो रहा है' : 'Water Pooling on Street'}</option>
                <option value="dry">{isHindi ? 'सूखा / केवल वर्षा' : 'Dry / Rain Only'}</option>
              </select>
            </div>

            <div className="input-group-col full-width-span">
              <label id="vulnerable-members-label">👥 {isHindi ? 'संवेदनशील पारिवारिक सदस्य:' : 'Vulnerable Members:'}</label>
              <div className="vulnerable-chips-row" role="group" aria-labelledby="vulnerable-members-label">
                <button
                  type="button"
                  role="button"
                  aria-pressed={citizenAiInput.vulnerableMembers.includes('elderly')}
                  className={`chip-toggle ${citizenAiInput.vulnerableMembers.includes('elderly') ? 'chip-active' : ''}`}
                  onClick={() => toggleVulnerableMember('elderly')}
                >
                  {citizenAiInput.vulnerableMembers.includes('elderly') && <span className="chip-check-icon">✓ </span>}
                  👴 {isHindi ? 'बुजुर्ग' : 'Elderly'}
                </button>
                <button
                  type="button"
                  role="button"
                  aria-pressed={citizenAiInput.vulnerableMembers.includes('infants')}
                  className={`chip-toggle ${citizenAiInput.vulnerableMembers.includes('infants') ? 'chip-active' : ''}`}
                  onClick={() => toggleVulnerableMember('infants')}
                >
                  {citizenAiInput.vulnerableMembers.includes('infants') && <span className="chip-check-icon">✓ </span>}
                  👶 {isHindi ? 'शिशु' : 'Infant'}
                </button>
                <button
                  type="button"
                  role="button"
                  aria-pressed={citizenAiInput.vulnerableMembers.includes('patients')}
                  className={`chip-toggle ${citizenAiInput.vulnerableMembers.includes('patients') ? 'chip-active' : ''}`}
                  onClick={() => toggleVulnerableMember('patients')}
                >
                  {citizenAiInput.vulnerableMembers.includes('patients') && <span className="chip-check-icon">✓ </span>}
                  🏥 {isHindi ? 'मरीज' : 'Patient'}
                </button>
                <button
                  type="button"
                  role="button"
                  aria-pressed={citizenAiInput.vulnerableMembers.includes('pets')}
                  className={`chip-toggle ${citizenAiInput.vulnerableMembers.includes('pets') ? 'chip-active' : ''}`}
                  onClick={() => toggleVulnerableMember('pets')}
                >
                  {citizenAiInput.vulnerableMembers.includes('pets') && <span className="chip-check-icon">✓ </span>}
                  🐾 {isHindi ? 'पालतू' : 'Pets'}
                </button>
              </div>
            </div>
          </div>

          {/* AI Result Card Display */}
          <div className="citizen-ai-result-panel" style={{ borderColor: citizenAiResult.color }}>
            <div className="result-top-status-bar">
              <div className="status-threat-pill" style={{ background: `${citizenAiResult.color}25`, borderColor: citizenAiResult.color }}>
                <span className="dot-pulse" style={{ background: citizenAiResult.color }}></span>
                <strong style={{ color: citizenAiResult.color }}>{citizenAiResult.level}</strong>
              </div>

              <div className="danger-score-badge">
                <span>{isHindi ? 'जोखिम प्रायिकता:' : 'Danger Index:'}</span>
                <strong style={{ color: citizenAiResult.color }}>{citizenAiResult.score}%</strong>
              </div>

              <div className="model-source-tag">
                <span>{citizenAiResult.source}</span>
              </div>
            </div>

            {/* Headline Callout */}
            <div className="ai-headline-box">
              <ShieldAlert size={20} style={{ color: citizenAiResult.color, flexShrink: 0 }} />
              <div>
                <strong>{citizenAiResult.headline}</strong>
                <p className="evac-timing-note">⏱️ {citizenAiResult.evacuationTiming}</p>
              </div>
            </div>

            {/* Explanation / Guidance */}
            <p className="ai-guidance-paragraph">{citizenAiResult.guidance}</p>

            {/* Interactive Safety Checklist */}
            <div className="ai-checklist-container">
              <div className="checklist-heading">
                <ShieldCheck size={16} className="text-emerald" />
                <span>{isHindi ? 'व्यक्तिगत आपातकालीन सुरक्षा सूची (चेक करें):' : 'Personal Action Checklist (Mark completed):'}</span>
              </div>

              <div className="checklist-items-grid">
                {citizenAiResult.checklist.map((item, idx) => {
                  const isDone = checkedChecklist.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`checklist-item-row ${isDone ? 'item-checked' : ''}`}
                      onClick={() => toggleChecklist(idx)}
                    >
                      {isDone ? (
                        <CheckSquare size={18} className="check-icon-done" />
                      ) : (
                        <Square size={18} className="check-icon-empty" />
                      )}
                      <span className="checklist-text">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1-Click Action Buttons */}
            <div className="ai-action-buttons-row">
              <button
                className="btn-ai-evac-route"
                onClick={() => {
                  if (shelters && shelters.length > 0) {
                    setSelectedShelterForRoute(shelters[0]);
                    const el = document.getElementById('citizen-map-anchor');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Navigation size={16} />
                <span>{isHindi ? 'सुरक्षित आश्रय मार्ग देखें' : 'Plot Flood-Safe Route to Shelter'}</span>
              </button>

              <button
                className="btn-ai-sos-report"
                onClick={() => {
                  setDescription(
                    `${citizenAiInput.floorLevel.toUpperCase()} FLOOR in ${userLocation.area}. Water observation: ${citizenAiInput.waterObservation}. Dependents: ${citizenAiInput.vulnerableMembers.join(', ')}. AI Danger Score: ${citizenAiResult.score}% (${citizenAiResult.level}). Urgent rescue required.`
                  );
                  setShowReportModal(true);
                  setReportSuccess(null);
                }}
              >
                <LifeBuoy size={16} />
                <span>{isHindi ? 'एआई जोखिम विवरण के साथ SOS भेजें' : 'Send SOS with AI Assessment'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 📋 MY SUBMITTED INCIDENTS & EMERGENCY REPORT TRACKER */}
      <CitizenMyReports onNewReportClick={() => setShowReportModal(true)} />

      {/* INTERACTIVE MAP CONTAINER */}
      <section className="citizen-map-section" id="citizen-map-anchor">
        <div className="section-header-row">
          <div>
            <div className="map-badge-tag">
              <span className="live-dot-green"></span>
              <span>Live GIS Satellite Telemetry</span>
            </div>
            <h3 className="section-title">
              🗺️ {isHindi ? 'लाइव सुरक्षा एवं राहत मानचित्र' : 'Live Safety & Relief Map'}
            </h3>
            <span className="section-sub">
              {isHindi ? 'उच्च-रिज़ॉल्यूशन उपग्रह मानचित्र, बाढ़ जलस्तर सेंसर (IoT), और बाढ़-मुक्त सुरक्षित निकासी गलियारा' : 'High-resolution satellite imagery, real-time Doppler radar, IoT water surge sensors, and safe evacuation corridors'}
            </span>
          </div>

          <div className="map-action-buttons-top">
            <button
              className="btn-quick-evac-route"
              onClick={() => {
                if (shelters && shelters.length > 0) {
                  setSelectedShelterForRoute(shelters[0]);
                }
              }}
              title="Calculate safest high-ground route avoiding all flood inundated zones"
            >
              <Navigation size={16} />
              <span>{isHindi ? 'निकटतम आश्रय का सुरक्षित मार्ग' : 'Route to Closest Shelter'}</span>
            </button>
          </div>
        </div>

        <InteractiveMap
          mode="citizen"
          height="520px"
          showRoute={Boolean(selectedShelterForRoute)}
          targetDestination={selectedShelterForRoute ? selectedShelterForRoute.coords : null}
          onSelectShelter={(shelter) => setSelectedShelterForRoute(shelter)}
        />

        {selectedShelterForRoute && (
          <div className="route-active-card">
            <div className="route-header-bar">
              <div className="route-info">
                <Navigation className="nav-arrow" size={22} />
                <div>
                  <strong>{isHindi ? 'सुरक्षित निकासी मार्ग सक्रिय:' : 'Flood-Safe Evacuation Corridor Active:'} {selectedShelterForRoute.name}</strong>
                  <p>1.2 km • {isHindi ? 'लगभग 4 मिनट सुरक्षित दूरी • उच्च-स्तरीय फ्लाईओवर मार्ग (बाढ़-मुक्त)' : '~4 mins via Elevated Bypass (+18m MSL) • Zero Submerged Crossings'}</p>
                </div>
              </div>
              <button
                className="btn-clear-route"
                onClick={() => setSelectedShelterForRoute(null)}
              >
                <X size={16} /> {isHindi ? 'मार्ग हटाएं' : 'Clear Route'}
              </button>
            </div>

            {/* Turn-by-Turn Waypoint Steps */}
            <div className="evac-waypoints-steps">
              <div className="step-node">
                <div className="step-badge">1</div>
                <div className="step-desc">
                  <strong>{isHindi ? 'प्रारंभ: वर्तमान स्थान' : 'Origin: Present Location'}</strong>
                  <span>Head North on High-Ground Arterial Road (450m)</span>
                </div>
              </div>
              <div className="step-node safe-elevated">
                <div className="step-badge">2</div>
                <div className="step-desc">
                  <strong>{isHindi ? 'फ्लाईओवर क्रॉसिंग (+18m MSL)' : 'Elevated Flyover Bypass (+18m MSL)'}</strong>
                  <span>Avoid Low Underpass (1.2m waterlogged); stay on upper carriage-way (600m)</span>
                </div>
              </div>
              <div className="step-node destination">
                <div className="step-badge">3</div>
                <div className="step-desc">
                  <strong>{isHindi ? 'गंतव्य: सुरक्षित राहत शिविर' : 'Destination: Verified Shelter'}</strong>
                  <span>Arrive at {selectedShelterForRoute.name} — {selectedShelterForRoute.available} Free Beds (150m)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* LOWER SECTION: Recent Alerts & Quick Shelters Grid */}
      <section className="citizen-bottom-grid">
        {/* RECENT ALERTS */}
        <div className="card-box recent-alerts-box">
          <div className="box-header">
            <h3>📢 {isHindi ? 'हालिया आपातकालीन चेतावनियां' : 'Recent Alerts'}</h3>
            <span className="status-live">LIVE</span>
          </div>
          <div className="alerts-list">
            <div className="alert-item alert-item-critical">
              <div className="item-dot dot-red"></div>
              <div className="item-text">
                <div className="item-title-row">
                  <strong>🔴 {isHindi ? 'बाढ़ की चेतावनी – जोन 3' : 'Flood Alert – Zone 3'}</strong>
                  <span className="time-tag">10m ago</span>
                </div>
                <p>{isHindi ? 'यमुना नदी का जलस्तर खतरे के निशान (205.33 मी) से ऊपर पहुंचा।' : 'River Yamuna has crossed danger mark (205.33m). Evacuation underway.'}</p>
              </div>
            </div>

            <div className="alert-item alert-item-warning">
              <div className="item-dot dot-orange"></div>
              <div className="item-text">
                <div className="item-title-row">
                  <strong>🟠 {isHindi ? 'भारी वर्षा – जोन 5' : 'Heavy Rain – Zone 5'}</strong>
                  <span className="time-tag">45m ago</span>
                </div>
                <p>{isHindi ? 'अगले 3 घंटों में 95 मिमी से अधिक वर्षा का अनुमान। अंडरपास से बचें।' : 'Over 95mm precipitation expected in next 3 hours. Avoid underpasses.'}</p>
              </div>
            </div>

            <div className="alert-item alert-item-info">
              <div className="item-dot dot-green"></div>
              <div className="item-text">
                <div className="item-title-row">
                  <strong>🟢 {isHindi ? 'राहत शिविर सक्रिय – जोन 1 एवं 2' : 'Relief Camps Activated – Zone 1 & 2'}</strong>
                  <span className="time-tag">1h ago</span>
                </div>
                <p>{isHindi ? 'राजकीय विद्यालय व खेल परिसर में निःशुल्क भोजन, चिकित्सा व आश्रय उपलब्ध।' : 'Free meals, medical aid, and shelter opened at Govt School & Sports Arena.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NEARBY SHELTERS QUICK LIST */}
        <div className="card-box nearby-shelters-box">
          <div className="box-header">
            <h3>🏠 {isHindi ? 'निकटतम राहत शिविर' : 'Nearby Shelters'}</h3>
            <button
              className="link-btn"
              onClick={() => setShowShelterDrawer(true)}
            >
              {isHindi ? 'सभी देखें' : 'View All (3)'} →
            </button>
          </div>

          <div className="shelters-compact-list">
            {shelters.slice(0, 2).map((shelter) => (
              <div key={shelter.id} className="shelter-compact-card">
                <div className="shelter-head">
                  <h4>{shelter.name}</h4>
                  <span className="distance-badge">{shelter.distance}</span>
                </div>
                <div className="shelter-stats">
                  <div>
                    <span className="stat-label">{isHindi ? 'कुल क्षमता:' : 'Capacity:'}</span>
                    <span className="stat-val">{shelter.capacity}</span>
                  </div>
                  <div>
                    <span className="stat-label">{isHindi ? 'उपलब्ध:' : 'Available:'}</span>
                    <span className="stat-val highlight-green">{shelter.available}</span>
                  </div>
                </div>
                <div className="shelter-actions">
                  <button
                    className="btn-view-route"
                    onClick={() => {
                      setSelectedShelterForRoute(shelter);
                      window.scrollTo({ top: 320, behavior: 'smooth' });
                    }}
                  >
                    <Navigation size={14} /> {isHindi ? 'रास्ता देखें' : 'VIEW ROUTE'}
                  </button>
                  <a href={`tel:${shelter.contact}`} className="btn-call-shelter">
                    <Phone size={13} /> {isHindi ? 'संपर्क करें' : 'Call Desk'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL: REPORT EMERGENCY FORM (Prominent Feature) */}
      {showReportModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowReportModal(false)}>
          <div className={`modal-card report-modal-card ${showCvInReport ? 'expanded-cv-modal' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header danger-header">
              <div className="title-with-icon">
                <span className="modal-icon">🚨</span>
                <div>
                  <h2>{isHindi ? 'आपातकालीन सहायता अनुरोध दर्ज करें' : 'Report Emergency / SOS'}</h2>
                  <p>{isHindi ? 'यह सूचना सीधे एनडीआरएफ और कमांड सेंटर तक पहुंचेगी' : 'Direct dispatch to NDRF Responder Teams & Command Center'}</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowReportModal(false)}>
                <X size={20} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="success-report-view animate-scale-up">
                <div className="success-icon-ring">
                  <CheckCircle size={54} color="#10B981" />
                </div>
                <h3>{isHindi ? '✅ आपातकाल सफलतापूर्वक दर्ज किया गया' : '✅ Emergency Reported Successfully'}</h3>
                <div className="incident-id-box">
                  <span className="label">INCIDENT ID</span>
                  <span className="id-code">{reportSuccess.id}</span>
                </div>
                <p className="instruction">
                  {isHindi
                    ? 'आपकी सहायता के लिए टीम अल्फा (NDRF) को रवाना किया गया है। कृपया सुरक्षित ऊंचे स्थान पर रहें और फोन चालू रखें।'
                    : 'Rescue Team Alpha (NDRF) has received your request. Stay on higher ground. A rescue boat is proceeding toward your sector.'}
                </p>
                <div className="helpline-alert">
                  <span>📞 {isHindi ? 'तत्काल पुलिस/आपदा हेल्पलाइन:' : 'Emergency Helpline:'} <strong>112 / 1070</strong></span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEmergency} className="report-form">
                {/* 📸 AI COMPUTER VISION SCENE SCANNER ASSISTANT */}
                <div className="cv-report-assistant-banner">
                  <div className="cv-banner-left">
                    <span className="cv-badge-sm">📸 AI VISION</span>
                    <span>{isHindi ? 'घटना स्थल की तस्वीर स्कैन करें' : 'Scan Disaster Photo with Computer Vision'}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-toggle-cv-inline"
                    onClick={() => setShowCvInReport(!showCvInReport)}
                  >
                    <Scan size={14} /> {showCvInReport ? (isHindi ? 'स्कैनर छुपाएं' : 'Hide Scanner') : (isHindi ? 'फोटो स्कैन करें व ऑटो-फिल करें' : 'Scan Photo & Auto-Fill Form')}
                  </button>
                </div>

                {showCvInReport && (
                  <div className="cv-inline-scanner-container animate-fade-in">
                    <CvSceneScanner
                      embeddedMode={true}
                      onApplyToReport={(cvData) => {
                        setDisasterType(cvData.disasterType);
                        setSeverity(cvData.severity);
                        setPeopleAffected(cvData.peopleAffected);
                        setDescription(cvData.description);
                        setShowCvInReport(false);
                        setCvSuccessNotice(true);
                      }}
                    />
                  </div>
                )}

                {cvSuccessNotice && (
                  <div className="cv-auto-filled-alert animate-fade-in">
                    <span>✨ <strong>{isHindi ? 'AI कंप्यूटर विज़न द्वारा विवरण भरा गया:' : 'AI Vision Auto-Filled:'}</strong> {isHindi ? 'आपदा प्रकार, गंभीरता और स्थिति का विवरण फोटो विश्लेषण से स्वतः भर दिया गया है।' : 'Disaster type, severity rating, and briefing auto-populated from photo detection.'}</span>
                    <button type="button" onClick={() => setCvSuccessNotice(false)} className="btn-dismiss-cv-notice" title="Dismiss">✕</button>
                  </div>
                )}

                <div className="form-group">
                  <label>{isHindi ? 'आपदा का प्रकार' : 'Disaster Type'}</label>
                  <select
                    value={disasterType}
                    onChange={e => setDisasterType(e.target.value)}
                    className="custom-select"
                  >
                    <option value="Flood Rescue">🌊 Flood Rescue (बाढ़ बचाव)</option>
                    <option value="Fire Outbreak">🔥 Fire Emergency (आग दुर्घटना)</option>
                    <option value="Landslide">⛰️ Landslide (भूस्खलन)</option>
                    <option value="Heavy Rainfall & Submersion">🌧️ Heavy Rainfall & Submersion</option>
                    <option value="Building Collapse">🏚️ Building Collapse (इमारत ढहना)</option>
                    <option value="Medical Emergency">🚑 Medical Critical SOS</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="label-with-btn-row">
                      <label>{isHindi ? 'स्थान / क्षेत्र' : 'Location / Zone'}</label>
                      <button
                        type="button"
                        className="btn-use-gps-inline"
                        onClick={() => setLocation(userLocation.address)}
                      >
                        📍 {isHindi ? 'वर्तमान जीपीएस' : 'Use Present GPS'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Present Sector / Address"
                      className="custom-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{isHindi ? 'गंभीरता स्तर' : 'Severity'}</label>
                    <select
                      value={severity}
                      onChange={e => setSeverity(e.target.value)}
                      className="custom-select severity-select"
                    >
                      <option value="Critical">🔴 Critical (अति गंभीर - जान का खतरा)</option>
                      <option value="High">🟠 High (उच्च जोखिम)</option>
                      <option value="Medium">🟡 Medium (मध्यम)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{isHindi ? 'प्रभावित व्यक्तियों की संख्या' : 'Number of People Affected / Stranded'}</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={peopleAffected}
                    onChange={e => setPeopleAffected(e.target.value)}
                    className="custom-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{isHindi ? 'संक्षिप्त विवरण' : 'Short Description & Landmarks'}</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Ground floor flooded, 24 people stranded on terrace, pregnant woman and elderly need urgent boat evacuation..."
                    className="custom-textarea"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowReportModal(false)}
                  >
                    {isHindi ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-submit-emergency">
                    🚨 {isHindi ? 'आपातकाल भेजें' : 'REPORT EMERGENCY NOW'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* DRAWER: FIND SHELTERS LIST */}
      {showShelterDrawer && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowShelterDrawer(false)}>
          <div className="drawer-panel animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <Home size={22} className="shelter-icon-brand" />
                <div>
                  <h3>{isHindi ? 'आपातकालीन राहत शिविर' : 'Emergency Safe Shelters'}</h3>
                  <p>{isHindi ? 'निकटतम राहत केंद्र, बिस्तर उपलब्धता एवं सुविधाएं' : 'Verified evacuation camps with live capacity'}</p>
                </div>
              </div>
              <button className="btn-close-drawer" onClick={() => setShowShelterDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="shelter-cards-scroll">
              {shelters.map(sh => (
                <div key={sh.id} className="shelter-detailed-card">
                  <div className="detailed-header">
                    <h4>{sh.name}</h4>
                    <span className="badge-zone">{sh.zone}</span>
                  </div>
                  <p className="shelter-address"><MapPin size={14} /> {sh.address}</p>

                  <div className="capacity-bar-wrapper">
                    <div className="capacity-meta">
                      <span>{isHindi ? 'क्षमता:' : 'Capacity:'} <strong>{sh.capacity}</strong></span>
                      <span>{isHindi ? 'उपलब्ध:' : 'Available:'} <strong className="green-text">{sh.available}</strong></span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.round((sh.occupied / sh.capacity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="facilities-chips">
                    {sh.facilities.map((fac, idx) => (
                      <span key={idx} className="fac-chip">✓ {fac}</span>
                    ))}
                  </div>

                  <div className="drawer-card-actions">
                    <button
                      className="btn-drawer-route"
                      onClick={() => {
                        setSelectedShelterForRoute(sh);
                        setShowShelterDrawer(false);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                    >
                      <Navigation size={15} /> {isHindi ? 'नक्शे पर मार्ग देखें' : 'VIEW ROUTE'} ({sh.distance})
                    </button>
                    <a href={`tel:${sh.contact}`} className="btn-drawer-call">
                      <Phone size={14} /> {sh.contact}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: ALERT DETAILS */}
      {showAlertDetailsModal && primaryAlert && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAlertDetailsModal(false)}>
          <div className="modal-card alert-details-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header danger-header">
              <div className="title-with-icon">
                <AlertTriangle size={24} color="#EF4444" />
                <div>
                  <h2>{primaryAlert.title}</h2>
                  <span className="source-tag">Authority: {primaryAlert.source}</span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAlertDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="alert-details-content">
              <div className="threat-level-box">
                <span className="threat-label">SEVERITY LEVEL</span>
                <span className="threat-val">{primaryAlert.severity.toUpperCase()}</span>
                <p>AFFECTED REGION: <strong>Zone 3 (Yamuna River Basin & Low-Lying Sectors)</strong></p>
              </div>

              <div className="instructions-section">
                <h4>🛡️ Critical Safety Guidelines:</h4>
                <ul className="safety-bullets">
                  <li><strong>Move to Upper Floors:</strong> If water begins to enter your building, move to higher floors immediately.</li>
                  <li><strong>Turn off Main Power:</strong> Cut off electrical circuit breakers to prevent electrocution hazards.</li>
                  <li><strong>Do Not Wade or Drive:</strong> Just 15cm of flowing water can knock down an adult; 30cm can float cars.</li>
                  <li><strong>Report Stranded People:</strong> Use the RAKSHA-SETU "Report Emergency" button above or dial 112.</li>
                </ul>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-primary-action"
                  onClick={() => {
                    setShowAlertDetailsModal(false);
                    setShowShelterDrawer(true);
                  }}
                >
                  <Home size={16} /> View Evacuation Shelters
                </button>
                <button
                  className="btn-secondary-action"
                  onClick={() => setShowAlertDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 📸 STANDALONE COMPUTER VISION SCANNER MODAL */}
      {showCvScannerModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowCvScannerModal(false)}>
          <div className="modal-card cv-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.3)', padding: '16px 22px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div className="title-with-icon">
                <span className="modal-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', padding: '6px 10px', borderRadius: '8px', fontSize: '1.4rem' }}>📸</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                    {isHindi ? 'कंप्यूटर विज़न आपदा क्षति विश्लेषक' : 'Disaster Scene & Flood Depth CV Scanner'}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    {isHindi ? 'ऑटोमैटिक ऑब्जेक्ट डिटेक्शन, जल-स्तर मापन एवं आपातकालीन रिपोर्टिंग' : 'AI Object Detection, Flood Depth Telemetry & Automated SOS Dispatch'}
                  </p>
                </div>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setShowCvScannerModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="cv-modal-body-scroll">
              <CvSceneScanner
                onApplyToReport={(cvData) => {
                  setDisasterType(cvData.disasterType);
                  setSeverity(cvData.severity);
                  setPeopleAffected(cvData.peopleAffected);
                  setDescription(cvData.description);
                  setShowCvScannerModal(false);
                  setShowReportModal(true);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
