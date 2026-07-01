import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../models/chat_model.dart';
import '../../models/message_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../providers/socket_provider.dart';
import '../../providers/call_provider.dart';
import '../../widgets/message_bubble.dart';
import '../call/call_screen.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final ChatModel chat;
  const ChatScreen({super.key, required this.chat});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _typingTimer;
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    final socket = ref.read(socketServiceProvider);
    socket.joinChat(widget.chat.id);
    socket.onNewMessage(widget.chat.id, (msg) {
      ref.read(messagesProvider(widget.chat.id).notifier).addMessage(msg);
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
    final socket = ref.read(socketServiceProvider);
    socket.leaveChat(widget.chat.id);
    socket.offNewMessage();
    _controller.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _onTextChanged(String val) {
    final socket = ref.read(socketServiceProvider);
    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) return;
    
    if (!_isTyping) {
      _isTyping = true;
      socket.emitTyping(widget.chat.id, currentUser.id);
    }
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      _isTyping = false;
      socket.emitStopTyping(widget.chat.id, currentUser.id);
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) return;

    _controller.clear();
    _typingTimer?.cancel();
    _isTyping = false;
    ref.read(socketServiceProvider).emitStopTyping(widget.chat.id, currentUser.id);

    // Optimistic update: show the message locally right away
    final optimisticMsg = MessageModel(
      id: 'optimistic-${DateTime.now().millisecondsSinceEpoch}',
      chatId: widget.chat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: text,
      createdAt: DateTime.now(),
    );
    ref.read(messagesProvider(widget.chat.id).notifier).addMessage(optimisticMsg);
    _scrollToBottom();

    // Emit over socket — backend will broadcast to all in the chat room
    ref.read(socketServiceProvider).sendMessage(widget.chat.id, currentUser.id, text);
  }

  Future<void> _startCall(BuildContext context, WidgetRef ref, dynamic currentUser) async {
    if (currentUser == null) return;
    final socket = ref.read(socketServiceProvider);
    final callNotifier = ref.read(callProvider.notifier);

    await callNotifier.startCall(
      toUserId: widget.chat.participant.id,
      toUserName: widget.chat.participant.name,
      toUserAvatar: widget.chat.participant.avatar,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      onSignal: (userId, signal) {
        socket.callUser(
          toUserId: userId,
          signalData: signal,
          fromUserId: currentUser.id,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
        );
      },
      onIceCandidate: (candidate, toId) {
        socket.sendIceCandidate(toId, candidate);
      },
    );

    if (context.mounted) {
      await Navigator.of(context, rootNavigator: true).push(
        MaterialPageRoute(
          builder: (_) => const CallScreen(),
          fullscreenDialog: true,
        ),
      );
    }
  }

  @override

  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider(widget.chat.id));
    final currentUser = ref.watch(authProvider).user;
    final isOnline = ref.watch(onlineUsersProvider)
        .contains(widget.chat.participant.id);
    final isTyping = ref.watch(typingUsersProvider)[widget.chat.id] ?? false;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceCard,
        leadingWidth: 30,
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppTheme.surfaceGlass,
                  backgroundImage: widget.chat.participant.avatar.isNotEmpty
                      ? NetworkImage(widget.chat.participant.avatar)
                      : null,
                  child: widget.chat.participant.avatar.isEmpty
                      ? Text(widget.chat.participant.name[0].toUpperCase(),
                          style: const TextStyle(color: AppTheme.primary))
                      : null,
                ),
                if (isOnline)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppTheme.onlineGreen,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.surfaceCard, width: 1.5),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.chat.participant.name,
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary)),
                if (isTyping)
                  const Text('typing...',
                      style: TextStyle(color: AppTheme.primary, fontSize: 12))
                else
                  Text(isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                          color: isOnline ? AppTheme.onlineGreen : AppTheme.textSecondary,
                          fontSize: 12)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam_rounded, color: AppTheme.primary),
            tooltip: 'Video Call',
            onPressed: () => _startCall(context, ref, currentUser),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline_rounded,
                            size: 60,
                            color: AppTheme.textSecondary.withOpacity(0.3)),
                        const SizedBox(height: 12),
                        const Text('Say hello! 👋',
                            style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 16),
                    itemCount: messages.length,
                    itemBuilder: (ctx, i) {
                      final msg = messages[i];
                      final isMe = msg.senderId == currentUser?.id;
                      return MessageBubble(
                        message: msg,
                        isMe: isMe,
                      );
                    },
                  ),
          ),

          // Input bar
          Container(
            color: AppTheme.surfaceCard,
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      onChanged: _onTextChanged,
                      onSubmitted: (_) => _sendMessage(),
                      style: const TextStyle(color: AppTheme.textPrimary),
                      maxLines: null,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                              const BorderSide(color: AppTheme.borderGlass),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                              const BorderSide(color: AppTheme.borderGlass),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                              const BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.surfaceGlass,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary, AppTheme.primaryDark],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.4),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.send_rounded,
                          color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
