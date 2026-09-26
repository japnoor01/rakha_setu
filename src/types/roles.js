/**
 * Raksha-Setu Role Enum & Role Metadata
 */

export const ROLES = Object.freeze({
  CITIZEN: 'CITIZEN',
  RESPONDER: 'RESPONDER',
  ADMIN: 'ADMIN',
});

export const ROLE_DETAILS = Object.freeze({
  [ROLES.CITIZEN]: {
    id: ROLES.CITIZEN,
    name: 'Citizen (Civilian)',
    badgeLabel: '👤 CITIZEN',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    defaultTab: 'citizen',
    description: 'Report emergencies, access personal evacuation guidance, and track status.',
  },
  [ROLES.RESPONDER]: {
    id: ROLES.RESPONDER,
    name: 'Emergency Responder',
    badgeLabel: '🚑 RESPONDER',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.35)',
    defaultTab: 'responder',
    description: 'Receive dispatched disaster tasks, deploy rescue units, and advance status.',
  },
  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    name: 'Command Administrator',
    badgeLabel: '🏛️ ADMIN HQ',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.35)',
    defaultTab: 'admin',
    description: 'Full system surveillance, AI risk modeling, user management, and broadcast alerts.',
  },
});

/**
 * Check if role A has permission to view tab B
 */
export function canAccessTab(userRole, tab) {
  if (!userRole) return false;
  const role = userRole.toUpperCase();

  if (role === ROLES.ADMIN) {
    // Admin has access to all dashboards
    return true;
  }

  if (role === ROLES.RESPONDER) {
    // Responder can only access responder dashboard
    return tab === 'responder';
  }

  if (role === ROLES.CITIZEN) {
    // Citizen can only access citizen dashboard
    return tab === 'citizen';
  }

  return false;
}
