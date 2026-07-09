#!/usr/bin/env node
/**
 * Verifies Supabase connectivity, schema, and core pantry/shopping CRUD.
 * Usage: node scripts/verify-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

const URL = 'https://hesmwidwkavdpprztzqi.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc213aWR3a2F2ZHBwcnp0enFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjcwMTMsImV4cCI6MjA5OTE0MzAxM30.utPRf1k6S59T9sd5Gxh2arRgolqssmRRJiiUbGu_AJ8';

const TABLES = [
  'users',
  'households',
  'grocery_items',
  'shopping_list_items',
  'recipes',
  'user_preferences',
  'user_recipe_preferences',
  'recipe_favorites',
  'cooking_sessions',
  'cooking_session_steps',
  'recipe_ratings',
];

const testEmail =
  process.env.SUPABASE_TEST_EMAIL ||
  `pantrypal.verify+${Date.now()}@gmail.com`;
const testPassword = process.env.SUPABASE_TEST_PASSWORD || 'TestPass123!';
const testName = 'Verify User';

async function main() {
  const supabase = createClient(URL, ANON_KEY);
  let passed = 0;
  let failed = 0;

  const ok = (msg) => {
    console.log(`  ✓ ${msg}`);
    passed++;
  };
  const fail = (msg, err) => {
    console.log(`  ✗ ${msg}`);
    if (err) console.log(`    ${err.message || JSON.stringify(err)}`);
    failed++;
  };

  console.log('\nPantryPal Supabase Verification\n================================\n');

  // 1. Schema — tables reachable (RLS may return empty, not error)
  console.log('1. Schema tables');
  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      fail(`Table "${table}"`, error);
    } else {
      ok(`Table "${table}" exists`);
    }
  }

  // 2. Auth — sign in with existing test account, or sign up new
  console.log('\n2. Auth');
  let userId;
  let useExisting = !!process.env.SUPABASE_TEST_EMAIL;

  if (useExisting) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
    if (signInError) {
      fail('Sign in with SUPABASE_TEST_EMAIL', signInError);
      printSummary(passed, failed);
      process.exit(1);
    }
    userId = signInData.user?.id;
    ok(`Sign in (${testEmail})`);
  } else {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { data: { name: testName } },
    });

    if (signUpError) {
      fail('Sign up', signUpError);
      console.log(
        '\nTip: Set SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD to reuse an account.\n' +
          'Or disable email confirmation: Dashboard → Authentication → Providers → Email → Confirm email OFF\n'
      );
      printSummary(passed, failed);
      process.exit(1);
    }
    ok(`Sign up (${testEmail})`);

    userId = signUpData.user?.id;
    const session = signUpData.session;

    if (!userId) {
      fail('Get user ID after signup');
      printSummary(passed, failed);
      process.exit(1);
    }

    if (!session) {
      fail(
        'No auth session after signup — email confirmation is likely required',
        new Error(
          'Dashboard → Authentication → Providers → Email → turn OFF "Confirm email", then sign up in the app and re-run with SUPABASE_TEST_EMAIL/PASSWORD.'
        )
      );
      printSummary(passed, failed);
      process.exit(1);
    }
    ok('Auth session established');
  }

  if (!userId) {
    fail('No user ID');
    printSummary(passed, failed);
    process.exit(1);
  }

  // 3. Create user profile
  console.log('\n3. User profile');
  const { error: profileError } = await supabase.from('users').insert({
    id: userId,
    email: testEmail,
    name: testName,
  });
  if (profileError) {
    fail('Insert users profile', profileError);
  } else {
    ok('Insert users profile');
  }

  // 4. User preferences
  console.log('\n4. User preferences');
  const { error: prefError } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    low_stock_threshold: 2,
    expiration_reminder_days: 5,
    default_item_visibility: 'shared',
    notifications: {
      expiration_reminders: true,
      low_stock_alerts: true,
      household_updates: true,
    },
  });
  if (prefError) fail('Upsert user_preferences', prefError);
  else ok('Upsert user_preferences');

  // 5. Pantry CRUD
  console.log('\n5. Pantry (grocery_items)');
  const { data: groceryItem, error: groceryError } = await supabase
    .from('grocery_items')
    .insert({
      name: 'Test Milk',
      quantity: 2,
      unit: 'gallon',
      category: 'Dairy & Eggs',
      expiration_date: '2026-12-31',
      added_by: userId,
      is_shared: false,
      is_expired: false,
      is_used: false,
    })
    .select()
    .single();

  if (groceryError) fail('Insert grocery_items', groceryError);
  else ok('Insert grocery_items');

  if (groceryItem) {
    const { error: updateError } = await supabase
      .from('grocery_items')
      .update({ quantity: 1 })
      .eq('id', groceryItem.id);
    if (updateError) fail('Update grocery_items', updateError);
    else ok('Update grocery_items');

    const { data: readPantry, error: readError } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('added_by', userId);
    if (readError) fail('Read grocery_items', readError);
    else if (!readPantry?.length) fail('Read grocery_items returned empty');
    else ok(`Read grocery_items (${readPantry.length} item(s))`);
  }

  // 6. Shopping list CRUD (with category + price columns)
  console.log('\n6. Shopping list');
  const { data: shopItem, error: shopError } = await supabase
    .from('shopping_list_items')
    .insert({
      name: 'Test Bread',
      quantity: 1,
      unit: 'loaf',
      category: 'Grains & Bread',
      price: 3.99,
      is_completed: false,
      added_by: userId,
      is_shared: false,
    })
    .select()
    .single();

  if (shopError) fail('Insert shopping_list_items', shopError);
  else ok('Insert shopping_list_items (with category + price)');

  if (shopItem) {
    const { error: shopUpdateError } = await supabase
      .from('shopping_list_items')
      .update({ is_completed: true })
      .eq('id', shopItem.id);
    if (shopUpdateError) fail('Update shopping_list_items', shopUpdateError);
    else ok('Update shopping_list_items');
  }

  // 7. Recipe + favorites
  console.log('\n7. Recipes & favorites');
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title: 'Test Recipe',
      ingredients: ['egg', 'flour'],
      instructions: ['Mix', 'Cook'],
      created_by: userId,
      is_shared: false,
    })
    .select()
    .single();

  if (recipeError) fail('Insert recipes', recipeError);
  else ok('Insert recipes');

  if (recipe) {
    const { error: favError } = await supabase.from('recipe_favorites').insert({
      user_id: userId,
      recipe_id: recipe.id,
    });
    if (favError) fail('Insert recipe_favorites', favError);
    else ok('Insert recipe_favorites');
  }

  // Cleanup test data (only when we created a throwaway signup account)
  console.log('\n8. Cleanup');
  if (!useExisting) {
    await supabase.from('recipe_favorites').delete().eq('user_id', userId);
    await supabase.from('recipes').delete().eq('created_by', userId);
    await supabase.from('shopping_list_items').delete().eq('added_by', userId);
    await supabase.from('grocery_items').delete().eq('added_by', userId);
    await supabase.from('user_preferences').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
    ok('Test data cleaned up');
  } else {
    ok('Skipped cleanup (reused test account)');
  }

  printSummary(passed, failed);
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary(passed, failed) {
  console.log(`\n================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('\nAll checks passed! Your Supabase DB is ready for PantryPal.\n');
  } else {
    console.log('\nSome checks failed. Review errors above.\n');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
