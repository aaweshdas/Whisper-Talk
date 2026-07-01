import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocketStore } from "../lib/socket";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  PhoneOffIcon,
  VideoIcon,
  VideoOffIcon,
  MicIcon,
  MicOffIcon,
  MonitorIcon,
} from "lucide-react";

export function VideoCallModal() {
  const {
    callState,
    incomingCall,
    remoteSignal,
    activeCallUserId,
    iceCandidates,
    answerCall,
    rejectCall,
    endCall,
    sendIceCandidate,
    clearCallState,
    initiateCall,
  } = useSocketStore();

  const { data: currentUser } = useCurrentUser();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const localVideoRef = useRef(null);

  // Callback ref: sets srcObject every time a <video> element mounts/remounts
  const attachLocalVideo = useCallback((node) => {
    localVideoRef.current = node;
    if (node && localStream) {
      node.srcObject = localStream;
    }
  }, [localStream]);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const isStartingRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const durationTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);

  const isCaller = callState === "calling";
  const isRinging = callState === "ringing";
  const isConnected = callState === "connected";
  const isEnded = callState === "ended";

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // ── Format call duration ──────────────────────────────────────────────────
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Auto-hide controls after 4s ───────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  // ── Call duration timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (isConnected) {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      resetControlsTimer();
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isConnected]);

  // ── Flush pending ICE candidates after remote desc is set ─────────────────
  const flushPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteDescSetRef.current) return;
    const pending = pendingIceCandidatesRef.current.splice(0);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[webrtc] addIceCandidate (flush) error:", err);
      }
    }
  }, []);

  // ── Clean up ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setConnectionStatus("idle");
    setCallDuration(0);
    isStartingRef.current = false;
    remoteDescSetRef.current = false;
    pendingIceCandidatesRef.current = [];
  }, [localStream]);

  useEffect(() => {
    if (callState === "idle" || callState === "ended") {
      cleanup();
      setIsMuted(false);
      setIsVideoOff(false);
    }
  }, [callState]);

  // Local stream attachment is handled by the attachLocalVideo callback ref

  // ── Attach remote stream ──────────────────────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Create shared peer connection ─────────────────────────────────────────
  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      console.log("[webrtc] ontrack fired", event.streams);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(targetUserId, event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] ICE state:", pc.iceConnectionState);
      setConnectionStatus(pc.iceConnectionState);
    };

    return pc;
  }, [sendIceCandidate]);

  // ── CALLER: start call when state = "calling" ─────────────────────────────
  useEffect(() => {
    if (isCaller && !peerConnectionRef.current && !isStartingRef.current) {
      isStartingRef.current = true;
      startCall();
    }
  }, [isCaller]);

  const startCall = async () => {
    try {
      // Always request both video + audio
      const constraints = {
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      const pc = createPeerConnection(activeCallUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("[webrtc] created offer, emitting call-user");
      initiateCall(activeCallUserId, offer, currentUser);
    } catch (err) {
      console.error("[webrtc] startCall error:", err);
      clearCallState();
    }
  };

  // ── CALLER: handle answer from callee ─────────────────────────────────────
  useEffect(() => {
    if (!remoteSignal || !peerConnectionRef.current) return;
    const applyAnswer = async () => {
      try {
        const pc = peerConnectionRef.current;
        if (pc.signalingState !== "have-local-offer") {
          console.warn("[webrtc] unexpected signaling state:", pc.signalingState);
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(remoteSignal));
        remoteDescSetRef.current = true;
        await flushPendingCandidates();
      } catch (err) {
        console.error("[webrtc] setRemoteDescription error:", err);
      }
    };
    applyAnswer();
  }, [remoteSignal]);

  // ── CALLEE: answer the call ───────────────────────────────────────────────
  const handleAnswer = async () => {
    try {
      const constraints = {
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      remoteDescSetRef.current = true;
      await flushPendingCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      answerCall(incomingCall.from, answer);
    } catch (err) {
      console.error("[webrtc] handleAnswer error:", err);
      rejectCall(incomingCall?.from);
    }
  };

  const handleReject = () => rejectCall(incomingCall?.from);
  const handleHangup = () => endCall(activeCallUserId || incomingCall?.from);

  // ── ICE candidates: queue if remoteDesc not set yet ───────────────────────
  useEffect(() => {
    if (!peerConnectionRef.current || iceCandidates.length === 0) return;

    const processCandidates = async () => {
      const candidates = [...iceCandidates];
      useSocketStore.setState({ iceCandidates: [] });

      for (const candidate of candidates) {
        if (remoteDescSetRef.current && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("[webrtc] addIceCandidate error:", err);
          }
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      }
    };

    processCandidates();
  }, [iceCandidates]);

  // ── Media controls ────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0a0a1a 0%, #111128 50%, #0d0d22 100%)",
      }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* ── RINGING STATE ── */}
      {isRinging && incomingCall && (
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-300">
          {/* Glass card */}
          <div className="rounded-3xl p-10 flex flex-col items-center w-96"
            style={{
              background: "rgba(15, 15, 30, 0.85)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124, 58, 237, 0.1)",
            }}
          >
            {/* Pulsing ring animation */}
            <div className="relative mb-8">
              <div className="absolute inset-[-12px] rounded-full animate-ping opacity-30"
                style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.4), transparent)" }} />
              <div className="absolute inset-[-6px] rounded-full animate-pulse opacity-50"
                style={{ border: "2px solid rgba(124, 58, 237, 0.3)" }} />
              <img
                src={incomingCall.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.name)}&background=7c3aed&color=fff`}
                alt="avatar"
                className="w-28 h-28 rounded-full object-cover relative z-10"
                style={{ border: "3px solid rgba(124, 58, 237, 0.4)" }}
              />
            </div>

            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{incomingCall.name}</h2>
            <p className="text-sm mb-10" style={{ color: "rgba(167, 139, 250, 0.7)" }}>
              Incoming video call...
            </p>

            <div className="flex items-center gap-8">
              <button onClick={handleReject}
                className="group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 8px 30px rgba(239, 68, 68, 0.3)",
                }}
              >
                <PhoneOffIcon className="w-7 h-7 text-white" />
              </button>

              <button onClick={handleAnswer}
                className="group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  boxShadow: "0 8px 30px rgba(34, 197, 94, 0.3)",
                  animation: "bounce 1s infinite",
                }}
              >
                <VideoIcon className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CALLING STATE ── */}
      {isCaller && (
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="rounded-3xl p-10 flex flex-col items-center w-96"
            style={{
              background: "rgba(15, 15, 30, 0.85)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124, 58, 237, 0.1)",
            }}
          >
            <div className="relative mb-8">
              <div className="absolute inset-[-8px] rounded-full opacity-60"
                style={{
                  border: "2px solid rgba(124, 58, 237, 0.3)",
                  animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
              <div className="w-28 h-28 rounded-full flex items-center justify-center relative z-10"
                style={{
                  background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2))",
                  border: "2px solid rgba(124, 58, 237, 0.3)",
                }}
              >
                <VideoIcon className="w-10 h-10" style={{ color: "#a78bfa" }} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Calling...</h2>
            <p className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
              Waiting for answer
            </p>

            {/* Small local preview */}
            {localStream && (
              <div className="w-40 h-28 rounded-2xl overflow-hidden mb-8 relative"
                style={{ border: "2px solid rgba(124, 58, 237, 0.25)" }}
              >
                <video ref={attachLocalVideo} autoPlay playsInline muted
                  className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }}
                />
              </div>
            )}

            <button onClick={handleHangup}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 8px 30px rgba(239, 68, 68, 0.3)",
              }}
            >
              <PhoneOffIcon className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── CONNECTED STATE ── */}
      {isConnected && (
        <div className="w-full h-full relative"
          onClick={resetControlsTimer}
        >
          {/* Remote video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: remoteStream ? "block" : "none" }}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full mb-4"
                style={{
                  border: "3px solid rgba(124, 58, 237, 0.4)",
                  borderTopColor: "#7c3aed",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span className="text-white/50 text-sm">Connecting video...</span>
              <span className="text-white/20 text-xs mt-1">{connectionStatus}</span>
            </div>
          )}

          {/* Top bar: duration & status */}
          <div className="absolute top-0 left-0 right-0 z-20 transition-opacity duration-300"
            style={{
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}
                />
                <span className="text-white font-mono text-sm tracking-wider">
                  {formatDuration(callDuration)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
              >
                <MonitorIcon className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/60 text-xs">Video Call</span>
              </div>
            </div>
          </div>

          {/* PiP Local Video */}
          {localStream && (
            <div className="absolute top-6 right-6 w-44 h-60 rounded-2xl overflow-hidden z-10 transition-all duration-300"
              style={{
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                opacity: showControls ? 1 : 0.6,
              }}
            >
              <video
                ref={attachLocalVideo}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                style={{ transform: "scaleX(-1)" }}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: "rgba(15, 15, 30, 0.95)" }}
                >
                  <VideoOffIcon className="w-8 h-8" style={{ color: "rgba(255,255,255,0.25)" }} />
                </div>
              )}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-300"
            style={{
              opacity: showControls ? 1 : 0,
              transform: showControls ? "translateY(0)" : "translateY(20px)",
              pointerEvents: showControls ? "auto" : "none",
              background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          >
            <div className="flex items-center justify-center gap-5 pb-10 pt-16">
              {/* Mute */}
              <ControlBtn
                active={isMuted}
                icon={isMuted ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
                label={isMuted ? "Unmute" : "Mute"}
                onClick={toggleMute}
              />

              {/* Camera */}
              <ControlBtn
                active={isVideoOff}
                icon={isVideoOff ? <VideoOffIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                label={isVideoOff ? "Start Video" : "Stop Video"}
                onClick={toggleVideo}
              />

              {/* Hang Up */}
              <button onClick={handleHangup}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 mx-3"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 8px 30px rgba(239, 68, 68, 0.4)",
                }}
              >
                <PhoneOffIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENDED STATE ── */}
      {isEnded && (
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="rounded-3xl p-10 flex flex-col items-center w-80"
            style={{
              background: "rgba(15, 15, 30, 0.85)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <PhoneOffIcon className="w-8 h-8" style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Call Ended</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              {callDuration > 0 ? formatDuration(callDuration) : ""}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// ── Reusable control button ─────────────────────────────────────────────────
function ControlBtn({ active, icon, label, onClick }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className="w-13 h-13 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{
          width: "52px",
          height: "52px",
          background: active
            ? "rgba(239, 68, 68, 0.2)"
            : "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${active ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.15)"}`,
          color: active ? "#f87171" : "#ffffff",
        }}
      >
        {icon}
      </button>
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
    </div>
  );
}
