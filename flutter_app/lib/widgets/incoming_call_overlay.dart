import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme/app_theme.dart';
import '../providers/call_provider.dart';
import '../providers/socket_provider.dart';
import '../screens/call/call_screen.dart';

/// Wrap this around your main scaffold. It listens to [callProvider] and
/// shows an incoming-call dialog whenever [CallStatus.ringing] fires.
class IncomingCallOverlay extends ConsumerWidget {
  final Widget child;
  const IncomingCallOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listen for ringing state
    ref.listen<CallState>(callProvider, (prev, next) {
      if (next.status == CallStatus.ringing &&
          (prev?.status != CallStatus.ringing)) {
        _showIncomingCallDialog(context, ref, next);
      }
    });

    return child;
  }

  void _showIncomingCallDialog(
      BuildContext context, WidgetRef ref, CallState call) {
    showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      pageBuilder: (ctx, _, __) => _IncomingCallDialog(call: call),
    );
  }
}

class _IncomingCallDialog extends ConsumerWidget {
  final CallState call;
  const _IncomingCallDialog({required this.call});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final callState = ref.watch(callProvider);

    // Auto-dismiss if call was ended by caller
    if (callState.status == CallStatus.idle) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (Navigator.of(context).canPop()) Navigator.of(context).pop();
      });
    }

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 32),
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1e1e3a), Color(0xFF12122a)],
            ),
            border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withOpacity(0.2),
                blurRadius: 32,
                spreadRadius: 4,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pulsing avatar
              Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: AppTheme.primary.withOpacity(0.4), width: 3),
                    ),
                  ),
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: AppTheme.surfaceCard,
                    backgroundImage:
                        (call.remoteUserAvatar?.isNotEmpty ?? false)
                            ? NetworkImage(call.remoteUserAvatar!)
                            : null,
                    child: (call.remoteUserAvatar?.isEmpty ?? true)
                        ? Text(
                            call.remoteUserName?.isNotEmpty == true
                                ? call.remoteUserName![0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                                fontSize: 36, color: AppTheme.primary),
                          )
                        : null,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                call.remoteUserName ?? 'Unknown',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Incoming Video Call',
                style: TextStyle(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 32),

              // Action buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Decline
                  _CallActionButton(
                    icon: Icons.call_end_rounded,
                    label: 'Decline',
                    color: Colors.red,
                    onTap: () {
                      final remoteId = ref.read(callProvider).remoteUserId;
                      if (remoteId != null) {
                        ref.read(socketServiceProvider).rejectCall(remoteId);
                      }
                      ref.read(callProvider.notifier).endCall();
                      Navigator.of(context).pop();
                    },
                  ),

                  // Accept
                  _CallActionButton(
                    icon: Icons.videocam_rounded,
                    label: 'Accept',
                    color: Colors.green,
                    onTap: () async {
                      Navigator.of(context).pop();
                      // Navigate to call screen first, then answer
                      await Navigator.of(context, rootNavigator: true).push(
                        MaterialPageRoute(
                            builder: (_) => const CallScreen(),
                            fullscreenDialog: true),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CallActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _CallActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

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
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: color.withOpacity(0.4),
                    blurRadius: 16,
                    spreadRadius: 2)
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
        ),
        const SizedBox(height: 8),
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 13)),
      ],
    );
  }
}
