import { execSync } from 'child_process';
import { getMigrations } from '../lib/db/migrations';

/**
 * Run migrations using wrangler d1 execute
 */
async function runMigrations() {
  const migrations = getMigrations();
  const databaseName = 'georgiobandera-db';

  console.log(`Running ${migrations.length} migrations on ${databaseName}...\n`);

  for (const migration of migrations) {
    console.log(`Running migration: ${migration.name}`);
    
    try {
      // Clean up the SQL: remove comments
      let cleanSql = migration.sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      // For special migration (003_add_admin_role.sql), skip as it's handled differently
      if (migration.name === '003_add_admin_role.sql') {
        console.log(`⏭️  Skipping ${migration.name} (handled by application)`);
        continue;
      }

      // Execute SQL using wrangler d1 execute
      // Note: We need to escape the SQL properly for the command line
      const escapedSql = cleanSql.replace(/"/g, '\\"').replace(/\$/g, '\\$');
      
      const command = `wrangler d1 execute ${databaseName} --command "${escapedSql}"`;
      
      try {
        execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
        console.log(`✅ Applied ${migration.name}\n`);
      } catch (error: any) {
        // Check if it's an "already exists" error
        const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
        if (
          errorOutput.includes('already exists') ||
          errorOutput.includes('duplicate column') ||
          errorOutput.includes('UNIQUE constraint failed')
        ) {
          console.log(`⏭️  Skipped ${migration.name} (already applied)\n`);
        } else {
          console.error(`❌ Error applying ${migration.name}:`, error.message);
          throw error;
        }
      }
    } catch (error: any) {
      console.error(`Failed to run migration ${migration.name}:`, error.message);
      process.exit(1);
    }
  }

  console.log('✅ All migrations completed!');
}

// Run the migrations
runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

