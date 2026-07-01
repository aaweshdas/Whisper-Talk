import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ── Brand Colors ──────────────────────────────────────────────────────────
  static const Color primary = Color(0xFFF4A261);
  static const Color primaryDark = Color(0xFFE76F51);
  static const Color surface = Color(0xFF0D0D0F);
  static const Color surfaceCard = Color(0xFF1A1A2E);
  static const Color surfaceGlass = Color(0x1AFFFFFF);
  static const Color borderGlass = Color(0x33FFFFFF);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color onlineGreen = Color(0xFF22C55E);
  static const Color errorRed = Color(0xFFEF4444);

  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: surface,
        colorScheme: const ColorScheme.dark(
          primary: primary,
          secondary: primaryDark,
          surface: surface,
          error: errorRed,
          onPrimary: surface,
          onSecondary: surface,
          onSurface: textPrimary,
        ),
        textTheme: GoogleFonts.interTextTheme(
          const TextTheme(
            displayLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
            displayMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
            headlineLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
            headlineMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
            titleLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
            titleMedium: TextStyle(color: textPrimary),
            bodyLarge: TextStyle(color: textPrimary),
            bodyMedium: TextStyle(color: textSecondary),
            labelLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: surface,
          elevation: 0,
          centerTitle: true,
          iconTheme: IconThemeData(color: textPrimary),
          titleTextStyle: TextStyle(
            color: textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surfaceGlass,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: borderGlass),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: borderGlass),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: primary, width: 2),
          ),
          hintStyle: const TextStyle(color: textSecondary),
          labelStyle: const TextStyle(color: textSecondary),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: surface,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: surfaceCard,
          selectedItemColor: primary,
          unselectedItemColor: textSecondary,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
        ),
      );
}
