import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { GroceryItem } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  type:
    | 'expiration'
    | 'low_stock'
    | 'household_update'
    | 'shopping_reminder'
    | 'general';
  itemId?: string;
  itemName?: string;
  daysUntilExpiration?: number;
  currentQuantity?: number;
  householdId?: string;
  householdName?: string;
  userId?: string;
  userName?: string;
}

class NotificationService {
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async setupNotifications(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Set up specific channels for different notification types
        await Notifications.setNotificationChannelAsync('expiration', {
          name: 'Expiration Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9800',
        });

        await Notifications.setNotificationChannelAsync('low_stock', {
          name: 'Low Stock Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F44336',
        });

        await Notifications.setNotificationChannelAsync('household', {
          name: 'Household Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });
      }

      console.log('Notifications setup complete');
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  async scheduleExpirationNotification(item: GroceryItem): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      const daysUntilExpiration = this.getDaysUntilExpiration(
        item.expirationDate
      );

      // Schedule notification 3 days before expiration
      if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
        const trigger = new Date();
        trigger.setDate(trigger.getDate() + daysUntilExpiration - 1); // Notify 1 day before
        trigger.setHours(10, 0, 0, 0); // 10 AM

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Item Expiring Soon!',
            body: `${item.name} expires in ${daysUntilExpiration} days`,
            data: { type: 'expiration', itemId: item.id },
          },
          trigger: { date: trigger },
        });
      }
    } catch (error) {
      console.error('Failed to schedule expiration notification:', error);
    }
  }

  async scheduleLowStockNotification(item: GroceryItem): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      // Schedule notification when item is low on stock
      if (item.quantity <= 1) {
        const trigger = new Date();
        trigger.setHours(18, 0, 0, 0); // 6 PM

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📦 Low Stock Alert!',
            body: `${item.name} is running low (${item.quantity} ${item.unit} left). Add it to your shopping list!`,
            data: {
              type: 'low_stock',
              itemId: item.id,
              itemName: item.name,
              currentQuantity: item.quantity,
            },
          },
          trigger: { date: trigger },
        });
      }
    } catch (error) {
      console.error('Failed to schedule low stock notification:', error);
    }
  }

  async scheduleHouseholdUpdateNotification(
    householdName: string,
    userName: string,
    action: string,
    itemName?: string
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      const trigger = new Date();
      trigger.setSeconds(trigger.getSeconds() + 5); // Send in 5 seconds

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏠 Household Update',
          body: `${userName} ${action}${itemName ? `: ${itemName}` : ''} in ${householdName}`,
          data: {
            type: 'household_update',
            householdName,
            userName,
            itemName,
          },
        },
        trigger: { date: trigger },
      });
    } catch (error) {
      console.error('Failed to schedule household notification:', error);
    }
  }

  async scheduleShoppingReminder(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      // Schedule weekly shopping reminder (every Sunday at 9 AM)
      const trigger = new Date();
      const dayOfWeek = trigger.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      trigger.setDate(trigger.getDate() + daysUntilSunday);
      trigger.setHours(9, 0, 0, 0); // 9 AM

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🛒 Shopping Reminder',
          body: 'Time to check your pantry and update your shopping list!',
          data: { type: 'shopping_reminder' },
        },
        trigger: { date: trigger },
      });
    } catch (error) {
      console.error('Failed to schedule shopping reminder:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async cancelNotificationById(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  private getDaysUntilExpiration(expirationDate: string): number {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async sendTestNotification(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('No notification permissions');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 PantryPal Test',
          body: 'This is a test notification from PantryPal!',
          data: { type: 'general' },
        },
        trigger: { seconds: 2 },
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  async getNotificationSettings(): Promise<{
    permissions: boolean;
    channelId?: string;
  }> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      const channelId = Platform.OS === 'android' ? 'default' : undefined;

      return {
        permissions: permissions.status === 'granted',
        channelId,
      };
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return { permissions: false };
    }
  }

  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
