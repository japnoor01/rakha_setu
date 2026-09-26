import { db } from './db.js';

console.log('🔄 Re-seeding Raksha-Setu Database with initial accounts & incident data...');
db.seed();
console.log('✅ Database seeded successfully:');
const stats = db.getSystemStats();
console.log(`   - Total Users:     ${stats.totalUsers}`);
console.log(`   - Admins:          ${stats.adminsCount}`);
console.log(`   - Responders:      ${stats.respondersCount}`);
console.log(`   - Citizens:        ${stats.citizensCount}`);
console.log(`   - Disaster Reports: ${stats.totalReports}`);
console.log('\nDefault Credentials:');
console.log('  🏛️  ADMIN:     admin@rakshasetu.gov.in    | Pass: AdminSecure@2026');
console.log('  🚑 RESPONDER: responder@rakshasetu.gov.in | Pass: ResponderAlpha@2026');
console.log('  👤 CITIZEN:   citizen@gmail.com          | Pass: CitizenSafe@2026');
