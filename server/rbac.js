/**
 * Role-Based Access Control (RBAC) System
 * Roles: CITIZEN, RESPONDER, ADMIN
 */

export const ROLES = Object.freeze({
  CITIZEN: 'CITIZEN',
  RESPONDER: 'RESPONDER',
  ADMIN: 'ADMIN',
});

// Permissions catalog
export const PERMISSIONS = Object.freeze({
  // Citizen
  REPORT_DISASTER: 'REPORT_DISASTER',
  VIEW_MY_REPORTS: 'VIEW_MY_REPORTS',
  TRACK_REPORTS: 'TRACK_REPORTS',
  VIEW_ALERTS: 'VIEW_ALERTS',
  VIEW_SHELTERS: 'VIEW_SHELTERS',
  USE_AI_SAFETY_ADVISOR: 'USE_AI_SAFETY_ADVISOR',

  // Responder
  VIEW_INCIDENTS: 'VIEW_INCIDENTS',
  ACCEPT_INCIDENT: 'ACCEPT_INCIDENT',
  UPDATE_INCIDENT_STATUS: 'UPDATE_INCIDENT_STATUS',
  UPDATE_AVAILABILITY: 'UPDATE_AVAILABILITY',
  VIEW_NAV_CORRIDOR: 'VIEW_NAV_CORRIDOR',

  // Admin
  MANAGE_USERS: 'MANAGE_USERS',
  CREATE_USER: 'CREATE_USER',
  DELETE_USER: 'DELETE_USER',
  MANAGE_DISASTERS: 'MANAGE_DISASTERS',
  ASSIGN_INCIDENTS: 'ASSIGN_INCIDENTS',
  BROADCAST_ALERT: 'BROADCAST_ALERT',
  VIEW_SYSTEM_ANALYTICS: 'VIEW_SYSTEM_ANALYTICS',
  MANAGE_SYSTEM_SETTINGS: 'MANAGE_SYSTEM_SETTINGS',
  ACCESS_ALL_DASHBOARDS: 'ACCESS_ALL_DASHBOARDS',
});

// Role-to-Permission Mapping
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.CITIZEN]: [
    PERMISSIONS.REPORT_DISASTER,
    PERMISSIONS.VIEW_MY_REPORTS,
    PERMISSIONS.TRACK_REPORTS,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_SHELTERS,
    PERMISSIONS.USE_AI_SAFETY_ADVISOR,
  ],
  [ROLES.RESPONDER]: [
    PERMISSIONS.VIEW_INCIDENTS,
    PERMISSIONS.ACCEPT_INCIDENT,
    PERMISSIONS.UPDATE_INCIDENT_STATUS,
    PERMISSIONS.UPDATE_AVAILABILITY,
    PERMISSIONS.VIEW_NAV_CORRIDOR,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_SHELTERS,
  ],
  [ROLES.ADMIN]: [
    // Admin has ALL permissions
    ...Object.values(PERMISSIONS),
  ],
});

/**
 * Validate if a role is a valid recognized role
 */
export function isValidRole(role) {
  return typeof role === 'string' && Object.values(ROLES).includes(role.toUpperCase());
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
  if (!isValidRole(role)) return false;
  const permissions = ROLE_PERMISSIONS[role.toUpperCase()] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role is allowed to access an endpoint
 */
export function isRoleAllowed(userRole, allowedRoles) {
  if (!userRole) return false;
  const normalizedUserRole = userRole.toUpperCase();
  return allowedRoles.map(r => r.toUpperCase()).includes(normalizedUserRole);
}
