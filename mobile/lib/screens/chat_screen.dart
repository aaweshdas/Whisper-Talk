import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';

class ChatScreen extends StatefulWidget {
  final String chatId;
  const ChatScreen({Key? key, required this.chatId}) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<dynamic> _messages = [];
  bool _isLoading = true;
  final TextEditingController _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    
    final socket = context.read<SocketService>().socket;
    if (socket != null) {
      socket.emit('join chat', widget.chatId);
      
      socket.on('message received', _onMessageReceived);
      socket.on('message-deleted', _onMessageDeleted);
    }
  }

  @override
  void dispose() {
    final socket = context.read<SocketService>().socket;
    if (socket != null) {
      socket.emit('leave chat', widget.chatId);
      socket.off('message received', _onMessageReceived);
      socket.off('message-deleted', _onMessageDeleted);
    }
    super.dispose();
  }

  void _onMessageReceived(dynamic data) {
    if (data['chat']['_id'] == widget.chatId || data['chat'] == widget.chatId) {
      setState(() {
        _messages.add(data);
      });
    }
  }

  void _onMessageDeleted(dynamic data) {
    setState(() {
      final index = _messages.indexWhere((m) => m['_id'] == data['messageId']);
      if (index != -1) {
        _messages[index]['deletedForEveryone'] = true;
        _messages[index]['text'] = "This message was deleted";
      }
    });
  }

  Future<void> _fetchMessages() async {
    try {
      final res = await ApiService.get('/messages/${widget.chatId}');
      if (res.statusCode == 200) {
        setState(() {
          _messages = jsonDecode(res.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    
    _textController.clear();
    
    try {
      final res = await ApiService.post('/messages', {
        'chatId': widget.chatId,
        'text': text,
      });
      
      if (res.statusCode == 200 || res.statusCode == 201) {
        final newMsg = jsonDecode(res.body);
        setState(() {
          _messages.add(newMsg);
        });
        
        final socket = context.read<SocketService>().socket;
        socket?.emit('new message', newMsg);
      }
    } catch (e) {
      print('Send error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    reverse: false,
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final isMe = message['sender']['_id'] == user?['_id'];
                      final isDeleted = message['deletedForEveryone'] == true;

                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDeleted 
                                ? Colors.grey.shade300 
                                : (isMe ? Colors.indigo : Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            isDeleted ? "This message was deleted" : (message['text'] ?? ''),
                            style: TextStyle(
                              color: isDeleted 
                                  ? Colors.grey.shade600 
                                  : (isMe ? Colors.white : Colors.black87),
                              fontStyle: isDeleted ? FontStyle.italic : FontStyle.normal,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.indigo,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
