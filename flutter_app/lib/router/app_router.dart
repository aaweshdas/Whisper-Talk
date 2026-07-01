import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../screens/home/home_screen.dart';
import '../screens/chat/chat_screen.dart';
import '../screens/new_chat/new_chat_screen.dart';
import '../screens/auth/auth_screen.dart';
import '../models/chat_model.dart';
import '../widgets/incoming_call_overlay.dart';
import '../providers/auth_provider.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/auth',
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState.status == AuthStatus.authenticated;
      final isOnAuth = state.matchedLocation == '/auth';

      // Still loading — don't redirect
      if (authState.status == AuthStatus.initial ||
          authState.status == AuthStatus.loading) {
        return null;
      }

      // Not authenticated → force to auth page
      if (!isAuthenticated && !isOnAuth) return '/auth';

      // Authenticated but still on auth page → go home
      if (isAuthenticated && isOnAuth) return '/home';

      return null;
    },
    routes: [
      GoRoute(
        path: '/auth',
        builder: (_, __) => const AuthScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (_, __) => const IncomingCallOverlay(child: HomeScreen()),
        routes: [
          GoRoute(
            path: 'chat',
            builder: (context, state) {
              final chat = state.extra as ChatModel;
              return IncomingCallOverlay(child: ChatScreen(chat: chat));
            },
          ),
          GoRoute(
            path: 'new-chat',
            builder: (_, __) =>
                const IncomingCallOverlay(child: NewChatScreen()),
          ),
        ],
      ),
    ],
  );
});
