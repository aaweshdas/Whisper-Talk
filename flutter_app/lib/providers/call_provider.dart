import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

enum CallStatus { idle, dialing, ringing, connected }

class CallState {
  final CallStatus status;
  final String? remoteUserId;
  final String? remoteUserName;
  final String? remoteUserAvatar;
  final bool isMuted;
  final bool isCameraOff;
  final bool isSpeakerOn;
  /// Stored when an incoming call arrives so CallScreen can answer it
  final Map<String, dynamic>? incomingSignal;

  const CallState({
    this.status = CallStatus.idle,
    this.remoteUserId,
    this.remoteUserName,
    this.remoteUserAvatar,
    this.isMuted = false,
    this.isCameraOff = false,
    this.isSpeakerOn = true,
    this.incomingSignal,
  });

  CallState copyWith({
    CallStatus? status,
    String? remoteUserId,
    String? remoteUserName,
    String? remoteUserAvatar,
    bool? isMuted,
    bool? isCameraOff,
    bool? isSpeakerOn,
    Map<String, dynamic>? incomingSignal,
  }) {
    return CallState(
      status: status ?? this.status,
      remoteUserId: remoteUserId ?? this.remoteUserId,
      remoteUserName: remoteUserName ?? this.remoteUserName,
      remoteUserAvatar: remoteUserAvatar ?? this.remoteUserAvatar,
      isMuted: isMuted ?? this.isMuted,
      isCameraOff: isCameraOff ?? this.isCameraOff,
      isSpeakerOn: isSpeakerOn ?? this.isSpeakerOn,
      incomingSignal: incomingSignal ?? this.incomingSignal,
    );
  }
}

class CallNotifier extends Notifier<CallState> {
  RTCPeerConnection? _peerConnection;
  MediaStream? localStream;
  MediaStream? remoteStream;

  // Callbacks to update renderers — set externally by the CallScreen
  void Function(MediaStream)? onLocalStream;
  void Function(MediaStream)? onRemoteStream;

  static const _iceServers = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
    ]
  };

  // Always request video + audio
  static const _mediaConstraints = {
    'audio': true,
    'video': {
      'facingMode': 'user',
      'width': {'ideal': 1280},
      'height': {'ideal': 720},
    }
  };

  @override
  CallState build() => const CallState();

  // ─── Outgoing call (always video+audio) ──────────────────────────────────
  Future<void> startCall({
    required String toUserId,
    required String toUserName,
    required String toUserAvatar,
    required String fromUserId,
    required String fromUserName,
    required String fromUserAvatar,
    required void Function(String userId, Map<String, dynamic> signal) onSignal,
    required void Function(Map<String, dynamic> candidate, String toId) onIceCandidate,
  }) async {
    state = state.copyWith(
      status: CallStatus.dialing,
      remoteUserId: toUserId,
      remoteUserName: toUserName,
      remoteUserAvatar: toUserAvatar,
    );

    await _setupMedia();
    await _createPeerConnection(
      toUserId: toUserId,
      onIceCandidate: onIceCandidate,
    );

    final offer = await _peerConnection!.createOffer();
    await _peerConnection!.setLocalDescription(offer);

    onSignal(toUserId, {
      'sdp': offer.sdp,
      'type': offer.type,
    });
  }

  // ─── Answer an incoming call (always video+audio) ─────────────────────────
  Future<void> answerCall({
    required String fromUserId,
    required Map<String, dynamic> signal,
    required void Function(Map<String, dynamic> signal, String toId) onAnswer,
    required void Function(Map<String, dynamic> candidate, String toId) onIceCandidate,
  }) async {
    await _setupMedia();
    await _createPeerConnection(
      toUserId: fromUserId,
      onIceCandidate: onIceCandidate,
    );

    final desc = RTCSessionDescription(signal['sdp'], signal['type']);
    await _peerConnection!.setRemoteDescription(desc);

    final answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);

    state = state.copyWith(status: CallStatus.connected);
    onAnswer({'sdp': answer.sdp, 'type': answer.type}, fromUserId);
  }

  // ─── Called when the other side accepted ──────────────────────────────────
  Future<void> handleCallAccepted(Map<String, dynamic> signal) async {
    state = state.copyWith(status: CallStatus.connected);
    final desc = RTCSessionDescription(signal['sdp'], signal['type']);
    await _peerConnection?.setRemoteDescription(desc);
  }

  // ─── Add remote ICE candidate ─────────────────────────────────────────────
  Future<void> addIceCandidate(Map<String, dynamic> candidate) async {
    try {
      final c = RTCIceCandidate(
        candidate['candidate'],
        candidate['sdpMid'],
        candidate['sdpMLineIndex'],
      );
      await _peerConnection?.addCandidate(c);
    } catch (_) {}
  }

  // ─── Incoming call state (ringing) ────────────────────────────────────────
  void setIncomingCall({
    required String fromUserId,
    required String fromUserName,
    required String fromUserAvatar,
    required Map<String, dynamic> signal,
  }) {
    if (state.status != CallStatus.idle) return; // busy
    state = state.copyWith(
      status: CallStatus.ringing,
      remoteUserId: fromUserId,
      remoteUserName: fromUserName,
      remoteUserAvatar: fromUserAvatar,
      incomingSignal: signal,
    );
  }

  // ─── End / reject call ────────────────────────────────────────────────────
  void endCall() {
    _peerConnection?.close();
    _peerConnection = null;
    localStream?.dispose();
    localStream = null;
    remoteStream?.dispose();
    remoteStream = null;
    state = const CallState();
  }

  // ─── Toggle mute ─────────────────────────────────────────────────────────
  void toggleMute() {
    final muted = !state.isMuted;
    localStream?.getAudioTracks().forEach((t) => t.enabled = !muted);
    state = state.copyWith(isMuted: muted);
  }

  // ─── Toggle speaker (loudspeaker ↔ earpiece) ──────────────────────────────
  void toggleSpeaker() {
    final speakerOn = !state.isSpeakerOn;
    Helper.setSpeakerphoneOn(speakerOn);
    state = state.copyWith(isSpeakerOn: speakerOn);
  }

  // ─── Toggle camera ────────────────────────────────────────────────────────
  void toggleCamera() {
    final off = !state.isCameraOff;
    localStream?.getVideoTracks().forEach((t) => t.enabled = !off);
    state = state.copyWith(isCameraOff: off);
  }

  void switchCamera() {
    final tracks = localStream?.getVideoTracks();
    if (tracks != null && tracks.isNotEmpty) {
      Helper.switchCamera(tracks.first);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────
  Future<void> _setupMedia() async {
    localStream = await navigator.mediaDevices.getUserMedia(_mediaConstraints);

    // Route audio to loudspeaker immediately (Android defaults to earpiece)
    await Helper.setSpeakerphoneOn(true);

    onLocalStream?.call(localStream!);
  }

  Future<void> _createPeerConnection({
    required String toUserId,
    required void Function(Map<String, dynamic> candidate, String toId) onIceCandidate,
  }) async {
    _peerConnection = await createPeerConnection(_iceServers);

    localStream?.getTracks().forEach((track) {
      _peerConnection!.addTrack(track, localStream!);
    });

    _peerConnection!.onIceCandidate = (candidate) {
      if (candidate.candidate != null) {
        onIceCandidate({
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        }, toUserId);
      }
    };

    _peerConnection!.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        remoteStream = event.streams.first;
        onRemoteStream?.call(remoteStream!);
      }
    };

    _peerConnection!.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
          state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
        endCall();
      }
    };
  }
}

final callProvider = NotifierProvider<CallNotifier, CallState>(CallNotifier.new);
