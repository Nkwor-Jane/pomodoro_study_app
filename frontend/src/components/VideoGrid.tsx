import React, { useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";

interface Participant {
  id: string;
  stream: MediaStream;
}

interface VideoGridProps {
  localStream: MediaStream | null;
  participants: Participant[];
  videoEnabled: boolean;
  audioEnabled: boolean;
  setVideoEnabled: (v: boolean) => void;
  setAudioEnabled: (v: boolean) => void;
}

const VideoTile = React.memo(({ label, stream, muted }: { label: string; stream: MediaStream; muted?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative group rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs">
        {label}
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
        <Video className="w-4 h-4 text-gray-300" />
      </div>
    </div>
  );
});

const VideoGrid = React.memo(
  ({ localStream, participants, videoEnabled, audioEnabled, setVideoEnabled, setAudioEnabled }: VideoGridProps) => {
    return (
      <div className="flex flex-col h-full">
        {/* Responsive grid for participants */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 flex-1 mb-4">
          {localStream && (
            <VideoTile label="You" stream={localStream} muted />
          )}
          {participants.map((p) => (
            <VideoTile key={p.id} label={`Peer ${p.id.substring(0, 4)}`} stream={p.stream} />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mt-auto pb-2">
          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`p-3 rounded-full ${
              videoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
            } transition-colors`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-full ${
              audioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
            } transition-colors`}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }
);

export default VideoGrid;
