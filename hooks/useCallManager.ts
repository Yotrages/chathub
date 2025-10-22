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

  const isLowEndDevice = () => {
  const memory = (navigator as any).deviceMemory; // GB
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  
  console.log("🔍 Device Detection:", {
    memory: memory || "unknown",
    cores: hardwareConcurrency,
    isMobile,
    userAgent: navigator.userAgent,
  });
  
  // Consider low-end if:
  // - Less than 2GB RAM OR
  // - Less than 4 CPU cores OR
  // - Specific low-end device detected
  const isLowRam = memory && memory < 2;
  const isLowCpu = hardwareConcurrency < 4;
  const isItelOrLowEnd = /Itel|Symphony|Infinix|Tecno/i.test(navigator.userAgent);
  
  const isLowEnd = isMobile && (isLowRam || isLowCpu || isItelOrLowEnd);
  
  console.log(`📱 Device classified as: ${isLowEnd ? "LOW-END" : "HIGH-END"}`);
  
  return isLowEnd;
};

// ===== OPTIMIZED VIDEO CONSTRAINTS =====
const getOptimizedVideoConstraints = (isVideo: boolean) => {
  if (!isVideo) return false;
  
  const lowEnd = isLowEndDevice();
  
  if (lowEnd) {
    console.log("📱 Using LOW-END device settings (optimized for 1GB RAM)");
    return {
      width: { min: 320, ideal: 480, max: 640 },
      height: { min: 240, ideal: 360, max: 480 },
      frameRate: { min: 10, ideal: 15, max: 20 },
      facingMode: "user",
      aspectRatio: 4/3,
    };
  } else {
    console.log("💻 Using HIGH-END device settings");
    return {
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: "user",
    };
  }
};

// ===== STORAGE CHECK =====
const checkStorageSpace = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage || 0) / (1024 * 1024);
      const totalMB = (estimate.quota || 0) / (1024 * 1024);
      const freeMB = totalMB - usedMB;
      
      console.log("💾 Storage Info:", {
        used: `${usedMB.toFixed(0)}MB`,
        total: `${totalMB.toFixed(0)}MB`,
        free: `${freeMB.toFixed(0)}MB`,
      });
      
      if (freeMB < 200) {
        console.warn("⚠️ WARNING: Low storage space! Video calls may fail.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Could not estimate storage:", error);
      return true; // Assume OK if can't check
    }
  }
  
  return true; // Assume OK if API not supported
};

// ===== MEMORY PRESSURE DETECTION =====
const checkMemoryPressure = () => {
  const memory = (performance as any).memory;
  
  if (memory) {
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const percentUsed = (usedMB / limitMB) * 100;
    
    console.log("🧠 Memory Usage:", {
      used: `${usedMB.toFixed(0)}MB`,
      limit: `${limitMB.toFixed(0)}MB`,
      percent: `${percentUsed.toFixed(1)}%`,
    });
    
    if (percentUsed > 80) {
      console.warn("⚠️ WARNING: High memory pressure! Recommend closing other apps.");
      return false;
    }
  }
  
  return true;
};

