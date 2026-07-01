import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// Data payload for a single notification banner.
class MessageNotification {
  final String senderName;
  final String text;
  final String chatId;

  const MessageNotification({
    required this.senderName,
    required this.text,
    required this.chatId,
  });
}

/// A global overlay entry that shows a glassmorphic banner at the top of the
/// screen when a new message arrives.
///
/// Usage:
///   MessageNotificationBanner.show(context, notification, onTap);
class MessageNotificationBanner {
  static OverlayEntry? _current;
  static Timer? _timer;

  static void show(
    BuildContext context,
    MessageNotification notification, {
    VoidCallback? onTap,
  }) {
    // Dismiss any already-visible banner immediately
    _dismiss();

    final overlay = Overlay.of(context);

    _current = OverlayEntry(
      builder: (_) => _BannerWidget(
        notification: notification,
        onTap: () {
          _dismiss();
          onTap?.call();
        },
        onDismiss: _dismiss,
      ),
    );

    overlay.insert(_current!);

    // Auto-dismiss after 4 s
    _timer = Timer(const Duration(seconds: 4), _dismiss);
  }

  static void _dismiss() {
    _timer?.cancel();
    _timer = null;
    _current?.remove();
    _current = null;
  }
}

// ── Private banner widget ─────────────────────────────────────────────────
class _BannerWidget extends StatefulWidget {
  final MessageNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _BannerWidget({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  State<_BannerWidget> createState() => _BannerWidgetState();
}

class _BannerWidgetState extends State<_BannerWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slide;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );

    _slide = Tween<Offset>(
      begin: const Offset(0, -1.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    _fade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _slideOut() async {
    await _controller.reverse();
    widget.onDismiss();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topPadding + 12,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slide,
        child: FadeTransition(
          opacity: _fade,
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: widget.onTap,
              // Swipe up to dismiss
              onVerticalDragUpdate: (details) {
                if (details.primaryDelta != null &&
                    details.primaryDelta! < -10) {
                  _slideOut();
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A2E).withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppTheme.primary.withValues(alpha: 0.35),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.18),
                      blurRadius: 24,
                      spreadRadius: 0,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.45),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Avatar circle with initials
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.35),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          widget.notification.senderName.isNotEmpty
                              ? widget.notification.senderName[0]
                                  .toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Text content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            widget.notification.senderName.isNotEmpty
                                ? widget.notification.senderName
                                : 'Someone',
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            widget.notification.text,
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 13,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),

                    // Dismiss X
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _slideOut,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.07),
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          size: 15,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
