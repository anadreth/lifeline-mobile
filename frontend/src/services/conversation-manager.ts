import * as Crypto from "expo-crypto";
import { Conversation } from "../lib/conversations";
import { getExamById, saveExam } from "../utils/exam-storage";

/**
 * Manages conversation state and ephemeral user messages
 */
export class ConversationManager {
  private ephemeralUserMessageId: string | null = null;

  /**
   * Load conversation from exam storage
   */
  async loadConversation(examId: string): Promise<Conversation[]> {
    if (!examId) return [];

    const exam = await getExamById(examId);
    if (exam && exam.conversation) {
      return exam.conversation;
    }
    return [];
  }

  /**
   * Save conversation to exam storage
   */
  async saveConversation(
    examId: string,
    conversation: Conversation[]
  ): Promise<void> {
    if (!examId || conversation.length === 0) return;

    const exam = await getExamById(examId);
    if (exam) {
      const updatedExam = {
        ...exam,
        conversation,
        updatedAt: new Date().toISOString(),
      };
      await saveExam(updatedExam);
    }
  }

  /**
   * Get or create ephemeral user message ID
   * Returns the ID and a boolean indicating if it was newly created
   */
  getOrCreateEphemeralUserId(): { id: string; message: Conversation | null } {
    if (this.ephemeralUserMessageId) {
      return { id: this.ephemeralUserMessageId, message: null };
    }

    const ephemeralId = Crypto.randomUUID();
    this.ephemeralUserMessageId = ephemeralId;

    const newMsg: Conversation = {
      id: ephemeralId,
      role: "user",
      text: "",
      timestamp: new Date().toISOString(),
      isFinal: false,
      status: "speaking",
    };

    return { id: ephemeralId, message: newMsg };
  }

  /**
   * Get the current ephemeral user message ID
   */
  getEphemeralUserId(): string | null {
    return this.ephemeralUserMessageId;
  }

  /**
   * Clear the ephemeral user message reference
   */
  clearEphemeralUserMessage(): void {
    this.ephemeralUserMessageId = null;
  }

  /**
   * Create a new user message
   */
  createUserMessage(text: string): Conversation {
    return {
      id: Crypto.randomUUID(),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
      isFinal: true,
      status: "final",
    };
  }

  /**
   * Create a new assistant message
   */
  createAssistantMessage(text: string): Conversation {
    return {
      id: Crypto.randomUUID(),
      role: "assistant",
      text,
      timestamp: new Date().toISOString(),
      isFinal: false,
    };
  }
}
