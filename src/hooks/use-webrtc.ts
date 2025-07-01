import * as Crypto from "expo-crypto";
import { useEffect, useRef, useState } from "react";
import {
  MediaStream,
  RTCPeerConnection,
  mediaDevices,
} from "react-native-webrtc";
// import SoundLevel from 'react-native-sound-level';
import { Conversation } from "../lib/conversations";
import i18n from "../lib/i18n";
import { Platform } from "react-native";

// Type augmentation for RTCDataChannel to include event handlers
// This is necessary because the default types for react-native-webrtc are incomplete
interface RTCDataChannelWithEvents extends RTCDataChannel {
  onopen: () => void;
  onclose: () => void;
  onerror: (error: any) => void;
  onmessage: (event: { data: string }) => void;
}

// Enhanced logger for API calls and network operations
const logger = {
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
      `[NETWORK][${method}] ${url} ${status ? `- Status: ${status}` : ''} ${details ? `- ${JSON.stringify(details)}` : ''}`
    );
  },
};

// Custom error class for API failures
class APIError extends Error {
  status?: number;
  endpoint: string;
  details?: any;

  constructor(message: string, endpoint: string, status?: number, details?: any) {
    super(message);
    this.name = 'APIError';
    this.endpoint = endpoint;
    this.status = status;
    this.details = details;
  }
}

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
}

