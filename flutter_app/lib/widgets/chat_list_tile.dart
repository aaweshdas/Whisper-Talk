import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme/app_theme.dart';
import '../models/chat_model.dart';

class ChatListTile extends StatelessWidget {
  final ChatModel chat;
  final VoidCallback onTap;

  const ChatListTile({super.key, required this.chat, required this.onTap});

  String _formatTime(DateTime? dt) {
    if (dt == null) return '';
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) return DateFormat('HH:mm').format(dt);
    if (diff.inDays == 1) return 'Yesterday';
    return DateFormat('dd/MM/yy').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final p = chat.participant;
    final lastMsg = chat.lastMessage;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 26,
              backgroundColor: AppTheme.surfaceCard,
              backgroundImage:
                  p.avatar.isNotEmpty ? NetworkImage(p.avatar) : null,
              child: p.avatar.isEmpty
                  ? Text(
                      p.name[0].toUpperCase(),
                      style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 18),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            // Name + last message
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name,
                    style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    lastMsg?.text ?? 'No messages yet',
                    style: const TextStyle(
                        color: AppTheme.textSecondary, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Time
            if (chat.lastMessageAt != null)
              Text(
                _formatTime(chat.lastMessageAt),
                style: const TextStyle(
                    color: AppTheme.textSecondary, fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }
}
