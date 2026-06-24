import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onSwitchToSignUp: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  onSwitchToSignUp,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.signInWithEmail(email.trim(), password);
      if (user) {
        onLoginSuccess();
      } else {
        Alert.alert('Error', 'Invalid email or password.');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-in removed - use email/password only

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to PantryPal</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your household pantry
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder='Email'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            editable={!isLoading}
            secureTextEntry={false}
            autoComplete='email'
            textContentType='emailAddress'
          />

          <TextInput
            style={styles.input}
            placeholder='Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize='none'
            autoCorrect={false}
            editable={!isLoading}
            autoComplete='password'
            textContentType='password'
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google sign-in removed - use email/password only */}

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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 20,
  },
  dividerLine: {
    backgroundColor: '#e0e0e0',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  switchTextBold: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    color: '#333',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