export default function useWebRTCAudioSession(
  voice: string,
  tools?: Tool[]
): UseWebRTCAudioSessionReturn {
  const t = i18n.t;
  const [status, setStatus] = useState<string>("");
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentVolume, setCurrentVolume] = useState<number>(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannelWithEvents | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const functionRegistry = useRef<Record<string, Function>>({});
  const ephemeralUserMessageIdRef = useRef<string | null>(null);

  // Register a tool/function
  function registerFunction(name: string, fn: Function) {
    functionRegistry.current[name] = fn;
  }

  // Ephemeral user message helpers
  function getOrCreateEphemeralUserId(): string {
    let ephemeralId = ephemeralUserMessageIdRef.current;
    if (!ephemeralId) {
      ephemeralId = Crypto.randomUUID();
      ephemeralUserMessageIdRef.current = ephemeralId;
      const newMsg: Conversation = {
        id: ephemeralId,
        role: "user",
        text: "",
        timestamp: new Date().toISOString(),
        isFinal: false,
        status: "speaking",
      };
      setConversation((prev) => [...prev, newMsg]);
    }
    return ephemeralId;
  }

  function updateEphemeralUserMessage(partial: Partial<Conversation>) {
    const id = ephemeralUserMessageIdRef.current;
    if (!id) return;
    setConversation((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...partial } : m))
    );
  }

  function clearEphemeralUserMessage() {
    ephemeralUserMessageIdRef.current = null;
  }

  // Handle incoming data messages
  async function handleDataChannelMessage(event: { data: string }) {
    try {
      // Log incoming message type (not full content for privacy)
      let msg;
      try {
        msg = JSON.parse(event.data);
        logger.info(`Received data channel message: ${msg.type}`);
      } catch (parseError) {
        logger.error(`Failed to parse data channel message`, parseError);
        return;
      }
      
      switch (msg.type) {
      // User speech events
      case "input_audio_buffer.speech_started":
        logger.info(`Speech started detected`);
        getOrCreateEphemeralUserId();
        updateEphemeralUserMessage({ status: "speaking" });
        break;

      case "input_audio_buffer.speech_stopped":
        logger.info(`Speech stopped detected`);
        updateEphemeralUserMessage({ status: "speaking" });
        break;

      case "conversation.item.input_audio_transcription":
        logger.info(`Received transcription update`);
        updateEphemeralUserMessage({
          text: msg.item.content[0].text,
          isFinal: msg.item.is_final,
          status: msg.item.is_final ? "final" : "speaking",
        });
        if (msg.item.is_final) {
          clearEphemeralUserMessage();
        }
        break;

      // Assistant message events
      case "response.audio_transcript.begin":
        logger.info(`Audio transcript beginning`);
        const newMsg: Conversation = {
          id: msg.item_id, // Use item_id from begin event
          role: "assistant",
          text: "",
          timestamp: new Date().toISOString(),
          status: "speaking",
          isFinal: false,
        };
        setConversation((prev) => [...prev, newMsg]);
        break;

      case "response.audio_transcript.delta": {
        const delta = msg.delta as string;
        setConversation((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && !last.isFinal) {
            return [
              ...prev.slice(0, -1),
              { ...last, text: (last.text || "") + delta },
            ];
          }
          return prev;
        });
        break;
      }

      case "conversation.item.update": {
        if (msg.item?.role === 'assistant' && msg.item?.content[0]?.text) {
          logger.info('Received final assistant message update', msg.item.content[0].text);
          setConversation((prev) => {
            const existingMessageIndex = prev.findIndex(m => m.id === msg.item.id);
            if (existingMessageIndex !== -1) {
              const updatedConversation = [...prev];
              updatedConversation[existingMessageIndex] = {
                ...updatedConversation[existingMessageIndex],
                text: msg.item.content[0].text,
                isFinal: true,
                status: 'final',
              };
              return updatedConversation;
            } else {
              const newAssistantMsg: Conversation = {
                id: msg.item.id,
                role: 'assistant',
                text: msg.item.content[0].text,
                timestamp: new Date().toISOString(),
                isFinal: true,
                status: 'final',
              };
              return [...prev, newAssistantMsg];
            }
          });
        }
        break;
      }

      // Tool-related events
      case "tools.function.call": {
        logger.info(`Tool function call: ${msg.function?.name}`);
        const fn = functionRegistry.current[msg.function?.name];
        if (fn) {
          try {
            const result = await fn(msg.function.arguments);
            if (dataChannelRef.current?.readyState === "open") {
              dataChannelRef.current.send(
                JSON.stringify({
                  type: "tools.function.call.response",
                  uuid: msg.uuid,
                  status: "success",
                  response: result,
                })
              );
            }
          } catch (err) {
            if (dataChannelRef.current?.readyState === "open") {
              dataChannelRef.current.send(
                JSON.stringify({
                  type: "tools.function.call.response",
                  uuid: msg.uuid,
                  status: "error",
                  response: err instanceof Error ? err.message : "Unknown error",
                })
              );
            }
          }
        } else {
          logger.warn(`Function not registered: ${msg.function?.name}`);
        }
        break;
      }

      default:
        logger.warn(`Unhandled data channel message type: ${msg.type}`);
        break;
    }
    } catch (err) {
      logger.error(`Error handling data channel message`, err);
    }
  }

  // Fetch ephemeral token
  async function getEphemeralToken(voice: string): Promise<string> {
    const host = Platform.OS === 'android' 
      ? '10.0.2.2'   // emulator → your computer
      : '192.168.1.116'; // iOS simulator → your computer

    const endpoint = `http://${host}:3000/api/session`;
    logger.info(`Fetching ephemeral token for voice: ${voice}`);
    
    try {
      logger.network("POST", endpoint);
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice }),
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
        
        logger.error(`Token fetch failed with status ${res.status}`, errorDetails);
        throw new APIError(
          `Failed to fetch token: ${res.status} ${res.statusText}`, 
          endpoint, 
          res.status, 
          errorDetails
        );
      }
      
      const json = await res.json();
      if (!json.client_secret?.value) {
        logger.error("Token response missing client_secret.value", json);
        throw new APIError("Invalid token response format", endpoint, res.status, { response: json });
      }
      
      logger.info("Successfully retrieved ephemeral token");
      return json.client_secret.value;
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw error; // Re-throw API errors that we've already formatted
      }
      
      // For other errors (like network issues)
      logger.error(`Token fetch failed with exception`, error);
      throw new APIError(
        `Token fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        endpoint
      );
    }
  }

  // Start streaming session
  async function startSession() {
    logger.info('Starting WebRTC audio session');
    try {
      // Step 1: Request microphone access
      setStatus("Requesting microphone...");
      logger.info('Requesting microphone access');
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        logger.info('Microphone access granted');
      } catch (micError) {
        logger.error('Microphone access denied', micError);
        throw new Error(`Microphone access denied: ${micError instanceof Error ? micError.message : 'Permission denied'}`);
      }

      // Volume metering implementation (commented out)
      // SoundLevel.start();
      // SoundLevel.onNewFrame = (data: any) => {
      //   const db = data.value;
      //   const linear = Math.min(Math.max((db + 160) / 160, 0), 1);
      //   setCurrentVolume(linear);
      // };

      // Step 2: Fetch authentication token
      setStatus("Fetching token...");
      logger.info('Fetching session token');
      let token;
      try {
        token = await getEphemeralToken(voice);
        logger.info('Token successfully retrieved');
      } catch (tokenError) {
        logger.error('Failed to get token', tokenError);
        throw new Error('Failed to authenticate session');
      }

      // Step 3: Create and configure peer connection
      setStatus("Setting up connection...");
      logger.info('Creating RTCPeerConnection');
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up connection event listeners
      pc.oniceconnectionstatechange = () => {
        logger.info(`ICE connection state changed: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          logger.error('WebRTC connection failed or disconnected');
          setStatus('Connection lost');
          // Consider a graceful recovery approach here
        }
      };

      pc.onconnectionstatechange = () => {
        logger.info(`Connection state changed: ${pc.connectionState}`);
      };
      
      // Log ICE gathering state changes
      pc.onicegatheringstatechange = () => {
        logger.info(`ICE gathering state changed: ${pc.iceGatheringState}`);
      };
      
      // Monitor ICE candidate errors - not fully supported in React Native WebRTC
      // but we'll log any connection failures through the other event handlers

      // Add mic track
      try {
        const stream = audioStreamRef.current;
        if (!stream) {
          throw new Error('Audio stream not available');
        }
        
        stream.getTracks().forEach((track) => {
          logger.info(`Adding audio track to peer connection: ${track.id}`);
          pc.addTrack(track, stream);
        });
      } catch (trackError) {
        logger.error('Failed to add audio track to connection', trackError);
        throw new Error('Failed to set up audio');
      }

      // Step 4: Set up data channel
      logger.info('Creating data channel');
      try {
        const dc = pc.createDataChannel("response") as unknown as RTCDataChannelWithEvents;
        dataChannelRef.current = dc;

        dc.onopen = () => {
          logger.info('Data channel opened, sending initial configuration');
          try {
            // Send session configuration
            dc.send(
              JSON.stringify({
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  tools: tools || [],
                  input_audio_transcription: { model: "gpt-4o-transcribe" },
                },
              })
            );
            
            // Send initial message
            dc.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{ type: "input_text", text: t("languagePrompt") }],
                },
              })
            );
            logger.info('Initial messages sent successfully');
          } catch (sendError) {
            logger.error('Failed to send initial messages', sendError as Error);
          }
        };

        dc.onclose = () => {
          logger.info('Data channel closed');
        };

        dc.onerror = (error: any) => {
          logger.error('Data channel error', error);
        };

        dc.onmessage = (event: { data: string }) => handleDataChannelMessage(event);
      } catch (channelError) {
        logger.error('Failed to create data channel', channelError as Error);
        throw new Error('Failed to create communication channel');
      }

      // Step 5: Perform WebRTC offer/answer exchange
      logger.info('Creating WebRTC offer');
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        logger.info('Offer created, setting local description');
        await pc.setLocalDescription(offer);

        // Send offer to server
        const rtcEndpoint = `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&voice=${voice}`;
        logger.network('POST', rtcEndpoint);
        
        const resp = await fetch(rtcEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        });
        
        logger.network('POST', rtcEndpoint, resp.status);
        
        if (!resp.ok) {
          const errorText = await resp.text();
          logger.error(`WebRTC offer rejected with status ${resp.status}`, errorText);
          throw new Error(`Server rejected WebRTC offer: ${resp.status} ${resp.statusText}`);
        }
        
        const answer = await resp.text();
        logger.info('Received answer, setting remote description');
        await pc.setRemoteDescription({ type: "answer", sdp: answer });
      } catch (rtcError) {
        logger.error('Failed during WebRTC negotiation', rtcError);
        throw new Error('Failed to establish connection with server');
      }

      // Success
      setIsSessionActive(true);
      setStatus("Session active");
      logger.info('WebRTC session successfully established');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Session start failed: ${errorMessage}`, err);
      setStatus(`Error: ${errorMessage}`);
      stopSession();
    }
  }

  // Stop session & cleanup
  function stopSession() {
    logger.info('Stopping WebRTC session');
    
    // Close data channel
    try {
      if (dataChannelRef.current) {
        logger.info('Closing data channel');
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
    } catch (dataError) {
      logger.error('Error closing data channel', dataError);
    }
    
    // Close peer connection
    try {
      if (peerConnectionRef.current) {
        logger.info('Closing peer connection');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    } catch (peerError) {
      logger.error('Error closing peer connection', peerError);
    }
    
    // Stop audio tracks
    try {
      if (audioStreamRef.current) {
        logger.info('Stopping audio tracks');
        audioStreamRef.current.getTracks().forEach((track) => {
          logger.info(`Stopping track: ${track.id}`);
          track.stop();
        });
        audioStreamRef.current = null;
      }
    } catch (audioError) {
      logger.error('Error stopping audio tracks', audioError);
    }
    
    // Stop SoundLevel if it was active
    // try {
    //   SoundLevel.stop();
    //   logger.info('Sound level monitoring stopped');
    // } catch (soundLevelError) {
    //   logger.error('Error stopping sound level monitoring', soundLevelError);
    // }
    
    // Reset state
    setIsSessionActive(false);
    setCurrentVolume(0);
    setMsgs(() => []);
    setConversation(() => []);
    setStatus("Session stopped");
    clearEphemeralUserMessage();
    
    logger.info('Session cleanup complete');
  }

  // Toggle session
  function handleStartStopClick() {
    isSessionActive ? stopSession() : startSession();
  }

  // Send text through data channel
  function sendTextMessage(text: string) {
    logger.info('Attempting to send text message');
    
    try {
      // Check if data channel is ready
      if (!dataChannelRef.current) {
        logger.error('Data channel not initialized');
        setStatus('Cannot send message: No active session');
        return;
      }
      
      if (dataChannelRef.current.readyState !== "open") {
        logger.error(`Data channel not open: ${dataChannelRef.current.readyState}`);
        setStatus('Cannot send message: Connection not ready');
        return;
      }
      
      // Create message ID and add to local conversation
      const id = Crypto.randomUUID();
      logger.info(`Creating new message with ID: ${id}`);
      
      const newMsg: Conversation = {
        id,
        role: "user",
        text,
        timestamp: new Date().toISOString(),
        isFinal: true,
        status: "final",
      };
      
      // Update UI with new message
      setConversation((prev) => [...prev, newMsg]);
      
      // Send message to server
      logger.info('Sending message to server');
      dataChannelRef.current.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        })
      );
      
      // Request response generation
      logger.info('Requesting response');
      dataChannelRef.current.send(JSON.stringify({ type: "response.create" }));
      
      logger.info('Message sent successfully');
    } catch (error) {
      logger.error('Failed to send text message', error);
      setStatus('Error sending message');
    }
  }

  useEffect(() => () => stopSession(), []);

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
  };
}
