import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/chat_provider.dart';
import '../../models/user_model.dart';

class NewChatScreen extends ConsumerStatefulWidget {
  const NewChatScreen({super.key});

  @override
  ConsumerState<NewChatScreen> createState() => _NewChatScreenState();
}

class _NewChatScreenState extends ConsumerState<NewChatScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(usersSearchProvider(_query));

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('New Chat'),
        backgroundColor: AppTheme.surfaceCard,
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: AppTheme.textPrimary),
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Search users by name or email...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppTheme.textSecondary),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _query = '');
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Results
          Expanded(
            child: _query.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search,
                            size: 64,
                            color: AppTheme.textSecondary.withOpacity(0.3)),
                        const SizedBox(height: 12),
                        const Text('Search for people to chat with',
                            style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  )
                : usersAsync.when(
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                    error: (e, _) => Center(child: Text('Error: $e')),
                    data: (users) {
                      if (users.isEmpty) {
                        return const Center(
                          child: Text('No users found',
                              style: TextStyle(color: AppTheme.textSecondary)),
                        );
                      }
                      return ListView.separated(
                        itemCount: users.length,
                        separatorBuilder: (_, __) => const Divider(
                            color: AppTheme.borderGlass, height: 1),
                        itemBuilder: (ctx, i) =>
                            _UserTile(user: users[i]),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _UserTile extends ConsumerWidget {
  final UserModel user;
  const _UserTile({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      onTap: () async {
        try {
          final chat = await getOrCreateChat(ref, user.id);
          if (context.mounted) {
            context.pop();
            context.push('/home/chat', extra: chat);
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to open chat: $e'),
                  backgroundColor: AppTheme.errorRed),
            );
          }
        }
      },
      leading: CircleAvatar(
        backgroundColor: AppTheme.surfaceCard,
        backgroundImage: user.avatar.isNotEmpty ? NetworkImage(user.avatar) : null,
        child: user.avatar.isEmpty
            ? Text(user.name[0].toUpperCase(),
                style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold))
            : null,
      ),
      title: Text(user.name,
          style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
      subtitle: Text(user.email,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
      trailing: const Icon(Icons.arrow_forward_ios_rounded,
          size: 14, color: AppTheme.textSecondary),
    );
  }
}
