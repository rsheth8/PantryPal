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

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onSwitchToSignUp: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  onSwitchToSignUp,
}: LoginScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password', { type: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.signInWithEmail(email.trim(), password);
      if (user) {
        onLoginSuccess();
      } else {
        showToast('Invalid email or password', { type: 'error' });
      }
    } catch {
      showToast('Login failed — check your connection and try again', {
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
      <AmbientBackground variant='primary' />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <FadeSlideIn offsetY={26}>
          <View style={styles.header}>
            <Text style={styles.logo}>🥫</Text>
            <Text style={styles.title}>PantryPal</Text>
            <Text style={styles.subtitle}>
              Track groceries. Waste less. Cook more.
            </Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={150} offsetY={26}>
          <View style={styles.form}>
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
              placeholder='Password'
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
              autoComplete='password'
              textContentType='password'
            />

            <PantryButton
              title='Sign In'
              onPress={handleEmailLogin}
              variant='primary'
              size='lg'
              loading={isLoading}
              fullWidth
            />

            <TouchableOpacity
              style={styles.switchButton}
              onPress={onSwitchToSignUp}
              disabled={isLoading}
            >
              <Text style={styles.switchText}>
                Don&apos;t have an account?{' '}
                <Text style={styles.switchTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
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
      color: theme.colors.primary,
      fontWeight: '600',
    },
    title: {
      ...typography.display,
      color: theme.colors.text,
      marginBottom: spacing.xs,
    },
  });
