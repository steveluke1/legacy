/**
 * Shared helper for creating notifications with idempotency
 * Use this from other backend functions to insert notifications safely
 */

export async function createNotification(base44ServiceClient, {
  user_id,
  title,
  message,
  type,
  action_url = null,
  dedupe_key = null,
  metadata = null
}) {
  try {
    // Validate required fields
    if (!user_id || !message || !type) {
      console.warn('[notificationHelper] Missing required fields:', { user_id, message, type });
      return { success: false, error: 'Missing required fields' };
    }

    // Check for duplicate if dedupe_key provided
    if (dedupe_key) {
      const existing = await base44ServiceClient.entities.Notification.filter({
        user_id,
        type,
        message
      }, undefined, 1);

      if (existing.length > 0) {
        // Already exists, skip
        return { success: true, duplicate: true, notification: existing[0] };
      }
    }

    // Create notification
    const notification = await base44ServiceClient.entities.Notification.create({
      user_id,
      message,
      type,
      action_url,
      related_entity_id: metadata?.related_entity_id || null
    });

    return { success: true, notification };
  } catch (error) {
    console.error('[notificationHelper] Failed to create notification:', error.message);
    return { success: false, error: error.message };
  }
}