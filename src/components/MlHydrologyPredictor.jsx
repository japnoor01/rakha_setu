import React, { useState, useMemo } from 'react';
import {
  Cpu,
  TrendingUp,
  Clock,
  Waves,
  AlertTriangle,
  Play,
  BarChart3,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { runHydrologicalMLInference } from '../utils/mlPredictor';

export default function MlHydrologyPredictor({
  userLocation,
  onBroadcastAlert = null
}) {
  const [rainfall, setRainfall] = useState(135);
  const [riverLevel, setRiverLevel] = useState(4.2);
  const [soilMoisture, setSoilMoisture] = useState(78);
  const [drainageCapacity, setDrainageCapacity] = useState(55);
  const [upstreamDischarge, setUpstreamDischarge] = useState(3800);
  const [density, setDensity] = useState('High');

  // Compute ML Inference result in real-time
  const mlResult = useMemo(() => {
    return runHydrologicalMLInference({
      rainfall,
      riverLevel,
      soilMoisture,
      drainageCapacity,
      upstreamDischarge,
      populationDensity: density,
      areaName: userLocation.area || 'Local Sector',
      elevation: 208,
    });
  }, [rainfall, riverLevel, soilMoisture, drainageCapacity, upstreamDischarge, density, userLocation.area]);

  return (
    <div className="ml-predictor-container">
      {/* Header */}
      <div className="ml-header-row">
        <div className="ml-title-group">
          <div className="ml-icon-wrapper">
            <Cpu size={22} className="pulse-neon-icon" />
          </div>
          <div>
            <div className="ml-badge-line">
              <span className="ml-tag">PREDICTIVE HYDROLOGICAL ML MODEL</span>
              <span className="ml-model-pill">{mlResult.modelName}</span>
            </div>
            <h3 className="ml-heading">Multi-Factor Disaster Inundation Predictor</h3>
          </div>
        </div>

        <div className="ml-accuracy-badge">
          <Sparkles size={14} color="#10B981" />
          <span>Model Accuracy: {mlResult.confidenceScore}% (Validated on CWC Flood History)</span>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Real-time ML Output on Right */}
      <div className="ml-main-grid">
        {/* LEFT COLUMN: TELEMETRY & HYDROLOGICAL CONTROLS */}
        <div className="ml-controls-card">
          <div className="controls-header">
            <h4><Sliders size={16} /> Sensor & Telemetry Feature Inputs</h4>
            <span className="realtime-text">Real-time Model Weights</span>
          </div>

          <div className="sliders-list">
            {/* 1. Rainfall */}
            <div className="ml-slider-item">
              <div className="slider-label-row">
                <span>🌧️ Cumulative Precipitation (24h)</span>
                <strong>{rainfall} mm</strong>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="ml-range-input range-blue"
              />
              <div className="range-hints">
                <span>Normal (&lt;50mm)</span>
                <span>Heavy (100mm)</span>
                <span className="danger-hint">Torrential (&gt;200mm)</span>
              </div>
            </div>

            {/* 2. River Level */}
            <div className="ml-slider-item">
              <div className="slider-label-row">
                <span>🌊 River / Sluice Gauge Level</span>
                <strong className={riverLevel >= 4.0 ? 'text-danger' : 'text-orange'}>{riverLevel.toFixed(1)} m</strong>
              </div>
              <input
                type="range"
                min="1.0"
                max="7.0"
                step="0.1"
                value={riverLevel}
                onChange={(e) => setRiverLevel(Number(e.target.value))}
                className="ml-range-input range-orange"
              />
              <div className="range-hints">
                <span>Safe (&lt;2.5m)</span>
                <span>Warning (3.5m)</span>
                <span className="danger-hint">Danger Level (&gt;4.0m)</span>
              </div>
            </div>

            {/* 3. Soil Saturation */}
            <div className="ml-slider-item">
              <div className="slider-label-row">
                <span>💧 Basin Soil Moisture Saturation</span>
                <strong>{soilMoisture}%</strong>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(Number(e.target.value))}
                className="ml-range-input range-cyan"
              />
            </div>

            {/* 4. Drainage Capacity */}
            <div className="ml-slider-item">
              <div className="slider-label-row">
                <span>🏙️ Municipal Storm Drain Throughput</span>
                <strong>{drainageCapacity}%</strong>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={drainageCapacity}
                onChange={(e) => setDrainageCapacity(Number(e.target.value))}
                className="ml-range-input range-purple"
              />
            </div>

            {/* 5. Upstream Discharge */}
            <div className="ml-slider-item">
              <div className="slider-label-row">
                <span>⚡ Upstream Barrage Inflow Rate</span>
                <strong>{upstreamDischarge.toLocaleString()} cumecs</strong>
              </div>
              <input
                type="range"
                min="1000"
                max="7500"
                step="250"
                value={upstreamDischarge}
                onChange={(e) => setUpstreamDischarge(Number(e.target.value))}
                className="ml-range-input range-amber"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREDICTION INFERENCE RESULT & SHAP BREAKDOWN */}
        <div className="ml-inference-card">
          {/* Top Score Banner */}
          <div className="inference-hero-banner" style={{ borderLeftColor: mlResult.themeColor }}>
            <div className="hero-left">
              <span className="prob-label">PREDICTED FLOOD PROBABILITY</span>
              <div className="prob-value-row">
                <span className="prob-number" style={{ color: mlResult.themeColor }}>
                  {mlResult.floodProbability}%
                </span>
                <span className="prob-badge" style={{ backgroundColor: `${mlResult.themeColor}22`, color: mlResult.themeColor, borderColor: mlResult.themeColor }}>
                  {mlResult.riskCategory}
                </span>
              </div>
            </div>

            <div className="hero-right-telemetry">
              <div className="surge-metric">
                <span className="surge-label"><Clock size={14} /> Time to Peak Surge</span>
                <strong className="surge-val text-warning">{mlResult.timeToPeakFormatted}</strong>
              </div>
              <div className="surge-metric">
                <span className="surge-label"><Waves size={14} /> Predicted Water Rise</span>
                <strong className="surge-val text-danger">+{mlResult.predictedSurgeMeters}m</strong>
              </div>
            </div>
          </div>

          {/* Feature Importance / SHAP Contributions */}
          <div className="shap-importance-section">
            <div className="shap-header">
              <h5><BarChart3 size={15} /> Model Feature Contributions (SHAP Values)</h5>
              <span className="shap-sub">How each telemetry factor drives the prediction</span>
            </div>

            <div className="shap-bars-list">
              {mlResult.featureImportance.map((feat, idx) => (
                <div key={idx} className="shap-bar-row">
                  <div className="shap-label-col">
                    <span className="feat-name">{feat.name}</span>
                    <span className="feat-val">({feat.value})</span>
                  </div>
                  <div className="shap-track-col">
                    <div
                      className={`shap-fill-bar ${idx === 0 ? 'fill-blue' : idx === 1 ? 'fill-orange' : idx === 2 ? 'fill-cyan' : 'fill-purple'}`}
                      style={{ width: `${feat.contribution}%` }}
                    ></div>
                  </div>
                  <span className="shap-pct-col">{feat.contribution}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6-Hour Synthetic Hydrograph Curve */}
          <div className="hydrograph-forecast-section">
            <div className="hydro-header">
              <h5>📈 6-Hour Synthetic Hydrograph Trajectory</h5>
              <span className="hydro-sub">Projected flood surge progression</span>
            </div>

            <div className="hydrograph-bars">
              {mlResult.hydrographForecast.map((step, i) => (
                <div key={i} className="hydro-step-col">
                  <div className="hydro-bar-wrapper">
                    <div
                      className={`hydro-bar-fill ${step.riskScore >= 75 ? 'danger-bar' : step.riskScore >= 50 ? 'warning-bar' : 'normal-bar'}`}
                      style={{ height: `${Math.max(15, step.riskScore)}%` }}
                    >
                      <span className="bar-tooltip">+{step.surgeLevel}m</span>
                    </div>
                  </div>
                  <span className="step-time">{step.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Drivers & 1-Click Early Warning Broadcast */}
          <div className="ml-footer-actions">
            <div className="drivers-summary">
              <strong>Key Hazard Factor:</strong> {mlResult.keyHazardDrivers[0]}
            </div>

            {onBroadcastAlert && (
              <button
                type="button"
                className="btn-broadcast-ml-alert"
                onClick={() => onBroadcastAlert(mlResult)}
              >
                <Play size={14} /> One-Click Issue Automated Alert ({mlResult.floodProbability}% ML Confidence)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
