import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../models/chat_model.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';

// ── Chats (refreshable) ───────────────────────────────────────────────────
class ChatsNotifier extends AsyncNotifier<List<ChatModel>> {
  @override
  Future<List<ChatModel>> build() => _fetch();

  Future<List<ChatModel>> _fetch() async {
    final dio = ref.watch(dioProvider);
    final res = await dio.get('/api/chats');
    final list = res.data as List;
    return list
        .map((e) => ChatModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Re-fetches the full chat list from the server.
  Future<void> refreshChats() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch());
  }
}

final chatsProvider =
    AsyncNotifierProvider<ChatsNotifier, List<ChatModel>>(ChatsNotifier.new);

// ── Messages per chat (family provider) ───────────────────────────────────
class MessagesNotifier extends Notifier<List<MessageModel>> {
  final String chatId;
  MessagesNotifier(this.chatId);

  @override
  List<MessageModel> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/api/messages/$chatId');
      final list = res.data as List;
      state = list
          .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {}
  }

  void addMessage(MessageModel msg) {
    // If this is a server-confirmed message, replace any matching optimistic entry
    if (!msg.id.startsWith('optimistic-')) {
      final idx = state.indexWhere(
        (m) => m.id.startsWith('optimistic-') &&
            m.senderId == msg.senderId &&
            m.text == msg.text,
      );
      if (idx != -1) {
        // Replace the optimistic placeholder with the real message
        final updated = [...state];
        updated[idx] = msg;
        state = updated;
        return;
      }
    }
    state = [...state, msg];
  }
}

final messagesProvider = NotifierProvider.family<MessagesNotifier,
    List<MessageModel>, String>(
  (chatId) => MessagesNotifier(chatId),
);

// ── Users search ──────────────────────────────────────────────────────────
final usersSearchProvider =
    FutureProvider.family<List<UserModel>, String>((ref, query) async {
  if (query.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/api/users', queryParameters: {'search': query});
  final list = res.data as List;
  return list
      .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
      .toList();
});

// ── Get or Create Chat ────────────────────────────────────────────────────
Future<ChatModel> getOrCreateChat(WidgetRef ref, String participantId) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/api/chats/$participantId');
  return ChatModel.fromJson(res.data as Map<String, dynamic>);
}
