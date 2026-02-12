// notificationService.ts

import axios from "axios";

export class NotificationService {

  private static readonly TAG = "NotificationService";

  static async sendMatchNotification(params: {
    token1?: string | null;
    token2?: string | null;
  }): Promise<void> {

    try {

      const { token1, token2 } = params;

      if ((!token1 || token1.length === 0) &&
          (!token2 || token2.length === 0)) {

        console.warn(
          `${NotificationService.TAG}: No valid tokens`
        );

        return;
      }

      const url =
        "https://us-central1-deep-aef66.cloudfunctions.net/sendMatchNotification";

      const response = await axios.post(
        url,
        {
          token1,
          token2,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "tharun-420",
          },
        }
      );

      console.info(
        `${NotificationService.TAG}: Status ${response.status}`
      );

      console.info(
        `${NotificationService.TAG}: Response`,
        response.data
      );

      if (response.status === 200) {

        console.info(
          `${NotificationService.TAG}: Match notification sent successfully`
        );

      } else {

        console.warn(
          `${NotificationService.TAG}: Failed`,
          response.data
        );
      }

    } catch (error) {

      console.error(
        `${NotificationService.TAG}: Error sending notification`,
        error
      );
    }
  }
}
