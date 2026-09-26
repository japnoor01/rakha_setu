import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';
import { ROLES } from './rbac.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Default Seed Accounts
const SEED_USERS = [
  {
    id: 'usr_admin_001',
    name: 'Chief Officer Rajesh Kumar',
    email: 'admin@rakshasetu.gov.in',
    plainPassword: 'AdminSecure@2026',
    role: ROLES.ADMIN,
    department: 'National Disaster Management Authority (NDMA)',
    badgeId: 'NDMA-HQ-01',
    phone: '+91 11 2670 1700',
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'usr_resp_001',
    name: 'Inspector Vikram Rathore',
    email: 'responder@rakshasetu.gov.in',
    plainPassword: 'ResponderAlpha@2026',
    role: ROLES.RESPONDER,
    unit: 'NDRF 8th Battalion (Team Alpha)',
    badgeId: 'NDRF-Alpha-04',
    specialty: 'Flood & Deep Water Search Rescue',
    status: 'Available',
    phone: '+91 98101 23456',
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'usr_cit_001',
    name: 'Aarav Sharma',
    email: 'citizen@gmail.com',
    plainPassword: 'CitizenSafe@2026',
    role: ROLES.CITIZEN,
    phone: '+91 98765 43210',
    location: 'Riverdale Block 4, Central District',
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Disaster Reports
const INITIAL_REPORTS = [
  {
    id: 'RS1024',
    title: 'Urgent Flood Rescue Required',
    type: 'Flood Rescue',
    location: 'Riverdale Block 4, Yamuna Basin',
    coords: [28.6189, 77.2140],
    severity: 'Critical',
    peopleAffected: 24,
    description: 'Ground floor submerged by 1.8m surge. 24 residents and 3 elderly citizens stranded on roof. Need immediate boat evacuation.',
    status: 'Accepted',
    reportedByUserId: 'usr_cit_001',
    reportedByUserName: 'Aarav Sharma',
    assignedTeamId: 'usr_resp_001',
    assignedTeamName: 'NDRF Team Alpha (Unit 4)',
    reportedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    responseHistory: [
      { status: 'Reported', time: new Date(Date.now() - 35 * 60 * 1000).toISOString(), note: 'Disaster reported via Citizen Portal' },
      { status: 'Accepted', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: 'NDRF Team Alpha dispatched' },
    ]
  },
  {
    id: 'RS1025',
    title: 'Bridge Embankment Soil Washout',
    type: 'Infrastructure Breach',
    location: 'Bridge Sector 12 Arterial Access',
    coords: [28.6250, 77.2210],
    severity: 'High',
    peopleAffected: 6,
    description: 'Road embankment collapsed due to flood surge. Traffic severed.',
    status: 'Pending',
    reportedByUserId: 'usr_cit_001',
    reportedByUserName: 'Aarav Sharma',
    assignedTeamId: null,
    assignedTeamName: null,
    reportedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    responseHistory: [
      { status: 'Reported', time: new Date(Date.now() - 12 * 60 * 1000).toISOString(), note: 'Disaster reported via Citizen Portal' }
    ]
  }
];

class Database {
  constructor() {
    this.data = {
      users: [],
      reports: [],
      systemSettings: {
        registrationAllowed: true,
        defaultAlertLevel: 'Warning',
        maintenanceMode: false,
        smsGatewayActive: true,
      },
    };
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure initial seed users exist
        let changed = false;
        for (const seed of SEED_USERS) {
          if (!this.data.users.find(u => u.email.toLowerCase() === seed.email.toLowerCase())) {
            const { hash, salt } = hashPassword(seed.plainPassword);
            this.data.users.push({
              id: seed.id,
              name: seed.name,
              email: seed.email,
              passwordHash: hash,
              salt,
              role: seed.role,
              department: seed.department,
              badgeId: seed.badgeId,
              specialty: seed.specialty,
              status: seed.status,
              phone: seed.phone,
              location: seed.location,
              createdAt: seed.createdAt,
              updatedAt: seed.updatedAt,
            });
            changed = true;
          }
        }
        if (changed) this.save();
        return;
      } catch (err) {
        console.warn('Failed reading db.json, creating fresh store:', err);
      }
    }
    this.seed();
  }

  seed() {
    this.data.users = SEED_USERS.map(seed => {
      const { hash, salt } = hashPassword(seed.plainPassword);
      return {
        id: seed.id,
        name: seed.name,
        email: seed.email,
        passwordHash: hash,
        salt,
        role: seed.role,
        department: seed.department,
        badgeId: seed.badgeId,
        specialty: seed.specialty,
        status: seed.status,
        phone: seed.phone,
        location: seed.location,
        createdAt: seed.createdAt,
        updatedAt: seed.updatedAt,
      };
    });

    this.data.reports = [...INITIAL_REPORTS];
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to db.json:', err);
    }
  }

  // --- User Operations ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findUserById(id) {
    if (!id) return null;
    return this.data.users.find(u => u.id === id) || null;
  }

  getAllUsers() {
    // Return sanitized users (without passwordHash and salt)
    return this.data.users.map(u => this.sanitizeUser(u));
  }

  createUser({ name, email, password, role, ...metadata }) {
    if (!email || !password || !name) {
      throw new Error('Name, email, and password are required');
    }

    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      role: role.toUpperCase(),
      createdAt: now,
      updatedAt: now,
      ...metadata,
    };

    this.data.users.push(newUser);
    this.save();
    return this.sanitizeUser(newUser);
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const current = this.data.users[idx];
    let newHash = current.passwordHash;
    let newSalt = current.salt;

    if (updates.password) {
      const res = hashPassword(updates.password);
      newHash = res.hash;
      newSalt = res.salt;
      delete updates.password;
    }

    const updated = {
      ...current,
      ...updates,
      passwordHash: newHash,
      salt: newSalt,
      updatedAt: new Date().toISOString(),
    };

    this.data.users[idx] = updated;
    this.save();
    return this.sanitizeUser(updated);
  }

  deleteUser(id) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    const user = this.data.users[idx];
    if (user.role === ROLES.ADMIN && this.data.users.filter(u => u.role === ROLES.ADMIN).length <= 1) {
      throw new Error('Cannot delete the primary root Administrator account');
    }
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  // --- Disaster Reports Operations ---
  createReport({ title, type, location, coords, severity, peopleAffected, description, user }) {
    const now = new Date().toISOString();
    const id = `RS${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport = {
      id,
      title: title || `${type || 'Emergency'} Incident`,
      type: type || 'Flood Rescue',
      location: location || 'Present Jurisdiction',
      coords: coords || [28.6139, 77.2090],
      severity: severity || 'Critical',
      peopleAffected: Number(peopleAffected) || 1,
      description: description || 'Immediate evacuation needed.',
      status: 'Pending',
      reportedByUserId: user.id,
      reportedByUserName: user.name,
      assignedTeamId: null,
      assignedTeamName: null,
      reportedAt: now,
      updatedAt: now,
      responseHistory: [
        { status: 'Reported', time: now, note: `Report filed by ${user.name} (${user.role})` }
      ]
    };

    this.data.reports.unshift(newReport);
    this.save();
    return newReport;
  }

  getReports(filter = {}) {
    let list = [...this.data.reports];
    if (filter.userId) {
      list = list.filter(r => r.reportedByUserId === filter.userId);
    }
    if (filter.assignedTeamId) {
      list = list.filter(r => r.assignedTeamId === filter.assignedTeamId);
    }
    if (filter.status) {
      list = list.filter(r => r.status.toLowerCase() === filter.status.toLowerCase());
    }
    return list;
  }

  getReportById(id) {
    return this.data.reports.find(r => r.id === id) || null;
  }

  updateReportStatus(id, newStatus, responderUser, note = '') {
    const report = this.data.reports.find(r => r.id === id);
    if (!report) return null;

    const now = new Date().toISOString();
    report.status = newStatus;
    report.updatedAt = now;

    if (responderUser) {
      if (newStatus === 'Accepted') {
        report.assignedTeamId = responderUser.id;
        report.assignedTeamName = responderUser.unit || responderUser.name;
      }
    }

    report.responseHistory = report.responseHistory || [];
    report.responseHistory.push({
      status: newStatus,
      time: now,
      by: responderUser ? responderUser.name : 'System',
      note: note || `Status updated to ${newStatus}`
    });

    this.save();
    return report;
  }

  getSystemStats() {
    return {
      totalUsers: this.data.users.length,
      citizensCount: this.data.users.filter(u => u.role === ROLES.CITIZEN).length,
      respondersCount: this.data.users.filter(u => u.role === ROLES.RESPONDER).length,
      adminsCount: this.data.users.filter(u => u.role === ROLES.ADMIN).length,
      totalReports: this.data.reports.length,
      activeReports: this.data.reports.filter(r => r.status !== 'Resolved').length,
      resolvedReports: this.data.reports.filter(r => r.status === 'Resolved').length,
      settings: this.data.systemSettings,
    };
  }
}

export const db = new Database();
