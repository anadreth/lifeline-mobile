import { MediaStream, RTCPeerConnection, mediaDevices } from "react-native-webrtc";
import { logger } from "./logger";
import { fetchIceConfig, getEphemeralToken } from "../services/webrtc-api";
import { RTCDataChannelWithEvents } from "./webrtc-message-handler";

export interface WebRTCConnectionConfig {
  voice: string;
  examId: string;
  locale: string;
  onDataChannelOpen?: (channel: RTCDataChannelWithEvents) => void;
  onDataChannelClose?: () => void;
  onDataChannelError?: (error: any) => void;
  onDataChannelMessage?: (event: MessageEvent) => void;
  onStatusChange?: (status: string) => void;
}

/**
 * Manages WebRTC peer connection, audio stream, and data channel
 */
export class WebRTCConnectionManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannelWithEvents | null = null;
  private audioStream: MediaStream | null = null;
  private config: WebRTCConnectionConfig;

  constructor(config: WebRTCConnectionConfig) {
    this.config = config;
  }

  /**
   * Get the data channel
   */
  getDataChannel(): RTCDataChannelWithEvents | null {
    return this.dataChannel;
  }

  /**
   * Get the peer connection
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  /**
   * Get the audio stream
   */
  getAudioStream(): MediaStream | null {
    return this.audioStream;
  }

  /**
   * Send message through data channel
   */
  sendMessage(message: any): void {
    if (!this.dataChannel) {
      logger.error("Cannot send message: Data channel not initialized");
      return;
    }

    if (this.dataChannel.readyState !== "open") {
      logger.error(`Cannot send message: Channel not open (${this.dataChannel.readyState})`);
      return;
    }

    try {
      this.dataChannel.send(JSON.stringify(message));
    } catch (error) {
      logger.error("Failed to send message through data channel", error);
    }
  }

  /**
   * Start WebRTC session
   */
  async start(initialMessage?: string): Promise<void> {
    try {
      // Step 1: Request microphone access
      this.updateStatus("Requesting microphone...");
      logger.info("Requesting microphone access");

      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        this.audioStream = stream;
        logger.info("Microphone access granted");
      } catch (micError) {
        logger.error("Microphone access denied", micError);
        throw new Error(
          `Microphone access denied: ${
            micError instanceof Error ? micError.message : "Permission denied"
          }`
        );
      }

      // Step 2: Fetch authentication token
      this.updateStatus("Fetching token...");
      logger.info("Fetching session token");

      let token: string;
      try {
        token = await getEphemeralToken(
          this.config.voice,
          this.config.examId,
          this.config.locale
        );
        logger.info("Token successfully retrieved");
      } catch (tokenError) {
        logger.error("Failed to get token", tokenError);
        throw new Error("Failed to authenticate session");
      }

      // Step 3: Create and configure peer connection
      this.updateStatus("Setting up connection...");
      logger.info("Creating RTCPeerConnection");

      const { iceServers } = await fetchIceConfig();
      const pc = new RTCPeerConnection({ iceServers });
      this.peerConnection = pc;

      // Set up connection event listeners
      this.setupPeerConnectionHandlers(pc);

      // Add mic track
      this.addAudioTrack(pc);

      // Step 4: Set up data channel
      this.setupDataChannel(pc, initialMessage);

      // Step 5: Perform WebRTC offer/answer exchange
      await this.performOfferAnswer(pc, token);

      // Success
      this.updateStatus("Session active");
      logger.info("WebRTC session successfully established");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Session start failed: ${errorMessage}`, err);
      this.updateStatus(`Error: ${errorMessage}`);
      throw err;
    }
  }

  /**
   * Stop session & cleanup
   */
  stop(): void {
    logger.info("Stopping WebRTC session");

    // Close data channel
    try {
      if (this.dataChannel) {
        logger.info("Closing data channel");
        this.dataChannel.close();
        this.dataChannel = null;
      }
    } catch (dataError) {
      logger.error("Error closing data channel", dataError);
    }

    // Close peer connection
    try {
      if (this.peerConnection) {
        logger.info("Closing peer connection");
        this.peerConnection.close();
        this.peerConnection = null;
      }
    } catch (peerError) {
      logger.error("Error closing peer connection", peerError);
    }

    // Stop audio tracks
    try {
      if (this.audioStream) {
        logger.info("Stopping audio tracks");
        this.audioStream.getTracks().forEach((track) => {
          logger.info(`Stopping track: ${track.id}`);
          track.stop();
        });
        this.audioStream = null;
      }
    } catch (audioError) {
      logger.error("Error stopping audio tracks", audioError);
    }

    this.updateStatus("Session stopped");
    logger.info("Session cleanup complete");
  }

  /**
   * Set up peer connection event handlers
   */
  private setupPeerConnectionHandlers(pc: RTCPeerConnection): void {
    pc.oniceconnectionstatechange = () => {
      logger.info(`ICE connection state changed: ${pc.iceConnectionState}`);
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed"
      ) {
        logger.error("WebRTC connection failed or disconnected");
        this.updateStatus("Connection lost");
      }
    };

    pc.onconnectionstatechange = () => {
      logger.info(`Connection state changed: ${pc.connectionState}`);
    };

    pc.onicegatheringstatechange = () => {
      logger.info(`ICE gathering state changed: ${pc.iceGatheringState}`);
    };
  }

  /**
   * Add audio track to peer connection
   */
  private addAudioTrack(pc: RTCPeerConnection): void {
    try {
      if (!this.audioStream) {
        throw new Error("Audio stream not available");
      }

      this.audioStream.getTracks().forEach((track) => {
        logger.info(`Adding audio track to peer connection: ${track.id}`);
        pc.addTrack(track, this.audioStream!);
      });
    } catch (trackError) {
      logger.error("Failed to add audio track to connection", trackError);
      throw new Error("Failed to set up audio");
    }
  }

  /**
   * Set up data channel
   */
  private setupDataChannel(pc: RTCPeerConnection, initialMessage?: string): void {
    logger.info("Creating data channel");

    try {
      const dc = pc.createDataChannel("response") as unknown as RTCDataChannelWithEvents;
      this.dataChannel = dc;

      dc.onopen = () => {
        logger.info("Data channel opened, sending initial configuration");
        try {
          // Send session configuration
          dc.send(
            JSON.stringify({
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                input_audio_transcription: { model: "gpt-4o-transcribe" },
                conversation: { max_response_output_tokens: 160 },
              },
            })
          );

          // Send initial message if provided
          if (initialMessage) {
            dc.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{ type: "input_text", text: initialMessage }],
                },
              })
            );
          }

          logger.info("Initial messages sent successfully");

          if (this.config.onDataChannelOpen) {
            this.config.onDataChannelOpen(dc);
          }
        } catch (sendError) {
          logger.error("Failed to send initial messages", sendError as Error);
        }
      };

      dc.onclose = () => {
        logger.info("Data channel closed");
        if (this.config.onDataChannelClose) {
          this.config.onDataChannelClose();
        }
      };

      dc.onerror = (error: any) => {
        logger.error("Data channel error", error);
        if (this.config.onDataChannelError) {
          this.config.onDataChannelError(error);
        }
      };

      dc.onmessage = (event: { data: string }) => {
        if (this.config.onDataChannelMessage) {
          this.config.onDataChannelMessage(event as MessageEvent);
        }
      };
    } catch (channelError) {
      logger.error("Failed to create data channel", channelError as Error);
      throw new Error("Failed to create communication channel");
    }
  }

  /**
   * Perform WebRTC offer/answer exchange
   */
  private async performOfferAnswer(
    pc: RTCPeerConnection,
    token: string
  ): Promise<void> {
    logger.info("Creating WebRTC offer");

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      logger.info("Offer created, setting local description");
      await pc.setLocalDescription(offer);

      // Send offer to server
      const rtcEndpoint = `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&voice=${this.config.voice}`;
      logger.network("POST", rtcEndpoint);

      const resp = await fetch(rtcEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      logger.network("POST", rtcEndpoint, resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        logger.error(
          `WebRTC offer rejected with status ${resp.status}`,
          errorText
        );
        throw new Error(
          `Server rejected WebRTC offer: ${resp.status} ${resp.statusText}`
        );
      }

      const answer = await resp.text();
      logger.info("Received answer, setting remote description");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
    } catch (rtcError) {
      logger.error("Failed during WebRTC negotiation", rtcError);
      throw new Error("Failed to establish connection with server");
    }
  }

  /**
   * Update status callback
   */
  private updateStatus(status: string): void {
    if (this.config.onStatusChange) {
      this.config.onStatusChange(status);
    }
  }
}
