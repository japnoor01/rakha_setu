/**
 * Frontend RBAC unit tests
 */
import { ROLES, ROLE_DETAILS, canAccessTab } from './src/types/roles.js';
import { ROLES as BACKEND_ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasPermission, isRoleAllowed } from './server/rbac.js';

let passes = 0;
let fails = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passes++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    fails++;
  }
}

console.log('Testing Frontend & Backend RBAC alignment:');

// Citizen Tab Access
assert(canAccessTab(ROLES.CITIZEN, 'citizen') === true, 'Citizen can access citizen tab');
assert(canAccessTab(ROLES.CITIZEN, 'responder') === false, 'Citizen CANNOT access responder tab');
assert(canAccessTab(ROLES.CITIZEN, 'admin') === false, 'Citizen CANNOT access admin tab');
assert(canAccessTab(ROLES.CITIZEN, 'tri-view') === false, 'Citizen CANNOT access tri-view tab');

// Responder Tab Access
assert(canAccessTab(ROLES.RESPONDER, 'citizen') === false, 'Responder CANNOT access citizen tab');
assert(canAccessTab(ROLES.RESPONDER, 'responder') === true, 'Responder can access responder tab');
assert(canAccessTab(ROLES.RESPONDER, 'admin') === false, 'Responder CANNOT access admin tab');
assert(canAccessTab(ROLES.RESPONDER, 'tri-view') === false, 'Responder CANNOT access tri-view tab');

// Admin Tab Access
assert(canAccessTab(ROLES.ADMIN, 'citizen') === true, 'Admin can access citizen tab');
assert(canAccessTab(ROLES.ADMIN, 'responder') === true, 'Admin can access responder tab');
assert(canAccessTab(ROLES.ADMIN, 'admin') === true, 'Admin can access admin tab');
assert(canAccessTab(ROLES.ADMIN, 'tri-view') === true, 'Admin can access tri-view tab');

// Permissions Check
assert(hasPermission(BACKEND_ROLES.CITIZEN, PERMISSIONS.REPORT_DISASTER) === true, 'Citizen has REPORT_DISASTER');
assert(hasPermission(BACKEND_ROLES.CITIZEN, PERMISSIONS.MANAGE_USERS) === false, 'Citizen does NOT have MANAGE_USERS');
assert(hasPermission(BACKEND_ROLES.RESPONDER, PERMISSIONS.ACCEPT_INCIDENT) === true, 'Responder has ACCEPT_INCIDENT');
assert(hasPermission(BACKEND_ROLES.RESPONDER, PERMISSIONS.UPDATE_INCIDENT_STATUS) === true, 'Responder has UPDATE_INCIDENT_STATUS');
assert(hasPermission(BACKEND_ROLES.RESPONDER, PERMISSIONS.MANAGE_USERS) === false, 'Responder does NOT have MANAGE_USERS');
assert(hasPermission(BACKEND_ROLES.ADMIN, PERMISSIONS.MANAGE_USERS) === true, 'Admin has MANAGE_USERS');

console.log(`\nFrontend & Backend Logic Verification: ${passes} passed, ${fails} failed.`);
if (fails > 0) process.exit(1);
