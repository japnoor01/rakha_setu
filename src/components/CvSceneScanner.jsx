import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Scan,
  Upload,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  Users,
  Waves,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import {
  CV_PRESET_SCENES,
  analyzeDisasterImageWithCV,
  renderCvAnnotationsOnCanvas
} from '../utils/cvService';

export default function CvSceneScanner({
  onApplyToReport = null,
  embeddedMode = false,
  initialPresetId = 'submerged_car'
}) {
  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId);
  const [currentImageSrc, setCurrentImageSrc] = useState(
    CV_PRESET_SCENES.find(p => p.id === initialPresetId)?.sampleImageSvg || CV_PRESET_SCENES[0].sampleImageSvg
  );
  const [isCustomUpload, setIsCustomUpload] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Run CV analysis whenever selected preset or image changes
  useEffect(() => {
    let isMounted = true;

    async function runAnalysis() {
      setIsScanning(true);
      try {
        const result = await analyzeDisasterImageWithCV(
          currentImageSrc,
          isCustomUpload ? null : selectedPresetId
        );
        if (isMounted) {
          setAnalysisResult(result);
          setIsScanning(false);
        }
      } catch (err) {
        console.error('CV analysis error:', err);
        if (isMounted) setIsScanning(false);
      }
    }

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [currentImageSrc, selectedPresetId, isCustomUpload]);

  // Redraw canvas whenever analysis result or toggle changes
  useEffect(() => {
    if (!analysisResult || !canvasRef.current || !imgRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;

    const draw = () => {
      if (showBoundingBoxes) {
        renderCvAnnotationsOnCanvas(canvas, img, analysisResult);
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 400;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [analysisResult, showBoundingBoxes]);

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    setIsCustomUpload(false);
    setSelectedPresetId(preset.id);
    setCurrentImageSrc(preset.sampleImageSvg);
  };

  // Handle Local File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setIsCustomUpload(true);
        setSelectedPresetId('custom_upload');
        setCurrentImageSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`cv-scanner-card ${embeddedMode ? 'cv-embedded' : ''}`}>
      {/* Hidden image element to load source bitmap */}
      <img
        ref={imgRef}
        src={currentImageSrc}
        alt="Disaster Scene Source"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />

      {/* Top Header */}
      <div className="cv-scanner-header">
        <div className="cv-title-left">
          <div className="cv-icon-pill">
            <Scan size={18} className="pulse-scan-icon" />
            <span>AI COMPUTER VISION</span>
          </div>
          <div>
            <h3 className="cv-heading">Automated Scene & Flood Depth Detection</h3>
            <p className="cv-subheading">
              Identifies stranded humans, submerged vehicles, flood waterline & structural hazards
            </p>
          </div>
        </div>

        <div className="cv-engine-badge">
          <Sparkles size={14} color="#38BDF8" />
          <span>{analysisResult?.source || 'YOLOv8-Disaster / Multimodal Vision'}</span>
        </div>
      </div>

      {/* Presets and Upload Controls */}
      <div className="cv-preset-bar">
        <span className="preset-label">Test Real-world Scenarios:</span>
        <div className="preset-btn-group">
          {CV_PRESET_SCENES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn ${!isCustomUpload && selectedPresetId === preset.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(preset)}
            >
              {preset.id === 'submerged_car' ? '🚗' : preset.id === 'rooftop_trapped' ? '🏠' : '🌊'}{' '}
              {preset.title.split('(')[0]}
            </button>
          ))}
          <button
            type="button"
            className={`preset-btn upload-btn ${isCustomUpload ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> Upload Custom Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Visual Canvas Viewer + Overlays */}
      <div className="cv-viewer-container">
        <div className="cv-canvas-wrapper">
          <canvas ref={canvasRef} className="cv-main-canvas" />

          {/* Scanning Animation Sweep */}
          {isScanning && (
            <div className="cv-scan-laser-line">
              <div className="laser-glow"></div>
            </div>
          )}

          {/* Canvas Controls Overlay */}
          <div className="cv-canvas-floating-controls">
            <button
              type="button"
              className={`btn-toggle-boxes ${showBoundingBoxes ? 'active' : ''}`}
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            >
              <Layers size={13} /> {showBoundingBoxes ? 'Bounding Boxes: ON' : 'Bounding Boxes: OFF'}
            </button>
          </div>
        </div>

        {/* Live Detected Metrics Panel */}
        <div className="cv-telemetry-sidebar">
          <div className="cv-sidebar-top">
            <div className="hud-metric-row">
              <span className="metric-tag">HAZARD CLASSIFICATION</span>
              <strong className="hazard-name">{analysisResult?.hazardType || 'Analyzing...'}</strong>
            </div>

            <div className="depth-gauge-card">
              <div className="depth-header">
                <span className="depth-icon"><Waves size={16} color="#38BDF8" /></span>
                <span>MEASURED FLOOD WATERLINE</span>
              </div>
              <div className="depth-value-large">
                {analysisResult?.waterDepthMeters?.toFixed(2) || '0.00'} <span className="depth-unit">meters</span>
              </div>
              <div className="depth-category-badge">
                {analysisResult?.waterDepthCategory || 'Calculating Inundation Level...'}
              </div>
            </div>

            <div className="cv-quick-stats-grid">
              <div className="stat-card">
                <div className="stat-label"><Users size={13} /> Stranded People</div>
                <div className="stat-num text-danger">{analysisResult?.strandedCount ?? '-'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">🚗 Submerged Vehicles</div>
                <div className="stat-num text-warning">{analysisResult?.submergedVehiclesCount ?? '-'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">🚨 SOS Severity</div>
                <div className={`stat-num ${analysisResult?.recommendedSeverity === 'Critical' ? 'text-danger' : 'text-orange'}`}>
                  {analysisResult?.recommendedSeverity || 'High'}
                </div>
              </div>
            </div>

            {/* Tactical Rescue Notes */}
            <div className="cv-notes-box">
              <span className="notes-heading">📋 TACTICAL CV BRIEFING:</span>
              <p className="notes-body">{analysisResult?.executiveSummary || 'Scanning visual telemetry...'}</p>
            </div>

            {/* Required Equipment Identified by CV */}
            {analysisResult?.recommendedResources && (
              <div className="cv-resources-box">
                <span className="res-tag-title">RECOMMENDED GEAR:</span>
                <div className="res-chip-row">
                  {analysisResult.recommendedResources.map((res, i) => (
                    <span key={i} className="res-chip">✓ {res}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action button: Auto-populate report form */}
          {onApplyToReport && analysisResult?.autoFormValues && (
            <div className="cv-apply-footer">
              <button
                type="button"
                className="btn-apply-cv-data"
                onClick={() => onApplyToReport(analysisResult.autoFormValues)}
              >
                <Sparkles size={16} /> Auto-Fill Report with CV Findings <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
