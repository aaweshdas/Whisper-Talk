import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/socket_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat_list_tile.dart';
import '../../widgets/message_notification_banner.dart';
import '../../core/storage/token_storage.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with WidgetsBindingObserver {
  int _selectedIndex = 0;
  bool _socketConnected = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _watchAndConnect());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Refresh the chat list whenever the app resumes (e.g. after navigating back)
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(chatsProvider.notifier).refreshChats();
    }
  }

  void _watchAndConnect() {
    ref.listenManual(authProvider, (_, next) async {
      if (next.status == AuthStatus.authenticated && !_socketConnected) {
        final token = await ref.read(tokenStorageProvider).getToken();
        final userId = next.user?.id;
        if (token != null && userId != null) {
          final socketService = ref.read(socketServiceProvider);
          socketService.connect(token, userId);
          _socketConnected = true;

          // Refresh the chat list whenever any message arrives or the chat
          // is updated server-side (e.g. from another device/user).
          socketService.onChatUpdated(() {
            ref.read(chatsProvider.notifier).refreshChats();
          });

          // Show an in-app notification banner for every message received
          // from another user, but only when that chat is NOT already open.
          // Suppression is handled inside SocketService via _activeChatId.
          socketService.onIncomingMessage((msg) {
            if (!mounted) return;

            final notification = MessageNotification(
              senderName: msg.senderName.isNotEmpty
                  ? msg.senderName
                  : 'New message',
              text: msg.text,
              chatId: msg.chatId,
            );

            // Fetch the chat object so we can navigate to it on tap.
            final chats = ref.read(chatsProvider).asData?.value ?? [];
            final chat = chats.where((c) => c.id == msg.chatId).firstOrNull;

            MessageNotificationBanner.show(
              context,
              notification,
              onTap: chat != null
                  ? () => context.push('/home/chat', extra: chat)
                  : null,
            );
          });
        }
      }
    }, fireImmediately: true);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    // Show full-screen loader while session is being initialised
    if (authState.status == AuthStatus.loading) {
      return const Scaffold(
        backgroundColor: AppTheme.surface,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    // Show error if backend is unreachable
    if (authState.status == AuthStatus.error) {
      return Scaffold(
        backgroundColor: AppTheme.surface,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.cloud_off_rounded,
                    color: AppTheme.errorRed, size: 64),
                const SizedBox(height: 16),
                Text(
                  'Cannot reach server',
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  authState.errorMessage ?? 'Make sure the backend is running.',
                  style: const TextStyle(
                      color: AppTheme.textSecondary, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Retry'),
                  onPressed: () =>
                      ref.invalidate(authProvider),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: const [_ChatsTab(), _ProfileTab()],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (i) => setState(() => _selectedIndex = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline_rounded),
            activeIcon: Icon(Icons.chat_bubble_rounded),
            label: 'Chats',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// ── Chats Tab ─────────────────────────────────────────────────────────────
class _ChatsTab extends ConsumerWidget {
  const _ChatsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatsAsync = ref.watch(chatsProvider);

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Whisper',
            style: TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w900,
                fontSize: 22)),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_square, color: AppTheme.primary),
            tooltip: 'New Chat',
            onPressed: () async {
              await context.push('/home/new-chat');
              // Refresh the chat list when returning from New Chat
              ref.read(chatsProvider.notifier).refreshChats();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: chatsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline,
                  color: AppTheme.errorRed, size: 48),
              const SizedBox(height: 12),
              Text('Failed to load chats',
                  style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.read(chatsProvider.notifier).refreshChats(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (chats) {
          if (chats.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline_rounded,
                      size: 80,
                      color: AppTheme.textSecondary.withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  const Text('No conversations yet',
                      style: TextStyle(
                          color: AppTheme.textSecondary, fontSize: 18)),
                  const SizedBox(height: 8),
                  const Text('Tap the edit icon to start a new chat',
                      style: TextStyle(
                          color: AppTheme.textSecondary, fontSize: 14)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: () => ref.read(chatsProvider.notifier).refreshChats(),
            child: ListView.separated(
              itemCount: chats.length,
              separatorBuilder: (_, __) =>
                  const Divider(color: AppTheme.borderGlass, height: 1, indent: 80),
              itemBuilder: (ctx, i) => ChatListTile(
                chat: chats[i],
                onTap: () async {
                  await context.push('/home/chat', extra: chats[i]);
                  // Refresh the chat list when returning from a chat
                  ref.read(chatsProvider.notifier).refreshChats();
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Profile Tab ───────────────────────────────────────────────────────────
class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(title: const Text('Profile')),
      body: user == null
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 20),
                Center(
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 52,
                        backgroundColor: AppTheme.surfaceCard,
                        backgroundImage: user.avatar.isNotEmpty
                            ? NetworkImage(user.avatar)
                            : null,
                        child: user.avatar.isEmpty
                            ? Text(user.name[0].toUpperCase(),
                                style: const TextStyle(
                                    fontSize: 40,
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.bold))
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: AppTheme.onlineGreen,
                            shape: BoxShape.circle,
                            border:
                                Border.all(color: AppTheme.surface, width: 2),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: Text(user.name,
                      style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary)),
                ),
                const SizedBox(height: 4),
                Center(
                  child: Text(user.email,
                      style:
                          const TextStyle(color: AppTheme.textSecondary)),
                ),
                const SizedBox(height: 40),
                _ProfileOption(
                  icon: Icons.person_outline,
                  label: 'Edit Profile',
                  onTap: () {},
                ),
                _ProfileOption(
                  icon: Icons.notifications_outlined,
                  label: 'Notifications',
                  onTap: () {},
                ),
                _ProfileOption(
                  icon: Icons.lock_outline,
                  label: 'Privacy',
                  onTap: () {},
                ),
                const SizedBox(height: 12),
                _ProfileOption(
                  icon: Icons.logout_rounded,
                  label: 'Sign Out',
                  iconColor: AppTheme.errorRed,
                  textColor: AppTheme.errorRed,
                  onTap: () {
                    ref.read(authProvider.notifier).logout();
                    context.go('/auth');
                  },
                ),
              ],
            ),
    );
  }
}

class _ProfileOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color iconColor;
  final Color textColor;

  const _ProfileOption({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor = AppTheme.textSecondary,
    this.textColor = AppTheme.textPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor),
      title: Text(label,
          style: TextStyle(color: textColor, fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right_rounded,
          color: textColor == AppTheme.textPrimary
              ? AppTheme.textSecondary
              : textColor),
      onTap: onTap,
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
    );
  }
}
