export interface Conversation {
  id: string; // Unique ID for react rendering and logging purposes
  role: 'user' | 'assistant'; // Role of the message sender
  text: string; // User or assistant message
  timestamp: string; // ISO string for message time
  isFinal: boolean; // Whether the transcription is final
  status?: 'speaking' | 'processing' | 'final'; // Status for real-time conversation states
}
  