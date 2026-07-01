class MessageModel {
  final String id;
  final String chatId;
  final String senderId;
  final String senderName;
  final String text;
  final DateTime createdAt;

  const MessageModel({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    // Backend populates `sender` as an object { _id, name, avatar } after save.
    // But in REST /api/messages it may be a plain string or populated object.
    // Handle all three cases: populated object, plain string id, or flat senderId.
    String senderId = '';
    String senderName = '';
    final sender = json['sender'];
    if (sender is Map) {
      senderId = (sender['_id'] ?? sender['id'] ?? '').toString();
      senderName = (sender['name'] ?? sender['username'] ?? '').toString();
    } else if (sender is String) {
      senderId = sender;
    } else {
      senderId = (json['senderId'] as String?) ?? '';
    }

    // chatId: populated msg has `chat` field (string id), REST may have `chatId`
    final chatId = (json['chat'] as String?) ??
        (json['chatId'] as String?) ??
        '';

    return MessageModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      chatId: chatId,
      senderId: senderId,
      senderName: senderName,
      text: (json['text'] as String?) ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}
