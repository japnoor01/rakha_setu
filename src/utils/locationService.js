// Geolocation utility for RAKSHA-SETU to dynamically adapt all dashboards to the user's present location

export const DEFAULT_LOCATION = {
  lat: 28.6139,
  lng: 77.2090,
  city: 'New Delhi',
  area: 'Central Zone',
  address: 'Present Location (Auto-Detecting GPS...)',
  isDetected: false,
};

// Compute a target latitude/longitude given a distance (in meters) and bearing (in degrees)
export function computeOffset(lat, lng, distanceMeters, bearingDegrees) {
  const R = 6378137; // Earth's radius in meters
  const d = distanceMeters / R;
  const brng = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [Number(((lat2 * 180) / Math.PI).toFixed(5)), Number(((lon2 * 180) / Math.PI).toFixed(5))];
}

// Calculate true geodesic ground distance between two coordinates in meters (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6378137; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate real-time danger zones, safe zones, shelters, and responder bases around the user's present position
export function generateGeoEnvironment(centerLat, centerLng, areaName = 'Local Sector', cityName = 'Current City') {
  // 1. Danger Zone 3 (Red) - 400m to 900m North-East
  const p1 = computeOffset(centerLat, centerLng, 350, 20);
  const p2 = computeOffset(centerLat, centerLng, 850, 45);
  const p3 = computeOffset(centerLat, centerLng, 950, 90);
  const p4 = computeOffset(centerLat, centerLng, 450, 110);
  const dangerPolygon = [p1, p2, p3, p4];

  // 2. Medium Risk Zone 5 (Orange) - 600m to 1200m South-East
  const m1 = computeOffset(centerLat, centerLng, 600, 140);
  const m2 = computeOffset(centerLat, centerLng, 1200, 160);
  const m3 = computeOffset(centerLat, centerLng, 1100, 200);
  const m4 = computeOffset(centerLat, centerLng, 550, 190);
  const mediumPolygon = [m1, m2, m3, m4];

  // 3. Safe Zone 1 & 2 (Green) - 500m to 1400m North-West
  const s1 = computeOffset(centerLat, centerLng, 400, 290);
  const s2 = computeOffset(centerLat, centerLng, 1100, 315);
  const s3 = computeOffset(centerLat, centerLng, 1250, 350);
  const s4 = computeOffset(centerLat, centerLng, 550, 360);
  const safePolygon = [s1, s2, s3, s4];

  // Shelters placed in safe sectors
  const shelter1Coords = computeOffset(centerLat, centerLng, 650, 310);
  const shelter2Coords = computeOffset(centerLat, centerLng, 1200, 270);
  const shelter3Coords = computeOffset(centerLat, centerLng, 1600, 340);

  const shelters = [
    {
      id: 'SH-1',
      name: `Government Senior Model School (${areaName})`,
      zone: 'Zone 1 (Safe Sector)',
      address: `Near Main Road, ${areaName}, ${cityName}`,
      coords: shelter1Coords,
      capacity: 500,
      available: 180,
      occupied: 320,
      distance: '650 m',
      facilities: ['Food & Potable Water', 'First Aid Post', 'Power Generator', 'Child Care Space'],
      contact: '1070 / +91-112',
      status: 'Operational'
    },
    {
      id: 'SH-2',
      name: `Community Indoor Stadium & Relief Hub`,
      zone: 'Zone 2 (Safe Sector)',
      address: `Sector Complex, ${cityName}`,
      coords: shelter2Coords,
      capacity: 800,
      available: 420,
      occupied: 380,
      distance: '1.2 km',
      facilities: ['Helipad Access', '24/7 Medical Staff', 'Clean Bedding & Kits', 'Sanitation Blocks'],
      contact: '1070 / +91-112',
      status: 'Operational'
    },
    {
      id: 'SH-3',
      name: `Civil Defense Central Relief Camp`,
      zone: 'Safe Sector West',
      address: `Administrative Block, ${cityName}`,
      coords: shelter3Coords,
      capacity: 350,
      available: 45,
      occupied: 305,
      distance: '1.6 km',
      facilities: ['Emergency Kitchen', 'Disaster Relief Volunteers', 'Communication Desk'],
      contact: '1070 / +91-112',
      status: 'Nearly Full'
    }
  ];

  // Citizen Emergency at or near current user position
  const userIncidentCoords = [centerLat, centerLng];
  const fireIncidentCoords = computeOffset(centerLat, centerLng, 800, 65);
  const roadBlockCoords = computeOffset(centerLat, centerLng, 950, 175);

  const incidents = [
    {
      id: 'RS1024',
      title: `Flood Rescue – ${areaName}`,
      type: 'Flood',
      zone: `${areaName} (Zone 3)`,
      location: `${areaName}, ${cityName}`,
      coords: userIncidentCoords,
      severity: 'Critical',
      peopleAffected: 24,
      description: `Water level rising rapidly near present coordinates. 24 people stranded on rooftop requiring boat evacuation.`,
      status: 'Pending',
      requiredResources: {
        ambulance: 1,
        rescueBoat: 1,
        medicalKit: 5,
      },
      assignedTeam: null,
      reportedAt: 'Just now',
    },
    {
      id: 'RS1023',
      title: `Industrial Chemical Hazard – ${areaName} East`,
      type: 'Fire',
      zone: `${areaName} East`,
      location: `Commercial Enclave, ${cityName}`,
      coords: fireIncidentCoords,
      severity: 'High',
      peopleAffected: 8,
      description: 'Minor warehouse fire with smoke emission. Fire tenders deployed.',
      status: 'Accepted',
      requiredResources: {
        fireTruck: 2,
        ambulance: 1,
        medicalKit: 4,
      },
      assignedTeam: 'Team Bravo',
      reportedAt: '20 mins ago',
    },
    {
      id: 'RS1022',
      title: `Road Corridor Obstruction – ${areaName} South`,
      type: 'Obstruction',
      zone: `${areaName} South`,
      location: `Main Arterial Bypass, ${cityName}`,
      coords: roadBlockCoords,
      severity: 'Medium',
      peopleAffected: 0,
      description: 'Uprooted tree blocking emergency ambulance corridor.',
      status: 'Resolved',
      requiredResources: {
        rescueTeam: 1,
      },
      assignedTeam: 'Team Delta',
      reportedAt: '1 hour ago',
    }
  ];

  // 4. Responder Team Alpha Base located ~900m South-West
  const responderCoords = computeOffset(centerLat, centerLng, 900, 220);

  const responderTeam = {
    id: 'TEAM-ALPHA',
    name: 'NDRF Unit 4 — Team Alpha',
    specialty: 'Water Rescue & Fast Flood Evacuation',
    status: 'Available',
    currentTaskId: null,
    members: 8,
    vehicle: 'Amphibious Rescue Cruiser #04',
    location: responderCoords,
  };

  // 5. Realistic IoT Water Level Telemetry Sensors
  const sensor1Coords = computeOffset(centerLat, centerLng, 600, 35);
  const sensor2Coords = computeOffset(centerLat, centerLng, 420, 85);
  const sensor3Coords = computeOffset(centerLat, centerLng, 780, 115);

  const waterSensors = [
    {
      id: 'WS-01',
      code: 'RS-GAUGE-01',
      name: 'River Basin Main Telemetry Gauge',
      coords: sensor1Coords,
      waterLevel: 205.85,
      dangerLevel: 205.33,
      surge: '+1.52m',
      flowVelocity: '3.4 m/s',
      trend: 'Rising (+14cm/hr)',
      status: 'CRITICAL SURGE',
      lastPing: '20s ago',
    },
    {
      id: 'WS-02',
      code: 'RS-UPASS-02',
      name: 'Low Underpass Flood Depth Sensor',
      coords: sensor2Coords,
      waterLevel: 1.25,
      dangerLevel: 0.5,
      surge: '+0.75m',
      flowVelocity: '1.2 m/s',
      trend: 'Rising (+8cm/hr)',
      status: 'SUBMERGED (ROAD CLOSED)',
      lastPing: '45s ago',
    },
    {
      id: 'WS-03',
      code: 'RS-SLUICE-03',
      name: 'Embankment Sluice Flow Station',
      coords: sensor3Coords,
      waterLevel: 4.8,
      dangerLevel: 4.0,
      surge: '+0.8m',
      flowVelocity: '4.1 m/s',
      trend: 'Discharging (3,850 cumecs)',
      status: 'SLUICE 100% OPEN',
      lastPing: '1m ago',
    }
  ];

  // 5. Realistic Road Hazards & Police Barricades
  const hazard1Coords = computeOffset(centerLat, centerLng, 450, 75);
  const hazard2Coords = computeOffset(centerLat, centerLng, 750, 155);
  const hazard3Coords = computeOffset(centerLat, centerLng, 520, 270);

  const roadHazards = [
    {
      id: 'HZ-01',
      title: 'Submerged Roadway & Underpass',
      coords: hazard1Coords,
      type: 'submerged',
      status: 'Road Closed by Police',
      depth: '1.2m Waterlogging',
      icon: '🚫',
      action: 'Divert to Elevated Ring Road',
    },
    {
      id: 'HZ-02',
      title: 'Fallen High-Voltage Cable & Debris',
      coords: hazard2Coords,
      type: 'debris',
      status: 'Isolated by Grid Dept',
      depth: 'Debris & Live Cable',
      icon: '⚡',
      action: 'Fire & Utility Squads on Scene',
    },
    {
      id: 'HZ-03',
      title: 'NDRF Sandbag Levee Checkpoint',
      coords: hazard3Coords,
      type: 'checkpoint',
      status: 'Controlled Evacuation Corridor',
      depth: 'Safe Passable Corridor',
      icon: '🚧',
      action: 'Priority Emergency Convoy Lane',
    }
  ];

  // 6. Reconnaissance Drone (UAV-01) Patrolling Perimeter
  const droneCoords = computeOffset(centerLat, centerLng, 500, 45);
  const reconDrone = {
    id: 'UAV-01',
    callsign: 'DRONE RECON ALPHA',
    coords: droneCoords,
    altitude: '120m AGL',
    battery: '82%',
    speed: '24 km/h',
    camera: 'FLIR Thermal IR + 4K Optical',
    status: 'Airborne Surveillance Active',
  };

  return {
    dangerPolygon,
    mediumPolygon,
    safePolygon,
    shelters,
    incidents,
    responderTeam,
    waterSensors,
    roadHazards,
    reconDrone,
  };
}

// Fetch reverse geocode address from OpenStreetMap Nominatim
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'User-Agent': 'RakshaSetuSIH2026/1.0' } }
    );
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    const addr = data.address || {};
    const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.road || 'Local Area';
    const city = addr.city || addr.town || addr.county || addr.state_district || 'District';
    const state = addr.state || '';
    const full = data.display_name || `${suburb}, ${city}`;

    return {
      area: suburb,
      city: city + (state ? `, ${state}` : ''),
      fullAddress: full.split(',').slice(0, 3).join(', ')
    };
  } catch {
    return {
      area: 'Present Sector',
      city: 'Current Location',
      fullAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    };
  }
}
