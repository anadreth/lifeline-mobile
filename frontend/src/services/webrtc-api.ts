import { Platform } from "react-native";
import { APIError } from "../lib/errors";
import { logger } from "../lib/logger";

/**
 * Get the appropriate host based on platform
 */
export function getHost(): string {
  return Platform.OS === "android" ? "10.0.2.2" : "192.168.1.116";
}

/**
 * Fetch ICE server configuration
 */
export async function fetchIceConfig() {
  const host = getHost();
  const res = await fetch(`http://${host}:3000/api/openai-session/ice`);
  if (!res.ok) throw new Error("Failed to get ICE config");
  return res.json(); // { iceServers: [...] }
}

/**
 * Fetch ephemeral token for WebRTC session
 */
export async function getEphemeralToken(
  voice: string,
  examId: string,
  locale: string
): Promise<string> {
  const host = getHost();
  const endpoint = `http://${host}:3000/api/openai-session`;
  logger.info(`Fetching ephemeral token for voice: ${voice}`);

  try {
    logger.network("POST", endpoint);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice, examId, locale }),
    });

    // Log response status
    logger.network("POST", endpoint, res.status);

    if (!res.ok) {
      const errorText = await res.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (e) {
        errorDetails = { rawError: errorText };
      }

      logger.error(
        `Token fetch failed with status ${res.status}`,
        errorDetails
      );
      throw new APIError(
        `Failed to fetch token: ${res.status} ${res.statusText}`,
        endpoint,
        res.status,
        errorDetails
      );
    }

    const json = await res.json();
    if (!json.data.client_secret?.value) {
      logger.error("Token response missing client_secret.value", json);
      throw new APIError(
        "Invalid token response format",
        endpoint,
        res.status,
        { response: json }
      );
    }

    logger.info("Successfully retrieved ephemeral token");
    return json.data.client_secret.value;
  } catch (error: unknown) {
    if (error instanceof APIError) {
      throw error; // Re-throw API errors that we've already formatted
    }

    // For other errors (like network issues)
    logger.error(`Token fetch failed with exception`, error);
    throw new APIError(
      `Token fetch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      endpoint
    );
  }
}

/**
 * Fetch exam summary from blackboard
 */
export async function fetchExamSummary(examId: string): Promise<string> {
  const host = getHost();
  try {
    const response = await fetch(
      `http://${host}:3000/api/bb/summary?examId=${examId}`
    );
    return await response.text();
  } catch (error) {
    logger.error("Failed to fetch exam summary", error);
    return "";
  }
}
