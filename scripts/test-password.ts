import bcrypt from 'bcryptjs';

async function testPassword() {
  const password = 'admin123';
  const hashFromDB = process.argv[2];
  
  if (!hashFromDB) {
    console.log('Usage: npx tsx scripts/test-password.ts <hash_from_db>');
    process.exit(1);
  }
  
  const isValid = await bcrypt.compare(password, hashFromDB);
  console.log(`Password: ${password}`);
  console.log(`Hash from DB: ${hashFromDB.substring(0, 30)}...`);
  console.log(`Is valid: ${isValid}`);
}

testPassword();

