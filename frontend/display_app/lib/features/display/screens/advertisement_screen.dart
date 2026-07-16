import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/mock_catalog.dart';
import '../../../models/product.dart';
import '../../../widgets/network_photo.dart';

/// Idle advertisement loop: full-bleed campaign imagery from the collection,
/// cross-fading slowly with an editorial caption.
class AdvertisementScreen extends StatefulWidget {
  const AdvertisementScreen({super.key});

  @override
  State<AdvertisementScreen> createState() => _AdvertisementScreenState();
}

class _AdvertisementScreenState extends State<AdvertisementScreen> {
  final List<Product> _items = MockCatalog.products;
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      setState(() => _index = (_index + 1) % _items.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final Product item = _items[_index];

    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        AnimatedSwitcher(
          duration: AppMotion.display,
          child: NetworkPhoto(
            key: ValueKey<String>(item.id),
            url: item.heroImage,
          ),
        ),
        const _Scrim(),
        Padding(
          padding: const EdgeInsets.all(AppSpacing.giant),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'THE AUTUMN COLLECTION',
                style: AppTypography.eyebrow(c.accent),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                item.name,
                style: AppTypography.displayHero(
                  Colors.white,
                ).copyWith(fontSize: 64),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                item.brand,
                style: t.titleMedium?.copyWith(color: Colors.white70),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Scrim extends StatelessWidget {
  const _Scrim();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[Colors.transparent, Colors.black87],
          stops: <double>[0.45, 1],
        ),
      ),
    );
  }
}
