export class NotificationService {
  public static async sendPushNotification(
    targetUserId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    console.log(`🔔 [PUSH NOTIFICATION MOCK]`);
    console.log(`👤 Target User ID: ${targetUserId}`);
    console.log(`📌 Title: ${title}`);
    console.log(`📝 Body: ${body}`);
    if (data) {
      console.log(`📦 Meta Data:`, JSON.stringify(data, null, 2));
    }
    console.log(`-----------------------------------------------`);
    return true;
  }

  public static async notifyAdmins(title: string, body: string, data?: Record<string, any>): Promise<void> {
    console.log(`🔔 [ADMIN PUSH NOTIFICATION MOCK]`);
    console.log(`📌 Title: ${title}`);
    console.log(`📝 Body: ${body}`);
    if (data) {
      console.log(`📦 Meta Data:`, JSON.stringify(data, null, 2));
    }
    console.log(`-----------------------------------------------`);
  }
}

export default NotificationService;
