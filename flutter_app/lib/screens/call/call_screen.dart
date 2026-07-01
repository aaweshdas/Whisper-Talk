import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/call_provider.dart';
import '../../providers/socket_provider.dart';

class CallScreen extends ConsumerStatefulWidget {
  const CallScreen({super.key});

  @override
  ConsumerState<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends ConsumerState<CallScreen>
    with SingleTickerProviderStateMixin {
  final _localRenderer = RTCVideoRenderer();
  final _remoteRenderer = RTCVideoRenderer();
  bool _renderersInitialized = false;
  int _callDuration = 0;
  Timer? _durationTimer;
  bool _showControls = true;
  Timer? _controlsTimer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _initRenderers();
  }

  Future<void> _initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
    if (mounted) setState(() => _renderersInitialized = true);

    final notifier = ref.read(callProvider.notifier);
    notifier.onLocalStream = (stream) {
      if (mounted) {
        setState(() => _localRenderer.srcObject = stream);
      }
    };
    notifier.onRemoteStream = (stream) {
      if (mounted) {
        setState(() => _remoteRenderer.srcObject = stream);
      }
    };

    // If a stream already exists (race condition), bind immediately
    if (notifier.localStream != null) {
      _localRenderer.srcObject = notifier.localStream;
    }
    if (notifier.remoteStream != null) {
      _remoteRenderer.srcObject = notifier.remoteStream;
    }

