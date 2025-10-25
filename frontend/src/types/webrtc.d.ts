// WebRTC type declarations for React Native WebRTC
// This extends the standard WebRTC types with React Native specific properties

import 'react-native-webrtc';

declare module 'react-native-webrtc' {
  // Extend RTCPeerConnection with event handlers
  interface RTCPeerConnection {
    oniceconnectionstatechange: (() => void) | null;
    onconnectionstatechange: (() => void) | null;
    onicegatheringstatechange: (() => void) | null;
    onicecandidateerror: ((event: any) => void) | null;
  }

  // Extend RTCDataChannel with event handlers
  interface RTCDataChannel {
    onopen: (() => void) | null;
    onclose: (() => void) | null;
    onerror: ((error: any) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
  }
}
