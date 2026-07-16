import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_icons.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../widgets/network_photo.dart';
import '../presentation_controller.dart';
import 'live_preview.dart';

/// Persistent bar shown whenever a product is live on the display. Makes the
/// "what the customer currently sees" state always visible to the salesperson,
/// and offers quick access to the live preview and to end the presentation.
class NowShowingBar extends StatelessWidget {
  const NowShowingBar({super.key});

  @override
  Widget build(BuildContext context) {
    final PresentationController pres = context.watch<PresentationController>();
    if (!pres.isPresenting || pres.product == null) {
      return const SizedBox.shrink();
    }
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final variant = pres.product!.variantById(pres.presentation?.variantId);

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Material(
          color: c.primary,
          borderRadius: AppRadius.brLg,
          child: InkWell(
            borderRadius: AppRadius.brLg,
            onTap: () => LivePreviewSheet.show(context),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xs),
              child: Row(
                children: <Widget>[
                  ClipRRect(
                    borderRadius: AppRadius.brSm,
                    child: SizedBox(
                      width: 44,
                      height: 44,
                      child: NetworkPhoto(url: variant.images.firstOrNull?.url),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Icon(AppIcons.connected, size: 14, color: c.accent),
                            const SizedBox(width: 4),
                            Text(
                              'ON SCREEN',
                              style: AppTypography.eyebrow(c.accent),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          pres.product!.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: t.titleSmall?.copyWith(color: c.onPrimary),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(AppIcons.disconnect, color: c.onPrimary),
                    tooltip: 'Return to Welcome',
                    onPressed: () =>
                        context.read<PresentationController>().hideProduct(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
