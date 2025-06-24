import * as Notifications from "expo-notifications";
import { MeteorShower, NotificationSettings } from "../types/meteorShower";
import { METEOR_SHOWERS_2025 } from "../data/meteorShowers";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Notification permission error:", error);
      return false;
    }
  }

  static async scheduleShowerNotifications(
    settings: NotificationSettings
  ): Promise<void> {
    if (!settings.enabled) {
      return;
    }

    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Notification permissions not granted");
    }

    // Schedule notifications for upcoming showers
    for (const shower of METEOR_SHOWERS_2025) {
      if (shower.zhr >= settings.minimumZHR) {
        await this.scheduleShowerReminders(shower, settings);
      }
    }
  }

  private static async scheduleShowerReminders(
    shower: MeteorShower,
    settings: NotificationSettings
  ): Promise<void> {
    const peakDate = new Date(shower.peak.date);
    const now = new Date();

    // Skip if peak has already passed
    if (peakDate <= now) {
      return;
    }

    // Schedule advance reminder
    if (settings.peakReminder && settings.daysBefore > 0) {
      const reminderDate = new Date(
        peakDate.getTime() - settings.daysBefore * 24 * 60 * 60 * 1000
      );

      if (reminderDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${shower.name} Peak Approaching`,
            body: `The ${shower.name} meteor shower peaks in ${
              settings.daysBefore
            } day${settings.daysBefore > 1 ? "s" : ""}! Expected rate: ${
              shower.zhr
            } meteors/hour.`,
            data: {
              showerId: shower.id,
              type: "advance_reminder",
              daysUntilPeak: settings.daysBefore,
            },
          },
          trigger: {
            date: reminderDate,
          },
        });
      }
    }

    // Schedule peak day reminder
    if (settings.hoursBeforePeak > 0) {
      const peakReminderDate = new Date(
        peakDate.getTime() - settings.hoursBeforePeak * 60 * 60 * 1000
      );

      if (peakReminderDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${shower.name} Peaks Tonight!`,
            body: `Peak viewing in ${settings.hoursBeforePeak} hours. ${shower.bestViewingTime}. Up to ${shower.zhr} meteors/hour expected!`,
            data: {
              showerId: shower.id,
              type: "peak_reminder",
              hoursUntilPeak: settings.hoursBeforePeak,
            },
          },
          trigger: {
            date: peakReminderDate,
          },
        });
      }
    }

    // Schedule peak time notification
    const peakTimeNotification = new Date(peakDate);
    if (shower.peak.time) {
      const [hours, minutes] = shower.peak.time.split(":");
      peakTimeNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    if (peakTimeNotification > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${shower.name} is Peaking Now!`,
          body: `The ${shower.name} meteor shower is at peak activity. Look ${shower.radiant} constellation. ${shower.bestViewingTime}`,
          data: {
            showerId: shower.id,
            type: "peak_now",
          },
        },
        trigger: {
          date: peakTimeNotification,
        },
      });
    }
  }

  static async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async cancelShowerNotifications(showerId: string): Promise<void> {
    const scheduled = await this.getScheduledNotifications();

    for (const notification of scheduled) {
      if (notification.content.data?.showerId === showerId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  }

  static async sendTestNotification(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Notification permissions not granted");
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Radiant Test Notification",
        body: "Your meteor shower notifications are working correctly!",
        data: { type: "test" },
      },
      trigger: {
        seconds: 1,
      },
    });
  }

  static setupNotificationListener(): void {
    // Listen for notifications when app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Listen for notification interactions
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      const data = response.notification.request.content.data;

      if (data?.showerId) {
        // Handle navigation to specific shower details
        // This would integrate with your navigation system
        console.log("Navigate to shower:", data.showerId);
      }
    });
  }
}
