import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDisaster } from '../context/DisasterContext';
import {
  Key,
  CheckCircle,
  CloudSun,
  Cpu,
  Map,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Shield,
  X,
  Save,
  RotateCcw
} from 'lucide-react';

export default function ApiSettingsModal({ isOpen, onClose }) {
  const { userLocation, liveWeather } = useDisaster();

  const [geminiKey, setGeminiKey] = useState('');
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [smsKey, setSmsKey] = useState('');
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    // Load from localStorage or Vite env
    const savedGemini = localStorage.getItem('RAKSHA_GEMINI_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
    const savedWeather = localStorage.getItem('RAKSHA_OPENWEATHER_KEY') || import.meta.env.VITE_OPENWEATHER_API_KEY || '';
    const savedSms = localStorage.getItem('RAKSHA_SMS_KEY') || import.meta.env.VITE_SMS_API_KEY || '';

    setGeminiKey(savedGemini);
    setOpenWeatherKey(savedWeather);
    setSmsKey(savedSms);
  }, []);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('RAKSHA_GEMINI_KEY', geminiKey.trim());
    localStorage.setItem('RAKSHA_OPENWEATHER_KEY', openWeatherKey.trim());
    localStorage.setItem('RAKSHA_SMS_KEY', smsKey.trim());

    setSaveNotice(true);
    setTimeout(() => {
      setSaveNotice(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('RAKSHA_GEMINI_KEY');
    localStorage.removeItem('RAKSHA_OPENWEATHER_KEY');
    localStorage.removeItem('RAKSHA_SMS_KEY');
    setGeminiKey('');
    setOpenWeatherKey('');
    setSmsKey('');
  };

  return createPortal(
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-card api-settings-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header api-modal-header">
          <div className="title-with-icon">
            <Key size={22} className="text-cyan" />
            <div>
              <h2>RAKSHA-SETU API & Cloud Connectors</h2>
              <p>Configure live AI models, commercial weather feeds, and GIS keys</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Live Active Zero-Key Services Banner */}
        <div className="zero-key-services-banner">
          <div className="zero-key-title">
            <CheckCircle size={15} color="#10B981" />
            <span>CORE SERVICES ACTIVE (Zero-Key Open Integrations):</span>
          </div>
          <div className="services-status-row">
            <span className="svc-badge svc-active">✓ Open-Meteo Live Weather</span>
            <span className="svc-badge svc-active">✓ OpenStreetMap GIS</span>
            <span className="svc-badge svc-active">✓ Browser GPS Positioning</span>
            <span className="svc-badge svc-active">✓ CartoDB Dark Matter Tiles</span>
          </div>
          {liveWeather && (
            <div className="live-weather-pill-mini">
              <span>🌦️ Current at {userLocation.area}:</span>
              <strong>{liveWeather.temperature}°C</strong> • <span>Rain: {liveWeather.rainfall}mm</span> • <span>Wind: {liveWeather.windSpeed}km/h</span> ({liveWeather.source})
            </div>
          )}
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="api-settings-form">
          {/* 1. Google Gemini AI */}
          <div className="api-input-group">
            <div className="group-label-row">
              <div className="label-with-icon">
                <Cpu size={16} className="text-purple" />
                <strong>1. Google Gemini AI API Key</strong>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="link-get-key"
              >
                Get Free Gemini Key <ExternalLink size={12} />
              </a>
            </div>
            <p className="field-hint">
              Enables real Generative AI disaster risk modeling, evacuation recommendations, and automated NDMA advisories.
            </p>
            <input
              type="password"
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to use smart offline heuristic model)"
              className="custom-input mono-font"
            />
          </div>

          {/* 2. OpenWeatherMap */}
          <div className="api-input-group">
            <div className="group-label-row">
              <div className="label-with-icon">
                <CloudSun size={16} className="text-orange" />
                <strong>2. OpenWeatherMap API Key</strong>
              </div>
              <a
                href="https://openweathermap.org/api"
                target="_blank"
                rel="noreferrer"
                className="link-get-key"
              >
                Get OpenWeather Key <ExternalLink size={12} />
              </a>
            </div>
            <p className="field-hint">
              Optional commercial radar feed. If blank, automatically uses free global Open-Meteo satellite sensors.
            </p>
            <input
              type="password"
              value={openWeatherKey}
              onChange={e => setOpenWeatherKey(e.target.value)}
              placeholder="e.g. 4a8b... (leave blank to use Open-Meteo)"
              className="custom-input mono-font"
            />
          </div>

          {/* 3. Emergency SMS Gateway */}
          <div className="api-input-group">
            <div className="group-label-row">
              <div className="label-with-icon">
                <MessageSquare size={16} className="text-green" />
                <strong>3. Fast2SMS / Twilio SMS Gateway Key</strong>
              </div>
              <span className="optional-tag">Optional</span>
            </div>
            <p className="field-hint">
              Broadcasts emergency alerts directly to citizens' mobile phone numbers via SMS.
            </p>
            <input
              type="password"
              value={smsKey}
              onChange={e => setSmsKey(e.target.value)}
              placeholder="Enter SMS Gateway API Key (optional)"
              className="custom-input mono-font"
            />
          </div>

          {saveNotice && (
            <div className="save-success-pill animate-scale-up">
              <CheckCircle size={16} /> API Keys Saved Successfully! Live models enabled.
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn-clear-keys"
              onClick={handleClear}
            >
              <RotateCcw size={14} /> Clear Keys
            </button>
            <button type="submit" className="btn-save-keys">
              <Save size={16} /> Save & Activate Connectors
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
