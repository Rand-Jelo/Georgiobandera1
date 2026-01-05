import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function createAdmin() {
  // Get email and password from command line arguments or use defaults
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin User';

  console.log(`Creating admin user...`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Password: ${password}`);
  console.log('');

  // Hash password
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Create SQL file to avoid shell escaping issues
  const fs = require('fs');
  const path = require('path');
  const sqlFile = path.join(__dirname, '../temp-admin-insert.sql');
  
  // Escape single quotes in values
  const escapedEmail = email.replace(/'/g, "''");
  const escapedName = name.replace(/'/g, "''");
  const escapedHash = passwordHash.replace(/'/g, "''");
  
  const sql = `INSERT INTO users (id, email, password_hash, name, is_admin, created_at, updated_at)
VALUES ('${userId}', '${escapedEmail}', '${escapedHash}', '${escapedName}', 1, ${now}, ${now});`;

  // Write SQL to file
  fs.writeFileSync(sqlFile, sql);

  // Execute SQL on local database using file
  try {
    execSync(
      `npx wrangler d1 execute georgiobandera-db-local --local --file ${sqlFile}`,
      { stdio: 'inherit' }
    );
    
    // Clean up temp file
    fs.unlinkSync(sqlFile);
    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log(`You can now login with:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

