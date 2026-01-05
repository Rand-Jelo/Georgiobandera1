import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { promisify } from 'util';

async function testLogin() {
  const email = 'admin@test.com';
  const password = 'admin123';
  
  // Get password hash from database
  const result = execSync(
    `npx wrangler d1 execute georgiobandera-db-local --local --command "SELECT password_hash FROM users WHERE email = '${email}';" --json`,
    { encoding: 'utf-8' }
  );
  
  const json = JSON.parse(result);
  const passwordHash = json[0]?.results?.[0]?.password_hash;
  
  if (!passwordHash) {
    console.log('❌ User not found in database');
    return;
  }
  
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Hash from DB: ${passwordHash.substring(0, 30)}...`);
  console.log(`Hash length: ${passwordHash.length}`);
  console.log('');
  
  // Test password verification
  const isValid = await bcrypt.compare(password, passwordHash);
  console.log(`Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (!isValid) {
    console.log('');
    console.log('Testing with a new hash...');
    const newHash = await bcrypt.hash(password, 10);
    const testValid = await bcrypt.compare(password, newHash);
    console.log(`New hash test: ${testValid ? '✅ VALID' : '❌ INVALID'}`);
  }
}

testLogin().catch(console.error);

