import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/constants/app_constants.dart';
import '../models/message_model.dart';
import 'call_provider.dart';

// ── Online Users ──────────────────────────────────────────────────────────
class OnlineUsersNotifier extends Notifier<List<String>> {
  @override
  List<String> build() => [];

  void update(List<String> users) => state = users;
}

final onlineUsersProvider =
    NotifierProvider<OnlineUsersNotifier, List<String>>(OnlineUsersNotifier.new);

// ── Typing Users (chatId -> isTyping) ────────────────────────────────────
class TypingNotifier extends Notifier<Map<String, bool>> {
  @override
  Map<String, bool> build() => {};

  void setTyping(String chatId, bool isTyping) {
    state = {...state, chatId: isTyping};
  }
}

final typingUsersProvider =
    NotifierProvider<TypingNotifier, Map<String, bool>>(TypingNotifier.new);

// ── Socket Service ────────────────────────────────────────────────────────
class SocketService {
  io.Socket? _socket;
  final Ref _ref;

  // Callback registries — allows multiple listeners without .off() conflicts
  void Function(MessageModel)? _chatMessageCallback;
  void Function()? _chatUpdatedCallback;

  /// Fired for every incoming `new-message` from *other* users.
  /// Carries enough data to render the notification banner.
  void Function(MessageModel)? _notificationCallback;

  /// The chatId the user is currently viewing (null = home / any non-chat screen).
  String? _activeChatId;

  SocketService(this._ref);

  void connect(String token, String userId) {
    _socket = io.io(
      kSocketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('join', userId);
    });

    _socket!.on('online-users', (data) {
      final users = List<String>.from(data as List);
      _ref.read(onlineUsersProvider.notifier).update(users);
    });

    _socket!.on('user-typing', (data) {
      final chatId = data['chatId'] as String;
      _ref.read(typingUsersProvider.notifier).setTyping(chatId, true);
    });

    _socket!.on('user-stopped-typing', (data) {
      final chatId = data['chatId'] as String;
      _ref.read(typingUsersProvider.notifier).setTyping(chatId, false);
    });

    // ── Central new-message handler ─────────────────────────────────────
    // Single listener that dispatches to the chat screen callback,
    // the home-level chat-list refresh callback, and the notification banner.
    _socket!.on('new-message', (data) {
      final msg = MessageModel.fromJson(data as Map<String, dynamic>);
      _chatMessageCallback?.call(msg);
      _chatUpdatedCallback?.call();
      // Show banner only for messages from other users AND only when the
      // user is NOT currently viewing that specific conversation.
      if (msg.senderId != userId && _activeChatId != msg.chatId) {
        _notificationCallback?.call(msg);
      }
    });

    // ── Chat-updated (for messages sent by *others* — home-list refresh) ─
    _socket!.on('chat-updated', (_) {
      _chatUpdatedCallback?.call();
    });

    // ── WebRTC Calling Signals ─────────────────────────────────────────────
    _socket!.on('call-user', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      _ref.read(callProvider.notifier).setIncomingCall(
            fromUserId: map['from'] as String,
            fromUserName: map['name'] as String,
            fromUserAvatar: (map['avatar'] as String?) ?? '',
            signal: Map<String, dynamic>.from(map['signal'] as Map),
          );
    });

    _socket!.on('call-accepted', (data) {
      final signal = Map<String, dynamic>.from(data as Map);
      _ref.read(callProvider.notifier).handleCallAccepted(signal);
    });

    _socket!.on('call-rejected', (_) {
      _ref.read(callProvider.notifier).endCall();
    });

    _socket!.on('call-ended', (_) {
      _ref.read(callProvider.notifier).endCall();
    });

    _socket!.on('webrtc-ice-candidate', (data) {
      final candidate = Map<String, dynamic>.from(data as Map);
      _ref.read(callProvider.notifier).addIceCandidate(candidate);
    });
  }

  // ── Chat-level message listener (ChatScreen) ──────────────────────────
  void onNewMessage(String chatId, void Function(MessageModel) callback) {
    _activeChatId = chatId; // mark this chat as actively open
    _chatMessageCallback = (msg) {
      if (msg.chatId == chatId) callback(msg);
    };
  }

  void offNewMessage() {
    _activeChatId = null; // user left the chat screen
    _chatMessageCallback = null;
  }

  // ── Home-level chat-list refresh listener ─────────────────────────────
  void onChatUpdated(void Function() callback) {
    _chatUpdatedCallback = callback;
  }

  void offChatUpdated() {
    _chatUpdatedCallback = null;
  }

  // ── In-app notification banner listener ───────────────────────────────
  void onIncomingMessage(void Function(MessageModel) callback) {
    _notificationCallback = callback;
  }

  void offIncomingMessage() {
    _notificationCallback = null;
  }

  void sendMessage(String chatId, String senderId, String text) {
    _socket?.emit('send-message', {
      'chatId': chatId,
      'senderId': senderId,
      'text': text,
    });
  }

  void emitTyping(String chatId, String userId) =>
      _socket?.emit('typing-start', {'chatId': chatId, 'userId': userId});

  void emitStopTyping(String chatId, String userId) =>
      _socket?.emit('typing-stop', {'chatId': chatId, 'userId': userId});

  void joinChat(String chatId) =>
      _socket?.emit('join-chat', chatId);

  void leaveChat(String chatId) =>
      _socket?.emit('leave-chat', chatId);

  // ── Call Signaling Emitters (always video+audio) ──────────────────────
  void callUser({
    required String toUserId,
    required Map<String, dynamic> signalData,
    required String fromUserId,
    required String fromName,
    required String fromAvatar,
  }) {
    _socket?.emit('call-user', {
      'userToCall': toUserId,
      'signalData': signalData,
      'from': fromUserId,
      'name': fromName,
      'avatar': fromAvatar,
      'type': 'video',
    });
  }

  void answerCall(String toUserId, Map<String, dynamic> signal) {
    _socket?.emit('answer-call', {'to': toUserId, 'signal': signal});
  }

  void rejectCall(String toUserId) {
    _socket?.emit('reject-call', {'to': toUserId});
  }

  void endCall(String toUserId) {
    _socket?.emit('end-call', {'to': toUserId});
  }

  void sendIceCandidate(String toUserId, Map<String, dynamic> candidate) {
    _socket?.emit('webrtc-ice-candidate', {'to': toUserId, 'candidate': candidate});
  }

  void disconnect() => _socket?.disconnect();
}

final socketServiceProvider =
    Provider<SocketService>((ref) => SocketService(ref));
