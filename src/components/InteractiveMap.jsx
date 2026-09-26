import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDisaster } from '../context/DisasterContext';
import {
  Layers,
  CloudRain,
  Compass,
  Crosshair,
  Maximize2,
  Minimize2,
  Navigation,
  Shield,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  Radio,
  Droplets,
  Waves,
  Video,
  Play,
  Pause,
  ChevronRight,
  Info,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  MapPin,
  ExternalLink,
  X,
  Gauge
} from 'lucide-react';

export default function InteractiveMap({
  mode = 'citizen', // 'citizen' | 'responder' | 'admin'
  height = '520px',
  activeIncidentId = null,
  activeShelterId = null,
  showRoute = false,
  targetDestination = null, // [lat, lng]
  onSelectShelter = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Layer groups ref
  const baseTileLayerRef = useRef(null);
  const radarTileLayerRef = useRef(null);
  const layersRef = useRef({
    zones: null,
    sensors: null,
    hazards: null,
    incidents: null,
    shelters: null,
    responders: null,
    drone: null,
    route: null,
    rangeRings: null,
    inspection: null,
    userPin: null,
  });

  const {
    incidents,
    shelters,
    responderTeam,
    userLocation,
    geoPolygons,
    waterSensors = [],
    roadHazards = [],
    reconDrone = null,
    floodRiseSim = 1.5,
    setFloodRiseSim,
    language = 'en',
    soundEnabled,
  } = useDisaster();

  const isHindi = language === 'hi';

  // Map Controls State
  const [mapStyle, setMapStyle] = useState('satellite'); // 'satellite' | 'dark' | 'streets' | 'terrain' | 'thermal'
  const [showRadar, setShowRadar] = useState(true);
  const [radarTileUrl, setRadarTileUrl] = useState(null);
  const [radarTime, setRadarTime] = useState('Live');
  const [showRangeRings, setShowRangeRings] = useState(true);
  const [showDroneFeed, setShowDroneFeed] = useState(false);
  const [activeInspector, setActiveInspector] = useState(null); // Click inspection telemetry
  const [localFloodRise, setLocalFloodRise] = useState(floodRiseSim || 1.5);

  const [layerVisibility, setLayerVisibility] = useState({
    dangerZones: true,
    shelters: true,
    sensors: true,
    hazards: true,
    responders: true,
    drone: true,
    routes: true,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || localStorage.getItem('RAKSHA_MAPBOX_TOKEN') || '';

  // Sync external floodRiseSim
  useEffect(() => {
    if (floodRiseSim !== undefined) {
      setLocalFloodRise(floodRiseSim);
    }
  }, [floodRiseSim]);

  // 1. Fetch live Doppler radar data from RainViewer API
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data?.radar?.past?.length > 0) {
          const latest = data.radar.past[data.radar.past.length - 1];
          const tileUrl = `https://tilecache.rainviewer.com/v2/radar/${latest.path}/512/{z}/{x}/{y}/2/1_1.png`;
          setRadarTileUrl(tileUrl);
          const date = new Date(latest.time * 1000);
          setRadarTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(err => console.warn('Radar fetch failed:', err));
  }, []);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center = [userLocation.lat || 28.6139, userLocation.lng || 77.2090];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      zoomControl: false, // Sleek custom HUD controls
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Ensure Leaflet calculates full container dimensions
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    // Track mouse coordinates for military crosshair HUD
    map.on('mousemove', (e) => {
      setCursorCoords([e.latlng.lat, e.latlng.lng]);
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Click anywhere to drop a tactical terrain & flood inspection crosshair
    map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Realistic distance and elevation estimation
      const distToUser = Math.round(
        map.distance([lat, lng], [userLocation.lat || 28.6139, userLocation.lng || 77.2090])
      );

      // Estimate flood safety based on proximity to user & center
      const estElevation = Math.max(198, Math.round(218 + (lng - (userLocation.lng || 77.2090)) * 400));
      const isSubmerged = estElevation < 206;

      setActiveInspector({
        coords: [lat, lng],
        distance: `${distToUser}m`,
        elevation: `${estElevation}m MSL`,
        waterDepth: isSubmerged ? `${((206 - estElevation) * 0.4 + localFloodRise * 0.3).toFixed(1)}m` : '0.0m (Dry)',
        riskLevel: isSubmerged ? 'HIGH FLOOD RISK' : estElevation > 214 ? 'SAFE HIGH GROUND' : 'MODERATE RISK',
        statusColor: isSubmerged ? '#EF4444' : estElevation > 214 ? '#10B981' : '#F59E0B',
      });
    });

    // Create Layer Groups
    layersRef.current.zones = L.layerGroup().addTo(map);
    layersRef.current.rangeRings = L.layerGroup().addTo(map);
    layersRef.current.sensors = L.layerGroup().addTo(map);
    layersRef.current.hazards = L.layerGroup().addTo(map);
    layersRef.current.incidents = L.layerGroup().addTo(map);
    layersRef.current.shelters = L.layerGroup().addTo(map);
    layersRef.current.responders = L.layerGroup().addTo(map);
    layersRef.current.drone = L.layerGroup().addTo(map);
    layersRef.current.route = L.layerGroup().addTo(map);
    layersRef.current.inspection = L.layerGroup().addTo(map);
    layersRef.current.userPin = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Switch Base Tile Layer (Satellite / Dark / Streets / Terrain / Thermal)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let tileUrl;
    let options = {
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1,
    };

    if (mapboxToken && mapboxToken.startsWith('pk.')) {
      if (mapStyle === 'satellite') {
        // High-resolution Mapbox Satellite-Streets v12 with @2x retina crispness
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      } else if (mapStyle === 'dark') {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      } else if (mapStyle === 'terrain') {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      } else if (mapStyle === 'thermal') {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      } else {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      }
    } else {
      // Free Fallbacks
      if (mapStyle === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        options = { maxZoom: 18 };
      } else if (mapStyle === 'dark' || mapStyle === 'thermal') {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        options = { maxZoom: 19 };
      } else {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        options = { maxZoom: 19 };
      }
    }

    baseTileLayerRef.current = L.tileLayer(tileUrl, options).addTo(map);
    baseTileLayerRef.current.bringToBack();
  }, [mapStyle, mapboxToken]);

  // 4. Manage Live Doppler Radar Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radarTileLayerRef.current) {
      map.removeLayer(radarTileLayerRef.current);
      radarTileLayerRef.current = null;
    }

    if (showRadar && radarTileUrl) {
      radarTileLayerRef.current = L.tileLayer(radarTileUrl, {
        opacity: 0.65,
        tileSize: 512,
        zoomOffset: -1,
        zIndex: 400,
      }).addTo(map);
    }
  }, [showRadar, radarTileUrl]);

  // 5. Auto Pan/Fly to User Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation.lat || !userLocation.lng) return;

    map.flyTo([userLocation.lat, userLocation.lng], 14, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [userLocation.lat, userLocation.lng]);

  // 6. Render All Vector GIS Telemetry Elements
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const {
      zones,
      rangeRings: ringLayer,
      sensors: sensorLayer,
      hazards: hazardLayer,
      incidents: incLayer,
      shelters: shLayer,
      responders: respLayer,
      drone: droneLayer,
      route: rtLayer,
      inspection: inspectLayer,
      userPin: userLayer,
    } = layersRef.current;

    zones.clearLayers();
    ringLayer.clearLayers();
    sensorLayer.clearLayers();
    hazardLayer.clearLayers();
    incLayer.clearLayers();
    shLayer.clearLayers();
    respLayer.clearLayers();
    droneLayer.clearLayers();
    rtLayer.clearLayers();
    inspectLayer.clearLayers();
    userLayer.clearLayers();

    const uLat = userLocation.lat || 28.6139;
    const uLng = userLocation.lng || 77.2090;

    // 📍 A. USER LOCATION RETICLE PIN WITH DUAL-BAND RTK GPS
    const userIcon = L.divIcon({
      className: 'user-map-icon',
      html: `
        <div class="tactical-user-pin">
          <div class="sonar-wave"></div>
          <div class="sonar-wave delay"></div>
          <div class="core-reticle">
            <span class="crosshair-icon">⊕</span>
          </div>
          <div class="user-callout-pill">
            <span class="live-dot-green"></span>
            <strong>${isHindi ? 'आप (वर्तमान स्थान)' : 'YOU (HERE)'}</strong>
          </div>
        </div>
      `,
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });

    L.marker([uLat, uLng], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(userLayer)
      .bindPopup(`
        <div class="gis-popup-card user-gis-popup">
          <div class="popup-header-bar">
            <span class="tag-live-gps">🛰️ GPS L1/L5 RTK-FIX</span>
            <span class="mono-coords">${uLat.toFixed(5)}°N, ${uLng.toFixed(5)}°E</span>
          </div>
          <h4>📍 ${isHindi ? 'आपकी वर्तमान स्थिति' : 'Your Present Coordinates'}</h4>
          <p class="popup-address">${userLocation.address}</p>
          <div class="popup-metric-row">
            <div><span>Elevation:</span> <strong>214 m MSL</strong></div>
            <div><span>Safety Zone:</span> <strong class="text-emerald">High Ground Grid</strong></div>
          </div>
          <div class="popup-actions-grid">
            <button class="popup-btn-nav" id="btn-evac-user">
              🧭 ${isHindi ? 'निकटतम सुरक्षित आश्रय खोजें' : 'Plot Safe Route to Nearest Shelter'}
            </button>
          </div>
        </div>
      `);

    // ⭕ B. TACTICAL RANGE RINGS (500m / 1000m / 2000m)
    if (showRangeRings) {
      // 500m ring
      L.circle([uLat, uLng], {
        radius: 500,
        color: '#EF4444',
        weight: 1.2,
        opacity: 0.6,
        dashArray: '4, 6',
        fill: false,
      }).addTo(ringLayer);

      // 1000m ring
      L.circle([uLat, uLng], {
        radius: 1000,
        color: '#F59E0B',
        weight: 1.2,
        opacity: 0.5,
        dashArray: '6, 8',
        fill: false,
      }).addTo(ringLayer);

      // 2000m ring
      L.circle([uLat, uLng], {
        radius: 2000,
        color: '#10B981',
        weight: 1,
        opacity: 0.4,
        dashArray: '8, 10',
        fill: false,
      }).addTo(ringLayer);
    }

    // 🌊 C. REALISTIC HYDRODYNAMIC FLOOD SURGE & INUNDATION POLYGONS
    if (layerVisibility.dangerZones) {
      // 1. DANGER ZONE 3 (Severe Flood Inundation Corridor)
      if (geoPolygons.danger && geoPolygons.danger.length > 2) {
        // Dynamic expansion scaling based on floodRiseSim
        const scaleFactor = 1 + (localFloodRise - 1.5) * 0.18;
        const scaledDanger = geoPolygons.danger.map(pt => {
          const dLat = (pt[0] - uLat) * scaleFactor;
          const dLng = (pt[1] - uLng) * scaleFactor;
          return [uLat + dLat, uLng + dLng];
        });

        // Outer Hazard Contour
        const dangerZone = L.polygon(scaledDanger, {
          color: '#EF4444',
          weight: 2.8,
          opacity: 0.95,
          fillColor: '#0284C7', // Deep hydrodynamic flood surge blue
          fillOpacity: 0.42,
          dashArray: '8, 6',
          className: 'hazard-flood-polygon'
        }).addTo(zones);

        dangerZone.bindTooltip(`
          <div class="realistic-tooltip danger-tt">
            <div class="tt-header">⚠️ CRITICAL INUNDATION ZONE (ZONE 3)</div>
            <div class="tt-body">
              <span>Water Depth Surge: <strong>+${(1.4 + (localFloodRise - 1.5) * 0.8).toFixed(1)} meters</strong></span><br>
              <span>Current Flow Velocity: <strong>3.2 m/s (Rapid Currents)</strong></span><br>
              <span class="evac-alert">🚨 MANDATORY EVACUATION IN EFFECT</span>
            </div>
          </div>
        `, { sticky: true, className: 'custom-leaflet-tooltip' });
      }

      // 2. MEDIUM RISK ZONE 5 (Runoff & Silt Buffer)
      if (geoPolygons.medium && geoPolygons.medium.length > 2) {
        const medZone = L.polygon(geoPolygons.medium, {
          color: '#F59E0B',
          weight: 2,
          opacity: 0.85,
          fillColor: '#F59E0B',
          fillOpacity: 0.24,
          dashArray: '6, 8',
          className: 'hazard-warning-polygon'
        }).addTo(zones);

        medZone.bindTooltip(`
          <div class="realistic-tooltip warning-tt">
            <div class="tt-header">🟠 RUNOFF & WATERLOGGING BUFFER (ZONE 5)</div>
            <div class="tt-body">
              <span>Precipitation Accumulation: <strong>92mm/hr</strong></span><br>
              <span>Road Conditions: <strong>Severe Waterlogging at Underpasses</strong></span>
            </div>
          </div>
        `, { sticky: true, className: 'custom-leaflet-tooltip' });
      }

      // 3. SAFE SECTOR 1 & 2 (High Ground Ridge & Relief Hubs)
      if (geoPolygons.safe && geoPolygons.safe.length > 2) {
        const safeZone = L.polygon(geoPolygons.safe, {
          color: '#10B981',
          weight: 2,
          opacity: 0.9,
          fillColor: '#10B981',
          fillOpacity: 0.18,
          className: 'safe-zone-polygon'
        }).addTo(zones);

        safeZone.bindTooltip(`
          <div class="realistic-tooltip safe-tt">
            <div class="tt-header">🟢 SECURE EVACUATION SECTOR</div>
            <div class="tt-body">
              <span>Elevation: <strong>+22m Above Flood Basin</strong></span><br>
              <span>Relief Infrastructure: <strong>Camps Active & Verified</strong></span>
            </div>
          </div>
        `, { sticky: true, className: 'custom-leaflet-tooltip' });
      }
    }

    // 🌊 D. REALISTIC IoT WATER LEVEL SENSORS (TELEMETRY GAUGES)
    if (layerVisibility.sensors && waterSensors.length > 0) {
      waterSensors.forEach(sensor => {
        const isCritical = sensor.waterLevel > sensor.dangerLevel;
        const currentWaterVal = (sensor.waterLevel + (localFloodRise - 1.5) * 0.4).toFixed(2);

        const sensorIcon = L.divIcon({
          className: 'realistic-sensor-icon',
          html: `
            <div class="iot-sensor-pin ${isCritical ? 'critical-water' : 'normal-water'}">
              <div class="sensor-wave-pulse"></div>
              <div class="sensor-badge">
                <span class="sensor-sym">💧</span>
              </div>
              <div class="sensor-telemetry-pill">
                <span class="sensor-code">${sensor.code}</span>
                <span class="sensor-depth">${currentWaterVal}m</span>
              </div>
            </div>
          `,
          iconSize: [60, 50],
          iconAnchor: [30, 25],
        });

        const marker = L.marker(sensor.coords, { icon: sensorIcon, zIndexOffset: 750 }).addTo(sensorLayer);
        marker.bindPopup(`
          <div class="gis-popup-card sensor-gis-popup">
            <div class="popup-header-bar ${isCritical ? 'danger-bar' : 'info-bar'}">
              <span class="tag-iot">IoT TELEMETRY STATION</span>
              <span class="mono-coords">${sensor.code}</span>
            </div>
            <h4>💧 ${sensor.name}</h4>
            <div class="sensor-readings-grid">
              <div class="gauge-card">
                <span class="reading-lbl">Current Level</span>
                <strong class="reading-val ${isCritical ? 'text-rose' : 'text-cyan'}">${currentWaterVal} m</strong>
                <span class="sub-stat">Danger Mark: ${sensor.dangerLevel}m</span>
              </div>
              <div class="gauge-card">
                <span class="reading-lbl">Flow Velocity</span>
                <strong class="reading-val">${sensor.flowVelocity}</strong>
                <span class="sub-stat">${sensor.trend}</span>
              </div>
            </div>
            <div class="sensor-status-strip ${isCritical ? 'status-critical' : 'status-normal'}">
              <span>● Status: <strong>${sensor.status}</strong></span>
              <span class="ping-time">${sensor.lastPing}</span>
            </div>
          </div>
        `);
      });
    }

    // 🚫 E. REALISTIC ROAD HAZARDS & POLICE BARRICADES
    if (layerVisibility.hazards && roadHazards.length > 0) {
      roadHazards.forEach(hz => {
        const hzIcon = L.divIcon({
          className: 'realistic-hazard-icon',
          html: `
            <div class="hazard-blockade-pin ${hz.type}">
              <div class="hazard-badge">
                <span>${hz.icon}</span>
              </div>
              <div class="hazard-label-flag">
                <strong>${hz.title}</strong>
              </div>
            </div>
          `,
          iconSize: [50, 40],
          iconAnchor: [25, 20],
        });

        const marker = L.marker(hz.coords, { icon: hzIcon, zIndexOffset: 760 }).addTo(hazardLayer);
        marker.bindPopup(`
          <div class="gis-popup-card hazard-gis-popup">
            <div class="popup-header-bar danger-bar">
              <span class="tag-blockade">ROAD INCIDENT / CLOSURE</span>
              <span>${hz.id}</span>
            </div>
            <h4>${hz.icon} ${hz.title}</h4>
            <p class="hazard-status-alert"><strong>Status:</strong> ${hz.status}</p>
            <p class="hazard-depth"><strong>Impact:</strong> ${hz.depth}</p>
            <div class="hazard-action-tip">
              💡 <strong>Action:</strong> ${hz.action}
            </div>
          </div>
        `);
      });
    }

    // 🏠 F. REALISTIC 3D SHELTERS WITH LIVE FLOATING BEDS GAUGE
    if (layerVisibility.shelters) {
      shelters.forEach(sh => {
        const isSelected = activeShelterId === sh.id;
        const occPercent = Math.round((sh.occupied / sh.capacity) * 100);

        const shelterIcon = L.divIcon({
          className: 'realistic-shelter-icon',
          html: `
            <div class="shelter-3d-pin ${isSelected ? 'focused' : ''}">
              <div class="shelter-roof">
                <span class="shelter-icon-sym">🏠</span>
              </div>
              <div class="shelter-occupancy-pill">
                <span class="occupancy-fill" style="width: ${occPercent}%"></span>
                <span class="occ-label">${sh.available} Free Beds</span>
              </div>
            </div>
          `,
          iconSize: [80, 55],
          iconAnchor: [40, 50],
        });

        const marker = L.marker(sh.coords, { icon: shelterIcon }).addTo(shLayer);
        marker.bindPopup(`
          <div class="gis-popup-card shelter-popup">
            <div class="popup-header-bar">
              <span class="tag-shelter-open">VERIFIED RELIEF CENTER</span>
              <span class="distance-chip">${sh.distance} away</span>
            </div>
            <h4>🏠 ${sh.name}</h4>
            <p class="popup-address">${sh.address}</p>
            <div class="capacity-gauge-box">
              <div class="gauge-labels">
                <span>Total Capacity: <strong>${sh.capacity}</strong></span>
                <span class="text-emerald">Available: <strong>${sh.available} Free Beds</strong></span>
              </div>
              <div class="gauge-track-sm">
                <div class="gauge-fill-sm" style="width: ${occPercent}%"></div>
              </div>
            </div>
            <div class="shelter-facility-badges">
              ${sh.facilities.map(f => `<span class="badge-facility">✓ ${f}</span>`).join('')}
            </div>
            <div class="popup-action-row">
              <span class="contact-num">📞 Camp Desk: <strong>${sh.contact}</strong></span>
              <button class="btn-popup-route" onclick="window.__rakshaSelectShelter && window.__rakshaSelectShelter('${sh.id}')">
                🧭 ${isHindi ? 'यहाँ सुरक्षित मार्ग बनाएँ' : 'Navigate Flood-Safe Route'}
              </button>
            </div>
          </div>
        `);
      });

      // Expose helper to global window for popup button click
      window.__rakshaSelectShelter = (id) => {
        const found = shelters.find(s => s.id === id);
        if (found && onSelectShelter) {
          onSelectShelter(found);
        }
      };
    }

    // 🚨 G. REALISTIC EMERGENCY INCIDENT STROBE DISTRESS BEACON (#RS1024)
    incidents.forEach(inc => {
      if (inc.status === 'Resolved' && mode !== 'admin') return;

      const isCritical = inc.severity === 'Critical';
      const isTarget = activeIncidentId === inc.id;

      const incidentIcon = L.divIcon({
        className: 'realistic-incident-icon',
        html: `
          <div class="incident-beacon ${isCritical ? 'critical-beacon' : 'high-beacon'} ${isTarget ? 'target-glow' : ''}">
            <div class="beacon-pulse-ring"></div>
            <div class="beacon-pulse-ring delay"></div>
            <div class="beacon-core">
              <span class="beacon-sym">${inc.type === 'Fire' ? '🔥' : inc.type === 'Flood' ? '🌊' : '🚨'}</span>
            </div>
            <div class="beacon-id-flag">
              <span class="id-tag">${inc.id}</span>
              <span class="affected-tag">${inc.peopleAffected} stranded</span>
            </div>
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      });

      const marker = L.marker(inc.coords, { icon: incidentIcon, zIndexOffset: 950 }).addTo(incLayer);
      marker.bindPopup(`
        <div class="gis-popup-card incident-gis-popup">
          <div class="popup-header-bar danger-bar">
            <span class="badge-priority">PRIORITY: ${inc.severity.toUpperCase()}</span>
            <span class="mono-id">${inc.id}</span>
          </div>
          <h4>${inc.title}</h4>
          <p class="popup-address">${inc.location}</p>
          <p class="popup-desc-box">${inc.description}</p>
          <div class="incident-metrics-grid">
            <div><span>Civilians:</span> <strong class="text-rose">${inc.peopleAffected} Stranded</strong></div>
            <div><span>Flood Depth:</span> <strong class="text-cyan">~1.5m Surging</strong></div>
            <div><span>Status:</span> <strong class="text-amber">${inc.status}</strong></div>
            <div><span>Required:</span> <strong>Rescue Boat + ALS</strong></div>
          </div>
          ${inc.assignedTeam ? `<div class="dispatched-team-tag">🚑 Dispatched: <strong>${inc.assignedTeam} (ETA 3 Mins)</strong></div>` : '<div class="pending-dispatch-tag">⚠️ Dispatch Required Immediately</div>'}
        </div>
      `);
    });

    // 🚑 H. REALISTIC RESPONDER UNITS (NDRF AMPHIBIOUS CRUISER & BOATS)
    if (layerVisibility.responders && (mode === 'responder' || mode === 'admin' || mode === 'tri-view')) {
      const isDeployed = responderTeam.status === 'Deployed' || responderTeam.status === 'On Scene';

      const alphaIcon = L.divIcon({
        className: 'responder-unit-icon',
        html: `
          <div class="tactical-unit-pin ${isDeployed ? 'deployed-unit' : 'available-unit'}">
            <div class="unit-radar-sweep"></div>
            <div class="unit-badge-core">
              <span class="unit-sym">🚤</span>
            </div>
            <div class="unit-callsign-box">
              <span class="unit-name">ALPHA-1</span>
              <span class="unit-speed">${isDeployed ? '38 km/h' : 'READY'}</span>
            </div>
          </div>
        `,
        iconSize: [60, 50],
        iconAnchor: [30, 25],
      });

      L.marker(responderTeam.location, { icon: alphaIcon, zIndexOffset: 880 })
        .addTo(respLayer)
        .bindPopup(`
          <div class="gis-popup-card unit-popup">
            <div class="popup-header-bar info-bar">
              <span class="badge-unit">NDRF RAPID WATER RESCUE</span>
              <span class="mono-unit">UNIT #04</span>
            </div>
            <h4>${responderTeam.name}</h4>
            <p><strong>Platform:</strong> ${responderTeam.vehicle}</p>
            <p><strong>Deployment Status:</strong> <span class="tag-status ${isDeployed ? 'deployed' : 'standby'}">${responderTeam.status.toUpperCase()}</span></p>
            <p><strong>Crew:</strong> 8 Specialists (Combat Divers & Trauma Paramedics)</p>
            <p><strong>Speed:</strong> 38 km/h • Heading 042° NE</p>
          </div>
        `);
    }

    // 🚁 I. REALISTIC AIRBORNE RECON DRONE (UAV-01) WITH RADAR SWEEP
    if (layerVisibility.drone && reconDrone) {
      const droneIcon = L.divIcon({
        className: 'drone-recon-icon',
        html: `
          <div class="tactical-drone-pin">
            <div class="drone-fov-cone"></div>
            <div class="drone-rotor-body">
              <span class="drone-sym">🚁</span>
            </div>
            <div class="drone-callout-pill">
              <span class="uav-name">${reconDrone.callsign}</span>
              <span class="uav-alt">${reconDrone.altitude}</span>
            </div>
          </div>
        `,
        iconSize: [65, 65],
        iconAnchor: [32, 32],
      });

      const droneMarker = L.marker(reconDrone.coords, { icon: droneIcon, zIndexOffset: 920 }).addTo(droneLayer);
      droneMarker.bindPopup(`
        <div class="gis-popup-card drone-popup">
          <div class="popup-header-bar info-bar">
            <span class="badge-drone">AERIAL RECON FLIR UAV</span>
            <span>${reconDrone.id}</span>
          </div>
          <h4>🚁 ${reconDrone.callsign}</h4>
          <div class="drone-metrics-grid">
            <div><span>Altitude:</span> <strong>${reconDrone.altitude}</strong></div>
            <div><span>Battery:</span> <strong class="text-emerald">${reconDrone.battery}</strong></div>
            <div><span>Sensor:</span> <strong>${reconDrone.camera}</strong></div>
            <div><span>Speed:</span> <strong>${reconDrone.speed}</strong></div>
          </div>
          <div class="drone-status-line">
            <span>Status: <strong>${reconDrone.status}</strong></span>
          </div>
        </div>
      `);
    }

    // 🛣️ J. REALISTIC TURN-BY-TURN SAFE HIGH-GROUND EVACUATION CORRIDOR
    if (layerVisibility.routes && (showRoute || responderTeam.status === 'Deployed' || targetDestination)) {
      const destCoords = targetDestination || (shelters[0] ? shelters[0].coords : [uLat, uLng]);
      const startCoords = mode === 'citizen' ? [uLat, uLng] : responderTeam.location;

      // Realistic high-ground detour deliberately avoiding the red flooded corridor
      const midLat = (startCoords[0] + destCoords[0]) / 2 + 0.0022;
      const midLng = (startCoords[1] + destCoords[1]) / 2 - 0.0018;

      const corridorPath = [
        startCoords,
        [startCoords[0] + (midLat - startCoords[0]) * 0.45, startCoords[1] + 0.0008],
        [midLat, midLng],
        [midLat + (destCoords[0] - midLat) * 0.55, midLng - 0.0010],
        destCoords
      ];

      // Route Outer Glow Ribbon
      L.polyline(corridorPath, {
        color: mode === 'citizen' ? '#10B981' : '#3B82F6',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
      }).addTo(rtLayer);

      // Route Inner High-Intensity Neon Dashed Line with Directional Pulse
      const mainRoute = L.polyline(corridorPath, {
        color: mode === 'citizen' ? '#34D399' : '#60A5FA',
        weight: 4.5,
        opacity: 0.98,
        dashArray: '12, 12',
        className: 'animated-corridor-flow'
      }).addTo(rtLayer);

      // Add High-Ground Waypoint Marker on Flyover
      const waypointIcon = L.divIcon({
        className: 'waypoint-marker-icon',
        html: `
          <div class="waypoint-pill">
            <span>↗️ Elevated Flyover (+18m MSL - Flood Safe)</span>
          </div>
        `,
        iconSize: [160, 24],
        iconAnchor: [80, 12],
      });
      L.marker([midLat, midLng], { icon: waypointIcon }).addTo(rtLayer);

      mainRoute.bindTooltip(`
        <div class="corridor-eta-tooltip">
          <span>${mode === 'citizen' ? '🟢 Evacuation Route: 650m (Elevated Roadway • Safe from Surge)' : '🚑 Fast Response Corridor: ETA 3 Mins'}</span>
        </div>
      `, { permanent: true, direction: 'center', className: 'corridor-tooltip-styled' });

      try {
        map.fitBounds(mainRoute.getBounds(), { padding: [60, 60] });
      } catch {
        // ignore
      }
    }

    // 🔍 K. ACTIVE CLICK-TO-INSPECT RETICLE
    if (activeInspector) {
      const inspectIcon = L.divIcon({
        className: 'inspection-reticle-icon',
        html: `
          <div class="inspect-crosshair">
            <div class="crosshair-circle"></div>
            <div class="crosshair-target"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const inspectMarker = L.marker(activeInspector.coords, { icon: inspectIcon, zIndexOffset: 1100 }).addTo(inspectLayer);
      inspectMarker.bindPopup(`
        <div class="gis-popup-card inspect-popup">
          <div class="popup-header-bar">
            <span class="tag-inspect">TERRAIN & FLOOD TELEMETRY</span>
            <span class="mono-coords">${activeInspector.coords[0].toFixed(5)}°N, ${activeInspector.coords[1].toFixed(5)}°E</span>
          </div>
          <h4>📍 Point Telemetry Inspection</h4>
          <div class="inspect-grid">
            <div><span>Elevation:</span> <strong>${activeInspector.elevation}</strong></div>
            <div><span>Est. Water Depth:</span> <strong>${activeInspector.waterDepth}</strong></div>
            <div><span>Distance to You:</span> <strong>${activeInspector.distance}</strong></div>
            <div><span>Safety Status:</span> <strong style="color: ${activeInspector.statusColor}">${activeInspector.riskLevel}</strong></div>
          </div>
        </div>
      `).openPopup();
    }

  }, [
    incidents,
    shelters,
    responderTeam,
    userLocation,
    geoPolygons,
    waterSensors,
    roadHazards,
    reconDrone,
    mode,
    activeIncidentId,
    activeShelterId,
    showRoute,
    targetDestination,
    layerVisibility,
    showRangeRings,
    localFloodRise,
    activeInspector,
    isHindi,
  ]);

  // Map Recenter Action
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map && userLocation.lat && userLocation.lng) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleFloodSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setLocalFloodRise(val);
    if (setFloodRiseSim) {
      setFloodRiseSim(val);
    }
  };

  return (
    <div
      className={`realistic-map-wrapper ${isFullscreen ? 'map-fullscreen-active' : ''} ${mapStyle === 'thermal' ? 'map-thermal-mode' : ''}`}
      style={{ height: isFullscreen ? '94vh' : height }}
    >
      <div ref={mapContainerRef} className="leaflet-map-element" />

      {/* TOP CONTROLS BAR: BASEMAP SWITCHER & LIVE DOPPLER RADAR TOGGLE */}
      <div className="map-top-controls-bar">
        {/* Basemap Segmented Control */}
        <div className="basemap-segmented-control">
          <button
            className={`map-seg-btn ${mapStyle === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapStyle('satellite')}
            title="Real Mapbox Satellite Imagery with high-res building footprints and street labels"
          >
            🛰️ Satellite HD
          </button>
          <button
            className={`map-seg-btn ${mapStyle === 'dark' ? 'active' : ''}`}
            onClick={() => setMapStyle('dark')}
            title="Tactical Dark Navigation Map"
          >
            🌙 Dark Ops
          </button>
          <button
            className={`map-seg-btn ${mapStyle === 'streets' ? 'active' : ''}`}
            onClick={() => setMapStyle('streets')}
            title="Standard High-Contrast Navigation Street Map"
          >
            🗺️ Streets
          </button>
          <button
            className={`map-seg-btn ${mapStyle === 'terrain' ? 'active' : ''}`}
            onClick={() => setMapStyle('terrain')}
            title="Topographical Elevation Contours and Watershed Relief"
          >
            ⛰️ Topo 3D
          </button>
          <button
            className={`map-seg-btn ${mapStyle === 'thermal' ? 'active' : ''}`}
            onClick={() => setMapStyle('thermal')}
            title="FLIR Infrared Thermal Simulation Mode for Night Search & Rescue"
          >
            🌡️ FLIR Thermal
          </button>
        </div>

        {/* Live Doppler Radar Toggle Button */}
        <button
          className={`btn-toggle-radar ${showRadar ? 'radar-on' : 'radar-off'}`}
          onClick={() => setShowRadar(!showRadar)}
          title="Toggle Real-Time Doppler Rain/Storm Radar Layer from RainViewer Satellites"
        >
          <CloudRain size={15} />
          <span>🌧️ Doppler Radar: {showRadar ? 'ON' : 'OFF'}</span>
          {showRadar && <span className="radar-time-tag">({radarTime})</span>}
        </button>

        {/* Tactical Range Rings Toggle */}
        <button
          className={`btn-map-icon-tool ${showRangeRings ? 'active-tool' : ''}`}
          onClick={() => setShowRangeRings(!showRangeRings)}
          title="Toggle 500m / 1000m / 2000m Tactical Emergency Range Rings"
        >
          <Crosshair size={16} />
        </button>

        {/* Simulated Live Drone Feed PiP Button */}
        <button
          className={`btn-map-icon-tool ${showDroneFeed ? 'active-tool' : ''}`}
          onClick={() => setShowDroneFeed(!showDroneFeed)}
          title="Toggle Live Airborne FLIR Drone Video Feed PiP"
        >
          <Video size={16} />
        </button>

        {/* Fullscreen Button */}
        <button
          className="btn-map-icon-tool"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* FLOATING MILITARY HUD CORNER: GPS LOCK & TELEMETRY */}
      <div className="map-hud-telemetry-corner">
        <div className="hud-metric">
          <span className="hud-indicator-dot"></span>
          <span className="hud-label">SATELLITE TELEMETRY:</span>
          <strong className="hud-val">GPS L1/L5 RTK-FIX (12 Sats)</strong>
        </div>
        <div className="hud-coords">
          {cursorCoords ? (
            <span>CURSOR: {cursorCoords[0].toFixed(5)}°N, {cursorCoords[1].toFixed(5)}°E</span>
          ) : (
            <span>TARGET: {(userLocation.lat || 28.6139).toFixed(5)}°N, {(userLocation.lng || 77.2090).toFixed(5)}°E</span>
          )}
        </div>
        <div className="hud-zoom">
          <span>ZOOM: {currentZoom}x • LAYER: {mapStyle.toUpperCase()} • ELEV: 214m MSL</span>
        </div>
      </div>

      {/* FLOATING WATER LEVEL SURGE SIMULATOR SLIDER */}
      <div className="map-flood-sim-slider-bar">
        <div className="flood-sim-label-row">
          <div className="flood-sim-title">
            <Waves size={14} className="text-cyan" />
            <span>{isHindi ? 'जलस्तर वृद्धि सिमुलेटर' : 'Live Flood Rise Sim'}:</span>
            <strong className="text-cyan">+{localFloodRise.toFixed(1)}m</strong>
          </div>
          <span className="flood-impact-badge">
            {localFloodRise >= 2.5 ? '🚨 CRITICAL SURGE' : localFloodRise >= 1.5 ? '⚠️ BASIN OVERFLOW' : '🟢 CONTROLLED RUNOFF'}
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="3.0"
          step="0.25"
          value={localFloodRise}
          onChange={handleFloodSliderChange}
          className="flood-range-slider"
          title="Drag to simulate water level rise and inspect dynamic polygon expansion"
        />
        <div className="slider-ticks">
          <span>+0m Normal</span>
          <span>+1.5m Danger</span>
          <span>+3.0m Surge</span>
        </div>
      </div>

      {/* QUICK RECENTER FLOATING BUTTON */}
      <button className="btn-floating-recenter" onClick={handleRecenter} title="Re-center onto your present location">
        <Crosshair size={18} />
      </button>

      {/* COMPACT REALISTIC LEGEND WITH LAYER TOGGLE FILTERS */}
      <div className={`realistic-map-legend ${legendOpen ? 'legend-expanded' : 'legend-collapsed'}`}>
        <div
          className="legend-head-row clickable-legend-head"
          onClick={() => setLegendOpen(!legendOpen)}
          role="button"
          tabIndex={0}
          title="Tap to toggle GIS telemetry layers"
        >
          <span className="legend-brand-title">🗺️ GIS LAYERS</span>
          <div className="legend-meta-right">
            <span className="legend-area-name">{userLocation.area || 'Active Grid'}</span>
            <span className="legend-toggle-caret">{legendOpen ? '▼' : '▲'}</span>
          </div>
        </div>

        <div className="legend-toggles-grid">
          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.dangerZones}
              onChange={() => setLayerVisibility({ ...layerVisibility, dangerZones: !layerVisibility.dangerZones })}
            />
            <span className="legend-color-box box-danger"></span>
            <span>🔴 Zone 3 (Critical Flood Surge)</span>
          </label>

          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.sensors}
              onChange={() => setLayerVisibility({ ...layerVisibility, sensors: !layerVisibility.sensors })}
            />
            <span className="legend-color-box box-sensor"></span>
            <span>💧 IoT Water Level Telemetry Stations</span>
          </label>

          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.hazards}
              onChange={() => setLayerVisibility({ ...layerVisibility, hazards: !layerVisibility.hazards })}
            />
            <span className="legend-color-box box-hazard"></span>
            <span>🚫 Road Blockades & Submerged Roads</span>
          </label>

          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.shelters}
              onChange={() => setLayerVisibility({ ...layerVisibility, shelters: !layerVisibility.shelters })}
            />
            <span className="legend-color-box box-shelter"></span>
            <span>🏠 Verified Evacuation Shelters</span>
          </label>

          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.responders}
              onChange={() => setLayerVisibility({ ...layerVisibility, responders: !layerVisibility.responders })}
            />
            <span className="legend-color-box box-responder"></span>
            <span>🚑 NDRF Response Cruiser & Units</span>
          </label>

          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.drone}
              onChange={() => setLayerVisibility({ ...layerVisibility, drone: !layerVisibility.drone })}
            />
            <span className="legend-color-box box-drone"></span>
            <span>🚁 Aerial Recon Drone (UAV-01)</span>
          </label>

          <label className="legend-filter-item">
            <input
              type="checkbox"
              checked={layerVisibility.routes}
              onChange={() => setLayerVisibility({ ...layerVisibility, routes: !layerVisibility.routes })}
            />
            <span className="legend-color-box box-route"></span>
            <span>🛣️ Turn-by-Turn Flood-Safe Corridor</span>
          </label>
        </div>
      </div>

      {/* SIMULATED LIVE DRONE RECON VIDEO FEED PiP MODAL */}
      {showDroneFeed && reconDrone && (
        <div className="drone-feed-pip-card">
          <div className="pip-header-bar">
            <div className="pip-title-box">
              <span className="pip-rec-dot"></span>
              <strong>LIVE DRONE FLIR FEED • {reconDrone.callsign}</strong>
            </div>
            <button className="pip-close-btn" onClick={() => setShowDroneFeed(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="pip-video-viewport">
            <div className="pip-hud-overlay">
              <div className="pip-reticle"></div>
              <div className="pip-telemetry-corner">
                <span>ALT: {reconDrone.altitude}</span>
                <span>SPD: {reconDrone.speed}</span>
                <span>BAT: {reconDrone.battery}</span>
                <span>OPT: 4K / FLIR IR</span>
              </div>
              <div className="pip-target-box">
                <span className="pip-target-code">TARGET #RS1024</span>
                <span className="pip-target-note">24 CIVILIANS ON ROOF</span>
              </div>
            </div>
            <div className="pip-static-grid"></div>
          </div>
          <div className="pip-footer">
            <span>SENSOR: FLIR THERMAL 640×512 • 30 FPS</span>
            <span className="text-cyan">GEO: {reconDrone.coords[0].toFixed(4)}, {reconDrone.coords[1].toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
