-- PantryPal production schema: shopping list columns, enhanced recipe tables, production RLS

-- Shopping list columns used by the app
ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';

ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Enhanced recipe tables (idempotent)
CREATE TABLE IF NOT EXISTS recipe_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS user_recipe_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  preferred_cuisines TEXT[] DEFAULT '{}',
  cooking_skill TEXT DEFAULT 'beginner',
  spice_tolerance TEXT DEFAULT 'medium',
  health_goals TEXT[] DEFAULT '{}',
  nutrition_goals JSONB DEFAULT '{
    "maxCalories": 2000,
    "minProtein": 50,
    "maxCarbs": 250,
    "maxFat": 65
  }'::jsonb,
  difficulty_preference TEXT DEFAULT 'any',
  max_cooking_time INTEGER DEFAULT 60,
  serving_size_preference INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  current_step INTEGER DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooking_session_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  estimated_time INTEGER,
  actual_time INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
  would_cook_again BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Recipe column additions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'nutrition_info'
  ) THEN
    ALTER TABLE recipes ADD COLUMN nutrition_info JSONB DEFAULT '{
      "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cuisine'
  ) THEN
    ALTER TABLE recipes ADD COLUMN cuisine TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE recipes ADD COLUMN difficulty TEXT DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'rating'
  ) THEN
    ALTER TABLE recipes ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'total_ratings'
  ) THEN
    ALTER TABLE recipes ADD COLUMN total_ratings INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on enhanced tables
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipe_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_session_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Remove permissive dev policies if present
DROP POLICY IF EXISTS "Dev users can view recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Dev users can insert recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Dev users can update recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Dev users can view favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Dev users can insert favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Dev users can delete favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Dev users can view cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Dev users can insert cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Dev users can update cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Dev users can delete cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Dev users can view cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Dev users can insert cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Dev users can update cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Dev users can delete recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Dev users can insert recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Dev users can update recipe ratings" ON recipe_ratings;

-- Production RLS policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON recipe_favorites;

CREATE POLICY "Users can view their own favorites" ON recipe_favorites
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own favorites" ON recipe_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own favorites" ON recipe_favorites
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Users can insert their own recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Users can update their own recipe preferences" ON user_recipe_preferences;

CREATE POLICY "Users can view their own recipe preferences" ON user_recipe_preferences
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own recipe preferences" ON user_recipe_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own recipe preferences" ON user_recipe_preferences
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Users can insert their own cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Users can update their own cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Users can delete their own cooking sessions" ON cooking_sessions;

CREATE POLICY "Users can view their own cooking sessions" ON cooking_sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own cooking sessions" ON cooking_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own cooking sessions" ON cooking_sessions
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own cooking sessions" ON cooking_sessions
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Users can insert their own cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Users can update their own cooking session steps" ON cooking_session_steps;

CREATE POLICY "Users can view their own cooking session steps" ON cooking_session_steps
  FOR SELECT USING (
    session_id IN (SELECT id FROM cooking_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert their own cooking session steps" ON cooking_session_steps
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM cooking_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update their own cooking session steps" ON cooking_session_steps
  FOR UPDATE USING (
    session_id IN (SELECT id FROM cooking_sessions WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view all recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can insert their own recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can update their own recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can delete their own recipe ratings" ON recipe_ratings;

CREATE POLICY "Users can view all recipe ratings" ON recipe_ratings
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own recipe ratings" ON recipe_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own recipe ratings" ON recipe_ratings
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own recipe ratings" ON recipe_ratings
  FOR DELETE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id ON recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id ON recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_id ON cooking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_recipe_id ON cooking_sessions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_status ON cooking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cooking_session_steps_session_id ON cooking_session_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items(category);
