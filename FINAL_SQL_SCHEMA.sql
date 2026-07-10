-- PantryPal Database Schema (Final Version)
-- Copy and paste this entire block into Supabase SQL Editor

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

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
CREATE TRIGGER update_grocery_items_updated_at 
  BEFORE UPDATE ON grocery_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
-- ============================================================
-- Migration: recipe personalization columns (safe to re-run)
-- ============================================================
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_grocery_items_added_by ON grocery_items(added_by);
CREATE INDEX IF NOT EXISTS idx_grocery_items_household ON grocery_items(household_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_expiration ON grocery_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_added_by ON shopping_list_items(added_by);
CREATE INDEX IF NOT EXISTS idx_shopping_list_household ON shopping_list_items(household_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_household ON recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_users_household ON users(household_id);

-- ============================================================
-- Migration: meal plans, roles, invites & activity feed
-- (idempotent — safe to re-run)
-- ============================================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  week_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meals JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_nutrition JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, household_id)
);

CREATE TABLE IF NOT EXISTS household_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  household_name TEXT,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_by_name TEXT,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  item_name TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_household ON meal_plans(household_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_household ON member_roles(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_code ON household_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_household_activity_household ON household_activity(household_id);
CREATE INDEX IF NOT EXISTS idx_household_activity_time ON household_activity(timestamp DESC);

-- Row Level Security
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_activity ENABLE ROW LEVEL SECURITY;

-- Meal plans: owner or household member can read/write their plans
DROP POLICY IF EXISTS "meal_plans_owner_access" ON meal_plans;
CREATE POLICY "meal_plans_owner_access" ON meal_plans
  FOR ALL USING (
    auth.uid() = user_id
    OR household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

-- Member roles: members of a household can read roles; users manage their own row
DROP POLICY IF EXISTS "member_roles_read" ON member_roles;
CREATE POLICY "member_roles_read" ON member_roles
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM users WHERE id = auth.uid())
  );
DROP POLICY IF EXISTS "member_roles_self_write" ON member_roles;
CREATE POLICY "member_roles_self_write" ON member_roles
  FOR ALL USING (auth.uid() = user_id);

-- Invites: readable by anyone with the code (for joining); creatable by members
DROP POLICY IF EXISTS "household_invites_access" ON household_invites;
CREATE POLICY "household_invites_access" ON household_invites
  FOR ALL USING (
    auth.uid() = invited_by
    OR household_id IN (SELECT household_id FROM users WHERE id = auth.uid())
  );

-- Activity: household members can read and append
DROP POLICY IF EXISTS "household_activity_access" ON household_activity;
CREATE POLICY "household_activity_access" ON household_activity
  FOR ALL USING (
    household_id IN (SELECT household_id FROM users WHERE id = auth.uid())
  );
