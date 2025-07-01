import { useState, useRef, useEffect } from "react";
import {
  RTCPeerConnection,
  MediaStream,
  mediaDevices,
} from "react-native-webrtc";
import * as Crypto from "expo-crypto";
// import SoundLevel from 'react-native-sound-level';
import i18n from "../lib/i18n";
import { Conversation } from "../lib/conversations";

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
  const dataChannelRef = useRef<any>(null);
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
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "input_audio_buffer.speech_started":
          getOrCreateEphemeralUserId();
          updateEphemeralUserMessage({ status: "speaking" });
          break;
        case "input_audio_buffer.speech_stopped":
          updateEphemeralUserMessage({ status: "speaking" });
          break;
        case "input_audio_buffer.committed":
          updateEphemeralUserMessage({
            text: "Processing speech...",
            status: "processing",
          });
          break;
        case "conversation.item.input_audio_transcription":
          updateEphemeralUserMessage({
            text: msg.transcript || msg.text || "",
            status: "speaking",
            isFinal: false,
          });
          break;
        case "conversation.item.input_audio_transcription.completed":
          updateEphemeralUserMessage({
            text: msg.transcript || "",
            status: "final",
            isFinal: true,
          });
          clearEphemeralUserMessage();
          break;
        case "response.audio_transcript.delta": {
          const delta = msg.delta as string;
          setConversation((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant" && !last.isFinal) {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + delta },
              ];
            }
            const newMsg: Conversation = {
              id: Crypto.randomUUID(),
              role: "assistant",
              text: delta,
              timestamp: new Date().toISOString(),
              isFinal: false,
            };
            return [...prev, newMsg];
          });
          break;
        }
        case "response.audio_transcript.done":
          setConversation((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[updated.length - 1].isFinal = true;
            return updated;
          });
          break;
        case "response.function_call_arguments.done": {
          const fn = functionRegistry.current[msg.name];
          if (fn) {
            const args = JSON.parse(msg.arguments || "{}");
            const result = await fn(args);
            dataChannelRef.current?.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: msg.call_id,
                  output: JSON.stringify(result),
                },
              })
            );
            dataChannelRef.current?.send(
              JSON.stringify({ type: "response.create" })
            );
          }
          break;
        }
        default:
          break;
      }
      setMsgs((prev) => [...prev, msg]);
    } catch (err) {
      console.error("Data channel message error:", err);
    }
  }

  // Fetch ephemeral token
  async function getEphemeralToken(voice: string): Promise<string> {
    const res = await fetch("https://your.backend.com/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice }),
    });
    if (!res.ok) throw new Error(`Token error ${res.status}`);
    const json = await res.json();
    return json.client_secret.value;
  }

  // Start streaming session
  async function startSession() {
    try {
      setStatus("Requesting microphone...");
      const stream = await mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // // Start volume metering
      // SoundLevel.start();
      // SoundLevel.onNewFrame = (data: any) => {
      //   const db = data.value;
      //   const linear = Math.min(Math.max((db + 160) / 160, 0), 1);
      //   setCurrentVolume(linear);
      // };

      setStatus("Fetching token...");
      const token = await getEphemeralToken(voice);

      setStatus("Setting up connection...");
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Add mic track
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Data channel
      const dc = pc.createDataChannel("response");
      dataChannelRef.current = dc;
      dc.onopen = () => {
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
      };
      dc.onmessage = (event) => handleDataChannelMessage(event);

      // Offer/answer exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const resp = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&voice=${voice}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );
      const answer = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setIsSessionActive(true);
      setStatus("Session active");
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err}`);
      stopSession();
    }
  }

  // Stop session & cleanup
  function stopSession() {
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    //SoundLevel.stop();
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    audioStreamRef.current = null;
    setIsSessionActive(false);
    setCurrentVolume(0);
    setMsgs([]);
    setConversation([]);
    setStatus("Session stopped");
    clearEphemeralUserMessage();
  }

  // Toggle session
  function handleStartStopClick() {
    isSessionActive ? stopSession() : startSession();
  }

  // Send text through data channel
  function sendTextMessage(text: string) {
    if (dataChannelRef.current?.readyState !== "open") return;
    const id = Crypto.randomUUID();
    const newMsg: Conversation = {
      id,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
      isFinal: true,
      status: "final",
    };
    setConversation((prev) => [...prev, newMsg]);
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
    dataChannelRef.current.send(JSON.stringify({ type: "response.create" }));
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
