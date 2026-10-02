/**
 * Share Utility for LifeOS AI Chat
 * Supports 1-tap WhatsApp sharing and Web Share API fallback.
 * Strictly uses plain formatted text without emojis.
 */

export async function shareContent(text: string, title: string = 'LifeOS Travel & Plan'): Promise<boolean> {
  if (!text) return false;

  // Clean raw json_action blocks if any
  const clean = text
    .replace(/```json_action[\s\S]*?```/g, '')
    .replace(/```/g, '')
    .trim();

  // 1. If navigator.share is available on mobile devices
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text: clean,
      });
      return true;
    } catch {
      // If user dismissed share sheet or fallback needed, fall through
    }
  }

  // 2. Fallback to WhatsApp web / app intent
  const encoded = encodeURIComponent(clean);
  const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return true;
}
