import 'user_model.dart';
import 'message_model.dart';

class ChatModel {
  final String id;
  final UserModel participant;
  final MessageModel? lastMessage;
  final DateTime? lastMessageAt;
  final DateTime createdAt;

  const ChatModel({
    required this.id,
    required this.participant,
    this.lastMessage,
    this.lastMessageAt,
    required this.createdAt,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) => ChatModel(
        id: json['_id'] as String,
        participant: UserModel.fromJson(json['participant'] as Map<String, dynamic>),
        lastMessage: json['lastMessage'] != null
            ? MessageModel.fromJson(json['lastMessage'] as Map<String, dynamic>)
            : null,
        lastMessageAt: json['lastMessageAt'] != null
            ? DateTime.parse(json['lastMessageAt'] as String)
            : null,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
