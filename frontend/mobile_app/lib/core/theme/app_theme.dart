import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';
import 'app_radius.dart';
import 'app_sizes.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

/// Central theme factory — the only place [ThemeData] is constructed.
/// Everything derives from [AppColors] tokens; re-skinning means editing tokens.
abstract final class AppTheme {
  static ThemeData light() => _build(AppColors.light);
  static ThemeData dark() => _build(AppColors.dark);

  static ThemeData _build(AppColors c) {
    final bool isDark = c.brightness == Brightness.dark;
    final TextTheme text = AppTypography.textTheme(c.textPrimary);

    final ColorScheme scheme = ColorScheme(
      brightness: c.brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      secondary: c.accent,
      onSecondary: c.onAccent,
      tertiary: c.secondary,
      onTertiary: c.onSecondary,
      error: c.error,
      onError: c.onStatus,
      surface: c.surface,
      onSurface: c.textPrimary,
      surfaceContainerLowest: c.background,
      surfaceContainerLow: c.surface,
      surfaceContainer: c.surfaceElevated,
      surfaceContainerHigh: c.surfaceElevated,
      surfaceContainerHighest: c.surfaceElevated,
      onSurfaceVariant: c.textSecondary,
      outline: c.border,
      outlineVariant: c.divider,
      scrim: c.scrim,
      shadow: const Color(0xFF000000),
      inverseSurface: c.primary,
      onInverseSurface: c.onPrimary,
      inversePrimary: c.accent,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: c.brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.background,
      canvasColor: c.background,
      splashColor: c.pressed,
      highlightColor: c.hover,
      hoverColor: c.hover,
      dividerColor: c.divider,
      textTheme: text,
      primaryColor: c.primary,
      extensions: <ThemeExtension<dynamic>>[AppColorsExtension(c)],
      appBarTheme: AppBarTheme(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        color: c.card,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.brLg,
          side: BorderSide(color: c.border),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      filledButtonTheme: FilledButtonThemeData(style: _primaryButton(c, text)),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: _primaryButton(c, text),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          minimumSize: const WidgetStatePropertyAll<Size>(
            Size(0, AppSizes.buttonMd),
          ),
          foregroundColor: WidgetStatePropertyAll<Color>(c.textPrimary),
          side: WidgetStatePropertyAll<BorderSide>(BorderSide(color: c.border)),
          textStyle: WidgetStatePropertyAll<TextStyle>(text.labelLarge!),
          padding: const WidgetStatePropertyAll<EdgeInsets>(
            EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          ),
          shape: const WidgetStatePropertyAll<OutlinedBorder>(
            RoundedRectangleBorder(borderRadius: AppRadius.brMd),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
          foregroundColor: WidgetStatePropertyAll<Color>(c.textPrimary),
          textStyle: WidgetStatePropertyAll<TextStyle>(text.labelLarge!),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        hintStyle: text.bodyMedium?.copyWith(color: c.textTertiary),
        labelStyle: text.bodyMedium?.copyWith(color: c.textSecondary),
        prefixIconColor: c.textSecondary,
        suffixIconColor: c.textSecondary,
        border: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: BorderSide(color: c.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: BorderSide(color: c.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: BorderSide(color: c.focus, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: BorderSide(color: c.error),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: c.accent.withValues(alpha: 0.16),
        elevation: 0,
        height: 68,
        labelTextStyle: WidgetStatePropertyAll<TextStyle>(text.labelSmall!),
        iconTheme: WidgetStateProperty.resolveWith(
          (Set<WidgetState> states) => IconThemeData(
            size: AppSizes.iconMd,
            color: states.contains(WidgetState.selected)
                ? c.textPrimary
                : c.textTertiary,
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surfaceElevated,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brXl),
        titleTextStyle: text.headlineSmall,
        contentTextStyle: text.bodyMedium?.copyWith(color: c.textSecondary),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surfaceElevated,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        modalBarrierColor: c.overlay,
        showDragHandle: true,
        dragHandleColor: c.border,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: AppRadius.rXl),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.primary,
        contentTextStyle: text.bodyMedium?.copyWith(color: c.onPrimary),
        actionTextColor: c.accent,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brMd),
        insetPadding: const EdgeInsets.all(AppSpacing.md),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: c.surface,
        selectedColor: c.primary,
        checkmarkColor: c.onPrimary,
        side: BorderSide(color: c.border),
        // Selected chips fill with `primary`, so the label must flip to
        // `onPrimary` or it renders dark-on-dark and disappears.
        labelStyle: text.labelMedium!.copyWith(
          color: WidgetStateColor.resolveWith(
            (Set<WidgetState> states) => states.contains(WidgetState.selected)
                ? c.onPrimary
                : c.textPrimary,
          ),
        ),
        secondaryLabelStyle: text.labelMedium!.copyWith(color: c.onPrimary),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brPill),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.primary,
          borderRadius: AppRadius.brSm,
        ),
        textStyle: text.labelSmall?.copyWith(color: c.onPrimary),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (Set<WidgetState> s) =>
              s.contains(WidgetState.selected) ? c.onAccent : c.surface,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (Set<WidgetState> s) =>
              s.contains(WidgetState.selected) ? c.accent : c.disabled,
        ),
        trackOutlineColor: WidgetStatePropertyAll<Color>(c.border),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (Set<WidgetState> s) =>
              s.contains(WidgetState.selected) ? c.primary : Colors.transparent,
        ),
        checkColor: WidgetStatePropertyAll<Color>(c.onPrimary),
        side: BorderSide(color: c.border, width: 1.5),
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brSm),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (Set<WidgetState> s) =>
              s.contains(WidgetState.selected) ? c.primary : c.border,
        ),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: c.primary,
        inactiveTrackColor: c.disabled,
        thumbColor: c.primary,
        overlayColor: c.primary.withValues(alpha: 0.12),
        trackHeight: 2,
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: c.textPrimary,
        unselectedLabelColor: c.textTertiary,
        labelStyle: text.titleSmall,
        unselectedLabelStyle: text.titleSmall,
        indicatorColor: c.accent,
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
      ),
      dividerTheme: DividerThemeData(color: c.divider, thickness: 1, space: 1),
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStatePropertyAll<Color>(c.border),
        radius: AppRadius.rPill,
        thickness: const WidgetStatePropertyAll<double>(4),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: c.textSecondary,
        textColor: c.textPrimary,
        titleTextStyle: text.titleMedium,
        subtitleTextStyle: text.bodySmall?.copyWith(color: c.textSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brMd),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        elevation: 0,
        focusElevation: 0,
        hoverElevation: 0,
        highlightElevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brLg),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.accent,
        linearTrackColor: c.disabled,
        circularTrackColor: c.disabled,
        linearMinHeight: 2,
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: c.surfaceElevated,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.brMd,
          side: BorderSide(color: c.border),
        ),
        textStyle: text.bodyMedium,
      ),
      iconTheme: IconThemeData(color: c.textPrimary, size: AppSizes.iconMd),
    );
  }

  static ButtonStyle _primaryButton(AppColors c, TextTheme text) => ButtonStyle(
    minimumSize: const WidgetStatePropertyAll<Size>(Size(0, AppSizes.buttonMd)),
    backgroundColor: WidgetStateProperty.resolveWith(
      (Set<WidgetState> s) =>
          s.contains(WidgetState.disabled) ? c.disabled : c.primary,
    ),
    foregroundColor: WidgetStateProperty.resolveWith(
      (Set<WidgetState> s) =>
          s.contains(WidgetState.disabled) ? c.onDisabled : c.onPrimary,
    ),
    overlayColor: WidgetStatePropertyAll<Color>(
      c.onPrimary.withValues(alpha: 0.08),
    ),
    textStyle: WidgetStatePropertyAll<TextStyle>(text.labelLarge!),
    padding: const WidgetStatePropertyAll<EdgeInsets>(
      EdgeInsets.symmetric(horizontal: AppSpacing.xl),
    ),
    elevation: const WidgetStatePropertyAll<double>(0),
    shape: const WidgetStatePropertyAll<OutlinedBorder>(
      RoundedRectangleBorder(borderRadius: AppRadius.brMd),
    ),
  );
}
