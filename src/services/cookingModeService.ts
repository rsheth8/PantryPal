import { CookingSession, CookingSessionStep, Recipe } from '../types';
import { supabase } from '../lib/supabaseClient';

export class CookingModeService {
  private static instance: CookingModeService;

  public static getInstance(): CookingModeService {
    if (!CookingModeService.instance) {
      CookingModeService.instance = new CookingModeService();
    }
    return CookingModeService.instance;
  }

  /**
   * Start a new cooking session
   */
  async startCookingSession(
    userId: string,
    recipeId: string,
    householdId?: string | null
  ): Promise<CookingSession> {
    try {
      // First, get the recipe to create steps
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) {
        console.error('Error fetching recipe:', recipeError);
        throw recipeError;
      }

      // Create the cooking session
      const { data: session, error: sessionError } = await supabase
        .from('cooking_sessions')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          household_id: householdId || null,
          status: 'active',
          current_step: 1,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating cooking session:', sessionError);
        throw sessionError;
      }

      // Create cooking session steps from recipe instructions
      if (recipe.instructions && recipe.instructions.length > 0) {
        const steps = recipe.instructions.map((instruction: string, index: number) => ({
          session_id: session.id,
          step_number: index + 1,
          instruction: instruction,
          estimated_time: Math.ceil(recipe.prep_time / recipe.instructions.length), // Rough estimate
          is_completed: false,
        }));

        const { error: stepsError } = await supabase
          .from('cooking_session_steps')
          .insert(steps);

        if (stepsError) {
          console.error('Error creating cooking session steps:', stepsError);
          // Don't throw here, session was created successfully
        }
      }

      return session;
    } catch (error) {
      console.error('Error in startCookingSession:', error);
      throw error;
    }
  }

  /**
   * Get active cooking session for a user
   */
  async getActiveCookingSession(userId: string): Promise<CookingSession | null> {
    try {
      const { data, error } = await supabase
        .from('cooking_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        console.error('Error fetching active cooking session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getActiveCookingSession:', error);
      throw error;
    }
  }

  /**
   * Get cooking session steps
   */
  async getCookingSessionSteps(sessionId: string): Promise<CookingSessionStep[]> {
    try {
      const { data, error } = await supabase
        .from('cooking_session_steps')
        .select('*')
        .eq('session_id', sessionId)
        .order('step_number', { ascending: true });

      if (error) {
        console.error('Error fetching cooking session steps:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCookingSessionSteps:', error);
      throw error;
    }
  }

  /**
   * Complete a cooking step
   */
  async completeStep(stepId: string, actualTime?: number, notes?: string): Promise<CookingSessionStep> {
    try {
      const { data, error } = await supabase
        .from('cooking_session_steps')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          actual_time: actualTime,
          notes: notes,
        })
        .eq('id', stepId)
        .select()
        .single();

      if (error) {
        console.error('Error completing step:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in completeStep:', error);
      throw error;
    }
  }

  /**
   * Update current step in cooking session
   */
  async updateCurrentStep(sessionId: string, currentStep: number): Promise<CookingSession> {
    try {
      const { data, error } = await supabase
        .from('cooking_sessions')
        .update({ current_step: currentStep })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating current step:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCurrentStep:', error);
      throw error;
    }
  }

  /**
   * Pause cooking session
   */
  async pauseCookingSession(sessionId: string): Promise<CookingSession> {
    try {
      const { data, error } = await supabase
        .from('cooking_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error pausing cooking session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in pauseCookingSession:', error);
      throw error;
    }
  }

  /**
   * Resume cooking session
   */
  async resumeCookingSession(sessionId: string): Promise<CookingSession> {
    try {
      const { data, error } = await supabase
        .from('cooking_sessions')
        .update({ status: 'active' })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error resuming cooking session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in resumeCookingSession:', error);
      throw error;
    }
  }

  /**
   * Complete cooking session
   */
  async completeCookingSession(sessionId: string, notes?: string): Promise<CookingSession> {
    try {
      const endTime = new Date().toISOString();
      
      // Calculate total duration
      const { data: session } = await supabase
        .from('cooking_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .single();

      let totalDuration = 0;
      if (session?.start_time) {
        const startTime = new Date(session.start_time);
        const endTimeDate = new Date(endTime);
        totalDuration = Math.round((endTimeDate.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
      }

      const { data, error } = await supabase
        .from('cooking_sessions')
        .update({
          status: 'completed',
          end_time: endTime,
          total_duration: totalDuration,
          notes: notes,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error completing cooking session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in completeCookingSession:', error);
      throw error;
    }
  }

  /**
   * Cancel cooking session
   */
  async cancelCookingSession(sessionId: string): Promise<CookingSession> {
    try {
      const { data, error } = await supabase
        .from('cooking_sessions')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling cooking session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in cancelCookingSession:', error);
      throw error;
    }
  }

  /**
   * Get cooking session with recipe and steps
   */
  async getCookingSessionWithDetails(sessionId: string): Promise<{
    session: CookingSession;
    recipe: Recipe;
    steps: CookingSessionStep[];
  } | null> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('cooking_sessions')
        .select(`
          *,
          recipes (*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching cooking session:', sessionError);
        throw sessionError;
      }

      const steps = await this.getCookingSessionSteps(sessionId);

      return {
        session,
        recipe: session.recipes,
        steps,
      };
    } catch (error) {
      console.error('Error in getCookingSessionWithDetails:', error);
      throw error;
    }
  }
}

export const cookingModeService = CookingModeService.getInstance();
