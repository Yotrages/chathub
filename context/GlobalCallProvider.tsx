// context/GlobalCallContext.tsx
"use client";
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { useSocket } from "@/context/socketContext";
import toast from "react-hot-toast";
import { IncomingCallModal } from "@/components/chat/IncomingCallModal";
import { CallInterface } from "@/components/chat/CallInterface";
import MobileDebugPanel from "@/components/chat/MobileDebugPanel";

type CallState = "idle" | "calling" | "ringing" | "connecting" | "connected" | "ended" | "failed";
type ConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";

interface IncomingCallData {
  from: string;
  isVideo: boolean;
  callId: string;
  callerName?: string;
  callerAvatar?: string;
}

interface GlobalCallContextType {
  callState: CallState;
  startCall: (userId: string, isVideo: boolean) => void;
  endCall: () => void;
}

const GlobalCallContext = createContext<GlobalCallContextType | undefined>(undefined);

export const useGlobalCall = () => {
  const context = useContext(GlobalCallContext);
  if (!context) {
    throw new Error("useGlobalCall must be used within GlobalCallProvider");
  }
  return context;
};

// Import all the helper functions from useCallManager
const isLowEndDevice = () => {
  const memory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const isLowRam = memory && memory < 2;
  const isLowCpu = hardwareConcurrency < 4;
  const isItelOrLowEnd = /Itel|Symphony|Infinix|Tecno/i.test(navigator.userAgent);
  return isMobile && (isLowRam || isLowCpu || isItelOrLowEnd);
};

const getOptimizedVideoConstraints = (isVideo: boolean) => {
  if (!isVideo) return false;
  const lowEnd = isLowEndDevice();
  
  if (lowEnd) {
    return {
      width: { min: 320, ideal: 480, max: 640 },
      height: { min: 240, ideal: 360, max: 480 },
      frameRate: { min: 10, ideal: 15, max: 20 },
      facingMode: "user",
      aspectRatio: 4 / 3,
    };
  } else {
    return {
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: "user",
    };
  }
};

const getOptimizedAudioConstraints = () => {
  const lowEnd = isLowEndDevice();
  if (lowEnd) {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1,
      echoCancellationType: "system",
      latency: 0.01,
      volume: 1.0,
    };
  } else {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      echoCancellationType: "system",
      latency: 0.01,
      volume: 1.0,
    };
  }
};