// ===== OPTIMIZED AUDIO CONSTRAINTS (Lower bandwidth) =====
const getOptimizedAudioConstraints = () => {
  const lowEnd = isLowEndDevice();
  
  if (lowEnd) {
    console.log("🔊 Using LOW-END audio settings");
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000, // Lower sample rate (was 48000)
      channelCount: 1,    // Mono (was default 2/stereo)
    };
  } else {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
    };
  }
};

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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
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
  
  // 🔴 CRITICAL: Track streams separately
  const remoteAudioStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoStreamRef = useRef<MediaStream | null>(null);

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

  // 🔴 CRITICAL FIX: Create audio element WITHOUT any video properties
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.muted = false; // MUST be false for audio
      audio.volume = 1.0;
      document.body.appendChild(audio);
      console.log("🔊 Created dedicated audio element for remote audio ONLY");
    }

    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

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
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
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

    if (remoteAudioStreamRef.current) {
      remoteAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteAudioStreamRef.current = null;
    }

    if (remoteVideoStreamRef.current) {
      remoteVideoStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteVideoStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.pause();
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }

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

  // ===== ICE CANDIDATE HANDLER =====
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("📤 ICE candidate:", event.candidate.type, event.candidate.protocol);
      if (socket && otherUserId.current && currentCallIdRef.current) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: otherUserId.current,
          callId: currentCallIdRef.current,
        });
      }
    } else {
      console.log("✅ ICE gathering complete");
    }
  };

  // ===== 🔴 CRITICAL: TRACK HANDLER (FIXED) =====
  pc.ontrack = (event) => {
    console.log("📥 ===== ONTRACK FIRED =====");
    console.log("📥 Track kind:", event.track.kind);
    console.log("📥 Track ID:", event.track.id);
    console.log("📥 Track label:", event.track.label);
    console.log("📥 Track enabled:", event.track.enabled);
    console.log("📥 Track muted:", event.track.muted);
    console.log("📥 Track readyState:", event.track.readyState);
    console.log("📥 Event streams count:", event.streams.length);

    // Store complete remote stream
    if (event.streams && event.streams[0]) {
      const stream = event.streams[0];
      console.log("📥 Stream ID:", stream.id);
      console.log("📥 Stream tracks:", {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length,
      });
      setRemoteStream(stream);
    }

    // 🔴 CRITICAL: Handle AUDIO track
    if (event.track.kind === "audio") {
      console.log("🔊 ===== AUDIO TRACK RECEIVED =====");

      // Create audio-only stream
      const audioOnlyStream = new MediaStream([event.track]);
      remoteAudioStreamRef.current = audioOnlyStream;

      console.log("🔊 Audio stream created:", {
        streamId: audioOnlyStream.id,
        audioTracks: audioOnlyStream.getAudioTracks().length,
        videoTracks: audioOnlyStream.getVideoTracks().length,
      });

      // 🔴 CRITICAL: Ensure audio element exists
      if (!remoteAudioRef.current) {
        console.error("❌ Audio element missing! Creating now...");
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.muted = false;
        audio.volume = 1.0;
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;
        console.log("✅ Audio element created");
      }

      console.log("🔊 Setting audio stream to audio element");
      remoteAudioRef.current.srcObject = audioOnlyStream;
      remoteAudioRef.current.muted = false; // MUST be false
      remoteAudioRef.current.volume = 1.0;

      console.log("🔊 Audio element configured:", {
        srcObject: !!remoteAudioRef.current.srcObject,
        muted: remoteAudioRef.current.muted,
        volume: remoteAudioRef.current.volume,
      });

      // 🔴 CRITICAL: Force play
      console.log("🔊 Attempting to play audio...");
      const playPromise = remoteAudioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("✅✅✅ AUDIO IS PLAYING!");
            console.log("🔊 Audio state:", {
              paused: remoteAudioRef.current?.paused,
              currentTime: remoteAudioRef.current?.currentTime,
              volume: remoteAudioRef.current?.volume,
            });

            // Monitor audio continuously
            const monitorAudio = setInterval(() => {
              if (remoteAudioRef.current) {
                // Auto-resume if paused
                if (remoteAudioRef.current.paused) {
                  console.warn("⚠️ Audio paused! Resuming...");
                  remoteAudioRef.current.play();
                }
              } else {
                clearInterval(monitorAudio);
              }
            }, 2000);
          })
          .catch((err) => {
            console.error("❌ Audio play failed:", err.name, err.message);

            if (err.name === "NotAllowedError") {
              console.log("🔧 User interaction needed for audio");
              
              // Setup interaction listener
              const enableAudio = () => {
                console.log("👆 Playing audio after interaction");
                remoteAudioRef.current?.play()
                  .then(() => console.log("✅ Audio now playing"))
                  .catch(e => console.error("❌ Still failed:", e));
                document.removeEventListener("click", enableAudio);
                document.removeEventListener("touchstart", enableAudio);
              };

              document.addEventListener("click", enableAudio, { once: true });
              document.addEventListener("touchstart", enableAudio, { once: true });
              
              toast("Tap screen to enable audio", { icon: "🔊" });
            }
          });
      }

      // Monitor track state
      event.track.onended = () => console.warn("⚠️ Audio track ended");
      event.track.onmute = () => console.warn("⚠️ Audio track muted");
      event.track.onunmute = () => console.log("✅ Audio track unmuted");
    }

    // 🔴 CRITICAL: Handle VIDEO track
    if (event.track.kind === "video") {
      console.log("📹 ===== VIDEO TRACK RECEIVED =====");

      // Create video-only stream
      const videoOnlyStream = new MediaStream([event.track]);
      remoteVideoStreamRef.current = videoOnlyStream;

      console.log("📹 Video stream created:", {
        streamId: videoOnlyStream.id,
        audioTracks: videoOnlyStream.getAudioTracks().length,
        videoTracks: videoOnlyStream.getVideoTracks().length,
      });

      if (!remoteVideoRef.current) {
        console.error("❌ Video element missing!");
        return;
      }

      console.log("📹 Setting video stream to video element");

      // Clear existing
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();

      // Set new stream with delay
      setTimeout(() => {
        if (remoteVideoRef.current && videoOnlyStream) {
          remoteVideoRef.current.srcObject = videoOnlyStream;

          // 🔴 CRITICAL: Video MUST be muted (audio from separate element)
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.volume = 0;
          remoteVideoRef.current.autoplay = true;
          remoteVideoRef.current.playsInline = true;

          // Mobile attributes
          remoteVideoRef.current.setAttribute("playsinline", "true");
          remoteVideoRef.current.setAttribute("webkit-playsinline", "true");
          remoteVideoRef.current.setAttribute("x5-playsinline", "true");
          remoteVideoRef.current.setAttribute("x5-video-player-type", "h5");
          remoteVideoRef.current.setAttribute("x5-video-player-fullscreen", "false");

          console.log("📹 Video element configured");

          // Force play
          const playPromise = remoteVideoRef.current.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("✅✅✅ VIDEO IS PLAYING!");
                console.log("📹 Video state:", {
                  paused: remoteVideoRef.current?.paused,
                  videoWidth: remoteVideoRef.current?.videoWidth,
                  videoHeight: remoteVideoRef.current?.videoHeight,
                });
              })
              .catch((err) => {
                console.error("❌ Video play failed:", err.name);

                // Setup interaction listener
                const enableVideo = () => {
                  console.log("👆 Playing video after interaction");
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.muted = true;
                    remoteVideoRef.current.play()
                      .then(() => console.log("✅ Video now playing"))
                      .catch(e => console.error("❌ Still failed:", e));
                  }
                  document.removeEventListener("click", enableVideo);
                  document.removeEventListener("touchstart", enableVideo);
                };

                document.addEventListener("click", enableVideo, { once: true });
                document.addEventListener("touchstart", enableVideo, { once: true });
              });
          }
        }
      }, 200);

      // Monitor track state
      event.track.onended = () => console.warn("⚠️ Video track ended");
      event.track.onmute = () => console.warn("⚠️ Video track muted");
      event.track.onunmute = () => console.log("✅ Video track unmuted");
    }
  };

  // ===== CONNECTION STATE HANDLERS =====
  pc.oniceconnectionstatechange = () => {
    console.log("🧊 ICE connection state:", pc.iceConnectionState);
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

      // Log all receivers
      const receivers = pc.getReceivers();
      console.log("📊 Active receivers:", receivers.length);
      receivers.forEach((receiver) => {
        if (receiver.track) {
          console.log(`📊 ${receiver.track.kind}:`, {
            enabled: receiver.track.enabled,
            readyState: receiver.track.readyState,
            muted: receiver.track.muted,
          });
        }
      });

      setCallState("connected");
      setCallError(null);
      reconnectAttemptsRef.current = 0;
      
      if (callStartTimeRef.current === null) {
        startCallTimer();
      }
      
      toast.success("Call connected");

      // 🔴 CRITICAL: Debug audio after connection
      setTimeout(() => {
        console.log("🔍 ===== POST-CONNECTION AUDIO CHECK =====");
        if (remoteAudioRef.current) {
          console.log("🔊 Audio element:", {
            exists: true,
            srcObject: !!remoteAudioRef.current.srcObject,
            muted: remoteAudioRef.current.muted,
            volume: remoteAudioRef.current.volume,
            paused: remoteAudioRef.current.paused,
          });

          const stream = remoteAudioRef.current.srcObject as MediaStream;
          if (stream) {
            console.log("🔊 Audio stream:", {
              active: stream.active,
              audioTracks: stream.getAudioTracks().length,
            });

            stream.getAudioTracks().forEach((track, idx) => {
              console.log(`🔊 Audio track ${idx}:`, {
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
              });
            });
          } else {
            console.error("❌ No audio stream!");
          }
        } else {
          console.error("❌ No audio element!");
        }
        console.log("🔍 ===== END AUDIO CHECK =====");
      }, 2000);

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
      // 🔴 CRITICAL: Check device capabilities
      const hasStorage = await checkStorageSpace();
      const hasMemory = checkMemoryPressure();
      
      if (!hasStorage) {
        toast.error("Low storage space! Free up at least 200MB and try again.");
        return;
      }
      
      if (!hasMemory) {
        toast("High memory usage. Close other apps for better performance.", {
          icon: "⚠️",
          duration: 5000,
        });
      }

      setCallError(null);
      setCallState("calling");
      setIsVideoCall(isVideo);

      const callId = `${user?._id}-${otherUserId.current}-${Date.now()}`;
      currentCallIdRef.current = callId;

      console.log("🎤 Requesting user media with optimized settings...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getOptimizedAudioConstraints(),
        video: getOptimizedVideoConstraints(isVideo),
      });

      console.log("✅ Got local media stream");
      console.log(
        "📊 Local stream tracks:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          settings: t.getSettings ? t.getSettings() : "N/A",
        }))
      );

      // Log actual video settings
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getSettings) {
        const settings = videoTrack.getSettings();
        console.log("📹 Actual video settings:", {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          aspectRatio: settings.aspectRatio,
        });
      }

      setLocalStream(stream);
      
      // Local video MUST be muted
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;

        localVideoRef.current.play().catch(err => {
          console.error("Local video play failed:", err);
        });
        
        console.log("✅ Local video configured (muted)");
      }

      console.log("🔌 Initializing peer connection...");
      const pc = initializePeerConnection();

      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track to PC:", track.kind, track.id);
        const sender = pc.addTrack(track, stream);
        console.log("✅ Track added, sender:", sender);
      });

      console.log(
        "📊 Peer connection senders:",
        pc.getSenders().map((s) => ({
          kind: s.track?.kind,
          id: s.track?.id,
          enabled: s.track?.enabled,
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

      console.log("📤 Sending offer to", otherUserId.current);
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
      } else if (error.name === "OverconstrainedError") {
        message = "Camera doesn't support requested resolution";
        console.error("OverconstrainedError details:", error.constraint);
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
    // 🔴 CRITICAL: Check device capabilities
    const hasStorage = await checkStorageSpace();
    const hasMemory = checkMemoryPressure();
    
    if (!hasStorage) {
      toast.error("Low storage space! Free up at least 200MB.");
      declineCall();
      return;
    }
    
    if (!hasMemory) {
      toast("High memory usage. Close other apps for better performance.", {
        icon: "⚠️",
        duration: 5000,
      });
    }

    setCallState("connecting");
    const callData = { ...incomingCall };
    setIncomingCall(null);
    setIsVideoCall(callData.isVideo);

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    console.log("🎤 Requesting user media with optimized settings...");

    // 🔴 USE OPTIMIZED CONSTRAINTS
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: getOptimizedAudioConstraints(),
      video: getOptimizedVideoConstraints(callData.isVideo),
    });

    console.log("✅ Got local media stream");
    console.log(
      "📊 Local stream tracks:",
      stream.getTracks().map((t) => ({
        kind: t.kind,
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.getSettings ? t.getSettings() : "N/A",
      }))
    );

    // Log actual video settings
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && videoTrack.getSettings) {
      const settings = videoTrack.getSettings();
      console.log("📹 Actual video settings:", {
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
        aspectRatio: settings.aspectRatio,
      });
    }

    setLocalStream(stream);
    
    // Local video MUST be muted
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
      localVideoRef.current.playsInline = true;
      localVideoRef.current.autoplay = true;
      
      localVideoRef.current.play().catch(err => {
        console.error("Local video play failed:", err);
      });
      
      console.log("✅ Local video configured (muted)");
    }

    let pc = peerConnectionRef.current;
    if (!pc) {
      console.log("⚠️ No PC, creating new one");
      pc = initializePeerConnection();
    }

    stream.getTracks().forEach((track) => {
      console.log("➕ Adding track to PC:", track.kind, track.id);
      const sender = pc.addTrack(track, stream);
      console.log("✅ Track added, sender:", sender);
    });

    console.log(
      "📊 Peer connection senders:",
      pc.getSenders().map((s) => ({
        kind: s.track?.kind,
        id: s.track?.id,
        enabled: s.track?.enabled,
      }))
    );

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
  } catch (error: any) {
    console.error("❌ Error accepting call:", error);
    let message = "Failed to accept call";
    
    if (error.name === "NotAllowedError") {
      message = "Camera/microphone permission denied";
    } else if (error.name === "NotFoundError") {
      message = "No camera or microphone found";
    } else if (error.name === "NotReadableError") {
      message = "Camera/microphone already in use";
    } else if (error.name === "OverconstrainedError") {
      message = "Camera doesn't support requested resolution";
      console.error("OverconstrainedError details:", error.constraint);
    }
    
    setCallError(message);
    toast.error(message);
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
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
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
      console.log('⏳ call_waiting:', data);
      if (data.status === 'offline') {
        setCallError('Calling... (user offline)');
      } else if (data.status === 'online') {
        setCallError(null);
        setCallState('ringing');
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

        if (localStream) {
          console.log("📝 Creating answer (have local stream)...");

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
    socket.on('call_waiting', handleCallWaiting);

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
      socket.off('call_waiting', handleCallWaiting);
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