import React from 'react';
import { Text, TextStyle, View } from 'react-native';
import { Money } from '../models/money';
import { useTheme } from '../theme/ThemeProvider';

/// Renders a product price with the base price struck through whenever the
/// effective price is genuinely lower. Ported from the Flutter `PriceTag`.
export function PriceTag({
  base,
  effective,
  style,
}: {
  base: Money;
  effective: Money;
  style?: TextStyle;
}) {
  const { colors, text } = useTheme();
  const priceStyle: TextStyle = style ?? text.titleMedium;
  const discounted = base.minorUnits > effective.minorUnits;

  if (!discounted) {
    return <Text style={priceStyle}>{effective.formatted}</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
      <Text style={priceStyle}>{effective.formatted}</Text>
      <Text
        style={[
          priceStyle,
          {
            marginLeft: 8,
            color: colors.textTertiary,
            fontWeight: '400',
            textDecorationLine: 'line-through',
            textDecorationColor: colors.textTertiary,
          },
        ]}
      >
        {base.formatted}
      </Text>
    </View>
  );
}
