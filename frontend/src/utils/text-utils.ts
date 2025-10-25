/**
 * Utility function to extract markers and clean text
 * Used for processing AI responses with completion markers
 */
export function extractMarkersAndClean(text: string) {
  const completeMatch = text.match(/\[\[COMPLETE:\s*(.*?)\s*\]\]/i);
  const cleanText = text.replace(/\[\[.*?\]\]/g, "").trim();
  const completePart = completeMatch?.[1]?.trim() ?? null;

  return { cleanText, completePart };
}
