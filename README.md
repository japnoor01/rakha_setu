# 🚨 RAKSHA-SETU (रक्षा-सेतु)
### Unified AI-Powered Disaster Intelligence & Emergency Response Platform
**Smart India Hackathon 2026 • Problem Statement ID: SIH26206 • Theme: Disaster Management • Team: Mavericks**

---

## 🌟 Overview & Core Philosophy

**RAKSHA-SETU** is purpose-built around **3 distinct role-based dashboards** designed not merely with different colors, but with fundamentally different operational purposes that communicate with each other in real-time over a synchronized event bus:

1. **👤 Citizen Dashboard** — *Civic Safety, Immediate SOS & Evacuation Guidance*
2. **🚑 Responder Dashboard (Team Alpha)** — *Tactical Dispatch, Navigation Corridor & Task Lifecycle*
3. **🏛️ Admin / Command Center Dashboard** — *Predictive AI Risk Modeling, Multi-Channel Alerts & Resource Allocation*

---

## 🎯 The Unified SIH 2026 Presentation Storyline

Instead of demonstrating isolated features, the entire prototype executes a single, cohesive disaster management narrative:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   🤖 STEP 1     │  ──▶  │   📢 STEP 2     │  ──▶  │   👤 STEP 3     │
│  Admin Predicts │       │  Admin Creates  │       │ Citizen Alerted │
│  Risk (87% High)│       │  Zone 3 Warning │       │   on Dashboard  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   🏛️ STEP 6     │  ◀──  │   🚑 STEP 5     │  ◀──  │   🚨 STEP 4     │
│  Admin Monitors │       │ Responder Alpha │       │  Citizen SOS    │
│  Active Count & │       │   Accepts Task  │       │  Report #RS1024 │
│  Team Deployed  │       │   & Starts Route│       │  (24 Stranded)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 🖥️ Dashboard Breakdown & Features

### 1. 👤 Citizen Dashboard
- **Active Alert Banner**: Immediate visual notification (`⚠️ ACTIVE ALERT: Flood Warning – Zone 3, Heavy rainfall expected`) with `[ VIEW DETAILS ]` modal.
- **⭐ Main Action — [ 🚨 REPORT EMERGENCY ]**: Visually prominent pulsing action card:
  - Disaster type selection (Flood Rescue, Fire, Landslide, Building Collapse, Medical SOS)
  - Location input with GPS telemetry
  - Severity level (`Critical`, `High`, `Medium`)
  - People affected count (e.g., 24 civilians)
  - Instant dispatch confirmation modal with **Incident ID: RS1024** and live ETA.
- **[ 🏠 FIND SHELTER ]**:
  - Live capacity tracker (e.g. *Government Model Senior Secondary School: 500 Capacity, 180 Available*).
  - `[ VIEW ROUTE ]` button plotting a flood-safe evacuation trajectory on the GIS map.
- **[ 🗺️ SAFE ZONES ] & Interactive Map**:
  - 🔴 High-risk zone (Zone 3 - Flood Inundation)
  - 🟠 Medium-risk zone (Zone 5 - Waterlogging)
  - 🟢 Safe evacuation zones (Zone 1 & 2)
  - 🏠 Relief shelters with bed availability
- **Bilingual Interface**: One-click toggle between English and **हिंदी (Hindi)**.

---

### 2. 🚑 Responder Dashboard (Team Alpha - NDRF Unit 4)
- **Active Incidents Feed**:
  - 🔴 Flood – Zone 3 (*CRITICAL, 24 people affected*)
  - 🟠 Fire – Industrial Area (*HIGH, 8 people affected*)
  - 🟡 Road Block – Zone 5 (*MEDIUM*)
- **Tactical Incident Map**:
  - 📍 Responder Location (`YOU / Team Alpha`)
  - 🔴 Emergency location with pulsing radar
  - 🏠 Safe shelters
  - 🚑 Neighboring response teams (Team Beta & QRT Boat-2)
- **⭐ Main Action — [ ACCEPT TASK ] & Status Lifecycle**:
  - Displays **TASK #RS1024** with priority level, people stranded, and target coordinates.
  - Clicking `[ ACCEPT TASK ]` transitions team state to **DEPLOYED** and activates the animated navigation route.
  - Interactive status stepper: `1. En Route` ➔ `2. On Scene` ➔ `3. Mark Resolved` (with celebration animation).
- **📦 Required Resources**:
  - Ambulance: 1
  - Rescue boat: 1
  - Medical kit: 5
  - Onboard equipment verification checklist.

---

### 3. 🏛️ Admin / Command Center Dashboard
- **Top Command KPI Cards**:
  - `ACTIVE INCIDENTS`: Real-time counter (dynamically updates when citizen reports or responder resolves)
  - `HIGH-RISK ZONES`: 4 zones tracked via satellite/IoT
  - `TEAMS DEPLOYED`: Live status of NDRF, SDRF, and civil defense units
  - `ACTIVE SHELTERS`: 8 relief centers with live bed occupancy percentages
- **🗺️ Live Disaster GIS Map**:
  - Full-screen multi-layer tactical display with live GPS L1/L5 telemetry and interactive popups.
- **📢 Create Alert Console**:
  - Form to broadcast alerts by type and zone with immediate push to Citizen Dashboards.
- **🤖 AI Risk Analysis Engine**:
  - Telemetry input sliders: Rainfall (mm), River Gauge (m), Soil Moisture (%), Population Density.
  - `[ ANALYZE RISK ]` button triggers predictive hydrologic scoring:
    - **🔴 HIGH RISK — 87%**
    - Key driver explanation and automated emergency recommendations.
    - One-click *Execute AI Recommendations* button.
- **🚑 Resource & Volunteer Inventory**:
  - Ambulances (12/18 active)
  - Rescue boats (7/10 active)
  - 126 Registered volunteers
  - 72% Shelter occupancy gauge.

---

## ⚡ Multi-View & Presentation Tools

1. **⚡ Tri-Split View ("Command Wall")**:
   - Displays Citizen, Responder, and Admin dashboards side-by-side simultaneously. Any action taken in one column immediately updates the other two in real-time.
2. **▶️ SIH 6-Step Storyline Walkthrough**:
   - An interactive guided tour with an **Auto-Play** mode that demonstrates the complete end-to-end loop automatically for judges.
3. **Audio Synthesis FX**:
   - Zero-dependency Web Audio API sound effects for sirens, SOS pings, dispatch notifications, and task acceptance chimes.
4. **Cross-Tab Synchronization**:
   - Integrated `BroadcastChannel` protocol allowing Admin and Citizen to be opened in separate physical monitors or tabs while remaining perfectly in sync.

---

## 🚀 Running the Prototype Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev

# 3. Open in your browser
http://localhost:5173
```
