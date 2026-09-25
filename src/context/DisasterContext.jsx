import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { soundFx } from '../utils/audio';
import {
  DEFAULT_LOCATION,
  generateGeoEnvironment,
  reverseGeocode,
} from '../utils/locationService';
import { fetchLiveWeather } from '../utils/weatherService';
import { generateAiRiskAssessment } from '../utils/aiService';

const DisasterContext = createContext();

// Pre-computed default environment for initial render
const defaultEnv = generateGeoEnvironment(
  DEFAULT_LOCATION.lat,
  DEFAULT_LOCATION.lng,
  'Zone 3 (Present Sector)',
  'Central District'
);

const INITIAL_ALERTS = [
  {
    id: 'ALT-101',
    type: 'Flood Warning',
    zone: 'Zone 3',
    severity: 'Critical',
    title: 'Flood Warning – Zone 3 (Present Sector)',
    desc: 'Heavy rainfall and drainage overflow alert near your present coordinates. Low-lying sectors advised to evacuate.',
    source: 'National Disaster Management Authority (NDMA)',
    timestamp: 'Just now',
    active: true,
  },
  {
    id: 'ALT-100',
    type: 'Heavy Rain',
    zone: 'Sector South',
    severity: 'Moderate',
    title: 'Heavy Rain Advisory – Sector South',
    desc: 'Precipitation exceeding 95mm/hr. Water logging reported on connecting arterial bridges.',
    source: 'Met Department & IMD',
    timestamp: '45 mins ago',
    active: true,
  },
  {
    id: 'ALT-099',
    type: 'Industrial Safety',
    zone: 'Industrial Sector',
    severity: 'High',
    title: 'Industrial Safety Advisory – Sector East',
    desc: 'Localized industrial fire. Fire tenders on site. Keep windows shut in downwind sectors.',
    source: 'District Emergency Command',
    timestamp: '2 hours ago',
    active: false,
  }
];

