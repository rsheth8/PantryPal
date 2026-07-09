-- Fix RLS Policies for Development Mode
-- Drop existing policies and create more permissive ones for development

-- Drop existing policies for user_recipe_preferences
DROP POLICY IF EXISTS "Users can view their own recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Users can insert their own recipe preferences" ON user_recipe_preferences;
DROP POLICY IF EXISTS "Users can update their own recipe preferences" ON user_recipe_preferences;

-- Create more permissive policies for development
CREATE POLICY "Dev users can view recipe preferences" ON user_recipe_preferences
  FOR SELECT USING (true);

CREATE POLICY "Dev users can insert recipe preferences" ON user_recipe_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dev users can update recipe preferences" ON user_recipe_preferences
  FOR UPDATE USING (true);

-- Drop existing policies for recipe_favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON recipe_favorites;

-- Create more permissive policies for development
CREATE POLICY "Dev users can view favorites" ON recipe_favorites
  FOR SELECT USING (true);

CREATE POLICY "Dev users can insert favorites" ON recipe_favorites
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dev users can delete favorites" ON recipe_favorites
  FOR DELETE USING (true);

-- Drop existing policies for cooking_sessions
DROP POLICY IF EXISTS "Users can view their own cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Users can insert their own cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Users can update their own cooking sessions" ON cooking_sessions;
DROP POLICY IF EXISTS "Users can delete their own cooking sessions" ON cooking_sessions;

-- Create more permissive policies for development
CREATE POLICY "Dev users can view cooking sessions" ON cooking_sessions
  FOR SELECT USING (true);

CREATE POLICY "Dev users can insert cooking sessions" ON cooking_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dev users can update cooking sessions" ON cooking_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Dev users can delete cooking sessions" ON cooking_sessions
  FOR DELETE USING (true);

-- Drop existing policies for cooking_session_steps
DROP POLICY IF EXISTS "Users can view their own cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Users can insert their own cooking session steps" ON cooking_session_steps;
DROP POLICY IF EXISTS "Users can update their own cooking session steps" ON cooking_session_steps;

-- Create more permissive policies for development
CREATE POLICY "Dev users can view cooking session steps" ON cooking_session_steps
  FOR SELECT USING (true);

CREATE POLICY "Dev users can insert cooking session steps" ON cooking_session_steps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dev users can update cooking session steps" ON cooking_session_steps
  FOR UPDATE USING (true);

-- Recipe ratings already have permissive SELECT policy, just update the others
DROP POLICY IF EXISTS "Users can insert their own recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can update their own recipe ratings" ON recipe_ratings;
DROP POLICY IF EXISTS "Users can delete their own recipe ratings" ON recipe_ratings;

CREATE POLICY "Dev users can insert recipe ratings" ON recipe_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dev users can update recipe ratings" ON recipe_ratings
  FOR UPDATE USING (true);

CREATE POLICY "Dev users can delete recipe ratings" ON recipe_ratings
  FOR DELETE USING (true);
