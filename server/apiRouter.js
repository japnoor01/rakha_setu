import { db } from './db.js';
import { hashPassword, verifyPassword, generateToken, verifyToken, extractTokenFromHeader } from './auth.js';
import { ROLES, isRoleAllowed } from './rbac.js';

/**
 * Helper to send JSON responses
 */
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Helper to read JSON request body
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Authentication Middleware:
 * Verifies Bearer token and attaches req.user
 */
function authenticateUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return { authenticated: false, error: 'Authentication token missing. Please log in.' };
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return { authenticated: false, error: result.error || 'Invalid or expired authentication token.' };
  }

  const user = db.findUserById(result.payload.id);
  if (!user) {
    return { authenticated: false, error: 'User account not found or has been revoked.' };
  }

  return { authenticated: true, user: db.sanitizeUser(user), token };
}

/**
 * Main API Request Dispatcher
 * Compatible with Vite dev server middleware and Node http / Express servers
 */
export async function handleApiRequest(req, res, next) {
  // Parse URL pathname
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Only handle /api routes
  if (!pathname.startsWith('/api')) {
    return next ? next() : res.end();
  }

  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    // =========================================================================
    // 1. PUBLIC AUTH ROUTES
    // =========================================================================

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = await readBody(req);

      if (!email || !password) {
        return sendJson(res, 400, {
          success: false,
          error: 'Email and password are required',
        });
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        return sendJson(res, 401, {
          success: false,
          error: 'Invalid credentials. User does not exist.',
        });
      }

      const isValid = verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        return sendJson(res, 401, {
          success: false,
          error: 'Invalid password. Please check your credentials.',
        });
      }

      const sanitized = db.sanitizeUser(user);
      const token = generateToken({
        id: sanitized.id,
        email: sanitized.email,
        name: sanitized.name,
        role: sanitized.role,
      });

      return sendJson(res, 200, {
        success: true,
        message: `Welcome back, ${sanitized.name}`,
        token,
        user: sanitized,
      });
    }

    // POST /api/auth/register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await readBody(req);
      const { name, email, password, role: requestedRole, ...meta } = body;

      if (!name || !email || !password) {
        return sendJson(res, 400, {
          success: false,
          error: 'Full name, email, and password are required.',
        });
      }

      // Security check: Never trust client-supplied role for ADMIN
      // Requirement 10: "Do not allow normal users to register themselves as Admin."
      if (requestedRole && requestedRole.toUpperCase() === ROLES.ADMIN) {
        return sendJson(res, 403, {
          success: false,
          error: 'Privilege Escalation Blocked: Administrator accounts cannot be self-registered. Contact National Command Authority.',
        });
      }

      // Allowed public roles: CITIZEN (default) or RESPONDER (with verification data)
      let assignedRole = ROLES.CITIZEN;
      if (requestedRole && requestedRole.toUpperCase() === ROLES.RESPONDER) {
        assignedRole = ROLES.RESPONDER;
      }

      try {
        const newUser = db.createUser({
          name,
          email,
          password,
          role: assignedRole,
          ...meta,
        });

        const token = generateToken({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        });

        return sendJson(res, 201, {
          success: true,
          message: `Account registered successfully as ${newUser.role}`,
          token,
          user: newUser,
        });
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: err.message || 'Registration failed',
        });
      }
    }

    // =========================================================================
    // 2. PROTECTED AUTH ROUTES (Requires Valid Token)
    // =========================================================================

    const auth = authenticateUser(req);

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }
      return sendJson(res, 200, {
        success: true,
        user: auth.user,
      });
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      return sendJson(res, 200, {
        success: true,
        message: 'Logged out successfully. Session terminated.',
      });
    }

    // =========================================================================
    // 3. DISASTER REPORTING API (RBAC Guarded)
    // =========================================================================

    // POST /api/disasters/report
    // Allowed: CITIZEN, ADMIN
    // Denied: RESPONDER (403)
    if (pathname === '/api/disasters/report' && method === 'POST') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.CITIZEN, ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Responders cannot submit citizen emergency reports. Please use Responder field incident telemetry.',
        });
      }

      const body = await readBody(req);
      const newReport = db.createReport({
        ...body,
        user: auth.user,
      });

      return sendJson(res, 201, {
        success: true,
        message: 'Emergency incident reported successfully',
        report: newReport,
      });
    }

    // GET /api/disasters/my-reports
    // Allowed: CITIZEN (own reports), ADMIN (all reports)
    // Denied: RESPONDER (403)
    if (pathname === '/api/disasters/my-reports' && method === 'GET') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.CITIZEN, ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Responder role cannot access personal citizen report history.',
        });
      }

      const filter = auth.user.role === ROLES.ADMIN ? {} : { userId: auth.user.id };
      const reports = db.getReports(filter);

      return sendJson(res, 200, {
        success: true,
        count: reports.length,
        reports,
      });
    }

    // =========================================================================
    // 4. DISASTER RESPONDER API (RBAC Guarded)
    // =========================================================================

    // POST /api/disasters/respond
    // Allowed: RESPONDER, ADMIN
    // Denied: CITIZEN (403)
    if (pathname === '/api/disasters/respond' && method === 'POST') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.RESPONDER, ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Citizens are not authorized to accept or advance incident responder tasks.',
        });
      }

      const { incidentId, status, note } = await readBody(req);
      if (!incidentId || !status) {
        return sendJson(res, 400, {
          success: false,
          error: 'Incident ID and status are required.',
        });
      }

      const updated = db.updateReportStatus(incidentId, status, auth.user, note);
      if (!updated) {
        return sendJson(res, 404, {
          success: false,
          error: `Incident #${incidentId} not found in database.`,
        });
      }

      return sendJson(res, 200, {
        success: true,
        message: `Incident #${incidentId} updated to ${status}`,
        report: updated,
      });
    }

    // GET /api/disasters/incidents
    // Allowed: CITIZEN, RESPONDER, ADMIN
    if (pathname === '/api/disasters/incidents' && method === 'GET') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      const reports = db.getReports();
      return sendJson(res, 200, {
        success: true,
        incidents: reports,
      });
    }

    // =========================================================================
    // 5. ADMINISTRATIVE & USER MANAGEMENT API (RBAC Guarded - ADMIN ONLY)
    // =========================================================================

    // GET /api/users/manage
    // Allowed: ADMIN ONLY
    // Denied: CITIZEN (403), RESPONDER (403)
    if (pathname === '/api/users/manage' && method === 'GET') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Administrative authority required to view or manage system users.',
        });
      }

      const users = db.getAllUsers();
      const stats = db.getSystemStats();

      return sendJson(res, 200, {
        success: true,
        stats,
        users,
      });
    }

    // POST /api/users/manage (Admin creating a new user or responder)
    // Allowed: ADMIN ONLY
    if (pathname === '/api/users/manage' && method === 'POST') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Only Administrators can provision system accounts.',
        });
      }

      const body = await readBody(req);
      try {
        const newUser = db.createUser(body);
        return sendJson(res, 201, {
          success: true,
          message: `User created successfully with role ${newUser.role}`,
          user: newUser,
        });
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: err.message || 'Failed creating user',
        });
      }
    }

    // DELETE /api/users/:id
    // Allowed: ADMIN ONLY
    if (pathname.startsWith('/api/users/') && method === 'DELETE') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Only Administrators can revoke user accounts.',
        });
      }

      const userId = pathname.replace('/api/users/', '');
      try {
        const deleted = db.deleteUser(userId);
        if (!deleted) {
          return sendJson(res, 404, { success: false, error: 'User not found' });
        }
        return sendJson(res, 200, {
          success: true,
          message: 'User account revoked and deleted successfully',
        });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // GET /api/admin/system-stats
    // Allowed: ADMIN ONLY
    if (pathname === '/api/admin/system-stats' && method === 'GET') {
      if (!auth.authenticated) {
        return sendJson(res, 401, { success: false, error: auth.error });
      }

      if (!isRoleAllowed(auth.user.role, [ROLES.ADMIN])) {
        return sendJson(res, 403, {
          success: false,
          error: '403 Forbidden: Administrative privileges required to access command metrics.',
        });
      }

      const stats = db.getSystemStats();
      return sendJson(res, 200, {
        success: true,
        stats,
      });
    }

    // Default 404 for unknown /api endpoint
    return sendJson(res, 404, {
      success: false,
      error: `Endpoint ${method} ${pathname} not found on Raksha-Setu API`,
    });

  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, {
      success: false,
      error: 'Internal server error processing request',
    });
  }
}
