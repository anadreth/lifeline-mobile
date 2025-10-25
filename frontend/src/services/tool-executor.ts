import { Platform } from "react-native";
import { logger } from "../lib/logger";
import { getExamById, saveExam } from "../utils/exam-storage";
import { Exam } from "../models/exam";

export interface ToolResult {
  ok: boolean;
  section?: string;
  summary?: string;
  bbVersion?: number;
  error?: string;
}

/**
 * Executes tools via API endpoint
 */
export class ToolExecutor {
  /**
   * Execute a tool by making API call to backend
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    examId?: string
  ): Promise<ToolResult> {
    // Add examId to args if not present
    if (examId && !args.examId) {
      args.examId = examId;
    }

    const host = Platform.OS === "android" ? "10.0.2.2" : "192.168.1.116";
    const toolEndpoint = `http://${host}:3000/api/tools/${toolName}`;

    let result: ToolResult = { ok: false };
    try {
      const response = await fetch(toolEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      result = await response.json();
    } catch (error) {
      logger.error("Tool proxy error", error);
      result = { ok: false, error: String(error) };
    }

    return result;
  }

  /**
   * Handle checkpoint.mark tool execution
   * Updates exam progress and returns summary
   */
  async handleCheckpointMark(
    result: ToolResult,
    examId: string
  ): Promise<void> {
    if (!result.ok || !result.section) return;

    logger.info(`Checkpoint reached via tool: ${result.section}`);

    // Update local exam storage
    const exam = await getExamById(examId);
    if (exam) {
      const updatedExam: Exam = {
        ...exam,
        completedSteps: {
          ...(exam.completedSteps || {}),
          [result.section]: true,
        },
        updatedAt: new Date().toISOString(),
      };
      await saveExam(updatedExam);
    }

    logger.info(`Truncated conversation with bbVersion ${result.bbVersion}`);
  }
}
