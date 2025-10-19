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

  // FIXED: Create audio element for remote audio ONLY
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      // audio.playsInline = true;
      remoteAudioRef.current = audio;
      document.body.appendChild(audio);
      console.log("🔊 Created dedicated audio element");
    }

    return () => {
      if (remoteAudioRef.current) {
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
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
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

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          "📤 ICE candidate:",
          event.candidate.type,
          event.candidate.protocol
        );
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

    // FIXED: Proper track handling with separate audio/video routing
    pc.ontrack = (event) => {
      console.log("📥 ===== ONTRACK FIRED =====");
      console.log("📥 Track kind:", event.track.kind);
      console.log("📥 Track ID:", event.track.id);
      console.log("📥 Track enabled:", event.track.enabled);
      console.log("📥 Track muted:", event.track.muted);
      console.log("📥 Track readyState:", event.track.readyState);
      console.log("📥 Streams count:", event.streams.length);

      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log("📥 Stream ID:", stream.id);

        setRemoteStream(stream);

        // CRITICAL: Route audio ONLY to audio element
        if (event.track.kind === "audio") {
          console.log("🔊 Setting AUDIO stream to audio element");
          if (remoteAudioRef.current) {
            // Create audio-only stream
            const audioStream = new MediaStream([event.track]);
            remoteAudioRef.current.srcObject = audioStream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;

            remoteAudioRef.current
              .play()
              .then(() => console.log("✅ Audio playing"))
              .catch((err) => {
                console.error("❌ Audio play failed:", err);
                const enableAudio = () => {
                  remoteAudioRef.current?.play();
                  document.removeEventListener("click", enableAudio);
                  document.removeEventListener("touchstart", enableAudio);
                };
                document.addEventListener("click", enableAudio, { once: true });
                document.addEventListener("touchstart", enableAudio, {
                  once: true,
                });
              });
          }
        }

        // CRITICAL: Route video ONLY to video element
        if (event.track.kind === "video") {
          console.log("📹 Setting VIDEO stream to video element");
          if (remoteVideoRef.current) {
            // FIXED: Create video-only stream (no audio track)
            const videoOnlyStream = new MediaStream([event.track]);

            // Clear existing srcObject first
            remoteVideoRef.current.srcObject = null;

            // Small delay to ensure clean slate
            setTimeout(() => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = videoOnlyStream;

                // CRITICAL: Video element MUST be muted (no audio)
                remoteVideoRef.current.muted = true;
                remoteVideoRef.current.volume = 0;
                remoteVideoRef.current.playsInline = true;
                remoteVideoRef.current.autoplay = true;
                remoteVideoRef.current.controls = false;

                // Mobile-specific attributes
                remoteVideoRef.current.setAttribute("playsinline", "true");
                remoteVideoRef.current.setAttribute("webkit-playsinline", "true");
                remoteVideoRef.current.setAttribute("x5-playsinline", "true");
                remoteVideoRef.current.setAttribute("x5-video-player-type", "h5");
                remoteVideoRef.current.setAttribute("x5-video-player-fullscreen", "false");
                remoteVideoRef.current.setAttribute("x-webkit-airplay", "allow");

                // FIXED: Force display styles for Itel A16
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

                console.log("📹 Attempting video play...");

                const playPromise = remoteVideoRef.current.play();

                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log("✅ Video playing successfully");
                    })
                    .catch((err) => {
                      console.error("❌ Video play failed:", err);
                      // Retry on user interaction
                      const enableVideo = () => {
                        if (remoteVideoRef.current) {
                          remoteVideoRef.current.muted = true;
                          remoteVideoRef.current
                            .play()
                            .then(() =>
                              console.log("✅ Video playing after interaction")
                            )
                            .catch((e) => console.error("❌ Still failed:", e));
                        }
                        document.removeEventListener("click", enableVideo);
                        document.removeEventListener("touchstart", enableVideo);
                      };
                      document.addEventListener("click", enableVideo, {
                        once: true,
                      });
                      document.addEventListener("touchstart", enableVideo, {
                        once: true,
                      });
                    });
                }
              }
            }, 100);
          }
        }
      }
    };

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

  const startCall = useCallback(
    async (isVideo: boolean = false) => {
      console.log("📞 ===== STARTING CALL =====");

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

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
          video: isVideo
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
        });

        console.log("✅ Got media stream");

        setLocalStream(stream);
        
        // FIXED: Local video MUST be muted to prevent echo
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // CRITICAL: Prevent echo
          localVideoRef.current.volume = 0;
          localVideoRef.current.playsInline = true;
          localVideoRef.current.autoplay = true;

          localVideoRef.current.play().catch((err) => {
            console.error("Local video play failed:", err);
          });
        }

        console.log("🔌 Initializing peer connection...");
        const pc = initializePeerConnection();

        stream.getTracks().forEach((track) => {
          console.log("➕ Adding track to PC:", track.kind);
          pc.addTrack(track, stream);
        });

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

        await pc.setLocalDescription(offer);
        console.log("✅ Local description set");

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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: callData.isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });

      console.log("✅ Got media stream");

      setLocalStream(stream);
      
      // FIXED: Local video MUST be muted
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // CRITICAL: Prevent echo
        localVideoRef.current.volume = 0;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;

        localVideoRef.current.play().catch((err) => {
          console.error("Local video play failed:", err);
        });
      }

      let pc = peerConnectionRef.current;
      if (!pc) {
        console.log("⚠️ No PC, creating new one");
        pc = initializePeerConnection();
      }

      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track to PC:", track.kind);
        pc.addTrack(track, stream);
      });

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

      await pc.setLocalDescription(answer);
      console.log("✅ Local description set");

      // Process queued ICE candidates
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      socket.emit("answer", {
        sdp: answer,
        to: callData.from,
        callId: callData.callId,
      });

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
        localVideoRef.current.muted = true; // Keep muted
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
      console.log("📥 RECEIVED OFFER");

      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = initializePeerConnection();
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log("✅ Remote description set");

        if (localStream) {
          const senders = pc.getSenders();
          localStream.getTracks().forEach((track) => {
            if (!senders.find((s) => s.track === track)) {
              pc.addTrack(track, localStream);
            }
          });

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("answer", {
            sdp: answer,
            to: data.from,
            callId: data.callId,
          });
        }
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    const handleAnswer = async (data: {
      sdp: RTCSessionDescriptionInit;
      from: string;
    }) => {
      console.log("📥 RECEIVED ANSWER");

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error("❌ No PC for answer");
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log("✅ Remote description set");

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

    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) => {
      console.log("📥 ICE candidate from:", data.from);

      const pc = peerConnectionRef.current;
      if (!pc) {
        iceCandidateQueue.current.push(data.candidate);
        return;
      }

      if (!pc.remoteDescription) {
        iceCandidateQueue.current.push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    };

    const handleCallRequest = (data: {
      from: string;
      isVideo: boolean;
      callId: string;
    }) => {
      console.log("📞 RECEIVED CALL_REQUEST");

      if (callStateRef.current !== "idle") {
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
        declineCall();
        toast.error("Missed call");
      }, 45000);
    };

    const handleCallAccept = (data: { from: string; callId: string }) => {
      console.log("✅ RECEIVED CALL_ACCEPT");

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      setCallState("connecting");
    };

    const handleCallEnd = (data: { from: string }) => {
      console.log("🔚 RECEIVED CALL_END");
      cleanup();
      toast.success("Call ended");
    };

    const handleCallDecline = (data: { from: string }) => {
      console.log("❌ RECEIVED CALL_DECLINE");
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