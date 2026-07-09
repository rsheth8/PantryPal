#!/usr/bin/env node
/**
 * PantryPal Schema Runner
 *
 * Applies database migrations via the Supabase SQL Editor or CLI.
 * Automated execution requires the Supabase CLI — not the anon key.
 *
 * Usage:
 *   node supabase-schema-runner.js          # Show instructions
 *   node supabase-schema-runner.js list     # List migration files
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'supabase', 'migrations');
const ROOT_SQL = [
  { file: 'FINAL_SQL_SCHEMA.sql', label: 'Base schema (run first)' },
  { file: 'enhanced-recipe-features.sql', label: 'Enhanced recipe tables (optional if using migrations)' },
];

function listMigrations() {
  console.log('PantryPal Database Setup');
  console.log('========================\n');
  console.log('Apply in this order:\n');

  ROOT_SQL.forEach((item, i) => {
    const exists = fs.existsSync(path.join(__dirname, item.file));
    console.log(`  ${i + 1}. ${item.file}`);
    console.log(`     ${item.label}${exists ? '' : ' (file missing)'}\n`);
  });

  if (fs.existsSync(MIGRATIONS_DIR)) {
    const migrations = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log('  Then apply supabase/migrations/ in order:\n');
    migrations.forEach((file, i) => {
      console.log(`  ${ROOT_SQL.length + i + 1}. supabase/migrations/${file}`);
    });
  }

  console.log('\nHow to apply:');
  console.log('  1. Open Supabase Dashboard → SQL Editor');
  console.log('  2. Paste and run each file in order');
  console.log('  Or use Supabase CLI: supabase db push\n');
}

const command = process.argv[2] || 'help';

if (command === 'list' || command === 'help') {
  listMigrations();
} else {
  console.log('Unknown command. Use: node supabase-schema-runner.js list');
}
