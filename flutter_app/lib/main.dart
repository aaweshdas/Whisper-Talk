import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SentryFlutter.init(
    (options) {
      options.dsn =
          'https://0e2279f71277224522894584b0187c64@o4511416768462848.ingest.us.sentry.io/4511416986763264';
      options.tracesSampleRate = 1.0;
      options.sendDefaultPii = true;
    },
    appRunner: () => runApp(
      const ProviderScope(child: WhisperApp()),
    ),
  );
}

class WhisperApp extends ConsumerWidget {
  const WhisperApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final router = ref.watch(appRouterProvider);

    // Show a loading splash while restoring session
    if (authState.status == AuthStatus.initial ||
        authState.status == AuthStatus.loading) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const _SplashScreen(),
      );
    }

    return MaterialApp.router(
      title: 'Whisper',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}

/// Splash screen shown while restoring session
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, Color(0xFFE76F51)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withOpacity(0.3),
                    blurRadius: 28,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(Icons.chat_bubble_rounded,
                  color: Colors.white, size: 32),
            ),
            const SizedBox(height: 20),
            Text(
              'Whisper',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppTheme.primary.withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
