import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _chats = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchChats();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        context.read<SocketService>().connect(user['_id']);
      }
    });
  }

  Future<void> _fetchChats() async {
    try {
      final res = await ApiService.get('/chats');
      if (res.statusCode == 200) {
        setState(() {
          _chats = jsonDecode(res.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chats'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<SocketService>().disconnect();
              context.read<AuthProvider>().logout();
            },
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _chats.isEmpty
              ? const Center(child: Text('No chats yet'))
              : ListView.builder(
                  itemCount: _chats.length,
                  itemBuilder: (context, index) {
                    final chat = _chats[index];
                    final isGroup = chat['isGroupChat'] ?? false;
                    
                    // Determine chat name & avatar
                    String chatName = chat['chatName'] ?? 'Unknown Chat';
                    String? avatarUrl;
                    if (!isGroup) {
                      final otherUser = (chat['users'] as List).firstWhere(
                        (u) => u['_id'] != user?['_id'],
                        orElse: () => null,
                      );
                      if (otherUser != null) {
                        chatName = otherUser['name'] ?? 'Unknown User';
                        avatarUrl = otherUser['avatar'];
                      }
                    }

                    return ListTile(
                      leading: CircleAvatar(
                        backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                            ? NetworkImage('http://10.70.8.78:3001$avatarUrl')
                            : null,
                        child: avatarUrl == null || avatarUrl.isEmpty
                            ? Text(chatName[0].toUpperCase())
                            : null,
                      ),
                      title: Text(chatName, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: chat['latestMessage'] != null
                          ? Text(
                              chat['latestMessage']['text'] ?? 'Attachment',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            )
                          : null,
                      onTap: () {
                        context.push('/chat/${chat['_id']}');
                      },
                    );
                  },
                ),
    );
  }
}
