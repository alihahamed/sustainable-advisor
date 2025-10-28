import { supabase } from './supabaseClient.js';

// ================================================
// CHALLENGES SERVICE
// Manages user challenges, progress tracking, and stats
// ================================================

/**
 * Fetch all active challenges
 */
export const fetchChallenges = async () => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch user's challenge progress with challenge details
 */
export const fetchUserChallenges = async (userId) => {
  try {
    // Ensure all active challenges have records
    await ensureAllChallengesStarted(userId);

    // Fetch user challenge data
    const { data: freshData, error: freshError } = await supabase
      .from('user_challenges_with_details')
      .select('*')
      .eq('user_id', userId);

    if (freshError) throw freshError;

    return { success: true, data: freshData || [] };
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ensure all challenges are initialized for the user
 */
const ensureAllChallengesStarted = async (userId) => {
  try {
    // Get all active challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, type, requirement_value')
      .eq('is_active', true);

    if (challengesError) throw challengesError;

    // Get existing user challenges
    const { data: existingUserChallenges, error: existingError } = await supabase
      .from('user_challenges')
      .select('challenge_id')
      .eq('user_id', userId);

    if (existingError) throw existingError;

    const existingChallengeIds = existingUserChallenges.map(uc => uc.challenge_id);

    // Find challenges that need to be initialized
    const newChallenges = challenges.filter(c =>
      !existingChallengeIds.includes(c.id)
    );

    if (newChallenges.length === 0) return;

    // Initialize new challenges
    const newChallengeRecords = newChallenges.map(challenge => ({
      user_id: userId,
      challenge_id: challenge.id,
      progress: 0,
      completed: false
    }));

    const { error: insertError } = await supabase
      .from('user_challenges')
      .insert(newChallengeRecords);

    if (insertError) throw insertError;

    console.log(`Initialized ${newChallenges.length} new challenges for user ${userId}`);
  } catch (error) {
    console.error('Error ensuring challenges are started:', error);
  }
};

/**
 * Update user challenge progress
 */
export const updateChallengeProgress = async (userId, challengeType, newProgress, isIncrement = false) => {
  try {
    // Find the challenge
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, requirement_value')
      .eq('type', challengeType)
      .eq('is_active', true)
      .order('requirement_value', { ascending: false });

    if (challengesError) throw challengesError;

    if (!challenges || challenges.length === 0) {
      console.warn(`No active challenges found for type: ${challengeType}`);
      return { success: false, message: 'No matching challenges' };
    }

    // Update progress for all matching challenges
    const updatePromises = challenges.map(async (challenge) => {
      // Get current progress
      const { data: userChallenge, error: ucError } = await supabase
        .from('user_challenges')
        .select('progress, completed')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .single();

      if (ucError && ucError.code !== 'PGRST116') throw ucError; // PGRST116 = not found

      let currentProgress = userChallenge ? userChallenge.progress : 0;
      let updatedProgress = isIncrement ? currentProgress + newProgress : newProgress;
      let completed = false;
      let completedAt = null;

      // Check if completed
      if (updatedProgress >= challenge.requirement_value && !userChallenge?.completed) {
        completed = true;
        completedAt = new Date().toISOString();
        console.log(`🎉 Challenge completed: ${challengeType}, user: ${userId}`);
      }

      // Update or insert
      const updateData = {
        user_id: userId,
        challenge_id: challenge.id,
        progress: Math.min(updatedProgress, challenge.requirement_value),
        completed,
        completed_at: completedAt,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('user_challenges')
        .upsert(updateData, { onConflict: 'user_id,challenge_id' });

      return { challenge: challenge.id, completed };
    });

    const results = await Promise.all(updatePromises);
    const completedChallenges = results.filter(r => r.completed);

    return {
      success: true,
      updatedCount: results.length,
      completedCount: completedChallenges.length,
      message: completedChallenges.length > 0
        ? `Completed ${completedChallenges.length} challenge(s)!`
        : 'Progress updated successfully'
    };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate and update user statistics
 */
export const calculateUserStats = async (userId) => {
  try {
    // Get scan count from localStorage (existing app data)
    const recentProducts = JSON.parse(localStorage.getItem('recentProducts') || '[]').length;
    const totalScans = Math.max(recentProducts, 0); // Placeholder - could be improved

    // Get favourite count
    const favourites = JSON.parse(localStorage.getItem('favouriteProducts') || '{}');
    const totalFavourites = Object.keys(favourites).length;

    // Placeholder for contributions - this would need to be tracked separately
    // For now, we'll set it based on whether user has contributed before
    const totalContributions = parseInt(localStorage.getItem('userContributions') || '0');

    // Calculate average eco-score
    const favouriteScores = Object.values(favourites).map(f => f.ecoScore).filter(score => score != null);
    const averageEcoScore = favouriteScores.length > 0
      ? favouriteScores.reduce((sum, score) => sum + score, 0) / favouriteScores.length
      : 0;

    // Get completed challenge points
    const { data: completedChallenges, error: challengesError } = await supabase
      .from('user_challenges_with_details')
      .select('reward_points')
      .eq('user_id', userId)
      .eq('completed', true);

    if (challengesError) throw challengesError;

    const totalChallengePoints = completedChallenges?.reduce((sum, c) => sum + c.reward_points, 0) || 0;

    // Update user stats
    const { error: updateError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_scans: totalScans,
        total_favourites: totalFavourites,
        total_contributions: totalContributions,
        average_eco_score: Math.round(averageEcoScore),
        total_challenge_points: totalChallengePoints,
        last_updated: new Date().toISOString()
      });

    if (updateError) throw updateError;

    return {
      success: true,
      stats: {
        totalScans,
        totalFavourites,
        totalContributions,
        averageEcoScore: Math.round(averageEcoScore),
        totalChallengePoints
      }
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no stats exist yet, return default
      if (error.code === 'PGRST116') {
        return { success: true, data: getDefaultStats() };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Default stats structure
 */
const getDefaultStats = () => ({
  user_id: null,
  total_scans: 0,
  total_favourites: 0,
  total_contributions: 0,
  average_eco_score: 0,
  total_challenge_points: 0,
  last_updated: new Date().toISOString()
});

/**
 * Challenge action trackers
 */
export const challengeActions = {
  /**
   * Track when user scans a product
   */
  async onScan(userId) {
    return await updateChallengeProgress(userId, 'scan_count', 1, true);
  },

  /**
   * Track when user favourites a product
   */
  async onFavourite(userId) {
    return await updateChallengeProgress(userId, 'favourite_count', 1, true);
  },

  /**
   * Track when user makes a contribution
   */
  async onContribution(userId) {
    return await updateChallengeProgress(userId, 'contribution_count', 1, true);
  },

  /**
   * Recalculate eco-score challenges based on current favourites
   */
  async recalculateEcoScoreChallenges(userId) {
    const stats = await calculateUserStats(userId);
    if (stats.success) {
      return await updateChallengeProgress(userId, 'eco_score_average', stats.stats.averageEcoScore, false);
    }
    return { success: false };
  }
};

/**
 * Initialize challenges for a new user
 */
export const initializeUserChallenges = async (userId) => {
  try {
    await ensureAllChallengesStarted(userId);
    await calculateUserStats(userId);
    return { success: true, message: 'Challenges initialized successfully' };
  } catch (error) {
    console.error('Error initializing challenges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset all user challenges (for testing)
 */
export const resetUserChallenges = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_challenges')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Reinitialize
    await ensureAllChallengesStarted(userId);
    await calculateUserStats(userId);

    return { success: true, message: 'Challenges reset successfully' };
  } catch (error) {
    console.error('Error resetting challenges:', error);
    return { success: false, error: error.message };
  }
};
