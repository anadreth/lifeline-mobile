import { useEffect, useRef, useState } from "react";
import { Conversation } from "../lib/conversations";
import i18n from "../lib/i18n";
import { ConversationManager } from "../services/conversation-manager";
import { ToolExecutor } from "../services/tool-executor";
import { WebRTCMessageHandler } from "../lib/webrtc-message-handler";
import { WebRTCConnectionManager } from "../lib/webrtc-connection";
import { logger } from "../lib/logger";

export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface UseWebRTCAudioSessionReturn {
  status: string;
  isSessionActive: boolean;
  currentVolume: number;
  startSession: () => Promise<void>;
  stopSession: () => void;
  handleStartStopClick: () => void;
  registerFunction: (name: string, fn: Function) => void;
  msgs: any[];
  conversation: Conversation[];
  sendTextMessage: (text: string) => void;
  examProgress: Record<string, boolean>;
  cancelAssistant: () => void;
}

/**
 * Custom hook for managing WebRTC audio sessions with OpenAI Realtime API
 */
export default function useWebRTCAudioSession(
  examId: string,
  voice: string
): UseWebRTCAudioSessionReturn {
  const t = i18n.t;

  // UI State
  const [status, setStatus] = useState<string>("");
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [examProgress, setExamProgress] = useState<Record<string, boolean>>({});

  // Service instances
  const conversationManagerRef = useRef<ConversationManager>(new ConversationManager());
  const toolExecutorRef = useRef<ToolExecutor>(new ToolExecutor());
  const connectionManagerRef = useRef<WebRTCConnectionManager | null>(null);
  const messageHandlerRef = useRef<WebRTCMessageHandler | null>(null);
  const functionRegistry = useRef<Record<string, Function>>({});

  /**
   * Load conversation from storage on mount
   */
  useEffect(() => {
    const loadConversation = async () => {
      if (examId) {
        const loadedConversation = await conversationManagerRef.current.loadConversation(examId);
        setConversation(loadedConversation);
      }
    };
    loadConversation();
  }, [examId]);

  /**
   * Save conversation to storage when it changes
   */
  useEffect(() => {
    const saveConversation = async () => {
      if (examId && conversation.length > 0) {
        await conversationManagerRef.current.saveConversation(examId, conversation);
      }
    };

    if (conversation.length > 0) {
      saveConversation();
    }
  }, [conversation, examId]);

  /**
   * Register a tool/function
   */
  function registerFunction(name: string, fn: Function) {
    functionRegistry.current[name] = fn;
  }

  /**
   * Start WebRTC session
   */
  async function startSession() {
    logger.info("Starting WebRTC audio session");

    try {
      // Create message handler with callbacks
      const messageHandler = new WebRTCMessageHandler(
        conversationManagerRef.current,
        toolExecutorRef.current,
        {
          updateConversation: setConversation,
          updateExamProgress: (section: string) => {
            setExamProgress((prev) => ({ ...prev, [section]: true }));
          },
          sendDataChannelMessage: (message: any) => {
            connectionManagerRef.current?.sendMessage(message);
          },
          addRawMessage: (msg: any) => {
            setMsgs((prev) => [...prev, msg]);
          },
        },
        examId
      );
      messageHandlerRef.current = messageHandler;

      // Create connection manager
      const connectionManager = new WebRTCConnectionManager({
        voice,
        examId,
        locale: i18n.locale || "sk-SK",
        onDataChannelMessage: (event: MessageEvent) => {
          messageHandler.handleMessage(event);
        },
        onStatusChange: (newStatus: string) => {
          setStatus(newStatus);
        },
      });
      connectionManagerRef.current = connectionManager;

      // Start the connection
      await connectionManager.start(t("languagePrompt"));

      setIsSessionActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Session start failed: ${errorMessage}`, err);
      setStatus(`Error: ${errorMessage}`);
      stopSession();
    }
  }

  /**
   * Stop session & cleanup
   */
  function stopSession() {
    logger.info("Stopping WebRTC session");

    // Stop connection
    connectionManagerRef.current?.stop();
    connectionManagerRef.current = null;
    messageHandlerRef.current = null;

    // Reset state
    setIsSessionActive(false);
    setCurrentVolume(0);
    setMsgs([]);
    setConversation([]);
    setStatus("Session stopped");
    conversationManagerRef.current.clearEphemeralUserMessage();

    logger.info("Session cleanup complete");
  }

  /**
   * Toggle session
   */
  function handleStartStopClick() {
    isSessionActive ? stopSession() : startSession();
  }

  /**
   * Cancel assistant response
   */
  function cancelAssistant() {
    connectionManagerRef.current?.sendMessage({ type: "response.cancel" });
  }

  /**
   * Send text through data channel
   */
  function sendTextMessage(text: string) {
    logger.info("Attempting to send text message");

    try {
      const dataChannel = connectionManagerRef.current?.getDataChannel();

      if (!dataChannel) {
        logger.error("Data channel not initialized");
        setStatus("Cannot send message: No active session");
        return;
      }

      if (dataChannel.readyState !== "open") {
        logger.error(`Data channel not open: ${dataChannel.readyState}`);
        setStatus("Cannot send message: Connection not ready");
        return;
      }

      // Create message and add to conversation
      const newMsg = conversationManagerRef.current.createUserMessage(text);
      setConversation((prev) => [...prev, newMsg]);

      // Send message to server
      logger.info("Sending message to server");
      connectionManagerRef.current?.sendMessage({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      });

      // Request response generation
      logger.info("Requesting response");
      connectionManagerRef.current?.sendMessage({ type: "response.create" });

      logger.info("Message sent successfully");
    } catch (error) {
      logger.error("Failed to send text message", error);
      setStatus("Error sending message");
    }
  }

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return {
    status,
    isSessionActive,
    currentVolume,
    startSession,
    stopSession,
    handleStartStopClick,
    registerFunction,
    msgs,
    conversation,
    sendTextMessage,
    examProgress,
    cancelAssistant,
  };
}
