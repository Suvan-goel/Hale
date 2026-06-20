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
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { SettingsIcon } from '../navigation/icons';
import { colors, componentStyles, fonts, minTapTarget, radius, shadow, spacing, type } from '../theme';

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
export const ScreenContainer = Screen;

export type TypographyVariant = keyof typeof type;

export function Typography({
  variant = 'body',
  color,
  align,
  children,
  style,
  ...textProps
}: TextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}) {
  return (
    <Text
      {...textProps}
      style={[
        type[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const HaleText = Typography;

export type CardVariant = 'base' | 'elevated' | 'flat' | 'feature';

export function Card({
  children,
  style,
  variant = 'base',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
}) {
  return <View style={[componentStyles.card[variant], style]}>{children}</View>;
}

export const PremiumCard = Card;
export const HaleCard = Card;

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

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        componentStyles.button.base,
        componentStyles.button[variant],
        disabled && styles.disabled,
        pressed && !disabled && (variant === 'primary' ? styles.primaryPressed : styles.pressed),
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={disabled ? { disabled } : undefined}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
          variant === 'ghost' && styles.ghostButtonText,
          variant === 'danger' && styles.dangerButtonText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  accessibilityLabel,
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return <Button title={title} onPress={onPress} accessibilityLabel={accessibilityLabel} style={style} disabled={disabled} />;
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
  return <Button title={title} onPress={onPress} variant="secondary" accessibilityLabel={accessibilityLabel} style={style} />;
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <Button title={title} onPress={onPress} variant="ghost" />;
}

export function HaleButton({
  title,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (variant === 'secondary') {
    return <SecondaryButton title={title} onPress={onPress} accessibilityLabel={accessibilityLabel} style={style} />;
  }
  if (variant === 'ghost') {
    return <GhostButton title={title} onPress={onPress} />;
  }
  return <PrimaryButton title={title} onPress={onPress} accessibilityLabel={accessibilityLabel} style={style} />;
}

export function Input({
  label,
  helperText,
  errorText,
  containerStyle,
  inputStyle,
  multiline,
  placeholderTextColor = colors.textTertiary,
  accessibilityLabel,
  onBlur,
  onFocus,
  ...inputProps
}: TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}) {
  const [focused, setFocused] = React.useState(false);
  const describedBy = errorText ?? helperText;
  return (
    <View style={[componentStyles.input.field, containerStyle]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={placeholderTextColor}
        accessibilityLabel={accessibilityLabel ?? label}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        style={[
          styles.input,
          multiline && componentStyles.input.multiline,
          focused && styles.inputFocused,
          errorText && componentStyles.input.error,
          inputStyle,
        ]}
      />
      {describedBy ? (
        <Text style={[styles.inputHelp, errorText && styles.inputError]}>{describedBy}</Text>
      ) : null}
    </View>
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

export function SettingsIconButton({
  onPress,
  accessibilityLabel = 'Open settings',
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <SettingsIcon size={22} color={colors.accentDeep} />
    </Pressable>
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
  return <Chip label={label} selected={selected} onPress={onPress} />;
}

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
      {label}
    </Text>
  );
  if (!onPress) return <View style={[componentStyles.chip.base, selected && componentStyles.chip.selected, style]}>{content}</View>;
  return (
    <Pressable
      style={({ pressed }) => [
        componentStyles.chip.base,
        selected && componentStyles.chip.selected,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmentedTabs, style]} accessibilityRole="tablist">
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={({ pressed }) => [
            styles.segmentedTab,
            option.value === value && styles.segmentedTabActive,
            pressed && styles.pressed,
          ]}
          onPress={() => onChange(option.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === value }}
          accessibilityLabel={option.label}
        >
          <Text style={[styles.segmentedTabText, option.value === value && styles.segmentedTabTextActive]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
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

export function ListRow({
  title,
  subtitle,
  value,
  status,
  leading,
  trailing,
  onPress,
  variant = 'base',
  selected,
  style,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  status?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  variant?: 'base' | 'inset';
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      {leading ? <View style={styles.listLeading}>{leading}</View> : null}
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      </View>
      {value || status ? (
        <View style={styles.listMeta}>
          {value ? <Text style={styles.listValue}>{value}</Text> : null}
          {status ? <Text style={styles.listStatus}>{status}</Text> : null}
        </View>
      ) : null}
      {trailing}
    </>
  );
  if (!onPress) return <View style={[componentStyles.listRow[variant], style]}>{content}</View>;
  return (
    <Pressable
      style={({ pressed }) => [componentStyles.listRow[variant], pressed && styles.pressed, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}${subtitle ? `: ${subtitle}` : ''}`}
      accessibilityState={selected ? { selected } : undefined}
    >
      {content}
    </Pressable>
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
        <Circle cx={center} cy={center} r={r} stroke={colors.sageMist} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.oliveSage}
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

export const ProgressRing = MetricRing;

export function ProgressBar({
  progress,
  accessibilityLabel,
  style,
}: {
  progress: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[componentStyles.progress.track, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[componentStyles.progress.fill, { width: `${clamped * 100}%` }]} />
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

export const PremiumListRow = DailyPlanItem;

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
    <Card style={styles.emptyCard}>
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
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  header: { gap: spacing.xs },
  headerTitle: { ...type.pageTitle },
  headerSubtitle: { ...type.pageSubtitle, maxWidth: 460 },
  iconButton: {
    width: minTapTarget,
    height: minTapTarget,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevatedCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warmBorder,
  },
  sectionHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: { ...type.cardTitle },
  sectionAction: { minHeight: 32, justifyContent: 'center' },
  sectionActionText: { ...type.label, color: colors.accentDeep },
  card: {
    ...componentStyles.card.base,
  },
  materialCard: {
    ...componentStyles.card.elevated,
  },
  buttonText: { ...type.button },
  primaryButtonText: { color: colors.buttonText },
  secondaryButtonText: { ...type.button, color: colors.accentDeep },
  ghostButtonText: { ...type.bodySmall, fontFamily: fonts.sansMedium, color: colors.accentDeep },
  dangerButtonText: { ...type.button, color: colors.error },
  disabled: { opacity: 0.52 },
  input: { ...type.body, ...componentStyles.input.base },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputLabel: { ...type.caption, color: colors.textSecondary },
  inputHelp: { ...type.caption, color: colors.textTertiary },
  inputError: { color: colors.error },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: minTapTarget,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  primaryPressed: { backgroundColor: colors.accentHover, transform: [{ scale: 0.99 }] },
  primaryText: { ...type.button },
  secondary: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: minTapTarget,
    borderRadius: radius.button,
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
  chipText: { ...type.caption, fontFamily: fonts.sansMedium, color: colors.textSecondary },
  chipTextSelected: { color: colors.accentDeep },
  segmentedTabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  segmentedTab: {
    minHeight: 42,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -StyleSheet.hairlineWidth,
  },
  segmentedTabActive: {
    borderBottomColor: colors.accent,
  },
  segmentedTabText: { ...type.bodySmall, fontFamily: fonts.sansMedium, color: colors.textMuted },
  segmentedTabTextActive: { color: colors.accent },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  badgeGood: { backgroundColor: colors.accentSoft, borderColor: colors.border },
  badgeAttention: { backgroundColor: colors.cautionSoft, borderColor: colors.cautionBorder },
  badgeGold: { backgroundColor: colors.surface, borderColor: colors.goldBorder },
  badgeText: { ...type.caption, fontFamily: fonts.sansMedium, color: colors.textSecondary },
  badgeGoodText: { color: colors.accentDeep },
  badgeAttentionText: { color: colors.caution },
  badgeGoldText: { color: colors.accentDeep },
  metricCard: {
    flex: 1,
    minWidth: 150,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.bgMaterial,
    gap: spacing.sm,
  },
  metricLabel: { ...type.cardCaption },
  metricValue: { ...type.cardTitle, fontVariant: ['tabular-nums'] },
  metricFooter: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  metricDetail: { ...type.caption, color: colors.textTertiary, flex: 1 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringValue: { ...type.h2, fontVariant: ['tabular-nums'], color: colors.accentDeep },
  ringLabel: { ...type.caption, color: colors.sageDeep, marginTop: -2 },
  listLeading: { alignItems: 'center', justifyContent: 'center' },
  listCopy: { flex: 1, minWidth: 0 },
  listTitle: { ...type.cardRowTitle },
  listSubtitle: { ...type.cardCaption, marginTop: 2 },
  listMeta: { alignItems: 'flex-end', maxWidth: 140 },
  listValue: { ...type.bodySmall, fontFamily: fonts.sansMedium, color: colors.accentDeep, textAlign: 'right' },
  listStatus: { ...type.caption, color: colors.textTertiary, marginTop: 2, textAlign: 'right' },
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
    borderRadius: radius.input,
    backgroundColor: colors.sageMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconGreen: { backgroundColor: colors.accentSoft },
  planIconGold: { backgroundColor: colors.bgGold },
  planIconCream: { backgroundColor: colors.bgElevated },
  planIconText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.accentDeep },
  planText: { flex: 1 },
  planTitle: { ...type.cardRowTitle },
  planSubtitle: { ...type.cardCaption, marginTop: 2 },
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
    borderRadius: radius.sm,
    backgroundColor: colors.sageMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthIconText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.accentDeep },
  healthLabel: { ...type.cardRowTitle, flex: 1 },
  healthValueWrap: { alignItems: 'flex-end', maxWidth: 136 },
  healthValue: { ...type.cardRowTitle, fontVariant: ['tabular-nums'] },
  healthStatus: { ...type.cardCaption, color: colors.sageDeep, marginTop: 2, textAlign: 'right' },
  emptyCard: {
    gap: spacing.md,
  },
  emptyTitle: { ...type.cardTitle },
  emptyBody: { ...type.cardBody },
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
