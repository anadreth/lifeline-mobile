/**
 * Enhanced logger for API calls and network operations
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO][WebRTC] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN][WebRTC] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR][WebRTC] ${message}`, ...args);
  },
  network: (method: string, url: string, status?: number, details?: any) => {
    console.log(
      `[NETWORK][${method}] ${url} ${status ? `- Status: ${status}` : ""} ${
        details ? `- ${JSON.stringify(details)}` : ""
      }`
    );
  },
};
