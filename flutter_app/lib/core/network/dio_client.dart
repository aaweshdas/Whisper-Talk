import 'package:dio/dio.dart';
import 'package:riverpod/riverpod.dart';
import '../constants/app_constants.dart';
import '../storage/token_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: kBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ));

  // JWT interceptor — automatically attaches Bearer token to every request
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final tokenStorage = ref.read(tokenStorageProvider);
        final token = await tokenStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        // Log to Sentry or handle 401 globally here if needed
        handler.next(error);
      },
    ),
  );

  return dio;
});
