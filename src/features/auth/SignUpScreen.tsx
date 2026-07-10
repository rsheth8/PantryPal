import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../../services/authService';
import PantryButton from '../../components/PantryButton';
import { AmbientBackground, FadeSlideIn, useToast } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';

interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function SignUpScreen({
  onSignUpSuccess,
  onSwitchToLogin,
}: SignUpScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignUp = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      showToast('Please fill in all fields', { type: 'warning' });
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', { type: 'warning' });
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', {
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.signUp(
        email.trim(),
        password,
        name.trim()
      );
      if (user) {
        onSignUpSuccess();
      } else {
        showToast('Sign up failed. Please try again.', { type: 'error' });
      }
    } catch {
      showToast('Sign up failed — check your connection and try again', {
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AmbientBackground variant='warm' />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <FadeSlideIn offsetY={26}>
          <View style={styles.header}>
            <Text style={styles.logo}>🧑‍🍳</Text>
            <Text style={styles.title}>Join PantryPal</Text>
            <Text style={styles.subtitle}>
              Your household&apos;s kitchen, organized together
            </Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={150} offsetY={26}>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder='Full Name'
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize='words'
              autoCorrect={false}
              editable={!isLoading}
              autoComplete='name'
              textContentType='name'
            />

            <TextInput
              style={styles.input}
              placeholder='Email'
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
              autoComplete='email'
              textContentType='emailAddress'
            />

            <TextInput
              style={styles.input}
              placeholder='Password (6+ characters)'
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
              autoComplete='new-password'
              textContentType='newPassword'
            />

            <TextInput
              style={styles.input}
              placeholder='Confirm Password'
              placeholderTextColor={theme.colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
              autoComplete='new-password'
              textContentType='newPassword'
            />

            <PantryButton
              title='Create Account'
              onPress={handleEmailSignUp}
              variant='secondary'
              size='lg'
              loading={isLoading}
              fullWidth
            />

            <TouchableOpacity
              style={styles.switchButton}
              onPress={onSwitchToLogin}
              disabled={isLoading}
            >
              <Text style={styles.switchText}>
                Already have an account?{' '}
                <Text style={styles.switchTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    footer: {
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    footerText: {
      ...typography.caption,
      color: theme.colors.textMuted,
      lineHeight: 16,
      textAlign: 'center',
    },
    form: {
      marginBottom: spacing.md,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      fontSize: 16,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    logo: {
      fontSize: 64,
      marginBottom: spacing.sm,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    subtitle: {
      ...typography.body,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    switchButton: {
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    switchText: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
    },
    switchTextBold: {
      color: theme.colors.secondary,
      fontWeight: '600',
    },
    title: {
      ...typography.display,
      color: theme.colors.text,
      marginBottom: spacing.xs,
    },
  });
