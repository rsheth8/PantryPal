import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { Recipe, CookingSession, CookingSessionStep } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/designSystem';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { cookingModeService } from '../../services/cookingModeService';

type CookingModeRouteProp = RouteProp<{
  CookingMode: { recipe: Recipe };
}, 'CookingMode'>;

export default function CookingModeScreen() {
  const navigation = useNavigation();
  const route = useRoute<CookingModeRouteProp>();
  const { recipe } = route.params;
  const { currentUser, currentHousehold } = useMultiUserStore();

  const [session, setSession] = useState<CookingSession | null>(null);
  const [steps, setSteps] = useState<CookingSessionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timerLabel, setTimerLabel] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCookingSession();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setShowTimerModal(false);
            Alert.alert('Timer Complete!', 'Time to move to the next step!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const initializeCookingSession = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const householdId =
        currentHousehold?.id ||
        currentUser.householdId ||
        currentUser.household_id ||
        null;
      const newSession = await cookingModeService.startCookingSession(
        currentUser.id,
        recipe.id,
        householdId
      );
      setSession(newSession);

      const sessionSteps = await cookingModeService.getCookingSessionSteps(newSession.id);
      setSteps(sessionSteps);
    } catch (error) {
      console.error('Error initializing cooking session:', error);
      Alert.alert('Error', 'Failed to start cooking session');
    } finally {
      setIsLoading(false);
    }
  };

  const startStepTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerLabel(`Step ${currentStepIndex + 1}`);
    setIsTimerRunning(true);
  };

  const activeStep = steps[currentStepIndex];

  // Check if current step needs a timer
  const stepNeedsTimer =
    activeStep?.estimatedTime != null && activeStep.estimatedTime > 0;

  // Auto-start timer when step changes (if step has estimated time)
  useEffect(() => {
    if (stepNeedsTimer && session?.status === 'active' && activeStep) {
      startStepTimer(activeStep.estimatedTime! * 60);
    }
  }, [currentStepIndex, session?.status, stepNeedsTimer, activeStep?.id]);

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerLabel('');
  };

  const completeCurrentStep = async () => {
    if (!session || currentStepIndex >= steps.length) return;

    try {
      const currentStep = steps[currentStepIndex];
      await cookingModeService.completeStep(currentStep.id);
      
      // Update local state
      setSteps(prev => prev.map((step, index) => 
        index === currentStepIndex ? { ...step, isCompleted: true } : step
      ));

      // Stop current timer
      setIsTimerRunning(false);
      
      // Move to next step
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        await cookingModeService.updateCurrentStep(session.id, currentStepIndex + 2);
      } else {
        // Recipe completed
        await cookingModeService.completeCookingSession(session.id);
        Alert.alert(
          'Recipe Complete!',
          'Congratulations! You\'ve successfully completed the recipe.',
          [
            {
              text: 'Great!',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error completing step:', error);
      Alert.alert('Error', 'Failed to complete step');
    }
  };

  const pauseSession = async () => {
    if (!session) return;

    try {
      await cookingModeService.pauseCookingSession(session.id);
      setSession(prev => prev ? { ...prev, status: 'paused' } : null);
      // Pause the timer when session is paused
      setIsTimerRunning(false);
      Alert.alert('Session Paused', 'Your cooking session and timer have been paused.');
    } catch (error) {
      console.error('Error pausing session:', error);
      Alert.alert('Error', 'Failed to pause session');
    }
  };

  const resumeSession = async () => {
    if (!session) return;

    try {
      await cookingModeService.resumeCookingSession(session.id);
      setSession(prev => prev ? { ...prev, status: 'active' } : null);
      // Resume the timer when session is resumed (only if step needs timer)
      if (stepNeedsTimer) {
        setIsTimerRunning(true);
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      Alert.alert('Error', 'Failed to resume session');
    }
  };

  const cancelSession = async () => {
    if (!session) return;

    Alert.alert(
      'Cancel Cooking Session',
      'Are you sure you want to cancel this cooking session?',
      [
        { text: 'Keep Cooking', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await cookingModeService.cancelCookingSession(session.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error cancelling session:', error);
              Alert.alert('Error', 'Failed to cancel session');
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PantryHeader
          title="Cooking Mode"
          subtitle="Preparing your cooking session..."
          gradient="primary"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Setting up your cooking session...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PantryHeader
        title="Cooking Mode"
        subtitle={recipe.title}
        gradient="primary"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Timer Banner - Only show when step needs timer */}
      {isTimerRunning && stepNeedsTimer && (
        <View style={styles.timerBanner}>
          <View style={styles.timerBannerContent}>
            <View style={styles.timerInfo}>
              <Text style={styles.timerBannerLabel}>{timerLabel}</Text>
              <Text style={styles.timerBannerDisplay}>{formatTime(timerSeconds)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.timerStopButton}
              onPress={stopTimer}
            >
              <Text style={styles.timerStopButtonText}>⏹️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>

        {/* Current Step */}
        {currentStep && (
          <PantryCard variant="elevated" margin="lg">
            <View style={styles.stepHeader}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{currentStepIndex + 1}</Text>
              </View>
              <Text style={styles.stepTitle}>Current Step</Text>
            </View>
            
            <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>
            
            {stepNeedsTimer ? (
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>⏱️ Timer needed:</Text>
                <Text style={styles.timeValue}>{currentStep.estimatedTime} minutes</Text>
              </View>
            ) : (
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>⚡ Quick step:</Text>
                <Text style={styles.timeValue}>No timer needed</Text>
              </View>
            )}

            <View style={styles.stepActions}>
              {stepNeedsTimer && (
                <View style={styles.timerStatus}>
                  <Text style={styles.timerStatusText}>
                    ⏰ {isTimerRunning ? 'Timer Running' : 'Timer Paused'} ({currentStep.estimatedTime} min)
                  </Text>
                </View>
              )}
              <PantryButton
                title="✅ Complete Step"
                variant="primary"
                onPress={completeCurrentStep}
                size="sm"
                fullWidth
              />
            </View>
          </PantryCard>
        )}

        {/* Session Controls */}
        <PantryCard variant="fresh" margin="lg">
          <Text style={styles.sectionTitle}>🎮 Session Controls</Text>
          <View style={styles.sessionActions}>
            {session?.status === 'paused' ? (
              <PantryButton
                title="▶️ Resume Session"
                variant="primary"
                onPress={resumeSession}
                fullWidth
              />
            ) : (
              <PantryButton
                title="⏸️ Pause Session"
                variant="outline"
                onPress={pauseSession}
                fullWidth
              />
            )}
            <PantryButton
              title="❌ Cancel Session"
              variant="ghost"
              onPress={cancelSession}
              fullWidth
            />
          </View>
          <View style={styles.sessionNote}>
            <Text style={styles.sessionNoteText}>
              💡 {stepNeedsTimer ? 
                (isTimerRunning ? 
                  `Timer is running for Step ${currentStepIndex + 1}. Pause session to pause the timer.` :
                  'Pause session to pause the step timer. Resume to continue cooking.'
                ) :
                'No timer needed for this step. Pause session to take a break.'
              }
            </Text>
          </View>
        </PantryCard>

        {/* All Steps Overview */}
        <PantryCard variant="outlined" margin="lg">
          <Text style={styles.sectionTitle}>📋 All Steps</Text>
          {steps.map((step, index) => (
            <View key={step.id} style={[
              styles.stepOverview,
              index === currentStepIndex && styles.currentStepOverview
            ]}>
              <View style={[
                styles.stepNumber,
                index === currentStepIndex && styles.currentStepNumber,
                step.isCompleted && styles.completedStepNumber
              ]}>
                <Text style={[
                  styles.stepOverviewNumberText,
                  index === currentStepIndex && styles.currentStepNumberText,
                  step.isCompleted && styles.completedStepNumberText
                ]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepOverviewText,
                  index === currentStepIndex && styles.currentStepText,
                  step.isCompleted && styles.completedStepText
                ]}>
                  {step.instruction}
                </Text>
                {step.estimatedTime && step.estimatedTime > 0 && (
                  <Text style={styles.stepTimerInfo}>⏰ {step.estimatedTime} min</Text>
                )}
                {step.isCompleted && (
                  <Text style={styles.completedText}>✅ Completed</Text>
                )}
                {index === currentStepIndex && !step.isCompleted && (
                  <Text style={styles.currentStepIndicator}>🔄 Current Step</Text>
                )}
              </View>
            </View>
          ))}
        </PantryCard>
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.neutral[600],
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.bodySmall,
    color: colors.neutral[50],
    fontWeight: '600',
  },
  stepTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  stepInstruction: {
    ...typography.bodyLarge,
    color: colors.neutral[700],
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeLabel: {
    ...typography.bodyMedium,
    color: colors.neutral[600],
    marginRight: spacing.sm,
  },
  timeValue: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: '600',
  },
  stepActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  sessionActions: {
    gap: spacing.sm,
  },
  stepOverview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  currentStepOverview: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  currentStepNumber: {
    backgroundColor: colors.primary[500],
  },
  completedStepNumber: {
    backgroundColor: colors.sage[100],
  },
  stepOverviewNumberText: {
    ...typography.bodySmall,
    color: colors.primary[700],
    fontWeight: '600',
  },
  currentStepNumberText: {
    color: colors.neutral[50],
  },
  completedStepNumberText: {
    color: colors.success[700],
  },
  stepContent: {
    flex: 1,
  },
  stepOverviewText: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  currentStepText: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  completedStepText: {
    color: colors.neutral[500],
    textDecorationLine: 'line-through',
  },
  completedText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  currentStepIndicator: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  stepTimerInfo: {
    ...typography.bodySmall,
    color: colors.warning[600],
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  timerStatus: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  timerStatusText: {
    ...typography.bodySmall,
    color: colors.primary[700],
    fontWeight: '600',
  },
  sessionNote: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  sessionNoteText: {
    ...typography.bodySmall,
    color: colors.primary[700],
    lineHeight: 18,
  },
  timerBanner: {
    position: 'absolute',
    top: 120, // Position below header
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.warning[500],
    zIndex: 1000,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  timerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  timerInfo: {
    flex: 1,
  },
  timerBannerLabel: {
    ...typography.bodySmall,
    color: colors.neutral[50],
    fontWeight: '600',
  },
  timerBannerDisplay: {
    ...typography.h3,
    color: colors.neutral[50],
    fontWeight: '700',
  },
  timerStopButton: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerStopButtonText: {
    fontSize: 20,
    color: colors.warning[600],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModal: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    margin: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  timerTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
  },
  timerDisplay: {
    ...typography.h1,
    color: colors.primary[600],
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  timerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
