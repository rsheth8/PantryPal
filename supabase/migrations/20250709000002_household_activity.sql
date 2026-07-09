-- Household activity feed for shared pantry/shopping events

CREATE TABLE IF NOT EXISTS household_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN ('added', 'updated', 'removed', 'used', 'joined', 'left', 'completed')
  ),
  item_name TEXT,
  item_type TEXT CHECK (
    item_type IS NULL OR item_type IN ('pantry', 'shopping', 'recipe', 'household')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_household_activity_household_id
  ON household_activity(household_id);
CREATE INDEX IF NOT EXISTS idx_household_activity_created_at
  ON household_activity(created_at DESC);

ALTER TABLE household_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members can view activity" ON household_activity;
DROP POLICY IF EXISTS "Household members can insert activity" ON household_activity;

CREATE POLICY "Household members can view activity" ON household_activity
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can insert activity" ON household_activity
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );
