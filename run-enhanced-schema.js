const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Import Supabase config
const SUPABASE_URL = 'https://isgexrmpfjkigfuenlij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZ2V4cm1wZmpraWdmdWVubGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MDUxMDAsImV4cCI6MjA2OTA4MTEwMH0.F03_xQ1Ojt7t4x9ulQpvdIrknzB1_GMZxX1NxtXkGpI';

// For running schema updates, we need the service role key, not anon key
// The anon key has limited permissions and can't create tables
console.log('⚠️  WARNING: This script uses the anon key which has limited permissions.');
console.log('📝 To run database schema changes, you need to:');
console.log('1. Go to your Supabase Dashboard (https://supabase.com/dashboard)');
console.log('2. Navigate to your project: https://supabase.com/dashboard/project/isgexrmpfjkigfuenlij');
console.log('3. Go to SQL Editor in the left sidebar');
console.log('4. Copy and paste the contents of enhanced-recipe-features.sql');
console.log('5. Click "Run" to execute the schema');
console.log('');
console.log('🔒 For security reasons, we cannot use the service role key in client code.');
console.log('');

// Create client (this will work for testing connection but not for schema changes)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      if (error.code === '42P01') {
        console.log('📋 This means the table doesn\'t exist yet, which is expected for a new setup.');
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log(`📊 Found ${data ? data.length : 0} users in the database.`);
    }
    
    // Read and display the schema file content
    const schemaPath = path.join(__dirname, 'enhanced-recipe-features.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      console.log('');
      console.log('📄 Enhanced Recipe Features Schema:');
      console.log('═══════════════════════════════════════');
      console.log(schemaContent);
      console.log('═══════════════════════════════════════');
    } else {
      console.log('❌ Schema file not found: enhanced-recipe-features.sql');
    }
    
  } catch (error) {
    console.error('❌ Error testing connection:', error.message);
  }
}

// Run the test
testConnection();
