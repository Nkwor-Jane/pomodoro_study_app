import { useEffect, useRef } from "react";
import { useStudyStore } from "./useStudyStore";

export const useWebRTC = () => {
  const { 
    roomName, 
    addParticipant, 
    removeParticipant,
    setLocalStream, 
    setMemberCount, 
    addMessage,
    setTimerState,
    startTimer,
    isRunning,
    timeLeft
  } = useStudyStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const peers = useRef<{ [id: string]: RTCPeerConnection }>({});
  const localStream = useRef<MediaStream | null>(null);
  const myId = useRef<string>(Math.random().toString(36).substr(2, 9));
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!roomName) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${roomName}`);
    wsRef.current = ws;

    // Get media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream.current = stream;
        setLocalStream(stream);
        console.log("Local stream acquired");
      })
      .catch((err) => console.error("Media error:", err));

    // Handle WebSocket messages
    ws.onopen = () => {
      console.log("WebSocket connected");
      // Announce yourself to the room
      if (!hasJoined.current) {
        ws.send(JSON.stringify({ 
          type: "join", 
          id: myId.current 
        }));
        hasJoined.current = true;
      }
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received message:", msg.type, msg);

      switch (msg.type) {
        case "new-peer":
          // When a new peer joins, create an offer
          if (msg.id !== myId.current && localStream.current) {
            console.log("New peer detected, creating offer:", msg.id);
            const pc = createPeer(msg.id, ws);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ 
              type: "offer", 
              offer, 
              from: myId.current, 
              to: msg.id 
            }));
          }
          break;

        case "offer":
          if (msg.to === myId.current || !msg.to) {
            console.log("Received offer from:", msg.from);
            const pc = createPeer(msg.from, ws);
            await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ 
              type: "answer", 
              answer, 
              from: myId.current, 
              to: msg.from 
            }));
          }
          break;

        case "answer":
          if (msg.to === myId.current) {
            console.log("Received answer from:", msg.from);
            const pc = peers.current[msg.from];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
            }
          }
          break;

        case "candidate":
          if (msg.to === myId.current || !msg.to) {
            const pc = peers.current[msg.from];
            if (pc && msg.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
          }
          break;

        case "members":
          console.log("Member count updated:", msg.count);
          setMemberCount(msg.count);
          break;

        case "chat":
          // Only add if it's not from me
          if (msg.from !== myId.current) {
            console.log("Chat message received:", msg);
            addMessage({ 
              id: Date.now() + Math.random(),
              sender: msg.sender || "Anonymous", 
              text: msg.text,
              timestamp: Date.now()
            });
          }
          break;

        case "timer":
          console.log("Timer action received:", msg.action, msg.data);
          // Only apply if it's from someone else (avoid double application)
          if (msg.from !== myId.current) {
            handleTimerAction(msg.action, msg.data);
          }
          break;

        case "timer-sync":
          // Sync timer state when joining
          console.log("Timer sync received:", msg.data);
          if (msg.data) {
            setTimerState(msg.data.isRunning, msg.data.timeLeft);
          }
          break;

        case "peer-left":
          console.log("Peer left:", msg.id);
          if (peers.current[msg.id]) {
            peers.current[msg.id].close();
            delete peers.current[msg.id];
            removeParticipant(msg.id);
          }
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      hasJoined.current = false;
    };

    return () => {
      // Cleanup
      Object.values(peers.current).forEach(pc => pc.close());
      peers.current = {};
      localStream.current?.getTracks().forEach(track => track.stop());
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      hasJoined.current = false;
    };
  }, [roomName]);

  const createPeer = (peerId: string, ws: WebSocket) => {
    console.log("Creating peer connection for:", peerId);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ],
    });

    peers.current[peerId] = pc;

    // Add local tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind);
        pc.addTrack(track, localStream.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0].id);
      addParticipant(peerId, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
            from: myId.current,
            to: peerId,
          })
        );
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", peerId, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        removeParticipant(peerId);
      }
    };

    return pc;
  };

  const handleTimerAction = (action: string, data: any) => {
    console.log("Handling timer action:", action, data);
    switch (action) {
      case "start":
        startTimer(data.duration || 25 * 60);
        break;
      case "pause":
        setTimerState(false, data.timeLeft || 0);
        break;
      case "resume":
        setTimerState(true, data.timeLeft || 0);
        break;
      case "reset":
        setTimerState(false, 25 * 60);
        break;
    }
  };

  // send chat
  const sendChat = (text: string) => {
    console.log("Sending chat:", text);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: "chat", 
        text, 
        sender: "Me",
        from: myId.current
      }));
      // Also add to local state
      addMessage({
        id: Date.now(),
        sender: "Me",
        text,
        timestamp: Date.now()
      });
    }
  };

  // send timer actions
  const sendTimerAction = (action: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Apply locally immediately for responsiveness
      handleTimerAction(action, data);
      
      // Then broadcast to others
      wsRef.current.send(JSON.stringify({ 
        type: "timer", 
        action, 
        data,
        from: myId.current
      }));
    }
  };

  return { sendChat, sendTimerAction };
};