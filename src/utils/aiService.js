// AI Risk Analysis Service for RAKSHA-SETU
// Supports Google Gemini API (gemini-flash-latest / gemini-2.5-flash) with intelligent offline fallback

export async function generateAiRiskAssessment({
  rainfall,
  riverLevel,
  soilMoisture,
  populationDensity,
  locationName,
  lat,
  lng,
  geminiApiKey = null,
}) {
  const activeKey = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (activeKey && activeKey.trim() !== '') {
    try {
      const prompt = `
You are the AI Disaster Risk Evaluation Commander for RAKSHA-SETU (India's Unified Disaster Intelligence Platform, Smart India Hackathon 2026).
Evaluate the following ground telemetry for:
- Target Jurisdiction: ${locationName} (GPS: ${lat}, ${lng})
- Cumulative Precipitation: ${rainfall} mm
- River / Drainage Gauge Level: ${riverLevel} meters
- Basin Soil Saturation: ${soilMoisture}%
- Population Density Category: ${populationDensity}

Provide a concise disaster evaluation in valid JSON with:
{
  "score": <number 0-100 indicating probability of hazard>,
  "level": <"HIGH RISK" or "MEDIUM RISK" or "LOW RISK">,
  "summary": <concise 2-sentence explanation of the hazard drivers>,
  "recommendations": [<string action 1>, <string action 2>, <string action 3>]
}
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            }
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          // Clean potential markdown wrap
          const cleanJson = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return {
            source: 'Google Gemini 2.5 Flash (Live Generative AI)',
            score: Math.min(100, Math.max(0, Number(parsed.score) || 87)),
            level: parsed.level || (parsed.score >= 75 ? 'HIGH RISK' : 'MEDIUM RISK'),
            color: parsed.score >= 75 ? '#EF4444' : parsed.score >= 50 ? '#F59E0B' : '#10B981',
            details: parsed.summary,
            recommendations: parsed.recommendations || [
              `Issue Level-3 Flash Flood Warning to ${locationName} citizens`,
              `Pre-deploy Water Rescue Team Alpha to low-lying sectors`,
              `Activate emergency relief shelters for immediate occupancy`
            ]
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to rule-based engine:', err);
    }
  }

  // Robust Rule-Based Simulation Fallback (Ensures zero presentation failure)
  const rain = Number(rainfall) || 100;
  const river = Number(riverLevel) || 3.0;
  const moisture = Number(soilMoisture) || 50;

  let calculatedScore = Math.min(98, Math.round((rain / 200) * 45 + (river / 5.0) * 40 + (moisture / 100) * 15));
  let level = 'LOW RISK';
  let color = '#10B981';

  if (calculatedScore >= 75) {
    level = 'HIGH RISK';
    color = '#EF4444';
  } else if (calculatedScore >= 50) {
    level = 'MEDIUM RISK';
    color = '#F59E0B';
  }

  return {
    source: 'Heuristic Hydrological Engine (SIH Rule Baseline)',
    score: calculatedScore,
    level,
    color,
    details: `Precipitation (${rain}mm) and river/runoff gauge reading (${river}m) combined with ${moisture}% soil moisture produce an estimated hazard probability of ${calculatedScore}%. Ground water saturation index is critical.`,
    recommendations: calculatedScore >= 75
      ? [
          `Issue Level-3 Flash Flood Warning to ${locationName} citizens immediately`,
          `Pre-deploy Water Rescue Team Alpha to ${locationName}`,
          `Prepare and open designated relief shelter for evacuees`
        ]
      : [
          `Issue Cautionary Advisory to ${locationName} residents`,
          `Put Team Alpha on standby alert`,
          `Monitor drainage telemetry every 15 minutes`
        ]
  };
}

// ============================================================================
// CITIZEN PERSONAL AI SAFETY & EVACUATION ADVISOR
// Ingests citizen's exact location, floor level, vulnerable family members,
// and current ground observations to deliver hyper-personalized survival guidance.
// ============================================================================
export async function generateCitizenSafetyAssessment({
  locationName = 'Current Sector',
  lat = 28.6139,
  lng = 77.2090,
  floorLevel = 'ground', // 'basement' | 'ground' | 'upper' | 'highrise'
  waterObservation = 'entering', // 'dry' | 'pooling' | 'entering' | 'deep'
  vulnerableMembers = ['elderly'], // 'elderly', 'infants', 'patients', 'pets'
  nearestShelter = null,
  activeAlert = null,
  geminiApiKey = null,
  language = 'en',
}) {
  const isHindi = language === 'hi';
  const activeKey = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const shelterName = nearestShelter?.name || 'Government Senior Model School';
  const shelterDist = nearestShelter?.distance || '650m away';

  if (activeKey && activeKey.trim() !== '') {
    try {
      const prompt = `
You are the AI Citizen Safety Advisor for RAKSHA-SETU (India's Disaster Management Platform).
The citizen is currently at: ${locationName} (GPS: ${lat}, ${lng}).
Local ground situation:
- Living accommodation: ${floorLevel} floor
- Current flood/water observation outside home: ${waterObservation}
- Vulnerable household members: ${vulnerableMembers.length > 0 ? vulnerableMembers.join(', ') : 'None'}
- Active regional alert: ${activeAlert ? activeAlert.title : 'Flood Alert Zone 3'}
- Nearest verified relief shelter: ${shelterName} (${shelterDist})

Provide a personalized disaster risk analysis for this household.
Return valid JSON only:
{
  "safetyScore": <number 0-100 indicating danger to this household>,
  "threatLevel": <"CRITICAL DANGER – EVACUATE IMMEDIATELY" | "HIGH ALERT – PREPARE TO EVACUATE" | "SAFE – SHELTER IN PLACE">,
  "headline": <concise 1-sentence urgent recommendation>,
  "guidance": <2-sentence clear explanation of their danger based on floor level and family vulnerabilities>,
  "checklist": [<action item 1>, <action item 2>, <action item 3>, <action item 4>],
  "evacuationTiming": <e.g. "Evacuate within 45 minutes before water reaches 1 meter depth">
}
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            }
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const cleanJson = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          const score = Math.min(99, Math.max(10, Number(parsed.safetyScore) || 85));
          return {
            source: 'Google Gemini AI (Live Generative Assessment)',
            score,
            level: parsed.threatLevel || (score >= 75 ? 'CRITICAL DANGER – EVACUATE IMMEDIATELY' : score >= 45 ? 'HIGH ALERT – PREPARE TO EVACUATE' : 'SAFE – SHELTER IN PLACE'),
            color: score >= 75 ? '#EF4444' : score >= 45 ? '#F59E0B' : '#10B981',
            headline: parsed.headline,
            guidance: parsed.guidance,
            checklist: parsed.checklist || [
              'Turn off main electricity breaker (MCB) and gas valve',
              'Move vulnerable family members and critical prescriptions to higher ground',
              'Pack waterproof emergency pouch (IDs, cash, torch, battery pack)',
              `Navigate high-ground bypass to ${shelterName}`
            ],
            evacuationTiming: parsed.evacuationTiming || 'Immediate evacuation advised before basin surcharge peaks.',
            shelterTarget: shelterName,
            shelterDistance: shelterDist,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini Citizen assessment failed, falling back to rule engine:', err);
    }
  }

  // Intelligent Hydrological Safety Rule-Based Fallback
  let baseScore = 20;

  // Water observation factor
  if (waterObservation === 'deep' || waterObservation === 'submerged_street') baseScore += 45;
  else if (waterObservation === 'entering' || waterObservation === 'entering_compound') baseScore += 35;
  else if (waterObservation === 'pooling') baseScore += 20;
  else baseScore += 5;

  // Floor level vulnerability factor
  if (floorLevel === 'basement') baseScore += 35;
  else if (floorLevel === 'ground') baseScore += 25;
  else if (floorLevel === 'upper') baseScore += 10;
  else baseScore += 2;

  // Vulnerable family members factor
  if (vulnerableMembers.includes('elderly')) baseScore += 8;
  if (vulnerableMembers.includes('infants')) baseScore += 8;
  if (vulnerableMembers.includes('patients')) baseScore += 8;
  if (vulnerableMembers.includes('pets')) baseScore += 4;

  const score = Math.min(96, Math.max(15, baseScore));

  let level = 'SAFE – SHELTER IN PLACE';
  let color = '#10B981';
  let headline = isHindi
    ? 'वर्तमान स्थिति सुरक्षित है। घर के भीतर रहें और आधिकारिक अलर्ट सुनें।'
    : 'Your current location is currently secure. Shelter indoors and monitor emergency sirens.';
  let timing = isHindi
    ? 'वर्तमान में निकासी की आवश्यकता नहीं है।'
    : 'No evacuation required right now. Re-evaluate if water starts rising.';

  if (score >= 70) {
    level = isHindi ? 'गंभीर खतरा – तुरंत सुरक्षित आश्रय पर जाएं' : 'CRITICAL DANGER – EVACUATE IMMEDIATELY';
    color = '#EF4444';
    headline = isHindi
      ? `तुरंत उच्च-स्तरीय बाईपास से ${shelterName} की ओर निकलें!`
      : `Evacuate immediately via high-ground bypass toward ${shelterName}!`;
    timing = isHindi
      ? 'अगले 30-45 मिनट के भीतर सुरक्षित स्थान पर पहुंचें।'
      : 'Complete evacuation within 30-45 minutes before local underpasses become impassable.';
  } else if (score >= 45) {
    level = isHindi ? 'सतर्कता – निकासी बैग तैयार रखें' : 'HIGH ALERT – PREPARE TO EVACUATE';
    color = '#F59E0B';
    headline = isHindi
      ? 'जलस्तर बढ़ रहा है। आवश्यक दवाइयां व दस्तावेज ऊपरी मंजिल पर रखें।'
      : 'Water surge approaching. Move essentials to upper level and keep grab-bag ready.';
    timing = isHindi
      ? 'यदि पानी 6 इंच से ऊपर पहुंचे तो तुरंत आश्रय की ओर बढ़ें।'
      : 'Be ready to move if compound water exceeds 6 inches.';
  }

  const guidance = isHindi
    ? `आप ${locationName} में ${floorLevel === 'ground' ? 'ग्राउंड फ्लोर' : floorLevel === 'basement' ? 'बेसमेंट' : 'ऊपरी मंजिल'} पर हैं और बाहर ${waterObservation === 'entering' ? 'पानी परिसर में प्रवेश कर रहा है' : waterObservation === 'deep' ? 'गंभीर जलभराव' : 'पानी जमा हो रहा है'}। ${vulnerableMembers.length > 0 ? 'बुजुर्गों और बच्चों की सुरक्षा के लिए शीघ्र कदम उठाएं।' : ''}`
    : `You are residing on the ${floorLevel} floor in ${locationName} with ${waterObservation === 'entering' ? 'water entering the premises' : waterObservation === 'deep' ? 'deep street waterlogging' : 'surface water pooling'}. ${vulnerableMembers.length > 0 ? 'Special assistance required for vulnerable household members.' : 'Ensure essential gear is ready.'}`;

  const checklist = isHindi
    ? [
        'मुख्य बिजली बोर्ड (MCB) और गैस सप्लाई तुरंत बंद करें',
        'बुजुर्गों, बच्चों और आवश्यक दवाओं को तुरंत सूखी सुरक्षित जगह पर ले जाएं',
        'वाटरप्रूफ बैग में आधार/पहचान पत्र, टॉर्च, पावर बैंक और नकदी रखें',
        `उच्च-स्तरीय सड़क मार्ग से ${shelterName} (${shelterDist}) की ओर बढ़ें`
      ]
    : [
        'Switch off main electrical circuit breaker (MCB) and LPG cylinder valve',
        'Transfer elderly/infant dependents and essential medications to elevated floor',
        'Pack 72-hour waterproof emergency grab bag (IDs, torch, power bank, dry rations)',
        `Follow flood-safe elevated corridor to ${shelterName} (${shelterDist})`
      ];

  return {
    source: 'Hydrological Safety Engine (SIH Citizen Baseline)',
    score,
    level,
    color,
    headline,
    guidance,
    checklist,
    evacuationTiming: timing,
    shelterTarget: shelterName,
    shelterDistance: shelterDist,
  };
}

