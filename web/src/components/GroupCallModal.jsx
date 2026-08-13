import { useEffect, useRef, useState, useCallback } from "react";
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneOffIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function GroupCallModal() {
  const { socket, currentCallChatId, leaveGroupCall, activeGroupCalls } = useSocketStore();
  const { data: currentUser } = useCurrentUser();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map()); // Map<peerId, RTCPeerConnection>
  
  const activeCall = currentCallChatId ? activeGroupCalls[currentCallChatId] : null;

  // Configuration for WebRTC
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const cleanup = useCallback(() => {
    // Stop local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    // Close all peer connections
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    setRemoteStreams({});
  }, [localStream]);

  // Main lifecycle: Setup local media and initialize mesh
  useEffect(() => {
    if (!currentCallChatId || !currentUser || !socket) return;

    let currentStream = null;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        currentStream = stream;
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // After getting local media, if we just joined, we need to connect to existing participants
        if (activeCall && activeCall.participants) {
          const peersToConnect = activeCall.participants.filter(p => p !== currentUser._id);
          peersToConnect.forEach(peerId => {
            if (!peersRef.current.has(peerId)) {
              createPeerConnection(peerId, stream, true);
            }
          });
        }
      } catch (err) {
        console.error("Failed to get local media", err);
        leaveGroupCall(currentCallChatId);
      }
    };

    initializeMedia();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentCallChatId, currentUser]);

  // Helper to create a new peer connection
  const createPeerConnection = async (peerId, stream, isInitiator) => {
    const pc = new RTCPeerConnection(configuration);
    peersRef.current.set(peerId, pc);

    // Add local tracks to the connection
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: event.streams[0]
      }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          targetPeerId: peerId,
          candidate: event.candidate,
          fromPeerId: currentUser._id
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
        pc.close();
        peersRef.current.delete(peerId);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", {
          targetPeerId: peerId,
          offer: offer,
          fromPeerId: currentUser._id
        });
      } catch (err) {
        console.error("Error creating offer", err);
      }
    }

    return pc;
  };

  // Listen to incoming WebRTC signaling
  useEffect(() => {
    if (!socket || !currentCallChatId || !currentUser || !localStream) return;

    const handleOffer = async ({ offer, fromPeerId }) => {
      let pc = peersRef.current.get(fromPeerId);
      if (!pc) {
        // We received an offer from someone new, create a PC for them (we are not the initiator)
        pc = await createPeerConnection(fromPeerId, localStream, false);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          targetPeerId: fromPeerId,
          answer: answer,
          fromPeerId: currentUser._id
        });
      } catch (err) {
        console.error("Error handling offer", err);
      }
    };

    const handleAnswer = async ({ answer, fromPeerId }) => {
      const pc = peersRef.current.get(fromPeerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("Error setting remote description from answer", err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate, fromPeerId }) => {
      const pc = peersRef.current.get(fromPeerId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ice candidate", err);
        }
      }
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
    };
  }, [socket, currentCallChatId, currentUser, localStream]);

  // If someone leaves the call, remove their stream
  useEffect(() => {
    if (!activeCall) return;
    
    // Find peers that are no longer in the activeCall.participants
    const currentPeerIds = Array.from(peersRef.current.keys());
    currentPeerIds.forEach(peerId => {
      if (!activeCall.participants.includes(peerId)) {
        const pc = peersRef.current.get(peerId);
        if (pc) {
          pc.close();
          peersRef.current.delete(peerId);
        }
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
      }
    });
  }, [activeCall]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
      setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
    }
  };

  const handleEndCall = () => {
    cleanup();
    leaveGroupCall(currentCallChatId);
  };

  if (!currentCallChatId) return null;

  // Calculate layout grid based on total streams (remote + 1 local)
  const totalParticipants = Object.keys(remoteStreams).length + 1;
  let gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
  if (totalParticipants === 1) gridCols = "grid-cols-1";
  else if (totalParticipants === 2) gridCols = "grid-cols-1 md:grid-cols-2";
  else if (totalParticipants <= 4) gridCols = "grid-cols-2 md:grid-cols-2 lg:grid-cols-2";
  else gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-50 flex flex-col p-4 sm:p-6">
      
      {/* Dynamic Video Grid */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden w-full max-w-7xl mx-auto">
        <div className={`w-full h-full grid gap-4 p-2 auto-rows-fr ${gridCols}`}>
          
          {/* Local Video */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? "opacity-0" : "opacity-100"}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                  You
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium border border-white/10 shadow-lg">
                You
              </div>
              {isMuted && (
                <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-lg text-white shadow-lg animate-pulse">
                  <MicOffIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([peerId, stream]) => (
            <RemoteVideo key={peerId} stream={stream} peerId={peerId} />
          ))}

        </div>
      </div>

      {/* Control Bar */}
      <div className="h-24 shrink-0 flex items-center justify-center gap-4 sm:gap-6 pt-4 pb-2">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${
            isMuted ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
          }`}
        >
          {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${
            isVideoOff ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
          }`}
        >
          {isVideoOff ? <VideoOffIcon className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
        </button>

        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 ml-4"
        >
          <PhoneOffIcon className="w-7 h-7" />
        </button>
      </div>

    </div>
  );
}

// Separate component for remote videos to manage their own refs securely
function RemoteVideo({ stream, peerId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing remote video:", e));
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium border border-white/10 shadow-lg">
        Participant
      </div>
    </div>
  );
}
