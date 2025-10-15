import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { useSocket } from "@/context/socketContext";
import toast from "react-hot-toast";

type CallState =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed";
type ConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export const useCallManagement = (currentChat: any) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("new");
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    isVideo: boolean;
    callId: string;
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // CRITICAL: Separate audio element
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

  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state: RootState) => state.auth);

  const otherUserId = useRef<string | null>(null);

  useEffect(() => {
    if (currentChat?.type !== "group") {
      const other = currentChat?.participants?.find(
        (p: any) => p._id !== user?._id
      )?._id;
      otherUserId.current = other || null;
    } else {
      otherUserId.current = null;
    }
  }, [currentChat, user?._id]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Create audio element for remote audio
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      // audio.playsInline = true; // ADD THIS
      audio.muted = false;
      audio.volume = 1.0;
      remoteAudioRef.current = audio;
      document.body.appendChild(audio);
      console.log("🔊 Created dedicated audio element");
    }

    return () => {
      if (remoteAudioRef.current) {
        if (remoteAudioRef.current.srcObject) {
          const stream = remoteAudioRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
  if (!remoteAudioRef.current) return;

  const audio = remoteAudioRef.current;
  
  const handleAudioPlay = () => {
    console.log("🔊 Audio element playing");
  };
  
  const handleAudioPause = () => {
    console.warn("⚠️ Audio element paused");
    // Auto-resume if we have a stream
    if (audio.srcObject) {
      audio.play().catch(err => console.error("Audio resume failed:", err));
    }
  };
  
  const handleAudioError = (e: Event) => {
    console.error("❌ Audio element error:", e);
  };

  audio.addEventListener('play', handleAudioPlay);
  audio.addEventListener('pause', handleAudioPause);
  audio.addEventListener('error', handleAudioError);

  return () => {
    audio.removeEventListener('play', handleAudioPlay);
    audio.removeEventListener('pause', handleAudioPause);
    audio.removeEventListener('error', handleAudioError);
  };
}, []);

// useEffect(() => {
//   if (localVideoRef.current) {
//     console.log("🔍 Local video element check:", {
//       muted: localVideoRef.current.muted,
//       volume: localVideoRef.current.volume,
//       srcObject: !!localVideoRef.current.srcObject,
//     });
    
//     // Force settings every second (paranoid check)
//     const interval = setInterval(() => {
//       if (localVideoRef.current) {
//         localVideoRef.current.muted = true;
//         localVideoRef.current.volume = 0;
//       }
//     }, 1000);
    
//     return () => clearInterval(interval);
//   }
// }, [localVideoRef, localStream]);

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
        username:
          "-vkE_HbUPxWY81OqkAwG7uEpErSNCRqPTX7nP6JyC8jwqzmrmSjtljr7ugCfPoayAAAAAGiBFnxxYXl5dW0=",
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(
          Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        );
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

  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      track.stop();
      console.log("🛑 Stopped local track:", track.kind);
    });
    setLocalStream(null);
  }

  // Stop remote stream
  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => {
      track.stop();
      console.log("🛑 Stopped remote track:", track.kind);
    });
    setRemoteStream(null);
  }

  // Clean up peer connection
  if (peerConnectionRef.current) {
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
  }

  // Clean up video elements
  if (localVideoRef.current) {
    localVideoRef.current.srcObject = null;
    localVideoRef.current.load(); // Force clear
  }
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
    remoteVideoRef.current.load(); // Force clear
  }
  
  // CRITICAL: Clean up audio element
  if (remoteAudioRef.current) {
    if (remoteAudioRef.current.srcObject) {
      const stream = remoteAudioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    remoteAudioRef.current.srcObject = null;
    remoteAudioRef.current.pause();
    remoteAudioRef.current.load(); // Force clear
  }

  // Clear all timeouts and intervals
  if (callTimeoutRef.current) {
    clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = null;
  }

  stopCallTimer();
  currentCallIdRef.current = null;
  reconnectAttemptsRef.current = 0;
  iceCandidateQueue.current = [];

  setCallState("idle");
  setConnectionState("new");
  setCallError(null);
  setIsAudioMuted(false);
  setIsVideoMuted(false);
  setIsRemoteAudioMuted(false);
  setIsCallMinimized(false);
  setIncomingCall(null);
}, [localStream, remoteStream, stopCallTimer]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.log("🔌 Closing existing peer connection");
      peerConnectionRef.current.close();
    }

    console.log("🔌 Creating new RTCPeerConnection");
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Track separate streams for audio and video
    let remoteAudioStream: MediaStream | null = null;
    let remoteVideoStream: MediaStream | null = null;

    pc.ontrack = (event) => {
      console.log("📥 ===== ONTRACK FIRED =====");
      console.log("📥 Track kind:", event.track.kind);
      console.log("📥 Track ID:", event.track.id);
      console.log("📥 Track enabled:", event.track.enabled);
      console.log("📥 Track muted:", event.track.muted);
      console.log("📥 Track readyState:", event.track.readyState);

      // CRITICAL: Handle audio and video SEPARATELY
      if (event.track.kind === "audio") {
        console.log("🔊 ===== AUDIO TRACK RECEIVED =====");

        // Create NEW audio-only stream
        remoteAudioStream = new MediaStream([event.track]);

        console.log("🔊 Audio stream created:", {
          id: remoteAudioStream.id,
          tracks: remoteAudioStream.getAudioTracks().length,
          trackEnabled: event.track.enabled,
          trackMuted: event.track.muted,
        });

        // Set to dedicated audio element
        if (remoteAudioRef.current) {
          console.log("🔊 Setting audio stream to audio element");
          remoteAudioRef.current.srcObject = remoteAudioStream;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.muted = false; // MUST be false

          // CRITICAL: Force play immediately
          const playAudio = () => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current
                .play()
                .then(() => {
                  console.log("✅ Audio playing successfully");
                  console.log("🔊 Audio element state:", {
                    paused: remoteAudioRef.current!.paused,
                    muted: remoteAudioRef.current!.muted,
                    volume: remoteAudioRef.current!.volume,
                    readyState: remoteAudioRef.current!.readyState,
                  });
                })
                .catch((err) => {
                  console.error("❌ Audio play failed:", err);
                  // User interaction required
                  const enableAudio = () => {
                    console.log("👆 User clicked, enabling audio");
                    if (remoteAudioRef.current) {
                      remoteAudioRef.current.play();
                    }
                    document.removeEventListener("click", enableAudio);
                    document.removeEventListener("touchstart", enableAudio);
                  };
                  document.addEventListener("click", enableAudio, {
                    once: true,
                  });
                  document.addEventListener("touchstart", enableAudio, {
                    once: true,
                  });
                });
            }
          };

          // Try immediately
          playAudio();
        }
      }

      if (event.track.kind === "video") {
        console.log("📹 ===== VIDEO TRACK RECEIVED =====");

        // Create NEW video-only stream
        remoteVideoStream = new MediaStream([event.track]);

        console.log("📹 Video stream created:", {
          id: remoteVideoStream.id,
          tracks: remoteVideoStream.getVideoTracks().length,
          trackEnabled: event.track.enabled,
          trackMuted: event.track.muted,
          trackSettings: event.track.getSettings(),
        });

        // Set remoteStream for state management
        setRemoteStream(remoteVideoStream);

        // CRITICAL: Set to video element with proper configuration
        if (remoteVideoRef.current) {
          console.log("📹 Setting video stream to video element");

          // Clear any existing stream
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.load(); // Force reload

          // Small delay for browser to process
          setTimeout(() => {
            if (remoteVideoRef.current && remoteVideoStream) {
              remoteVideoRef.current.srcObject = remoteVideoStream;

              // CRITICAL: Video element MUST be muted (no audio output)
              remoteVideoRef.current.muted = true;
              remoteVideoRef.current.volume = 0;

              // CRITICAL: Mobile video attributes
              remoteVideoRef.current.playsInline = true;
              remoteVideoRef.current.autoplay = true;
              remoteVideoRef.current.controls = false;

              // Set all mobile attributes
              remoteVideoRef.current.setAttribute("playsinline", "true");
              remoteVideoRef.current.setAttribute("webkit-playsinline", "true");
              remoteVideoRef.current.setAttribute("x5-playsinline", "true");
              remoteVideoRef.current.setAttribute("x5-video-player-type", "h5");
              remoteVideoRef.current.setAttribute(
                "x5-video-player-fullscreen",
                "false"
              );
              remoteVideoRef.current.setAttribute("x-webkit-airplay", "allow");

              // CRITICAL: Force display styles (Itel A16)
              const video = remoteVideoRef.current;
              video.style.display = "block";
              video.style.visibility = "visible";
              video.style.opacity = "1";
              video.style.objectFit = "cover";
              video.style.width = "100%";
              video.style.height = "100%";
              video.style.position = "absolute";
              video.style.top = "0";
              video.style.left = "0";
              video.style.zIndex = "1";

              // Force hardware acceleration
              video.style.transform = "translate3d(0, 0, 0)";
              video.style.webkitTransform = "translate3d(0, 0, 0)";
              video.style.backfaceVisibility = "hidden";
              video.style.webkitBackfaceVisibility = "hidden";
              video.style.willChange = "transform";
              video.style.isolation = "isolate";

              console.log("📹 Video element configured, attempting play...");

              // CRITICAL: Aggressive play attempts for Itel A16
              const attemptPlay = (attempt: number = 0) => {
                if (!remoteVideoRef.current || attempt > 10) {
                  if (attempt > 10)
                    console.error("❌ Max play attempts reached");
                  return;
                }

                const video = remoteVideoRef.current;

                video
                  .play()
                  .then(() => {
                    console.log(`✅ Video playing on attempt ${attempt + 1}`);
                    console.log("📹 Video state:", {
                      paused: video.paused,
                      muted: video.muted,
                      videoWidth: video.videoWidth,
                      videoHeight: video.videoHeight,
                      readyState: video.readyState,
                      networkState: video.networkState,
                      currentTime: video.currentTime,
                    });

                    // Force a re-layout (Itel A16 fix)
                    if (video.parentElement) {
                      const parent = video.parentElement;
                      const display = parent.style.display;
                      parent.style.display = "none";
                      parent.offsetHeight; // Force reflow
                      parent.style.display = display || "block";
                    }
                  })
                  .catch((err) => {
                    console.warn(
                      `⚠️ Play attempt ${attempt + 1} failed:`,
                      err.message
                    );

                    // Retry with exponential backoff
                    if (attempt < 5) {
                      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
                      console.log(`🔄 Retrying in ${delay}ms...`);
                      setTimeout(() => attemptPlay(attempt + 1), delay);
                    } else {
                      // Final fallback: require user interaction
                      console.log(
                        "⚠️ Requiring user interaction for video playback"
                      );
                      const enableVideo = () => {
                        if (remoteVideoRef.current) {
                          console.log(
                            "👆 User interaction detected, playing video"
                          );
                          remoteVideoRef.current.muted = true; // Keep muted!
                          remoteVideoRef.current
                            .play()
                            .then(() =>
                              console.log("✅ Video playing after interaction")
                            )
                            .catch((e) => console.error("❌ Still failed:", e));
                        }
                        document.removeEventListener("click", enableVideo);
                        document.removeEventListener("touchstart", enableVideo);
                        document.removeEventListener("touchend", enableVideo);
                      };

                      document.addEventListener("click", enableVideo, {
                        once: true,
                      });
                      document.addEventListener("touchstart", enableVideo, {
                        once: true,
                      });
                      document.addEventListener("touchend", enableVideo, {
                        once: true,
                      });
                    }
                  });
              };

              // Start play attempts
              attemptPlay(0);
            }
          }, 150);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        console.log("✅ ICE connected!");
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("🧊 ICE gathering state:", pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log("📡 Signaling state:", pc.signalingState);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("🔗 Connection state:", state);
      setConnectionState(state as ConnectionState);

      if (state === "connected") {
        console.log("✅ ===== PEER CONNECTION CONNECTED =====");

        // Log all tracks
        const receivers = pc.getReceivers();
        console.log("📊 Active receivers:", receivers.length);
        receivers.forEach((receiver) => {
          if (receiver.track) {
            console.log(
              `  - ${receiver.track.kind}: enabled=${receiver.track.enabled}, readyState=${receiver.track.readyState}`
            );
          }
        });

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

  const startCall = useCallback(
    async (isVideo: boolean = false) => {
      console.log("📞 ===== STARTING CALL =====");
      console.log("📞 Video:", isVideo, "To:", otherUserId.current);

      if (!currentChat || !socket || !otherUserId.current) {
        toast.error("Cannot start call");
        return;
      }

      if (!isConnected) {
        toast.error("Not connected to server");
        return;
      }

      try {
        setCallError(null);
        setCallState("calling");
        setIsVideoCall(isVideo);

        const callId = `${user?._id}-${otherUserId.current}-${Date.now()}`;
        currentCallIdRef.current = callId;

        console.log("🎤 Requesting user media...");

        const audioConstraints = {
          echoCancellation: { exact: true, ideal: true },
          noiseSuppression: { exact: true, ideal: true },
          autoGainControl: { exact: true, ideal: true },
          sampleRate: { ideal: 48000 },
          sampleSize: { ideal: 16 },
          channelCount: { ideal: 1 }, // Mono for calls
          // latency: { ideal: 0.01 },
        };

        const videoConstraints = {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 30 },
          aspectRatio: { ideal: 16 / 9 },
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: isVideo ? videoConstraints : false,
        });

        console.log("✅ Got media stream");
        console.log(
          "📊 Local tracks:",
          stream.getTracks().map((t) => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            readyState: t.readyState,
            label: t.label,
          }))
        );

        setLocalStream(stream);

        // CRITICAL: Set local video with NO audio output
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // MUST be true
          localVideoRef.current.volume = 0; // MUST be 0
          localVideoRef.current.playsInline = true;
          localVideoRef.current.autoplay = true;

          // Force play
          localVideoRef.current.play().catch((err) => {
            console.error("Local video play failed:", err);
          });

          console.log("✅ Local video configured (muted, volume=0)");
        }

        console.log("🔌 Initializing peer connection...");
        const pc = initializePeerConnection();

        // Add transceivers for better control
        stream.getTracks().forEach((track) => {
          console.log("➕ Adding track to PC:", track.kind, track.id);
          const sender = pc.addTrack(track, stream);
          console.log("✅ Track added, sender:", sender);
        });

        // Log senders
        console.log(
          "📊 Peer connection senders:",
          pc.getSenders().map((s) => ({
            kind: s.track?.kind,
            id: s.track?.id,
          }))
        );

        console.log("📤 Sending call_request");
        socket.emit("call_request", {
          to: otherUserId.current,
          isVideo,
          callId,
        });

        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log("📝 Creating offer...");
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo,
        });

        console.log("📝 Setting local description...");
        await pc.setLocalDescription(offer);
        console.log("✅ Local description set:", pc.localDescription?.type);

        console.log("📤 Sending offer");
        socket.emit("offer", {
          sdp: offer,
          to: otherUserId.current,
          isVideo,
          callId,
        });

        callTimeoutRef.current = setTimeout(() => {
          if (
            callStateRef.current === "calling" ||
            callStateRef.current === "ringing"
          ) {
            setCallError("No answer");
            toast.error("No answer");
            socket.emit("call_timeout", { to: otherUserId.current, callId });
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
    },
    [
      currentChat,
      socket,
      isConnected,
      initializePeerConnection,
      cleanup,
      user?._id,
    ]
  );

  const acceptCall = useCallback(async () => {
    console.log("✅ ===== ACCEPTING CALL =====");

    if (!incomingCall || !socket) {
      console.error("❌ Cannot accept - invalid state");
      return;
    }

    try {
      setCallState("connecting");
      const callData = { ...incomingCall };
      setIncomingCall(null);
      setIsVideoCall(callData.isVideo);

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      console.log("🎤 Requesting user media...");

      const audioConstraints = {
          echoCancellation: { exact: true, ideal: true },
          noiseSuppression: { exact: true, ideal: true },
          autoGainControl: { exact: true, ideal: true },
          sampleRate: { ideal: 48000 },
          sampleSize: { ideal: 16 },
          channelCount: { ideal: 1 }, // Mono for calls
          // latency: { ideal: 0.01 },
        };

        const videoConstraints = {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 30 },
          aspectRatio: { ideal: 16 / 9 },
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: callData.isVideo ? videoConstraints : false,
        });

      console.log("✅ Got media stream");
      console.log(
        "📊 Local tracks:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          label: t.label,
        }))
      );

      setLocalStream(stream);

      // CRITICAL: Set local video with NO audio output
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // MUST be true
        localVideoRef.current.volume = 0; // MUST be 0
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;

        // Force play
        localVideoRef.current.play().catch((err) => {
          console.error("Local video play failed:", err);
        });

        console.log("✅ Local video configured (muted, volume=0)");
      }

      let pc = peerConnectionRef.current;
      if (!pc) {
        console.log("⚠️ No PC, creating new one");
        pc = initializePeerConnection();
      }

      // Add tracks
      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track to PC:", track.kind, track.id);
        const sender = pc.addTrack(track, stream);
        console.log("✅ Track added, sender:", sender);
      });

      // Log senders
      console.log(
        "📊 Peer connection senders:",
        pc.getSenders().map((s) => ({
          kind: s.track?.kind,
          id: s.track?.id,
        }))
      );

      // Wait for offer if not set
      if (!pc.remoteDescription) {
        console.log("⏳ Waiting for offer...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!pc.remoteDescription) {
        console.error("❌ Still no remote description!");
        socket.emit("call_accept", {
          to: callData.from,
          callId: callData.callId,
        });
        return;
      }

      console.log("📝 Creating answer...");
      const answer = await pc.createAnswer();

      console.log("📝 Setting local description...");
      await pc.setLocalDescription(answer);
      console.log("✅ Local description set:", pc.localDescription?.type);

      // Process queued ICE candidates
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        if (candidate) {
          console.log("🧊 Adding queued ICE candidate");
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      console.log("📤 Sending answer");
      socket.emit("answer", {
        sdp: answer,
        to: callData.from,
        callId: callData.callId,
      });

      console.log("📤 Sending call_accept");
      socket.emit("call_accept", {
        to: callData.from,
        callId: callData.callId,
      });
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      setCallError("Failed to accept call");
      toast.error("Failed to accept call");
      cleanup();
    }
  }, [incomingCall, socket, initializePeerConnection, cleanup]);

  const declineCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit("call_decline", {
        to: incomingCall.from,
        callId: incomingCall.callId,
      });
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

    if (
      socket &&
      otherUserId.current &&
      callStateRef.current !== "idle" &&
      currentCallIdRef.current
    ) {
      socket.emit("call_end", {
        to: otherUserId.current,
        callId: currentCallIdRef.current,
      });
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
        console.log("🎤 Microphone:", audioTrack.enabled ? "ON" : "OFF");
      }
    }
  }, [localStream]);

  const toggleVideoMute = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
        console.log("📹 Camera:", videoTrack.enabled ? "ON" : "OFF");
      }
    }
  }, [localStream]);

  const toggleRemoteAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsRemoteAudioMuted(remoteAudioRef.current.muted);
      console.log("🔊 Speaker:", remoteAudioRef.current.muted ? "OFF" : "ON");
    }
  }, []);

  const switchCallType = useCallback(async () => {
    if (!peerConnectionRef.current || callState !== "connected") return;

    try {
      const newIsVideo = !isVideoCall;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: newIsVideo,
        audio: true,
      });

      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

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
    if (!socket || !isConnected) return;

    console.log("🔌 Setting up socket handlers...");

    const handleCallError = (data: { error: string; reason?: string }) => {
      console.log("❌ call_error:", data);
      setCallError(data.error);
      toast.error(data.error);
    };

    const handleCallWaiting = (data: { message: string; status: string }) => {
      console.log("⏳ call_waiting:", data);
      if (data.status === "offline") {
        setCallError("Calling... (user offline)");
      } else if (data.status === "online") {
        setCallError(null);
        setCallState("ringing");
      }
    };

    const handleOffer = async (data: {
      sdp: RTCSessionDescriptionInit;
      from: string;
      isVideo: boolean;
      callId: string;
    }) => {
      console.log("📥 ===== RECEIVED OFFER =====");
      console.log("📥 From:", data.from, "CallID:", data.callId);

      let pc = peerConnectionRef.current;
      if (!pc) {
        console.log("⚠️ No PC, creating one");
        pc = initializePeerConnection();
      }

      try {
        console.log("📝 Setting remote description (offer)...");
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log("✅ Remote description set");
        console.log("📊 Remote description type:", pc.remoteDescription?.type);

        // If we have local stream (already accepted), create answer
        if (localStream) {
          console.log("📝 Creating answer (have local stream)...");

          // Ensure tracks are added
          const senders = pc.getSenders();
          localStream.getTracks().forEach((track) => {
            if (!senders.find((s) => s.track === track)) {
              console.log("➕ Adding track:", track.kind);
              pc.addTrack(track, localStream);
            }
          });

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("✅ Answer created and set");

          socket.emit("answer", {
            sdp: answer,
            to: data.from,
            callId: data.callId,
          });
          console.log("📤 Answer sent");
        }
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    const handleAnswer = async (data: {
      sdp: RTCSessionDescriptionInit;
      from: string;
    }) => {
      console.log("📥 ===== RECEIVED ANSWER =====");
      console.log("📥 From:", data.from);

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error("❌ No PC for answer");
        return;
      }

      try {
        console.log("📝 Setting remote description (answer)...");
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log("✅ Remote description set");
        console.log("📊 Remote description type:", pc.remoteDescription?.type);

        // Process queued ICE candidates
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          if (candidate) {
            console.log("🧊 Adding queued ICE candidate");
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }

        setCallState("connected");
      } catch (err) {
        console.error("❌ Error setting answer:", err);
      }
    };

    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) => {
      console.log("📥 ICE candidate from:", data.from);

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.log("⚠️ No PC, queuing");
        iceCandidateQueue.current.push(data.candidate);
        return;
      }

      if (!pc.remoteDescription) {
        console.log("⚠️ No remote desc, queuing");
        iceCandidateQueue.current.push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("✅ ICE candidate added");
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    };

    const handleCallRequest = (data: {
      from: string;
      isVideo: boolean;
      callId: string;
    }) => {
      console.log("📞 ===== RECEIVED CALL_REQUEST =====");
      console.log(
        "📞 From:",
        data.from,
        "Video:",
        data.isVideo,
        "CallID:",
        data.callId
      );

      if (callStateRef.current !== "idle") {
        console.log("⚠️ Already in call, ignoring");
        return;
      }

      otherUserId.current = data.from;
      currentCallIdRef.current = data.callId;

      setIncomingCall({
        from: data.from,
        isVideo: data.isVideo,
        callId: data.callId,
      });
      setCallState("ringing");
      setIsVideoCall(data.isVideo);

      // Initialize PC
      initializePeerConnection();

      callTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Auto-declining call");
        declineCall();
        toast.error("Missed call");
      }, 45000);
    };

    const handleCallAccept = (data: { from: string; callId: string }) => {
      console.log("✅ RECEIVED CALL_ACCEPT from:", data.from);

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      setCallState("connecting");
    };

    const handleCallEnd = (data: { from: string }) => {
      console.log("🔚 RECEIVED CALL_END from:", data.from);
      cleanup();
      toast.success("Call ended");
    };

    const handleCallDecline = (data: { from: string }) => {
      console.log("❌ RECEIVED CALL_DECLINE from:", data.from);
      cleanup();
      toast.error("Call declined");
    };

    const handleCallTimeout = (data: { callId: string }) => {
      console.log("⏰ RECEIVED CALL_TIMEOUT");
      setCallError("No answer");
      toast.error("Call timeout");
      setTimeout(() => cleanup(), 2000);
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call_request", handleCallRequest);
    socket.on("call_accept", handleCallAccept);
    socket.on("call_end", handleCallEnd);
    socket.on("call_decline", handleCallDecline);
    socket.on("call_error", handleCallError);
    socket.on("call_timeout", handleCallTimeout);
    socket.on("call_waiting", handleCallWaiting);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call_request", handleCallRequest);
      socket.off("call_accept", handleCallAccept);
      socket.off("call_end", handleCallEnd);
      socket.off("call_decline", handleCallDecline);
      socket.off("call_error", handleCallError);
      socket.off("call_timeout", handleCallTimeout);
      socket.off("call_waiting", handleCallWaiting);
    };
  }, [
    socket,
    isConnected,
    initializePeerConnection,
    declineCall,
    cleanup,
    localStream,
  ]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    callState,
    connectionState,
    isVideoCall,
    callError,
    callDuration,
    isAudioMuted,
    isVideoMuted,
    isRemoteAudioMuted,
    isCallMinimized,
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    peerConnectionRef,
    incomingCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudioMute,
    toggleVideoMute,
    toggleRemoteAudio,
    switchCallType,
    setIsCallMinimized,
    formatDuration,
  };
};
