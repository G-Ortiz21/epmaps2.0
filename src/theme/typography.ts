import type { TextStyle } from 'react-native';

export const fontSizes = {
  title: 28,
  section: 20,
  value: 36,
  body: 16,
  technical: 15,
  label: 14,
  caption: 12,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const lineHeights = {
  title: 34,
  section: 26,
  value: 44,
  body: 24,
  technical: 20,
  label: 20,
  caption: 16,
} as const;

export const typography = {
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.title,
  },
  section: {
    fontSize: fontSizes.section,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.section,
  },
  value: {
    fontSize: fontSizes.value,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.value,
  },
  body: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
  },
  technical: {
    fontFamily: 'monospace',
    fontSize: fontSizes.technical,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.technical,
  },
  label: {
    fontSize: fontSizes.label,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.label,
  },
  caption: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.caption,
  },
} satisfies Record<string, TextStyle>;