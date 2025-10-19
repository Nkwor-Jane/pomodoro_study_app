// StudyTogetherApp.tsx
import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { useStudyStore } from "../middleware/useStudyStore";
import { useWebRTC } from "../middleware/useWebRTC";
import { useParams, useNavigate } from "react-router-dom";
import VideoGrid from "./VideoGrid";


const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export default function StudyApp() {
  const {
    roomName,
    setRoom,
    isRunning,
    timeLeft,
    tick,
    logs,
    localStream,
    participants,
    messages,
    addLog,
  } = useStudyStore();

  const { sendChat, sendTimerAction } = useWebRTC();
  const [chatInput, setChatInput] = useState("");
  const [roomInput, setRoomInput] = useState("")
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { roomName: roomParam } = useParams();
  const navigate = useNavigate();
  const memberCount = useStudyStore((s) => s.memberCount);


  // Timer ticking
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    if (roomParam && !roomName) {
      setRoom(roomParam);
    }
  }, [roomParam, roomName, setRoom]);

  // Toggle video track
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = videoEnabled;
      }
    }
  }, [videoEnabled, localStream]);

  // Toggle audio track
  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = audioEnabled;
      }
    }
  }, [audioEnabled, localStream]);

  // Handle Start/Pause synced across peers
  const handleStartPause = () => {
    if (isRunning) {
      sendTimerAction("pause", { timeLeft });
      addLog({ id: Date.now(), type: "break", duration: 25 * 60 - timeLeft });
    } else {
      sendTimerAction("start", { duration: timeLeft || 25 * 60 });
      addLog({ id: Date.now(), type: "study", duration: timeLeft });
    }
  };

  // Join screen
  if (!roomName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              StudyTogether
            </h1>
            <p className="text-gray-600">
              Focus better with friends using Pomodoro technique
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Study Room
              </label>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && roomInput.trim()) {
                    navigate(`/room/${roomInput}`);
                  }
                }}
                placeholder="Enter room name (e.g., Math Study Group)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => {
                if (!roomInput.trim()) return;
                navigate(`/room/${roomInput}`);
              }}
              disabled={!roomInput.trim()}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Join Room
            </button>

            <div className="text-center text-sm text-gray-500">
              Or create a new room with any name
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Study room
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-semibold">{roomName}</h1>
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>

            <button
              onClick={() => {
                const link = `${window.location.origin}/room/${roomName}`;
                navigator.clipboard.writeText(link);
                alert(`Room link copied:\n${link}`);
              }}
              className="ml-4 text-xs text-indigo-400 hover:text-indigo-200"
            >
              Copy Invite Link
            </button>
          </div>

          <button
            onClick={() => {
              setRoom(null);
              navigate('/');
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Leave Room
          </button>
        </div>
      </header>

      <div className="flex max-w-6xl mx-auto">
        {/* Video Grid */}
        <div className="flex-1 p-6">
          <VideoGrid
            localStream={localStream}
            participants={participants}
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            setVideoEnabled={setVideoEnabled}
            setAudioEnabled={setAudioEnabled}
          />
        </div>


        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Timer */}
          <div className="p-6 border-b border-gray-700">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold mb-4 text-indigo-400">
                {formatTime(timeLeft)}
              </div>

              <div className="text-sm font-medium mb-4 text-indigo-400">
                {isRunning
                  ? "📚 Focus Time - Study Mode"
                  : "⏸ Paused / Break"}
              </div>

              <button
                onClick={handleStartPause}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isRunning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 inline mr-2" />
                    Pause Timer
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-2" />
                    Start Timer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="p-6 border-b border-gray-700">
            <h3 className="flex items-center text-lg font-semibold mb-4">
              <MessageCircle className="w-5 h-5 mr-2" />
              Activity Log
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(log.id).toLocaleTimeString()}
                    </div>
                    <div className="text-sm">
                      {log.type} - {log.duration}s
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">Chat</h3>
            <div className="space-y-2 flex-1 overflow-y-auto mb-2">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-sm bg-gray-700 rounded p-2">
                    <span className="font-medium text-indigo-400">{msg.sender}: </span>
                    <span className="text-gray-200">{msg.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex space-x-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    sendChat(chatInput);
                    setChatInput("");
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  if (!chatInput.trim()) return;
                  sendChat(chatInput);
                  setChatInput("");
                }}
                className="bg-indigo-600 px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}