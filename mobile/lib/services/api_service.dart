import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class ApiService {
  static const String baseUrl = 'http://10.70.8.78:3001/api'; // Android Emulator alias for localhost

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final cookie = prefs.getString('cookie');
    return {
      'Content-Type': 'application/json',
      if (cookie != null) 'cookie': cookie,
    };
  }

  static Future<void> _updateCookie(http.Response response) async {
    String? rawCookie = response.headers['set-cookie'];
    if (rawCookie != null) {
      int index = rawCookie.indexOf(';');
      String cookie = (index == -1) ? rawCookie : rawCookie.substring(0, index);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cookie', cookie);
    }
  }

  static Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl$endpoint'), headers: headers);
    await _updateCookie(response);
    return response;
  }

  static Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
    await _updateCookie(response);
    return response;
  }

  static Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
    await _updateCookie(response);
    return response;
  }
  
  static Future<http.Response> patch(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
    await _updateCookie(response);
    return response;
  }

  static Future<http.Response> delete(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    final request = http.Request('DELETE', Uri.parse('$baseUrl$endpoint'));
    request.headers.addAll(headers);
    if (body != null) {
      request.body = jsonEncode(body);
    }
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    await _updateCookie(response);
    return response;
  }

  // Upload file via multipart request
  static Future<http.Response> uploadFile(String endpoint, File file, {String fileField = 'attachment', Map<String, String>? fields}) async {
    final headers = await _getHeaders();
    headers.remove('Content-Type'); // Let the request set the multipart boundary

    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));
    request.headers.addAll(headers);
    
    if (fields != null) {
      request.fields.addAll(fields);
    }
    
    request.files.add(await http.MultipartFile.fromPath(fileField, file.path));
    
    var streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    await _updateCookie(response);
    return response;
  }
}
