import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../core/network/dio_client.dart';
import '../core/storage/token_storage.dart';
import '../models/user_model.dart';

// ── Auth State ─────────────────────────────────────────────────────────────────
enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? errorMessage;

  const AuthState({required this.status, this.user, this.errorMessage});

  AuthState copyWith({AuthStatus? status, UserModel? user, String? errorMessage}) =>
      AuthState(
        status: status ?? this.status,
        user: user ?? this.user,
        errorMessage: errorMessage,
      );
}

// ── Google Sign-In instance ────────────────────────────────────────────────────
// The serverClientId must match the GOOGLE_CLIENT_ID in your backend .env.
// This is the "server" or "Web" client ID — NOT the Android client ID.
final _googleSignIn = GoogleSignIn(
  serverClientId:
      '800145314008-a9hj6d3pjg00p7ituc23dsptsanqq2lm.apps.googleusercontent.com',
);

// ── Auth Notifier ──────────────────────────────────────────────────────────────
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _tryRestoreSession();
    return const AuthState(status: AuthStatus.initial);
  }

  /// Try to restore an existing session from a saved JWT token.
  Future<void> _tryRestoreSession() async {
    state = const AuthState(status: AuthStatus.loading);
    final storage = ref.read(tokenStorageProvider);
    final token = await storage.getToken();

    if (token == null) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }

    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/api/auth/me');
      final user = UserModel.fromJson(res.data as Map<String, dynamic>);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (_) {
      await storage.deleteToken();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Register a new account with username and password.
  Future<void> register({
    required String username,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final email = '${username.trim().toLowerCase().replaceAll(' ', '_')}@whisper.app';
      final dio = ref.read(dioProvider);
      final res = await dio.post('/api/auth/register', data: {
        'name': username.trim(),
        'email': email,
        'password': password,
      });

      await ref.read(tokenStorageProvider).saveToken(res.data['token'] as String);
      final user = UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Registration failed';
      state = state.copyWith(status: AuthStatus.unauthenticated, errorMessage: msg);
    }
  }

  /// Login with existing username and password.
  Future<void> login({
    required String username,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final email = '${username.trim().toLowerCase().replaceAll(' ', '_')}@whisper.app';
      final dio = ref.read(dioProvider);
      final res = await dio.post('/api/auth/login', data: {
        'email': email,
        'password': password,
      });

      await ref.read(tokenStorageProvider).saveToken(res.data['token'] as String);
      final user = UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Login failed';
      state = state.copyWith(status: AuthStatus.unauthenticated, errorMessage: msg);
    }
  }

  /// Sign in with Google and exchange the server auth code for our JWT.
  Future<void> signInWithGoogle() async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) {
        // User cancelled the sign-in dialog
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: null,
        );
        return;
      }

      final auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: 'Could not get Google ID token. Please try again.',
        );
        return;
      }

      final dio = ref.read(dioProvider);
      final res = await dio.post('/api/auth/google', data: {'idToken': idToken});

      await ref.read(tokenStorageProvider).saveToken(res.data['token'] as String);
      final user = UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Google sign-in failed';
      state = state.copyWith(status: AuthStatus.unauthenticated, errorMessage: msg);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: 'Google sign-in failed. Please try again.',
      );
    }
  }

  /// Sign out the current user (also disconnects Google session).
  Future<void> logout() async {
    await ref.read(tokenStorageProvider).deleteToken();
    await _googleSignIn.signOut();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Refresh user profile data.
  Future<void> refresh() async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/api/auth/me');
      final user = UserModel.fromJson(res.data as Map<String, dynamic>);
      state = state.copyWith(user: user);
    } catch (_) {}
  }
}

final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
