import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../core/storage/token_storage.dart';
import '../models/user_model.dart';

// ── Guest Session State ───────────────────────────────────────────────────
enum GuestStatus { loading, ready, error }

class GuestState {
  final GuestStatus status;
  final UserModel? user;
  final String? errorMessage;

  const GuestState({required this.status, this.user, this.errorMessage});

  GuestState copyWith({GuestStatus? status, UserModel? user, String? errorMessage}) =>
      GuestState(
        status: status ?? this.status,
        user: user ?? this.user,
        errorMessage: errorMessage ?? this.errorMessage,
      );
}

// ── Guest Notifier ─────────────────────────────────────────────────────────
class GuestNotifier extends Notifier<GuestState> {
  @override
  GuestState build() {
    _initSession();
    return const GuestState(status: GuestStatus.loading);
  }

  /// On startup: try to restore existing session from stored JWT.
  /// If none exists, auto-register a new guest account.
  Future<void> _initSession() async {
    final storage = ref.read(tokenStorageProvider);
    final token = await storage.getToken();

    if (token != null) {
      // Try to restore session
      try {
        final dio = ref.read(dioProvider);
        final res = await dio.get('/api/auth/me');
        final user = UserModel.fromJson(res.data as Map<String, dynamic>);
        state = GuestState(status: GuestStatus.ready, user: user);
        return;
      } catch (_) {
        // Token expired or invalid — clear it and create a fresh guest
        await storage.deleteToken();
      }
    }

    // No valid session — auto-register a new guest
    await _createGuestAccount();
  }

  Future<void> _createGuestAccount() async {
    try {
      final rnd = _randomSuffix();
      final name = 'Guest$rnd';
      final email = 'guest$rnd@whisper.local';
      final password = 'guest_${rnd}_pass';

      final dio = ref.read(dioProvider);
      final res = await dio.post('/api/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
      });

      await ref.read(tokenStorageProvider).saveToken(res.data['token'] as String);
      final user = UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
      state = GuestState(status: GuestStatus.ready, user: user);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Failed to initialise session';
      state = GuestState(status: GuestStatus.error, errorMessage: msg);
    }
  }

  /// Allows refreshing profile data from the server
  Future<void> refresh() async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/api/auth/me');
      final user = UserModel.fromJson(res.data as Map<String, dynamic>);
      state = state.copyWith(user: user);
    } catch (_) {}
  }

  String _randomSuffix() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final rng = Random.secure();
    return List.generate(8, (_) => chars[rng.nextInt(chars.length)]).join();
  }
}

final guestProvider =
    NotifierProvider<GuestNotifier, GuestState>(GuestNotifier.new);
