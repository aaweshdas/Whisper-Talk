class UserModel {
  final String id;
  final String name;
  final String email;
  final String avatar;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.avatar,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['_id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        avatar: json['avatar'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'avatar': avatar,
      };
}
