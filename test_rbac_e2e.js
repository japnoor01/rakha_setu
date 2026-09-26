/**
 * End-to-end RBAC and Security Suite Test for Raksha Setu
 */
const BASE_URL = 'http://localhost:5173';

async function req(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🛡️ RAKSHA-SETU AUTH & RBAC SECURITY TEST SUITE');
  console.log('====================================================\n');

  let passes = 0;
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passes++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failures++;
    }
  }

  // --- 1. UNAUTHENTICATED PROTECTION ---
  console.log('--- Test Suite 1: Unauthenticated Endpoint Protection ---');
  const noAuthReports = await req('/api/disasters/my-reports');
  assert(noAuthReports.status === 401, 'Request without token returns 401 Unauthorized');

  const noAuthUsers = await req('/api/users/manage');
  assert(noAuthUsers.status === 401, 'Admin endpoint without token returns 401 Unauthorized');

  // --- 2. CITIZEN ROLE TEST SUITE ---
  console.log('\n--- Test Suite 2: Citizen Role Permissions & Boundaries ---');
  const citizenLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'citizen@gmail.com', password: 'CitizenSafe@2026' })
  });
  assert(citizenLogin.status === 200 && citizenLogin.data.token, 'Citizen login succeeds with JWT token');
  const citizenToken = citizenLogin.data?.token;

  const citizenMe = await req('/api/auth/me', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(citizenMe.status === 200 && citizenMe.data.user.role === 'CITIZEN', 'Citizen profile returns role CITIZEN');

  // Citizen can report disaster
  const citizenReport = await req('/api/disasters/report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({
      title: 'Water logging in ground floor',
      disasterType: 'Flood Rescue',
      location: 'Civil Lines Sector 4',
      severity: 'High',
      description: 'Basement flooding with elderly person stuck.',
      peopleAffected: 3,
      lat: 28.614,
      lng: 77.209
    })
  });
  assert(citizenReport.status === 201, 'Citizen can report disaster (201 Created)');

  // Citizen can view own reports
  const citizenReports = await req('/api/disasters/my-reports', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(citizenReports.status === 200 && Array.isArray(citizenReports.data.reports), 'Citizen can retrieve own submitted reports');

  // Citizen CANNOT respond to incidents (Forbidden)
  const citizenRespond = await req('/api/disasters/respond', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({ incidentId: 'RS1024', status: 'Accepted' })
  });
  assert(citizenRespond.status === 403, 'Citizen is DENIED responding to incidents (403 Forbidden)');

  // Citizen CANNOT access user management (Forbidden)
  const citizenUserMgmt = await req('/api/users/manage', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(citizenUserMgmt.status === 403, 'Citizen is DENIED user management API (403 Forbidden)');

  // --- 3. RESPONDER ROLE TEST SUITE ---
  console.log('\n--- Test Suite 3: Responder Role Permissions & Boundaries ---');
  const respLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'responder@rakshasetu.gov.in', password: 'ResponderAlpha@2026' })
  });
  assert(respLogin.status === 200 && respLogin.data.token, 'Responder login succeeds with JWT token');
  const respToken = respLogin.data?.token;

  // Responder CAN respond to incidents
  const respRespond = await req('/api/disasters/respond', {
    method: 'POST',
    headers: { Authorization: `Bearer ${respToken}` },
    body: JSON.stringify({
      incidentId: 'RS1024',
      action: 'accept',
      status: 'Accepted',
      notes: 'Team Alpha en route with boat'
    })
  });
  assert(respRespond.status === 200, 'Responder can respond & advance incident status (200 OK)');

  // Responder CANNOT submit citizen reports (Boundary test)
  const respReport = await req('/api/disasters/report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${respToken}` },
    body: JSON.stringify({ title: 'Unauthorized report' })
  });
  assert(respReport.status === 403, 'Responder is DENIED submitting citizen disaster reports (403 Forbidden)');

  // Responder CANNOT access user management
  const respUserMgmt = await req('/api/users/manage', {
    headers: { Authorization: `Bearer ${respToken}` }
  });
  assert(respUserMgmt.status === 403, 'Responder is DENIED user management API (403 Forbidden)');

  // --- 4. ADMIN ROLE TEST SUITE ---
  console.log('\n--- Test Suite 4: Admin Full System Access ---');
  const adminLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@rakshasetu.gov.in', password: 'AdminSecure@2026' })
  });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login succeeds with JWT token');
  const adminToken = adminLogin.data?.token;

  // Admin can access user management
  const adminUsers = await req('/api/users/manage', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.users), 'Admin can view system users directory (200 OK)');

  // Admin can access system stats
  const adminStats = await req('/api/admin/system-stats', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminStats.status === 200 && adminStats.data.stats, 'Admin can view system-wide analytics & stats (200 OK)');

  // Admin can also respond and report
  const adminRespond = await req('/api/disasters/respond', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ incidentId: 'RS1024', action: 'override', status: 'In Progress' })
  });
  assert(adminRespond.status === 200, 'Admin can perform disaster response overrides (200 OK)');

  // --- 5. SECURITY ATTACK & PRIVILEGE ESCALATION PREVENTION ---
  console.log('\n--- Test Suite 5: Security & Anti-Privilege Escalation ---');
  // Attempting self-registration as ADMIN must be BLOCKED
  const hackAdminReg = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Hacker Joe',
      email: 'hacker@darknet.org',
      password: 'HackedPassword@123',
      role: 'ADMIN' // Trying to forge ADMIN role
    })
  });
  assert(hackAdminReg.status === 403, 'Privilege Escalation blocked: Self-registration as ADMIN rejected (403 Forbidden)');

  // Valid citizen registration
  const legitCitizenReg = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Rohan Sharma',
      email: `rohan_${Date.now()}@gmail.com`,
      password: 'CitizenPassword@2026',
      role: 'CITIZEN'
    })
  });
  assert(legitCitizenReg.status === 201 && legitCitizenReg.data.token, 'Legitimate citizen registration succeeds with token');

  // Invalid login credentials check
  const badLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@rakshasetu.gov.in', password: 'WrongPassword' })
  });
  assert(badLogin.status === 401, 'Invalid login credentials properly return 401 Unauthorized');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passes} PASSED, ${failures} FAILED`);
  console.log('====================================================');

  if (failures > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
