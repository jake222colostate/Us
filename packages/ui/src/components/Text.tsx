import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

type Props = RNTextProps & {
  weight?: Weight;
  muted?: boolean;
};

const weightToFont: Record<Weight, string> = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const Text: React.FC<Props> = ({ weight = 'regular', muted, style, ...rest }) => {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        {
          color: muted ? theme.colors.textMuted : theme.colors.text,
          fontFamily: weightToFont[weight],
          fontWeight: weight === 'regular' ? '400' : weight === 'medium' ? '500' : '600',
        },
        style,
      ]}
    />
  );
};
