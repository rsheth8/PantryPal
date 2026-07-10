import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../utils/designSystem';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Top-level crash guard: shows a friendly recovery screen instead of a white
// screen when an unexpected render error occurs.
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught:', error, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🫙</Text>
          <Text style={styles.title}>Something spilled!</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Don&apos;t worry — your pantry data is
            safe.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            accessibilityRole='button'
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.button,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    ...typography.button,
    color: '#fff',
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.neutral[600],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.neutral[900],
    textAlign: 'center',
  },
});
