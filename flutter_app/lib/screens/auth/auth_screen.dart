import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen>
    with SingleTickerProviderStateMixin {
  bool _isLogin = true;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _toggleMode() {
    _animController.reset();
    setState(() {
      _isLogin = !_isLogin;
      _usernameController.clear();
      _passwordController.clear();
      _confirmController.clear();
    });
    _animController.forward();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (_isLogin) {
      await ref.read(authProvider.notifier).login(
            username: username,
            password: password,
          );
    } else {
      await ref.read(authProvider.notifier).register(
            username: username,
            password: password,
          );
    }
  }

  Future<void> _handleGoogleSignIn() async {
    await ref.read(authProvider.notifier).signInWithGoogle();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.status == AuthStatus.loading;
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: Stack(
        children: [
          // ── Ambient glow orbs ─────────────────────────────────────────
          Positioned(
            top: -screenSize.height * 0.12,
            left: -screenSize.width * 0.3,
            child: Container(
              width: screenSize.width * 0.8,
              height: screenSize.width * 0.8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  AppTheme.primary.withOpacity(0.18),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          Positioned(
            bottom: -screenSize.height * 0.1,
            right: -screenSize.width * 0.25,
            child: Container(
              width: screenSize.width * 0.7,
              height: screenSize.width * 0.7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF7C3AED).withOpacity(0.12),
                  Colors.transparent,
                ]),
              ),
            ),
          ),

          // ── Main content ──────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // ── Logo ─────────────────────────────────────────
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppTheme.primary,
                                Color(0xFFE76F51),
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.35),
                                blurRadius: 32,
                                spreadRadius: 4,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.chat_bubble_rounded,
                            color: Colors.white,
                            size: 36,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── App title ────────────────────────────────────
                        Text(
                          'Whisper',
                          style: Theme.of(context)
                              .textTheme
                              .headlineLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _isLogin
                              ? 'Welcome back. Sign in to continue.'
                              : 'Create your account to get started.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 36),

                        // ── Glass card ──────────────────────────────────
                        ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                            child: Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.08),
                                ),
                              ),
                              child: Form(
                                key: _formKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // ── Username field ──────────────────
                                    _buildInputField(
                                      controller: _usernameController,
                                      label: 'Username',
                                      icon: Icons.person_outline_rounded,
                                      validator: (val) {
                                        if (val == null || val.trim().isEmpty) {
                                          return 'Enter a username';
                                        }
                                        if (val.trim().length < 3) {
                                          return 'At least 3 characters';
                                        }
                                        return null;
                                      },
                                    ),
                                    const SizedBox(height: 16),

                                    // ── Password field ──────────────────
                                    _buildInputField(
                                      controller: _passwordController,
                                      label: 'Password',
                                      icon: Icons.lock_outline_rounded,
                                      obscure: _obscurePassword,
                                      toggleObscure: () => setState(
                                          () => _obscurePassword = !_obscurePassword),
                                      validator: (val) {
                                        if (val == null || val.isEmpty) {
                                          return 'Enter a password';
                                        }
                                        if (val.length < 6) {
                                          return 'At least 6 characters';
                                        }
                                        return null;
                                      },
                                    ),

                                    // ── Confirm password (Register only) ─
                                    if (!_isLogin) ...[
                                      const SizedBox(height: 16),
                                      _buildInputField(
                                        controller: _confirmController,
                                        label: 'Confirm Password',
                                        icon: Icons.lock_rounded,
                                        obscure: _obscureConfirm,
                                        toggleObscure: () => setState(
                                            () => _obscureConfirm = !_obscureConfirm),
                                        validator: (val) {
                                          if (val != _passwordController.text) {
                                            return 'Passwords do not match';
                                          }
                                          return null;
                                        },
                                      ),
                                    ],

                                    // ── Error message ──────────────────
                                    if (authState.errorMessage != null) ...[
                                      const SizedBox(height: 16),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 12, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: AppTheme.errorRed.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: AppTheme.errorRed.withOpacity(0.3),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.error_outline_rounded,
                                                color: AppTheme.errorRed, size: 18),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                authState.errorMessage!,
                                                style: const TextStyle(
                                                  color: AppTheme.errorRed,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],

                                    const SizedBox(height: 24),

                                    // ── Submit button ──────────────────
                                    _buildSubmitButton(isLoading),

                                    const SizedBox(height: 20),

                                    // ── Divider ────────────────────────
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Divider(
                                            color: Colors.white.withOpacity(0.08),
                                            thickness: 1,
                                          ),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                          child: Text(
                                            'or continue with',
                                            style: TextStyle(
                                              color: Colors.white.withOpacity(0.3),
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: Divider(
                                            color: Colors.white.withOpacity(0.08),
                                            thickness: 1,
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 16),

                                    // ── Google Sign-In button ──────────
                                    _buildGoogleButton(isLoading),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── Toggle Login/Register ───────────────────────
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _isLogin
                                  ? "Don't have an account?"
                                  : 'Already have an account?',
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                            TextButton(
                              onPressed: isLoading ? null : _toggleMode,
                              style: TextButton.styleFrom(
                                foregroundColor: AppTheme.primary,
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 6),
                              ),
                              child: Text(
                                _isLogin ? 'Register' : 'Sign In',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Google Sign-In Button ────────────────────────────────────────────────────
  Widget _buildGoogleButton(bool isLoading) {
    return GestureDetector(
      onTap: isLoading ? null : _handleGoogleSignIn,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        height: 54,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.white.withOpacity(isLoading ? 0.04 : 0.08),
          border: Border.all(color: Colors.white.withOpacity(0.12)),
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _GoogleColorIcon(),
                    const SizedBox(width: 10),
                    const Text(
                      'Continue with Google',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  // ── Input Field ──────────────────────────────────────────────────────────────
  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscure = false,
    VoidCallback? toggleObscure,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: validator,
      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.textSecondary, size: 20),
        suffixIcon: toggleObscure != null
            ? IconButton(
                icon: Icon(
                  obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                  color: AppTheme.textSecondary,
                  size: 20,
                ),
                onPressed: toggleObscure,
              )
            : null,
        filled: true,
        fillColor: Colors.white.withOpacity(0.04),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.errorRed),
        ),
      ),
    );
  }

  // ── Submit Button ────────────────────────────────────────────────────────────
  Widget _buildSubmitButton(bool isLoading) {
    return GestureDetector(
      onTap: isLoading ? null : _submit,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        height: 54,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [AppTheme.primary, Color(0xFFE76F51)],
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withOpacity(isLoading ? 0.1 : 0.35),
              blurRadius: isLoading ? 8 : 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : Text(
                  _isLogin ? 'Sign In' : 'Create Account',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
        ),
      ),
    );
  }
}

// ── Google "G" coloured icon ──────────────────────────────────────────────────
class _GoogleColorIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // Blue segment
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      -0.5, 2.0, true, paint,
    );

    // Green segment
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      1.5, 1.6, true, paint,
    );

    // Yellow segment
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      3.1, 1.1, true, paint,
    );

    // Red segment
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      4.2, 1.0, true, paint,
    );

    // White center
    paint.color = const Color(0xFF0D0D1A);
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width * 0.3,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
