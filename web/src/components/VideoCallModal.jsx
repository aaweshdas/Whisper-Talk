import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocketStore } from "../lib/socket";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  PhoneOffIcon,
  PhoneIcon,
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
    activeCallType,
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

  // Centralized stream management
  useEffect(() => {
    const attachStream = async (videoElement, stream) => {
      if (!videoElement || !stream) return;
      videoElement.srcObject = stream;
      try {
        await videoElement.play();
      } catch (err) {
        console.warn("[webrtc] auto-play prevented:", err);
      }
    };

    if (localVideoRef.current) {
      attachStream(localVideoRef.current, localStream);
    }
    
    // We only attach the remote stream if we are fully connected
    if (remoteVideoRef.current && isConnected) {
      attachStream(remoteVideoRef.current, remoteStream);
    }
  }, [localStream, remoteStream, isConnected]);

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      }
    ],
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

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


  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      setRemoteStream((prevStream) => {
        const tracks = prevStream ? prevStream.getTracks() : [];
        if (!tracks.find((t) => t.id === event.track.id)) {
          tracks.push(event.track);
        }
        return new MediaStream(tracks);
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(targetUserId, event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      setConnectionStatus(pc.iceConnectionState);
    };

    return pc;
  }, [sendIceCandidate]);

  useEffect(() => {
    if (isCaller && !peerConnectionRef.current && !isStartingRef.current) {
      isStartingRef.current = true;
      startCall();
    }
  }, [isCaller]);

  const startCall = async () => {
    try {
      const isVideo = activeCallType === "video";
      const constraints = {
        video: isVideo ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsVideoOff(!isVideo);

      const pc = createPeerConnection(activeCallUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      initiateCall(activeCallUserId, offer, currentUser, activeCallType);
    } catch (err) {
      console.error("[webrtc] startCall error:", err);
      clearCallState();
    }
  };

  useEffect(() => {
    if (!remoteSignal || !peerConnectionRef.current) return;
    const applyAnswer = async () => {
      try {
        const pc = peerConnectionRef.current;
        if (pc.signalingState !== "have-local-offer") return;
        
        await pc.setRemoteDescription(new RTCSessionDescription(remoteSignal));
        remoteDescSetRef.current = true;
        await flushPendingCandidates();
      } catch (err) {
        console.error("[webrtc] setRemoteDescription error:", err);
      }
    };
    applyAnswer();
  }, [remoteSignal]);

  const handleAnswer = async () => {
    try {
      const isVideo = incomingCall.type === "video";
      const constraints = {
        video: isVideo ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsVideoOff(!isVideo);

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

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/80 backdrop-blur-md">
      
      {/* ── RINGING STATE ── */}
      {isRinging && incomingCall && (
        <div className="modal-content w-96 flex flex-col items-center text-center !p-10">
          <div className="relative mb-6">
            <div className="absolute inset-[-12px] rounded-full animate-ping opacity-20 bg-primary-500" />
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-medium text-slate-700 dark:text-slate-300 overflow-hidden border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative z-10 shadow-lg">
              {incomingCall.avatar ? (
                <img src={incomingCall.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                incomingCall.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">{incomingCall.name}</h2>
          <p className="text-sm mb-8 text-slate-500 dark:text-slate-400">
            Incoming {incomingCall.type === "voice" ? "voice" : "video"} call...
          </p>

          <div className="flex items-center gap-6">
            <button onClick={handleReject} className="btn-danger w-14 h-14 !rounded-full flex items-center justify-center shadow-lg">
              <PhoneOffIcon className="w-6 h-6" />
            </button>
            <button onClick={handleAnswer} className="btn-primary w-14 h-14 !bg-emerald-600 hover:!bg-emerald-700 !rounded-full flex items-center justify-center shadow-lg">
              <VideoIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ── CALLING STATE ── */}
      {isCaller && (
        <div className="modal-content w-96 flex flex-col items-center text-center !p-10">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center relative z-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
              {activeCallType === "voice" ? (
                <PhoneIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              ) : (
                <VideoIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <div className="absolute inset-[-16px] rounded-full border border-slate-300 dark:border-slate-600 animate-ping opacity-30" />
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Calling...</h2>
          <p className="text-sm mb-8 text-slate-500 dark:text-slate-400">
            Waiting for answer
          </p>

          {/* Small local preview */}
          {localStream && (
            <div className="w-48 h-32 rounded-xl overflow-hidden mb-8 relative border border-slate-200 dark:border-slate-800 shadow-sm bg-black">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            </div>
          )}

          <button onClick={handleHangup} className="btn-danger w-14 h-14 !rounded-full flex items-center justify-center shadow-lg">
            <PhoneOffIcon className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ── CONNECTED STATE ── */}
      {isConnected && (
        <div className="w-full h-full relative bg-slate-950" onClick={resetControlsTimer}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: remoteStream ? "block" : "none" }}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
              {remoteStream ? (
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6 border border-slate-700">
                  <PhoneIcon className="w-10 h-10 text-slate-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full mb-4 border-2 border-slate-700 border-t-primary-500 animate-spin" />
              )}
              <span className="text-slate-400 text-sm font-medium">{remoteStream ? "Voice Call" : "Connecting..."}</span>
            </div>
          )}

          {/* Header Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between"
            style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-white font-mono text-sm tracking-wider font-medium drop-shadow-md">
                {formatDuration(callDuration)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
              <MonitorIcon className="w-4 h-4 text-white/80" />
              <span className="text-white text-xs font-medium uppercase tracking-wide">Encrypted Call</span>
            </div>
          </div>

          {/* Local PiP */}
          {localStream && (
            <div className="absolute top-20 right-6 w-48 h-64 rounded-xl overflow-hidden z-10 transition-all duration-300 border-2 border-white/20 shadow-2xl bg-slate-900"
              style={{ opacity: showControls ? 1 : 0.6 }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                style={{ transform: "scaleX(-1)" }}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <VideoOffIcon className="w-8 h-8 text-slate-600" />
                </div>
              )}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-10 pt-20"
            style={{
              opacity: showControls ? 1 : 0,
              transform: showControls ? "translateY(0)" : "translateY(20px)",
              pointerEvents: showControls ? "auto" : "none"
            }}
          >
            <div className="flex items-center justify-center gap-4">
              <ControlBtn active={isMuted} icon={isMuted ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />} onClick={toggleMute} />
              {(activeCallType === "video" || incomingCall?.type === "video") && (
                <ControlBtn active={isVideoOff} icon={isVideoOff ? <VideoOffIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />} onClick={toggleVideo} />
              )}
              <button onClick={handleHangup} className="btn-danger w-14 h-14 !rounded-full flex items-center justify-center shadow-lg ml-2 hover:scale-105">
                <PhoneOffIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENDED STATE ── */}
      {isEnded && (
        <div className="modal-content w-80 flex flex-col items-center text-center !p-10">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 dark:text-slate-400">
            <PhoneOffIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Call Ended</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
            Duration: {formatDuration(callDuration)}
          </p>
        </div>
      )}
    </div>
  );
}

function ControlBtn({ active, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
        active
          ? "bg-white text-slate-900 hover:bg-slate-200"
          : "bg-slate-800/80 text-white border border-white/10 hover:bg-slate-700/80 backdrop-blur-md"
      }`}
    >
      {icon}
    </button>
  );
}
