/**
 * chatUtils.ts
 * Utility functions for chat system
 */

/**
 * Generate a short hash from email for chatId
 * This prevents long chatIds that cause API errors
 * 
 * Example:
 * Input: "saburovmuhamadjon@gmail.com"
 * Output: "a3f7k2m9" (8 characters)
 */
export function generateEmailHash(email: string): string {
  const hash = email
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  
  return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Generate chatId for a trip conversation (legacy, per-trip)
 * Format: trip_{tripId}_{emailHash}
 */
export function generateTripChatId(tripId: string | number, userEmail: string): string {
  const emailHash = generateEmailHash(userEmail || 'guest');
  return `trip_${tripId}_${emailHash}`;
}

/**
 * Generate a stable chatId for a pair of users (driver ↔ sender).
 * Emails are sorted so A+B and B+A always give the same chatId.
 * Format: pair_{hashA}_{hashB}
 */
export function generatePairChatId(emailA: string, emailB: string): string {
  const sorted = [emailA || 'guest', emailB || 'guest'].sort();
  const hashA = generateEmailHash(sorted[0]);
  const hashB = generateEmailHash(sorted[1]);
  return `pair_${hashA}_${hashB}`;
}