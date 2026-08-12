import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  final String _serverUrl = 'http://10.70.8.78:3001';

  IO.Socket? get socket => _socket;

  void connect(String userId) {
    if (_socket != null && _socket!.connected) return;

    _socket = IO.io(
      _serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setQuery({'userId': userId})
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      print('Connected to Socket.io');
    });

    _socket!.onDisconnect((_) {
      print('Disconnected from Socket.io');
    });

    _socket!.on('get-online-users', (users) {
      // notify listeners about online users if needed
      // For now, we'll let other services listen to the socket directly
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
