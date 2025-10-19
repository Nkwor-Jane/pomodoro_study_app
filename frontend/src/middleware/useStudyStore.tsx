// middleware/useStudyStore.tsx
import { create } from "zustand";

interface LogEntry {
  id: number;
  type: "study" | "break";
  duration: number;
}

interface Participant {
  id: string;
  stream: MediaStream;
}

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  timestamp: number;
}

interface StudyState {
  roomName: string | null;
  isRunning: boolean;
  timeLeft: number;
  logs: LogEntry[];
  participants: Participant[];
  localStream: MediaStream | null;
  messages: ChatMessage[];
  memberCount: number;
  setmberCount: (count: number) => void;

  // actions
  setRoom: (room: string | null) => void;
  startTimer: (duration: number) => void;
  tick: () => void;
  addLog: (entry: LogEntry) => void;
  setTimerState: (running: boolean, timeLeft: number) => void;

  setLocalStream: (stream: MediaStream) => void;
  addParticipant: (id: string, stream: MediaStream) => void;
  removeParticipant: (id: string) => void;

  addMessage: (msg: ChatMessage) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  roomName: null,
  isRunning: false,
  timeLeft: 25 * 60,
  logs: [],
  participants: [],
  localStream: null,
  messages: [],
  memberCount: 1, // starts with yourself
  // getMemberCount: () => get().participants.length + 1,
  setMemberCount: (count) => set({ memberCount: count }),
  setRoom: (room) => set({ roomName: room }),

  startTimer: (duration) =>
    set({ isRunning: true, timeLeft: duration }),

  tick: () =>
    set((state) => ({
      timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0,
      isRunning: state.timeLeft > 1,
    })),

  addLog: (entry) =>
  set((state) => {
    const updatedLogs = [...state.logs, entry];
    console.log("LOGS:", updatedLogs);
    return { logs: updatedLogs };
  }),

    
  setTimerState: (running, timeLeft) =>
    set(() => ({ isRunning: running, timeLeft })),

  setLocalStream: (stream) => set({ localStream: stream }),

  // addParticipant: (id, stream) =>
  //   set((state) => ({
  //     participants: [...state.participants, { id, stream }],
  //   })),

  // removeParticipant: (id) =>
  //   set((state) => ({
  //     participants: state.participants.filter((p) => p.id !== id),
  //   })),
  addParticipant: (id, stream) =>
    set((state) => {
      // Prevent duplicates
      const exists = state.participants.some((p) => p.id === id);
      if (exists) return state;

      const updatedParticipants = [...state.participants, { id, stream }];
      return {
        participants: updatedParticipants,
        memberCount: updatedParticipants.length + 1, // +1 for local user
      };
    }),

  removeParticipant: (id) =>
    set((state) => {
      const updatedParticipants = state.participants.filter((p) => p.id !== id);
      return {
        participants: updatedParticipants,
        memberCount: updatedParticipants.length + 1, // +1 for local user
      };
    }),


  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
}));