export function DisasterProvider({ children }) {
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'responder' | 'admin' | 'tri-view'
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Present Live Location State
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState('detecting'); // 'detecting' | 'live' | 'fallback' | 'custom'
  const [locationError, setLocationError] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);

  // Geographic polygons & entities around current location
  const [geoPolygons, setGeoPolygons] = useState({
    danger: defaultEnv.dangerPolygon,
    medium: defaultEnv.mediumPolygon,
    safe: defaultEnv.safePolygon,
  });

  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [incidents, setIncidents] = useState(defaultEnv.incidents);
  const [shelters, setShelters] = useState(defaultEnv.shelters);
  const [responderTeam, setResponderTeam] = useState(defaultEnv.responderTeam);
  const [waterSensors, setWaterSensors] = useState(defaultEnv.waterSensors || []);
  const [roadHazards, setRoadHazards] = useState(defaultEnv.roadHazards || []);
  const [reconDrone, setReconDrone] = useState(defaultEnv.reconDrone || null);
  const [floodRiseSim, setFloodRiseSim] = useState(1.5); // meters of flood surge simulation

  // Resources overview
  const [resources, setResources] = useState({
    ambulances: { active: 12, total: 18 },
    rescueBoats: { active: 7, total: 10 },
    volunteers: 126,
    shelterCapacityPercent: 72,
    activeIncidentsCount: 12,
    highRiskZonesCount: 4,
    teamsDeployedCount: 18,
    sheltersCount: 8,
  });

  // AI Risk Analysis Model state
  const [riskInputs, setRiskInputs] = useState({
    rainfall: 180, // mm
    riverLevel: 4.5, // meters
    populationDensity: 'High',
    soilMoisture: 84, // %
  });

  const [riskResult, setRiskResult] = useState({
    analyzed: false,
    score: 87,
    level: 'HIGH RISK',
    color: '#EF4444',
    details: 'Heavy rainfall (180mm) combined with localized river/drainage surge (4.5m) exceeds danger mark (+1.2m). Soil saturation is at 84%. Inundation probability is 87%.',
    recommendations: [
      'Issue Level-3 Flash Flood Warning to Zone 3 citizens immediately',
      'Pre-deploy Water Rescue Team Alpha to Riverdale Block 4',
      'Prepare and open Government Model School shelter for evacuees'
    ]
  });

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, time: '15:20', text: 'RAKSHA-SETU Engine initialized. Telemetry channels online.', type: 'system' },
    { id: 2, time: '15:24', text: 'GPS L1/L5 Positioning module listening for present device coordinates', type: 'system' },
  ]);

  // Demo Story Step (0 to 6)
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Helper to log activities
  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs(prev => [{ id: Date.now(), time, text, type }, ...prev.slice(0, 20)]);
  };

  // Broadcast state across tabs
  const broadcastState = (updatedState) => {
    try {
      const bc = new BroadcastChannel('raksha_setu_bus');
      bc.postMessage({ type: 'SYNC_ALL', payload: updatedState });
      bc.close();
    } catch {
      // ignore
    }
  };

  // Apply location and recalculate all disaster assets around coordinates
  const applyCoordinates = useCallback(async (lat, lng, labelArea = null, labelCity = null, isLiveGps = false) => {
    try {
      setLocationStatus('detecting');

      let geoDetails;
      if (labelArea && labelCity) {
        geoDetails = { area: labelArea, city: labelCity, fullAddress: `${labelArea}, ${labelCity}` };
      } else {
        geoDetails = await reverseGeocode(lat, lng);
      }

      const newLocation = {
        lat,
        lng,
        area: geoDetails.area || 'Current Sector',
        city: geoDetails.city || 'Present City',
        address: geoDetails.fullAddress || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`,
        isDetected: true,
        isLiveGps,
      };

      setUserLocation(newLocation);
      setLocationStatus(isLiveGps ? 'live' : 'custom');

      // Fetch real live weather telemetry
      try {
        const savedWeatherKey = localStorage.getItem('RAKSHA_OPENWEATHER_KEY');
        const weather = await fetchLiveWeather(lat, lng, savedWeatherKey);
        setLiveWeather(weather);
        addLog(`🌦️ Live Weather synced for ${newLocation.area}: ${weather.temperature}°C (${weather.condition})`, 'system');
      } catch {
        // ignore
      }

      // Generate dynamic environment around new coordinates
      const newEnv = generateGeoEnvironment(lat, lng, newLocation.area, newLocation.city);

      setGeoPolygons({
        danger: newEnv.dangerPolygon,
        medium: newEnv.mediumPolygon,
        safe: newEnv.safePolygon,
      });

      setShelters(newEnv.shelters);
      setIncidents(newEnv.incidents);
      setResponderTeam(newEnv.responderTeam);
      if (newEnv.waterSensors) setWaterSensors(newEnv.waterSensors);
      if (newEnv.roadHazards) setRoadHazards(newEnv.roadHazards);
      if (newEnv.reconDrone) setReconDrone(newEnv.reconDrone);

      // Update primary alert title to match present area
      setAlerts(prev => [
        {
          ...prev[0],
          zone: `${newLocation.area} (Zone 3)`,
          title: `Flood Warning – ${newLocation.area}`,
          desc: `Severe water surge & precipitation alert near ${newLocation.address}. Immediate evacuation to safe sectors advised.`,
        },
        ...prev.slice(1)
      ]);

      addLog(`📍 Location Synced: Centered disaster grid on ${newLocation.address}`, 'system');

      broadcastState({
        userLocation: newLocation,
        shelters: newEnv.shelters,
        incidents: newEnv.incidents,
        responderTeam: newEnv.responderTeam,
      });
    } catch (err) {
      console.warn('Location application error:', err);
      setLocationStatus('fallback');
    }
  }, []);

  // Detect live present location using Browser Geolocation API with IP fallback
  const detectPresentLocation = useCallback(() => {
    setLocationStatus('detecting');
    setLocationError(null);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          applyCoordinates(latitude, longitude, null, null, true);
        },
        (error) => {
          console.warn('Browser GPS permission or timeout:', error.message);
          // Try IP-based fallback
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data && data.latitude && data.longitude) {
                applyCoordinates(
                  data.latitude,
                  data.longitude,
                  data.city || data.region,
                  data.region || data.country_name,
                  false
                );
              } else {
                applyCoordinates(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, 'Central Sector', 'New Delhi', false);
              }
            })
            .catch(() => {
              applyCoordinates(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, 'Central Sector', 'New Delhi', false);
            });
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 10000 }
      );
    } else {
      // Fallback
      applyCoordinates(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, 'Central Sector', 'New Delhi', false);
    }
  }, [applyCoordinates]);

  // Initial detection on mount
  useEffect(() => {
    detectPresentLocation();
  }, [detectPresentLocation]);

  // Sync across tabs
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('raksha_setu_bus');
      bc.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SYNC_ALL') {
          if (payload.alerts) setAlerts(payload.alerts);
          if (payload.incidents) setIncidents(payload.incidents);
          if (payload.responderTeam) setResponderTeam(payload.responderTeam);
          if (payload.resources) setResources(payload.resources);
          if (payload.riskResult) setRiskResult(payload.riskResult);
          if (payload.activityLogs) setActivityLogs(payload.activityLogs);
          if (payload.userLocation) setUserLocation(payload.userLocation);
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (bc) bc.close();
    };
  }, []);

  // 1. Admin: Run AI Risk Analysis (Calls Gemini if key provided, else intelligent rule model)
  const runRiskAnalysis = async (inputs = riskInputs) => {
    soundFx.playAiAnalyze();
    const savedGeminiKey = localStorage.getItem('RAKSHA_GEMINI_KEY') || import.meta.env.VITE_GEMINI_API_KEY;

    const result = await generateAiRiskAssessment({
      rainfall: inputs.rainfall,
      riverLevel: inputs.riverLevel,
      soilMoisture: inputs.soilMoisture,
      populationDensity: inputs.populationDensity,
      locationName: userLocation.area || 'Current Sector',
      lat: userLocation.lat,
      lng: userLocation.lng,
      geminiApiKey: savedGeminiKey,
    });

    setRiskResult(result);
    addLog(`🤖 Risk Model executed via ${result.source}: ${result.level} (${result.score}%)`, 'risk');
    broadcastState({ riskResult: result });
    return result;
  };

  // 2. Admin: Create & Broadcast Alert
  const createAlert = ({ type, zone, title, message, severity = 'Critical' }) => {
    soundFx.playEmergencyAlert();
    const newAlert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      type: type || 'Flood Warning',
      zone: zone || userLocation.area,
      title: title || `${type || 'Flood Warning'} – ${zone || userLocation.area}`,
      desc: message || `Heavy rainfall expected near ${userLocation.address}. Immediate evacuation advised for vulnerable sectors.`,
      severity,
      source: 'National Command Center & NDMA',
      timestamp: 'Just now',
      active: true,
    };

    const updatedAlerts = [newAlert, ...alerts];
    setAlerts(updatedAlerts);

    addLog(`📢 New Emergency Alert issued: "${newAlert.title}"`, 'alert');
    broadcastState({ alerts: updatedAlerts });
    return newAlert;
  };

  // 3. Citizen: Report Emergency
  const reportEmergency = ({ disasterType, location: locName, severity, description, peopleAffected = 24, coords = null }) => {
    soundFx.playSosSent();
    const incidentId = 'RS1024';

    const actualCoords = coords || [userLocation.lat, userLocation.lng];
    const actualLocation = locName || userLocation.address;

    const newIncident = {
      id: incidentId,
      title: `${disasterType || 'Flood Rescue'} – ${userLocation.area}`,
      type: disasterType || 'Flood',
      zone: userLocation.area,
      location: actualLocation,
      coords: actualCoords,
      severity: severity || 'Critical',
      peopleAffected: Number(peopleAffected) || 24,
      description: description || `Water rising quickly near ${userLocation.address}. 24 people stranded on upper floors needing immediate boat evacuation.`,
      status: 'Pending',
      requiredResources: {
        ambulance: 1,
        rescueBoat: 1,
        medicalKit: 5,
      },
      assignedTeam: null,
      reportedAt: 'Just now',
    };

    const existingIndex = incidents.findIndex(i => i.id === incidentId);
    let updatedIncidents;
    if (existingIndex >= 0) {
      updatedIncidents = [...incidents];
      updatedIncidents[existingIndex] = newIncident;
    } else {
      updatedIncidents = [newIncident, ...incidents];
    }

    const updatedResources = {
      ...resources,
      activeIncidentsCount: resources.activeIncidentsCount + 1,
    };

    setIncidents(updatedIncidents);
    setResources(updatedResources);

    addLog(`👤 Citizen reported Emergency #${incidentId} at ${newIncident.location}: (${newIncident.peopleAffected} affected)`, 'sos');
    broadcastState({ incidents: updatedIncidents, resources: updatedResources });
    return incidentId;
  };

  // 4. Responder: Accept Task
  const acceptTask = (incidentId = 'RS1024') => {
    soundFx.playTaskAccepted();

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'Accepted',
          assignedTeam: 'Team Alpha (NDRF Unit 4)',
        };
      }
      return inc;
    });

    const updatedResponder = {
      ...responderTeam,
      status: 'Deployed',
      currentTaskId: incidentId,
    };

    const updatedResources = {
      ...resources,
      teamsDeployedCount: resources.teamsDeployedCount + 1,
      ambulances: {
        ...resources.ambulances,
        active: Math.min(resources.ambulances.total, resources.ambulances.active + 1)
      },
      rescueBoats: {
        ...resources.rescueBoats,
        active: Math.min(resources.rescueBoats.total, resources.rescueBoats.active + 1)
      }
    };

    setIncidents(updatedIncidents);
    setResponderTeam(updatedResponder);
    setResources(updatedResources);

    addLog(`🚑 Team Alpha ACCEPTED Task #${incidentId} at ${userLocation.area}. Status: DEPLOYED. Route initiated.`, 'team');
    broadcastState({
      incidents: updatedIncidents,
      responderTeam: updatedResponder,
      resources: updatedResources
    });
  };

  // 5. Update Incident Status
  const updateIncidentStatus = (incidentId, newStatus) => {
    soundFx.playDispatchChime();
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        return { ...inc, status: newStatus };
      }
      return inc;
    });

    let updatedResponder = { ...responderTeam };
    let updatedResources = { ...resources };

    if (newStatus === 'Resolved') {
      updatedResponder = {
        ...responderTeam,
        status: 'Available',
        currentTaskId: null,
      };
      updatedResources = {
        ...resources,
        activeIncidentsCount: Math.max(0, resources.activeIncidentsCount - 1),
        teamsDeployedCount: Math.max(0, resources.teamsDeployedCount - 1),
      };
      addLog(`✅ Task #${incidentId} marked as RESOLVED by Team Alpha. 24 civilians rescued safely.`, 'success');
    } else {
      updatedResponder.status = newStatus === 'On Scene' ? 'On Scene' : 'Deployed';
      addLog(`📍 Task #${incidentId} status updated to: ${newStatus}`, 'team');
    }

    setIncidents(updatedIncidents);
    setResponderTeam(updatedResponder);
    setResources(updatedResources);

    broadcastState({
      incidents: updatedIncidents,
      responderTeam: updatedResponder,
      resources: updatedResources
    });
  };

  // Reset demo state back to default
  const resetDemo = () => {
    const env = generateGeoEnvironment(userLocation.lat, userLocation.lng, userLocation.area, userLocation.city);
    setAlerts(INITIAL_ALERTS);
    setIncidents(env.incidents);
    setShelters(env.shelters);
    setResponderTeam(env.responderTeam);
    setResources({
      ambulances: { active: 12, total: 18 },
      rescueBoats: { active: 7, total: 10 },
      volunteers: 126,
      shelterCapacityPercent: 72,
      activeIncidentsCount: 12,
      highRiskZonesCount: 4,
      teamsDeployedCount: 18,
      sheltersCount: 8,
    });
    setRiskResult({
      analyzed: false,
      score: 87,
      level: 'HIGH RISK',
      color: '#EF4444',
      details: 'Heavy rainfall (180mm) combined with localized river/drainage surge (4.5m) exceeds danger mark (+1.2m). Soil saturation is at 84%.',
      recommendations: [
        `Issue Level-3 Flash Flood Warning to ${userLocation.area} citizens immediately`,
        `Pre-deploy Water Rescue Team Alpha to ${userLocation.area}`,
        `Prepare and open ${env.shelters[0]?.name || 'Local Relief Camp'} for evacuees`
      ]
    });
    setDemoStep(0);
    setIsDemoRunning(false);
    addLog('System state restored to initial readiness baseline.', 'system');
  };

  // Step-by-step Interactive SIH Demo Walkthrough
  const runNextDemoStep = () => {
    const nextStep = demoStep + 1;
    if (nextStep === 1) {
      setActiveTab('admin');
      runRiskAnalysis({ rainfall: 180, riverLevel: 4.5, soilMoisture: 84, populationDensity: 'High' });
      setDemoStep(1);
    } else if (nextStep === 2) {
      setActiveTab('admin');
      createAlert({
        type: 'Flood Warning',
        zone: userLocation.area,
        title: `Flood Warning – ${userLocation.area}`,
        message: `Heavy rainfall expected. Immediate evacuation advised for ${userLocation.address}.`,
        severity: 'Critical'
      });
      setDemoStep(2);
    } else if (nextStep === 3) {
      setActiveTab('citizen');
      setDemoStep(3);
    } else if (nextStep === 4) {
      setActiveTab('citizen');
      reportEmergency({
        disasterType: 'Flood Rescue',
        location: userLocation.address,
        severity: 'Critical',
        peopleAffected: 24,
        description: `Water rising quickly near ${userLocation.address}. 24 people stranded on upper floors.`,
        coords: [userLocation.lat, userLocation.lng]
      });
      setDemoStep(4);
    } else if (nextStep === 5) {
      setActiveTab('responder');
      soundFx.playDispatchChime();
      setDemoStep(5);
    } else if (nextStep === 6) {
      acceptTask('RS1024');
      setTimeout(() => {
        setActiveTab('admin');
      }, 700);
      setDemoStep(6);
    } else {
      setDemoStep(0);
    }
  };

  return (
    <DisasterContext.Provider
      value={{
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        soundEnabled,
        setSoundEnabled,
        userLocation,
        liveWeather,
        locationStatus,
        locationError,
        detectPresentLocation,
        applyCoordinates,
        geoPolygons,
        alerts,
        incidents,
        shelters,
        responderTeam,
        waterSensors,
        roadHazards,
        reconDrone,
        floodRiseSim,
        setFloodRiseSim,
        resources,
        riskInputs,
        setRiskInputs,
        riskResult,
        runRiskAnalysis,
        createAlert,
        reportEmergency,
        acceptTask,
        updateIncidentStatus,
        activityLogs,
        addLog,
        demoStep,
        setDemoStep,
        isDemoRunning,
        setIsDemoRunning,
        runNextDemoStep,
        resetDemo,
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
}

export function useDisaster() {
  return useContext(DisasterContext);
}
