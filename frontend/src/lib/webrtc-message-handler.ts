import { Conversation } from "./conversations";
import { logger } from "./logger";
import { extractMarkersAndClean } from "../utils/text-utils";
import { ConversationManager } from "../services/conversation-manager";
import { ToolExecutor } from "../services/tool-executor";

/**
 * Callbacks for message handler to update component state
 */
export interface MessageHandlerCallbacks {
  updateConversation: (
    updater: (prev: Conversation[]) => Conversation[]
  ) => void;
  updateExamProgress: (section: string) => void;
  sendDataChannelMessage: (message: any) => void;
  addRawMessage: (msg: any) => void;
}

/**
 * Type augmentation for RTCDataChannel to include event handlers
 */
export interface RTCDataChannelWithEvents extends RTCDataChannel {
  onopen: () => void;
  onclose: () => void;
  onerror: (error: any) => void;
  onmessage: (event: { data: string }) => void;
}

/**
 * Handles incoming WebRTC data channel messages
 */
export class WebRTCMessageHandler {
  private conversationManager: ConversationManager;
  private toolExecutor: ToolExecutor;
  private callbacks: MessageHandlerCallbacks;
  private examId: string;

  constructor(
    conversationManager: ConversationManager,
    toolExecutor: ToolExecutor,
    callbacks: MessageHandlerCallbacks,
    examId: string
  ) {
    this.conversationManager = conversationManager;
    this.toolExecutor = toolExecutor;
    this.callbacks = callbacks;
    this.examId = examId;
  }

  /**
   * Update the examId (used when it changes)
   */
  setExamId(examId: string): void {
    this.examId = examId;
  }

  /**
   * Main handler for data channel messages
   */
  async handleMessage(event: MessageEvent): Promise<any> {
    try {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "input_audio_buffer.speech_started":
          await this.handleSpeechStarted();
          break;

        case "input_audio_buffer.speech_stopped":
          this.handleSpeechStopped();
          break;

        case "input_audio_buffer.committed":
          this.handleAudioCommitted();
          break;

        case "conversation.item.input_audio_transcription":
          this.handlePartialTranscription(msg);
          break;

        case "conversation.item.input_audio_transcription.completed":
          this.handleFinalTranscription(msg);
          break;

        case "response.audio_transcript.delta":
          await this.handleAudioTranscriptDelta(msg);
          break;

        case "response.audio_transcript.done":
          this.handleAudioTranscriptDone();
          break;

        case "response.function_call_arguments.done":
          await this.handleFunctionCall(msg);
          break;

        default:
          console.warn("Unhandled message type:", msg.type);
          break;
      }

      // Always log the raw message
      this.callbacks.addRawMessage(msg);
      return msg;
    } catch (error) {
      console.error("Error handling data channel message:", error);
    }
  }

  /**
   * User speech started
   */
  private async handleSpeechStarted(): Promise<void> {
    const { id, message } =
      this.conversationManager.getOrCreateEphemeralUserId();

    if (message) {
      this.callbacks.updateConversation((prev) => [...prev, message]);
    } else {
      this.updateEphemeralMessage({ status: "speaking" });
    }

    // Cancel any ongoing response
    this.callbacks.sendDataChannelMessage({ type: "response.cancel" });
  }

  /**
   * User speech stopped
   */
  private handleSpeechStopped(): void {
    this.updateEphemeralMessage({ status: "speaking" });
  }

  /**
   * Audio buffer committed
   */
  private handleAudioCommitted(): void {
    this.updateEphemeralMessage({
      text: "Processing speech...",
      status: "processing",
    });
  }

  /**
   * Partial user transcription
   */
  private handlePartialTranscription(msg: any): void {
    const partialText = msg.transcript ?? msg.text ?? "User is speaking...";
    this.updateEphemeralMessage({
      text: partialText,
      status: "speaking",
      isFinal: false,
    });
  }

  /**
   * Final user transcription
   */
  private handleFinalTranscription(msg: any): void {
    this.updateEphemeralMessage({
      text: msg.transcript || "",
      isFinal: true,
      status: "final",
    });
    this.conversationManager.clearEphemeralUserMessage();
  }

  /**
   * Streaming AI transcripts (assistant partial)
   */
  private async handleAudioTranscriptDelta(msg: any): Promise<void> {
    const { content } = msg;
    logger.info("Got audio transcript delta", msg.delta);

    if (!content) {
      // Extract markers and clean text
      const { cleanText, completePart } = extractMarkersAndClean(msg.delta);

      this.callbacks.updateConversation((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && !lastMsg.isFinal) {
          // Update existing message
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMsg,
            text: lastMsg.text + cleanText,
          };
          return updated;
        } else {
          // Add new message
          const newMessage =
            this.conversationManager.createAssistantMessage(cleanText);
          return [...prev, newMessage];
        }
      });

      // Process completion marker if present
      if (completePart) {
        await this.handleCompletionMarker(completePart);
      }
    }
  }

  /**
   * Mark the last assistant message as final
   */
  private handleAudioTranscriptDone(): void {
    this.callbacks.updateConversation((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1].isFinal = true;
      return updated;
    });
  }

  /**
   * AI calls a function (tool)
   */
  private async handleFunctionCall(msg: any): Promise<void> {
    const toolName = msg.name;
    const args = JSON.parse(msg.arguments || "{}");

    // Execute tool
    const result = await this.toolExecutor.executeTool(
      toolName,
      args,
      this.examId
    );

    // Send function output back to model (required)
    this.callbacks.sendDataChannelMessage({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: msg.call_id,
        output: JSON.stringify(result),
      },
    });
    this.callbacks.sendDataChannelMessage({ type: "response.create" });

    // Special handling for checkpoint.mark
    if (toolName === "checkpoint.mark" && result?.ok && result.section) {
      // Update UI progress
      this.callbacks.updateExamProgress(result.section);

      // Update exam storage
      await this.toolExecutor.handleCheckpointMark(result, this.examId);

      // Truncate conversation with summary from tool
      this.callbacks.sendDataChannelMessage({
        type: "conversation.truncate",
        conversation: {
          last_messages: 8,
          summary: result.summary || "",
        },
      });
    }
  }

  /**
   * Handle completion marker from transcript
   */
  private async handleCompletionMarker(completePart: string): Promise<void> {
    logger.info(`Exam section complete: ${completePart}`);
    this.callbacks.updateExamProgress(completePart);

    // Update exam in storage
    if (this.examId) {
      const { getExamById, saveExam } = await import("../utils/exam-storage");

      const exam = await getExamById(this.examId);
      if (exam) {
        const updatedCompletedSteps = {
          ...exam.completedSteps,
          [completePart]: true,
        };
        const updatedExam = {
          ...exam,
          completedSteps: updatedCompletedSteps,
          updatedAt: new Date().toISOString(),
        };
        await saveExam(updatedExam);
      }

      // Fetch summary and truncate
      const { fetchExamSummary } = await import("../services/webrtc-api");
      const summary = await fetchExamSummary(this.examId);

      this.callbacks.sendDataChannelMessage({
        type: "conversation.truncate",
        conversation: {
          last_messages: 8,
          summary,
        },
      });
    }
  }

  /**
   * Helper to update ephemeral user message
   */
  private updateEphemeralMessage(partial: Partial<Conversation>): void {
    const id = this.conversationManager.getEphemeralUserId();
    if (!id) return;

    this.callbacks.updateConversation((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...partial } : m))
    );
  }
}
