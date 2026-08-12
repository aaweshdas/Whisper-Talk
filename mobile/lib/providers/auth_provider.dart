import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _isCheckingAuth = true;

  Map<String, dynamic>? get user => _user;
  bool get isCheckingAuth => _isCheckingAuth;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    checkAuth();
  }

  Future<void> checkAuth() async {
    _isCheckingAuth = true;
    notifyListeners();
    
    try {
      final response = await ApiService.get('/auth/check');
      if (response.statusCode == 200) {
        _user = jsonDecode(response.body);
      } else {
        _user = null;
      }
    } catch (e) {
      _user = null;
    } finally {
      _isCheckingAuth = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await ApiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _user = data;
        
        // We'll simulate storing token if the backend passes a token in the response or uses cookies.
        // Wait, the Whisper backend uses HTTP-only cookies! 
        // We might have an issue since http package doesn't persist cookies automatically.
        // Actually, if we send a JWT back, we can store it. If it only uses cookies, we'll need to manually parse the Set-Cookie header.
        
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> signup(String fullName, String email, String password) async {
    try {
      final response = await ApiService.post('/auth/signup', {
        'fullName': fullName,
        'email': email,
        'password': password,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _user = data;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ApiService.post('/auth/logout', {});
      _user = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cookie');
      notifyListeners();
    } catch (e) {
      print('Logout error: $e');
    }
  }

  void updateUser(Map<String, dynamic> updatedUser) {
    _user = updatedUser;
    notifyListeners();
  }
}