export const GlobalCallProvider = ({ children }: { children: React.ReactNode }) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const [connectionState, setConnectionState] = useState<ConnectionState>("new");
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [currentChatUser, setCurrentChatUser] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const callStateRef = useRef<CallState>("idle");
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const otherUserIdRef = useRef<string | null>(null);

  const { socket, isConnected } = useSocket();
  const { user, chats } = useSelector((state: RootState) => ({
    user: state.auth.user,
    chats: state.chat.chats,
  }));

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: [
          "turn:jb-turn1.xirsys.com:80?transport=udp",
          "turn:jb-turn1.xirsys.com:3478?transport=udp",
          "turn:jb-turn1.xirsys.com:80?transport=tcp",
          "turn:jb-turn1.xirsys.com:3478?transport=tcp",
          "turns:jb-turn1.xirsys.com:443?transport=tcp",
          "turns:jb-turn1.xirsys.com:5349?transport=tcp",
        ],
        username: "-vkE_HbUPxWY81OqkAwG7uEpErSNCRqPTX7nP6JyC8jwqzmrmSjtljr7ugCfPoayAAAAAGiBFnxxYXl5dW0=",
        credential: "515cb5a6-67e7-11f0-b95a-0242ac120004",
      },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle" as RTCBundlePolicy,
    rtcpMuxPolicy: "require" as RTCRtcpMuxPolicy,
    iceTransportPolicy: "all" as RTCIceTransportPolicy,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  }, []);

  const cleanup = useCallback(() => {
    console.log("🧹 Cleaning up call resources...");

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped local track:", track.kind);
      });
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped remote track:", track.kind);
      });
      setRemoteStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    stopCallTimer();
    currentCallIdRef.current = null;
    reconnectAttemptsRef.current = 0;
    iceCandidateQueue.current = [];
    otherUserIdRef.current = null;

    setCallState("idle");
    setConnectionState("new");
    setCallError(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsRemoteAudioMuted(false);
    setIsCallMinimized(false);
    setIncomingCall(null);
    setCurrentChatUser(null);
  }, [localStream, remoteStream, stopCallTimer]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.log("🔌 Closing existing peer connection");
      peerConnectionRef.current.close();
    }

    console.log("🔌 Creating new RTCPeerConnection");
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📤 ICE candidate:", event.candidate.type, event.candidate.protocol);
        if (socket && otherUserIdRef.current && currentCallIdRef.current) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: otherUserIdRef.current,
            callId: currentCallIdRef.current,
          });
        }
      } else {
        console.log("✅ ICE gathering complete");
      }
    };

    pc.ontrack = (event) => {
      console.log("📥 ===== ONTRACK FIRED =====");
      console.log("📥 Track kind:", event.track.kind);

      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log("📥 Stream ID:", stream.id);
        setRemoteStream(stream);

        if (remoteVideoRef.current) {
          console.log("📹 Setting remote video stream");
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.volume = 0;
          remoteVideoRef.current.playsInline = true;
          remoteVideoRef.current.autoplay = true;
          remoteVideoRef.current.controls = false;

          remoteVideoRef.current.setAttribute("playsinline", "true");
          remoteVideoRef.current.setAttribute("webkit-playsinline", "true");

          const attemptPlay = () => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play()
                .then(() => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.volume = 0;
                    remoteVideoRef.current.muted = true;
                  }
                  console.log("✅ Remote video playing");
                })
                .catch((err) => console.error("❌ Remote video play failed:", err));
            }
          };

          attemptPlay();
          [100, 300, 500, 1000, 2000].forEach((delay) => {
            setTimeout(attemptPlay, delay);
          });
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("🔗 Connection state:", state);
      setConnectionState(state as ConnectionState);

      if (state === "connected") {
        console.log("✅ PEER CONNECTION CONNECTED");
        setCallState("connected");
        setCallError(null);
        reconnectAttemptsRef.current = 0;
        if (callStartTimeRef.current === null) {
          startCallTimer();
        }
        toast.success("Call connected");
      } else if (state === "disconnected") {
        setCallError("Connection interrupted. Reconnecting...");
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (pc.connectionState === "disconnected") {
              console.log("🔄 Attempting ICE restart...");
              pc.restartIce();
            }
          }, 2000);
        }
      } else if (state === "failed") {
        console.error("❌ Connection failed");
        setCallError("Connection failed");
        endCall();
      }
    };

    return pc;
  }, [socket, startCallTimer]);

  const startCall = useCallback(async (userId: string, isVideo: boolean = false) => {
    console.log("📞 ===== STARTING CALL =====");
    console.log("📞 Video:", isVideo, "To:", userId);

    if (!socket || !user) {
      toast.error("Cannot start call");
      return;
    }

    if (!isConnected) {
      toast.error("Not connected to server");
      return;
    }

    // Find user info
    let userData: any = null;
    for (const chat of chats) {
      const participant = chat.participants?.find((p: any) => p._id === userId);
      if (participant) {
        userData = {
          _id: participant._id,
          name: participant.username || "Unknown",
          avatar: participant.avatar || "",
        };
        break;
      }
    }

    if (!userData) {
      toast.error("User not found");
      return;
    }

    try {
      setCallError(null);
      setCallState("calling");
      setIsVideoCall(isVideo);
      setCurrentChatUser(userData);
      otherUserIdRef.current = userId;

      const callId = `${user._id}-${userId}-${Date.now()}`;
      currentCallIdRef.current = callId;

      console.log("🎤 Requesting user media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getOptimizedAudioConstraints(),
        video: getOptimizedVideoConstraints(isVideo),
      });

      console.log("✅ Got local media stream");
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.play().catch((err) => console.error("Local video play failed:", err));
      }

      const pc = initializePeerConnection();
      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track to PC:", track.kind);
        pc.addTrack(track, stream);
      });

      console.log("📤 Sending call_request");
      socket.emit("call_request", { to: userId, isVideo, callId });

      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("📝 Creating offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });

      await pc.setLocalDescription(offer);
      console.log("✅ Local description set");

      socket.emit("offer", { sdp: offer, to: userId, isVideo, callId });

      callTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === "calling" || callStateRef.current === "ringing") {
          setCallError("No answer");
          toast.error("No answer");
          socket.emit("call_timeout", { to: userId, callId });
          setTimeout(() => cleanup(), 2000);
        }
      }, 45000);
    } catch (error: any) {
      console.error("❌ Error starting call:", error);
      let message = "Failed to start call";

      if (error.name === "NotAllowedError") {
        message = "Camera/microphone permission denied";
      } else if (error.name === "NotFoundError") {
        message = "No camera or microphone found";
      } else if (error.name === "NotReadableError") {
        message = "Camera/microphone already in use";
      }

      setCallError(message);
      setCallState("failed");
      toast.error(message);
      setTimeout(() => cleanup(), 2000);
    }
  }, [socket, user, chats, isConnected, initializePeerConnection, cleanup]);

  const acceptCall = useCallback(async () => {
    console.log("✅ ===== ACCEPTING CALL =====");

    if (!incomingCall || !socket) {
      console.error("❌ Cannot accept - invalid state");
      return;
    }

    try {
      setCallState("connecting");
      setCallError("Requesting camera/microphone permission...");

      const callData = { ...incomingCall };
      setIncomingCall(null);
      setIsVideoCall(callData.isVideo);
      otherUserIdRef.current = callData.from;

      setCurrentChatUser({
        _id: callData.from,
        name: callData.callerName || "Unknown",
        avatar: callData.callerAvatar || "",
      });

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      console.log("🎤 Requesting user media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getOptimizedAudioConstraints(),
        video: getOptimizedVideoConstraints(callData.isVideo),
      });

      setCallError(null);
      console.log("✅ Got local media stream");
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.play().catch((err) => console.error("Local video play failed:", err));
      }

      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = initializePeerConnection();
      }

      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track to PC:", track.kind);
        pc.addTrack(track, stream);
      });

      if (!pc.remoteDescription) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!pc.remoteDescription) {
        console.error("❌ Still no remote description!");
        socket.emit("call_accept", { to: callData.from, callId: callData.callId });
        return;
      }

      console.log("📝 Creating answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      socket.emit("answer", { sdp: answer, to: callData.from, callId: callData.callId });
      socket.emit("call_accept", { to: callData.from, callId: callData.callId });
    } catch (error: any) {
      console.error("❌ Error accepting call:", error);
      let message = "Failed to accept call";

      if (error.name === "NotAllowedError") {
        message = "Camera/microphone permission denied";
      }

      setCallError(message);
      toast.error(message);

      if (incomingCall) {
        socket.emit("call_failed", { to: incomingCall.from, callId: incomingCall.callId });
      }

      cleanup();
    }
  }, [incomingCall, socket, initializePeerConnection, cleanup]);

  const declineCall = useCallback(() => {
    if (incomingCall && socket) {
      console.log("📞 Declining call from:", incomingCall.from);
      socket.emit("call_decline", { to: incomingCall.from, callId: incomingCall.callId });
      setIncomingCall(null);
      setCallState("idle");
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    }
  }, [incomingCall, socket]);

  const endCall = useCallback(() => {
    console.log("🔚 Ending call...");

    if (socket && otherUserIdRef.current && callStateRef.current !== "idle" && currentCallIdRef.current) {
      socket.emit("call_end", { to: otherUserIdRef.current, callId: currentCallIdRef.current });
    }

    cleanup();
    toast.success("Call ended");
  }, [socket, cleanup]);

  const toggleAudioMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideoMute = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleRemoteAudio = useCallback(() => {
    toast.error("Remote audio is automatically managed for echo prevention");
  }, []);

  const switchCallType = useCallback(async () => {
    if (!peerConnectionRef.current || callState !== "connected") return;

    try {
      const newIsVideo = !isVideoCall;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: newIsVideo,
        audio: true,
      });

      const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "video");

      if (newIsVideo && !sender) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionRef.current.addTrack(videoTrack, stream);
        }
      } else if (!newIsVideo && sender) {
        peerConnectionRef.current.removeTrack(sender);
      } else if (newIsVideo && sender) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoCall(newIsVideo);
    } catch (error) {
      console.error("Failed to switch call type:", error);
      setCallError("Failed to switch call type");
    }
  }, [callState, isVideoCall]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleCallRequest = (data: { from: string; isVideo: boolean; callId: string }) => {
      console.log("📞 Incoming call request:", data);

      // Find caller info
      let callerName = "Unknown";
      let callerAvatar = "";

      for (const chat of chats) {
        const participant = chat.participants?.find((p: any) => p._id === data.from);
        if (participant) {
          callerName = participant.username || "Unknown";
          callerAvatar = participant.avatar || "";
          break;
        }
      }

      otherUserIdRef.current = data.from;
      currentCallIdRef.current = data.callId;

      setIncomingCall({
        from: data.from,
        isVideo: data.isVideo,
        callId: data.callId,
        callerName,
        callerAvatar,
      });
      setCallState("ringing");
      setIsVideoCall(data.isVideo);

      initializePeerConnection();

      callTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Call timeout - auto declining");
        declineCall();
        toast.error("Missed call from " + callerName);
      }, 45000);
    };

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean; callId: string }) => {
      console.log("📥 RECEIVED OFFER");

      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = initializePeerConnection();
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        if (localStream) {
          const senders = pc.getSenders();
          localStream.getTracks().forEach((track) => {
            if (!senders.find((s) => s.track === track)) {
              pc.addTrack(track, localStream);
            }
          });

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("answer", { sdp: answer, to: data.from, callId: data.callId });
        }
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }

        setCallState("connected");
      } catch (err) {
        console.error("❌ Error setting answer:", err);
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        iceCandidateQueue.current.push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    };

    const handleCallAccept = (data: { from: string; callId: string }) => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setCallState("connecting");
    };

    const handleCallEnd = () => {
      cleanup();
      toast.success("Call ended");
    };

    const handleCallDecline = () => {
      cleanup();
      toast.error("Call declined");
    };

    const handleCallTimeout = () => {
      setCallError("No answer");
      toast.error("Call timeout");
      setTimeout(() => cleanup(), 2000);
    };

    const handleCallWaiting = (data: { message: string; status: string }) => {
      if (data.status === "offline") {
        setCallError("Calling... (user offline)");
      } else if (data.status === "online") {
        setCallError(null);
        setCallState("ringing");
      }
    };

    const handleCallDisconnected = (data: { from: string; callId: string; reason: string; status: string; duration: number }) => {
      console.log("🔌 Call disconnected:", data);
      if (data.status === "failed") {
        toast.error("Call failed - Connection lost");
        setCallError("Call failed - Connection lost");
      } else {
        toast.error(`Call ended - Connection lost (${formatDuration(data.duration)})`);
        setCallError(`Connection lost after ${formatDuration(data.duration)}`);
      }
      setTimeout(() => cleanup(), 2000);
    };

    socket.on("call_request", handleCallRequest);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call_accept", handleCallAccept);
    socket.on("call_end", handleCallEnd);
    socket.on("call_decline", handleCallDecline);
    socket.on("call_timeout", handleCallTimeout);
    socket.on("call_waiting", handleCallWaiting);
    socket.on("call_disconnected", handleCallDisconnected);

    return () => {
      socket.off("call_request", handleCallRequest);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call_accept", handleCallAccept);
      socket.off("call_end", handleCallEnd);
      socket.off("call_decline", handleCallDecline);
      socket.off("call_timeout", handleCallTimeout);
      socket.off("call_waiting", handleCallWaiting);
      socket.off("call_disconnected", handleCallDisconnected);

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [socket, isConnected, user, chats, initializePeerConnection, declineCall, cleanup, localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <GlobalCallContext.Provider
      value={{
        callState,
        startCall,
        endCall,
      }}
    >
      {children}

      {/* Global Incoming Call Modal */}
      {incomingCall && currentChatUser && (
        <IncomingCallModal
          incomingCall={incomingCall}
          callState={callState}
          currentChat={currentChatUser}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Global Call Interface - Shows on any page */}
      {callState !== "idle" && currentChatUser && (
        <>
          <CallInterface
            callState={callState}
            connectionState={connectionState}
            isVideoCall={isVideoCall}
            callError={callError}
            callDuration={callDuration}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            isRemoteAudioMuted={isRemoteAudioMuted}
            isCallMinimized={isCallMinimized}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            currentChat={currentChatUser}
            onToggleAudioMute={toggleAudioMute}
            onToggleVideoMute={toggleVideoMute}
            onToggleRemoteAudio={toggleRemoteAudio}
            onSwitchCallType={switchCallType}
            onEndCall={endCall}
            onToggleMinimize={() => setIsCallMinimized(!isCallMinimized)}
            formatDuration={formatDuration}
          />

          {/* Mobile Debug Panel */}
          <MobileDebugPanel
            localStream={localStream}
            remoteStream={remoteStream}
            peerConnection={peerConnectionRef.current}
            callState={callState}
          />
        </>
      )}
    </GlobalCallContext.Provider>
  );
};