import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics can throw on devices without an engine (or on web) — every helper
// is fire-and-forget and safe to call unconditionally.
const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => undefined);
};

export const haptics = {
  light: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    ),
  warning: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    ),
  error: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    ),
  selection: () => safe(() => Haptics.selectionAsync()),
};
