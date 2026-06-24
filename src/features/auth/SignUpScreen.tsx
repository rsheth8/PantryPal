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

interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function SignUpScreen({
  onSignUpSuccess,
  onSwitchToLogin,
}: SignUpScreenProps) {
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
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
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
        Alert.alert('Error', 'Sign up failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-up removed - use email/password only

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join PantryPal to manage your household
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder='Full Name'
            value={name}
            onChangeText={setName}
            autoCapitalize='words'
            autoCorrect={false}
            editable={!isLoading}
            secureTextEntry={false}
            autoComplete='name'
            textContentType='name'
          />

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
            autoComplete='new-password'
            textContentType='newPassword'
          />

          <TextInput
            style={styles.input}
            placeholder='Confirm Password'
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            autoCapitalize='none'
            autoCorrect={false}
            editable={!isLoading}
            autoComplete='new-password'
            textContentType='newPassword'
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleEmailSignUp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google sign-up removed - use email/password only */}

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