    // If this screen was opened from an incoming call, answer it now
    final callState = ref.read(callProvider);
    if (callState.status == CallStatus.ringing &&
        callState.incomingSignal != null &&
        callState.remoteUserId != null) {
      await notifier.answerCall(
        fromUserId: callState.remoteUserId!,
        signal: callState.incomingSignal!,
        onAnswer: (signal, toId) {
          ref.read(socketServiceProvider).answerCall(toId, signal);
        },
        onIceCandidate: (candidate, toId) {
          ref.read(socketServiceProvider).sendIceCandidate(toId, candidate);
        },
      );
    }
  }

  void _startDurationTimer() {
    _durationTimer?.cancel();
    _callDuration = 0;
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _callDuration++);
    });
    _resetControlsTimer();
  }

  void _resetControlsTimer() {
    _controlsTimer?.cancel();
    if (mounted) setState(() => _showControls = true);
    _controlsTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) setState(() => _showControls = false);
    });
  }

  String _formatDuration(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _controlsTimer?.cancel();
    _pulseController.dispose();
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    super.dispose();
  }

  void _hangUp() {
    final call = ref.read(callProvider);
    final remoteId = call.remoteUserId;
    if (remoteId != null) {
      ref.read(socketServiceProvider).endCall(remoteId);
    }
    ref.read(callProvider.notifier).endCall();
    Navigator.of(context).pop();
  }

  void _toggleMute() => ref.read(callProvider.notifier).toggleMute();
  void _toggleCamera() => ref.read(callProvider.notifier).toggleCamera();
  void _switchCamera() => ref.read(callProvider.notifier).switchCamera();
  void _toggleSpeaker() => ref.read(callProvider.notifier).toggleSpeaker();

  @override
  Widget build(BuildContext context) {
    final call = ref.watch(callProvider);
    final isConnected = call.status == CallStatus.connected;

    // Start timer when connected
    if (isConnected && _durationTimer == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _startDurationTimer());
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0a0a1a),
      body: GestureDetector(
        onTap: isConnected ? _resetControlsTimer : null,
        child: Stack(
          children: [
            // ── Ambient background gradient ─────────────────────────────────
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF0a0a1a), Color(0xFF111128), Color(0xFF0d0d22)],
                  ),
                ),
              ),
            ),

            // ── Ambient glow orbs ───────────────────────────────────────────
            Positioned(
              top: -80,
              left: -60,
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (_, __) => Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppTheme.primary.withOpacity(0.15 * _pulseController.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -100,
              right: -50,
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (_, __) => Container(
                  width: 240,
                  height: 240,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.blue.withOpacity(0.12 * _pulseController.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // ── Remote Video (full screen) ──────────────────────────────────
            if (_renderersInitialized && _remoteRenderer.srcObject != null)
              Positioned.fill(
                child: RTCVideoView(
                  _remoteRenderer,
                  objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                ),
              )
            else if (!isConnected)
              // ── Pre-connect state (calling/ringing) ─────────────────────
              Positioned.fill(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Avatar with pulse
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        AnimatedBuilder(
                          animation: _pulseController,
                          builder: (_, __) => Container(
                            width: 140 + 20 * _pulseController.value,
                            height: 140 + 20 * _pulseController.value,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.primary.withOpacity(0.2 * _pulseController.value),
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppTheme.primary.withOpacity(0.3),
                              width: 3,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.15),
                                blurRadius: 40,
                                spreadRadius: 10,
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 58,
                            backgroundColor: const Color(0xFF1a1a2e),
                            backgroundImage: (call.remoteUserAvatar?.isNotEmpty ?? false)
                                ? NetworkImage(call.remoteUserAvatar!)
                                : null,
                            child: (call.remoteUserAvatar?.isEmpty ?? true)
                                ? Text(
                                    call.remoteUserName?.isNotEmpty == true
                                        ? call.remoteUserName![0].toUpperCase()
                                        : '?',
                                    style: const TextStyle(
                                      fontSize: 44,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primary,
                                    ),
                                  )
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    Text(
                      call.remoteUserName ?? '',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _statusLabel(call.status),
                      style: TextStyle(
                        color: AppTheme.primary.withOpacity(0.6),
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),

            // ── Local Video (picture-in-picture) ────────────────────────────
            if (_renderersInitialized && _localRenderer.srcObject != null)
              Positioned(
                top: MediaQuery.of(context).padding.top + 12,
                right: 16,
                width: 120,
                height: 170,
                child: AnimatedOpacity(
                  opacity: (isConnected && !_showControls) ? 0.5 : 1.0,
                  duration: const Duration(milliseconds: 300),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.15),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.5),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: call.isCameraOff
                          ? Container(
                              color: const Color(0xFF0f0f1e),
                              child: const Center(
                                child: Icon(
                                  Icons.videocam_off_rounded,
                                  color: Colors.white24,
                                  size: 32,
                                ),
                              ),
                            )
                          : RTCVideoView(
                              _localRenderer,
                              mirror: true,
                              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                            ),
                    ),
                  ),
                ),
              ),

            // ── Top bar (connected state) ───────────────────────────────────
            if (isConnected)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: AnimatedOpacity(
                  opacity: _showControls ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 300),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.6),
                          Colors.transparent,
                        ],
                      ),
                    ),
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        child: Row(
                          children: [
                            // Duration indicator
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF22c55e),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF22c55e).withOpacity(0.5),
                                          blurRadius: 6,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    _formatDuration(_callDuration),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontFamily: 'monospace',
                                      fontWeight: FontWeight.w500,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            // Switch camera
                            _TopBarButton(
                              icon: Icons.flip_camera_ios_rounded,
                              onTap: _switchCamera,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // ── Back button (pre-connect state) ─────────────────────────────
            if (!isConnected)
              Positioned(
                top: 0,
                left: 0,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white70),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ),
              ),

            // ── Control buttons ─────────────────────────────────────────────
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: AnimatedOpacity(
                opacity: (isConnected && !_showControls) ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withOpacity(isConnected ? 0.7 : 0.0),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  padding: EdgeInsets.only(
                    bottom: MediaQuery.of(context).padding.bottom + 30,
                    top: 40,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Mute
                      _ControlButton(
                        icon: call.isMuted
                            ? Icons.mic_off_rounded
                            : Icons.mic_rounded,
                        label: call.isMuted ? 'Unmute' : 'Mute',
                        isActive: call.isMuted,
                        onTap: _toggleMute,
                      ),
                      const SizedBox(width: 16),

                      // Camera
                      _ControlButton(
                        icon: call.isCameraOff
                            ? Icons.videocam_off_rounded
                            : Icons.videocam_rounded,
                        label: call.isCameraOff ? 'Start' : 'Stop',
                        isActive: call.isCameraOff,
                        onTap: _toggleCamera,
                      ),
                      const SizedBox(width: 16),

                      // Hang up
                      _HangUpButton(onTap: _hangUp),
                      const SizedBox(width: 16),

                      // Speaker
                      _ControlButton(
                        icon: call.isSpeakerOn
                            ? Icons.volume_up_rounded
                            : Icons.hearing_rounded,
                        label: call.isSpeakerOn ? 'Speaker' : 'Earpiece',
                        isActive: call.isSpeakerOn,
                        activeColor: AppTheme.primary,
                        onTap: _toggleSpeaker,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _statusLabel(CallStatus status) {
    switch (status) {
      case CallStatus.dialing:
        return 'Calling...';
      case CallStatus.ringing:
        return 'Incoming video call...';
      case CallStatus.connected:
        return 'Connected';
      case CallStatus.idle:
        return '';
    }
  }
}

// ── Reusable control button with glassmorphism ────────────────────────────────
class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color? activeColor;
  final VoidCallback onTap;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isActive = false,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive
        ? (activeColor ?? Colors.red)
        : Colors.white;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive
                  ? (activeColor ?? Colors.red).withOpacity(0.2)
                  : Colors.white.withOpacity(0.12),
              border: Border.all(
                color: isActive
                    ? (activeColor ?? Colors.red).withOpacity(0.3)
                    : Colors.white.withOpacity(0.15),
                width: 1,
              ),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.5),
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

// ── Hang up button ────────────────────────────────────────────────────────────
class _HangUpButton extends StatelessWidget {
  final VoidCallback onTap;
  const _HangUpButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFFef4444), Color(0xFFdc2626)],
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.red.withOpacity(0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(Icons.call_end_rounded, color: Colors.white, size: 28),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'End',
          style: TextStyle(
            color: Colors.white.withOpacity(0.5),
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

// ── Top bar small button ──────────────────────────────────────────────────────
class _TopBarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _TopBarButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withOpacity(0.1),
        ),
        child: Icon(icon, color: Colors.white70, size: 20),
      ),
    );
  }
}
