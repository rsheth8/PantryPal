import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '!',
};

interface ActiveToast {
  id: number;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
}

// App-wide toast/snackbar system with slide-up animation and optional action
// button (e.g. "Undo"). Use via `const { showToast } = useToast()`.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const { type = 'info', duration = 3200, actionLabel, onAction } = options;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      idRef.current += 1;
      setToast({ id: idRef.current, message, type, actionLabel, onAction });

      if (type === 'success') haptics.success();
      else if (type === 'error') haptics.error();

      translateY.setValue(120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 16,
          bounciness: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimer.current = setTimeout(hide, duration);
    },
    [translateY, opacity, hide]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <ToastView
          toast={toast}
          translateY={translateY}
          opacity={opacity}
          onDismiss={hide}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  translateY,
  opacity,
  onDismiss,
}: {
  toast: ActiveToast;
  translateY: Animated.Value;
  opacity: Animated.Value;
  onDismiss: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const accent = {
    success: theme.colors.success,
    error: theme.colors.error,
    info: theme.colors.info,
    warning: theme.colors.warning,
  }[toast.type];

  return (
    <Animated.View
      pointerEvents='box-none'
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 96 },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.toast}>
        <View style={[styles.iconBadge, { backgroundColor: accent }]}>
          <Text style={styles.iconText}>{TOAST_ICONS[toast.type]}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.actionLabel ? (
          <TouchableOpacity
            onPress={() => {
              toast.onAction?.();
              onDismiss();
            }}
            style={styles.actionButton}
            accessibilityRole='button'
          >
            <Text style={[styles.actionText, { color: accent }]}>
              {toast.actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actionButton: {
      marginLeft: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    actionText: {
      ...typography.label,
      textTransform: 'uppercase',
    },
    iconBadge: {
      alignItems: 'center',
      borderRadius: 12,
      height: 24,
      justifyContent: 'center',
      marginRight: spacing.sm,
      width: 24,
    },
    iconText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    message: {
      ...typography.bodySmall,
      color: theme.colors.text,
      flex: 1,
    },
    toast: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      ...shadows.lg,
      shadowColor: theme.colors.shadow,
    },
    wrapper: {
      left: spacing.md,
      position: 'absolute',
      right: spacing.md,
      zIndex: 1000,
    },
  });
