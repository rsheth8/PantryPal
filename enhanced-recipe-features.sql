-- Enhanced Recipe Features Database Schema
-- Add these tables and updates to support the new recipe features

-- 1. Recipe Favorites System
CREATE TABLE IF NOT EXISTS recipe_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- 2. Enhanced User Preferences (for onboarding quiz results)
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

-- 3. Cooking Mode Sessions
CREATE TABLE IF NOT EXISTS cooking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  current_step INTEGER DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Cooking Session Steps (for tracking progress)
CREATE TABLE IF NOT EXISTS cooking_session_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  estimated_time INTEGER, -- in minutes
  actual_time INTEGER, -- in minutes
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recipe Ratings and Reviews
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

-- Enable Row Level Security on new tables
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipe_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_session_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Recipe Favorites
CREATE POLICY "Users can view their own favorites" ON recipe_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites" ON recipe_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites" ON recipe_favorites
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS Policies for User Recipe Preferences
CREATE POLICY "Users can view their own recipe preferences" ON user_recipe_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recipe preferences" ON user_recipe_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recipe preferences" ON user_recipe_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS Policies for Cooking Sessions
CREATE POLICY "Users can view their own cooking sessions" ON cooking_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cooking sessions" ON cooking_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cooking sessions" ON cooking_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cooking sessions" ON cooking_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS Policies for Cooking Session Steps
CREATE POLICY "Users can view their own cooking session steps" ON cooking_session_steps
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM cooking_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own cooking session steps" ON cooking_session_steps
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM cooking_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own cooking session steps" ON cooking_session_steps
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM cooking_sessions WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for Recipe Ratings
CREATE POLICY "Users can view all recipe ratings" ON recipe_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own recipe ratings" ON recipe_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recipe ratings" ON recipe_ratings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own recipe ratings" ON recipe_ratings
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id ON recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id ON recipe_favorites(recipe_id);

CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_id ON cooking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_recipe_id ON cooking_sessions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_status ON cooking_sessions(status);

CREATE INDEX IF NOT EXISTS idx_cooking_session_steps_session_id ON cooking_session_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_cooking_session_steps_step_number ON cooking_session_steps(step_number);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_rating ON recipe_ratings(rating);

-- Create triggers for updated_at
CREATE TRIGGER update_user_recipe_preferences_updated_at 
  BEFORE UPDATE ON user_recipe_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ratings_updated_at 
  BEFORE UPDATE ON recipe_ratings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add missing columns to existing recipes table if they don't exist
DO $$ 
BEGIN
  -- Add nutrition info column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recipes' AND column_name = 'nutrition_info') THEN
    ALTER TABLE recipes ADD COLUMN nutrition_info JSONB DEFAULT '{
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "sugar": 0
    }'::jsonb;
  END IF;

  -- Add cuisine column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recipes' AND column_name = 'cuisine') THEN
    ALTER TABLE recipes ADD COLUMN cuisine TEXT;
  END IF;

  -- Add difficulty column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recipes' AND column_name = 'difficulty') THEN
    ALTER TABLE recipes ADD COLUMN difficulty TEXT DEFAULT 'medium';
  END IF;

  -- Add rating column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recipes' AND column_name = 'rating') THEN
    ALTER TABLE recipes ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
  END IF;

  -- Add total_ratings column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recipes' AND column_name = 'total_ratings') THEN
    ALTER TABLE recipes ADD COLUMN total_ratings INTEGER DEFAULT 0;
  END IF;
END $$;
