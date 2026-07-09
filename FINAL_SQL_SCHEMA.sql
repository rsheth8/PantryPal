-- PantryPal Database Schema (Final Version)
-- Copy and paste this entire block into Supabase SQL Editor
-- Safe to run on a fresh database or re-run idempotently

-- Drop existing triggers only if their tables exist (fresh DB has no tables yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'grocery_items'
  ) THEN
    DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_preferences'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
  END IF;
END $$;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_household_code();

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  household_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  members TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "allow_private_items": true,
    "require_approval_for_shared": false,
    "default_item_visibility": "shared"
  }'::jsonb
);

-- Create grocery_items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  category TEXT NOT NULL DEFAULT 'Other',
  expiration_date DATE,
  added_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT true,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  price DECIMAL(10,2),
  notes TEXT,
  is_expired BOOLEAN DEFAULT false,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  is_completed BOOLEAN DEFAULT false,
  added_by UUID REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT[] NOT NULL DEFAULT '{}',
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  image TEXT,
  can_cook_now BOOLEAN DEFAULT false,
  missing_ingredients TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  low_stock_threshold INTEGER DEFAULT 1,
  expiration_reminder_days INTEGER DEFAULT 3,
  default_item_visibility TEXT DEFAULT 'shared',
  notifications JSONB DEFAULT '{
    "expiration_reminders": true,
    "low_stock_alerts": true,
    "household_updates": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on our custom tables only
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update households" ON households;

DROP POLICY IF EXISTS "Users can view their own items and shared household items" ON grocery_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON grocery_items;
DROP POLICY IF EXISTS "Users can update their own items" ON grocery_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON grocery_items;

DROP POLICY IF EXISTS "Users can view their own items and shared household items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can update their own items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON shopping_list_items;

DROP POLICY IF EXISTS "Users can view their own recipes and shared household recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

-- Create RLS Policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view households they belong to" ON households
  FOR SELECT USING (
    auth.uid()::text = ANY(members) OR 
    auth.uid() = owner_id
  );

CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Household owners can update households" ON households
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own items and shared household items" ON grocery_items
  FOR SELECT USING (
    added_by = auth.uid() OR 
    (is_shared = true AND household_id IN (
      SELECT id FROM households WHERE auth.uid()::text = ANY(members)
    ))
  );

CREATE POLICY "Users can insert their own items" ON grocery_items
  FOR INSERT WITH CHECK (added_by = auth.uid());

CREATE POLICY "Users can update their own items" ON grocery_items
  FOR UPDATE USING (added_by = auth.uid());

CREATE POLICY "Users can delete their own items" ON grocery_items
  FOR DELETE USING (added_by = auth.uid());

CREATE POLICY "Users can view their own items and shared household items" ON shopping_list_items
  FOR SELECT USING (
    added_by = auth.uid() OR 
    (is_shared = true AND household_id IN (
      SELECT id FROM households WHERE auth.uid()::text = ANY(members)
    ))
  );

CREATE POLICY "Users can insert their own items" ON shopping_list_items
  FOR INSERT WITH CHECK (added_by = auth.uid());

CREATE POLICY "Users can update their own items" ON shopping_list_items
  FOR UPDATE USING (added_by = auth.uid());

CREATE POLICY "Users can delete their own items" ON shopping_list_items
  FOR DELETE USING (added_by = auth.uid());

CREATE POLICY "Users can view their own recipes and shared household recipes" ON recipes
  FOR SELECT USING (
    created_by = auth.uid() OR 
    (is_shared = true AND household_id IN (
      SELECT id FROM households WHERE auth.uid()::text = ANY(members)
    ))
  );

CREATE POLICY "Users can insert their own recipes" ON recipes
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grocery_items_added_by ON grocery_items(added_by);
CREATE INDEX IF NOT EXISTS idx_grocery_items_household_id ON grocery_items(household_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_expiration_date ON grocery_items(expiration_date);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_added_by ON shopping_list_items(added_by);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_household_id ON shopping_list_items(household_id);

CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id);

CREATE INDEX IF NOT EXISTS idx_households_code ON households(code);
CREATE INDEX IF NOT EXISTS idx_households_owner_id ON households(owner_id);

CREATE INDEX IF NOT EXISTS idx_users_household_id ON users(household_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;
CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate household codes
CREATE OR REPLACE FUNCTION generate_household_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql; 