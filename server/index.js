import http from 'node:http';
import { handleApiRequest } from './apiRouter.js';

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  handleApiRequest(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, () => {
  console.log(`🛡️  Raksha-Setu Auth & RBAC API Server listening on port ${PORT}`);
  console.log(`📌 Pre-seeded Accounts:`);
  console.log(`   - Admin:     admin@rakshasetu.gov.in    (Pass: AdminSecure@2026)`);
  console.log(`   - Responder: responder@rakshasetu.gov.in (Pass: ResponderAlpha@2026)`);
  console.log(`   - Citizen:   citizen@gmail.com          (Pass: CitizenSafe@2026)`);
});
