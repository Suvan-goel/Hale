/**
 * Shared UI primitives built on src/theme. These are deliberately small:
 * enough structure to make the app feel like one product, without adding a UI
 * dependency or changing the existing navigation/data model.
 */

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts, minTapTarget, radius, shadow, spacing, type } from '../theme';

export function Screen({
  children,
  contentStyle,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export const AppScreen = Screen;

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export const PremiumCard = Card;

export function MaterialCard({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.materialCard, pressed && styles.pressed, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.materialCard, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.secondary, pressed && styles.pressed, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Text style={styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={type.label}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <Text style={[styles.pillText, selected && styles.pillTextSelected]} numberOfLines={1}>
      {label}
    </Text>
  );
  if (!onPress) return <View style={[styles.pill, selected && styles.pillSelected]}>{content}</View>;
  return (
    <Pressable
      style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'good' | 'attention' | 'gold';
}) {
  return (
    <View style={[styles.badge, tone === 'good' && styles.badgeGood, tone === 'attention' && styles.badgeAttention, tone === 'gold' && styles.badgeGold]}>
      <Text
        style={[
          styles.badgeText,
          tone === 'good' && styles.badgeGoodText,
          tone === 'attention' && styles.badgeAttentionText,
          tone === 'gold' && styles.badgeGoldText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: string;
  detail?: string;
  status?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.metricFooter}>
        {detail ? <Text style={styles.metricDetail}>{detail}</Text> : <View />}
        {status ? <StatusBadge label={status} tone="good" /> : null}
      </View>
    </View>
  );
}

export function MetricRing({
  progress,
  label,
  value,
  size = 118,
}: {
  progress: number;
  label?: string;
  value?: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = 13;
  const center = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={colors.accentSoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.sage}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </Svg>
      <View style={styles.ringCenter}>
        {value ? <Text style={styles.ringValue}>{value}</Text> : null}
        {label ? <Text style={styles.ringLabel}>{label}</Text> : null}
      </View>
    </View>
  );
}

export function DailyPlanItem({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'sage',
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  tone?: 'sage' | 'green' | 'gold' | 'cream';
}) {
  const row = (
    <>
      <View
        style={[
          styles.planIcon,
          tone === 'green' && styles.planIconGreen,
          tone === 'gold' && styles.planIconGold,
          tone === 'cream' && styles.planIconCream,
        ]}
      >
        <Text style={styles.planIconText}>{icon}</Text>
      </View>
      <View style={styles.planText}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planSubtitle}>{subtitle}</Text>
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );
  if (!onPress) return <View style={styles.planRow}>{row}</View>;
  return (
    <Pressable
      style={({ pressed }) => [styles.planRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
    >
      {row}
    </Pressable>
  );
}

export function HealthMetricRow({
  label,
  value,
  status,
  icon,
}: {
  label: string;
  value: string;
  status?: string;
  icon?: string;
}) {
  return (
    <View style={styles.healthRow}>
      {icon ? (
        <View style={styles.healthIcon}>
          <Text style={styles.healthIconText}>{icon}</Text>
        </View>
      ) : null}
      <Text style={styles.healthLabel}>{label}</Text>
      <View style={styles.healthValueWrap}>
        <Text style={styles.healthValue}>{value}</Text>
        {status ? <Text style={styles.healthStatus}>{status}</Text> : null}
      </View>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? <PrimaryButton title={actionLabel} onPress={onAction} style={styles.emptyButton} /> : null}
    </Card>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderHairline, true: colors.sage }}
        thumbColor={value ? colors.accent : colors.bgSurface}
        ios_backgroundColor={colors.borderHairline}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  screenContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
    gap: spacing.xl,
  },
  header: { gap: spacing.sm },
  headerTitle: { ...type.display },
  headerSubtitle: { ...type.body, color: colors.textSecondary, maxWidth: 320 },
  sectionHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: { ...type.h2 },
  sectionAction: { minHeight: 32, justifyContent: 'center' },
  sectionActionText: { ...type.label, color: colors.accentDeep },
  card: {
    padding: spacing.xxl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  materialCard: {
    padding: spacing.xxl,
    borderRadius: radius.panel,
    backgroundColor: colors.bgMaterial,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    ...shadow.lifted,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: minTapTarget,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lifted,
  },
  primaryPressed: { backgroundColor: colors.accentDeep, transform: [{ scale: 0.99 }] },
  primaryText: { ...type.button },
  secondary: {
    backgroundColor: colors.bgSurface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: minTapTarget,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  secondaryText: { ...type.button, color: colors.accentDeep },
  ghost: {
    paddingVertical: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
  },
  ghostText: { ...type.bodySmall, color: colors.accentDeep },
  pill: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  pillSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { ...type.caption, fontFamily: fonts.sansMedium, color: colors.textSecondary },
  pillTextSelected: { color: colors.onAccent },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  badgeGood: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  badgeAttention: { backgroundColor: colors.cautionSoft, borderColor: colors.cautionBorder },
  badgeGold: { backgroundColor: colors.bgGold, borderColor: colors.goldBorder },
  badgeText: { ...type.label, color: colors.textSecondary },
  badgeGoodText: { color: colors.accentDeep },
  badgeAttentionText: { color: colors.caution },
  badgeGoldText: { color: colors.accentDeep },
  metricCard: {
    flex: 1,
    minWidth: 136,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    gap: spacing.sm,
  },
  metricLabel: { ...type.caption },
  metricValue: { ...type.h1, fontVariant: ['tabular-nums'] },
  metricFooter: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  metricDetail: { ...type.caption, color: colors.textTertiary, flex: 1 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringValue: { ...type.h2, fontVariant: ['tabular-nums'], color: colors.accentDeep },
  ringLabel: { ...type.caption, color: colors.sageDeep, marginTop: -2 },
  planRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconGreen: { backgroundColor: colors.accentSoft },
  planIconGold: { backgroundColor: colors.bgGold },
  planIconCream: { backgroundColor: colors.bgElevated },
  planIconText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.accentDeep },
  planText: { flex: 1 },
  planTitle: { ...type.h3 },
  planSubtitle: { ...type.caption, marginTop: 2 },
  chevron: { ...type.h2, color: colors.textTertiary },
  healthRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  healthIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthIconText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.accentDeep },
  healthLabel: { ...type.bodySmall, flex: 1 },
  healthValueWrap: { alignItems: 'flex-end', maxWidth: 136 },
  healthValue: { ...type.bodySmall, fontFamily: fonts.sansMedium, fontVariant: ['tabular-nums'] },
  healthStatus: { ...type.caption, color: colors.sageDeep, marginTop: 2, textAlign: 'right' },
  emptyTitle: { ...type.h2 },
  emptyBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  emptyButton: { marginTop: spacing.lg },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    minHeight: minTapTarget,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  toggleText: { flex: 1 },
  toggleLabel: { ...type.bodySmall, fontFamily: fonts.sansMedium },
  toggleDesc: { ...type.caption, marginTop: 2 },
});
