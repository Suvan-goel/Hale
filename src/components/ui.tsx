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
import Svg, { Path } from 'react-native-svg';

import { AppBackground } from './AppBackground';
import { PageHeader } from './PageHeader';
import { useSystemInsets } from './SystemInsetsProvider';
import { colors, componentStyles, fonts, minTapTarget, radius, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

const ScreenScrollClearanceContext = React.createContext(0);

export function ScreenScrollClearanceProvider({
  bottom = 0,
  children,
}: {
  bottom?: number;
  children: React.ReactNode;
}) {
  return (
    <ScreenScrollClearanceContext.Provider value={bottom}>
      {children}
    </ScreenScrollClearanceContext.Provider>
  );
}

export function useScreenScrollClearance(): number {
  return React.useContext(ScreenScrollClearanceContext);
}

export function Screen({
  children,
  contentStyle,
  tone = 'default',
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  tone?: 'default' | 'focus';
}) {
  const responsive = useResponsiveLayout();
  const systemInsets = useSystemInsets();
  const bottomScrollClearance = React.useContext(ScreenScrollClearanceContext);
  const paddingBottom =
    bottomScrollClearance > 0
      ? bottomScrollClearance
      : responsive.pageBottom + systemInsets.bottom;

  return (
    <View style={[styles.screen, tone === 'focus' && styles.focusScreen]}>
      {tone === 'default' ? <AppBackground /> : null}
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={[
          styles.screenContent,
          {
            maxWidth: responsive.maxContentWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingTop: responsive.pageTop,
            paddingBottom,
            gap: responsive.screenGap,
          },
          contentStyle,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

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
  const responsive = useResponsiveLayout();
  const compactStyle = responsive.isCompactPhone ? compactTypographyForVariant(variant) : null;
  return (
    <Text
      {...textProps}
      style={[
        type[variant],
        compactStyle,
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function compactTypographyForVariant(variant: TypographyVariant): TextStyle | null {
  if (variant === 'h2') return compactTypography.h2;
  if (variant === 'pageTitle') return compactTypography.pageTitle;
  if (variant === 'cardTitle') return compactTypography.cardTitle;
  return null;
}

export const PearlText = Typography;

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
  const responsive = useResponsiveLayout();
  const compactCardPadding = responsive.isCompactPhone
    ? { paddingHorizontal: responsive.cardPadding, paddingVertical: responsive.cardPaddingVertical }
    : null;
  return <View style={[componentStyles.card[variant], style, compactCardPadding]}>{children}</View>;
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
  const responsive = useResponsiveLayout();
  const isPrimary = variant === 'primary';
  const showChevron = isPrimary && primaryButtonShowsChevron(title);
  const compactPadding = responsive.isCompactPhone ? styles.compactHorizontalPadding : null;

  return (
    <Pressable
      style={({ pressed }) => [
        componentStyles.button.base,
        componentStyles.button[variant],
        disabled && styles.disabled,
        pressed && !disabled && (isPrimary ? styles.primaryPressed : styles.pressed),
        style,
        compactPadding,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={disabled ? { disabled } : undefined}
    >
      {isPrimary ? (
        <View style={styles.primaryButtonContent}>
          <Text style={[styles.buttonText, styles.primaryButtonText, textStyle]} numberOfLines={2}>
            {title}
          </Text>
          {showChevron ? <PrimaryButtonChevron /> : null}
        </View>
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.secondaryButtonText,
            variant === 'ghost' && styles.ghostButtonText,
            variant === 'danger' && styles.dangerButtonText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

function primaryButtonShowsChevron(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  if (!normalized || normalized.endsWith('...')) return false;
  return !/^(back|done|try again|retake|cancel|sign out)/.test(normalized);
}

function PrimaryButtonChevron() {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" accessibilityElementsHidden>
      <Path
        d="M1.25 1.5L6 7L1.25 12.5"
        fill="none"
        stroke={colors.onAccent}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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
  disabled,
}: {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant="secondary"
      accessibilityLabel={accessibilityLabel}
      style={style}
      disabled={disabled}
    />
  );
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <Button title={title} onPress={onPress} variant="ghost" />;
}

/**
 * One quiet notice pattern for every "not available, here's why" state
 * (blocked check-up, data recovery, retake…). Copy varies per state; the
 * layout never does, so these moments feel intentional rather than like
 * error screens. The optional continuation stays secondary — a notice never
 * carries a hero action.
 */
export function NoticeCard({
  title,
  body,
  actionLabel,
  onPress,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <Card style={noticeStyles.card}>
      <Text style={noticeStyles.title}>{title}</Text>
      <Text style={noticeStyles.body}>{body}</Text>
      {actionLabel && onPress ? (
        <SecondaryButton title={actionLabel} onPress={onPress} />
      ) : null}
    </Card>
  );
}

const noticeStyles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
});

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
  const responsive = useResponsiveLayout();
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
          responsive.isCompactPhone && styles.compactHorizontalPadding,
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

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  progress,
  prominentTitle = false,
  onBack,
  backAccessibilityLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional "step X of N" indicator shown above the eyebrow (e.g. onboarding). */
  progress?: { step: number; total: number };
  /**
   * Keeps a short section label in top navigation and renders the full title
   * as a wrapping page heading. Used by onboarding questions that must never
   * shrink into the one-line navigation row.
   */
  prominentTitle?: boolean;
  onBack?: () => void;
  backAccessibilityLabel?: string;
}) {
  const showProminentTitle = prominentTitle && eyebrow !== undefined;
  return (
    <View style={styles.header}>
      <PageHeader
        title={showProminentTitle ? eyebrow : title}
        onBack={onBack}
        backAccessibilityLabel={backAccessibilityLabel}
      />
      {progress ? <StepProgress step={progress.step} total={progress.total} /> : null}
      {showProminentTitle ? (
        <Text style={styles.headerProminentTitle} accessibilityRole="header">
          {title}
        </Text>
      ) : eyebrow ? (
        <Eyebrow>{eyebrow}</Eyebrow>
      ) : null}
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function StepProgress({ step, total }: { step: number; total: number }) {
  const clamped = Math.max(1, Math.min(step, total));
  return (
    <View
      style={styles.stepProgress}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${clamped} of ${total}`}
    >
      <View style={styles.stepProgressDots}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[styles.stepProgressDot, index < clamped && styles.stepProgressDotActive]}
          />
        ))}
      </View>
      <Text style={styles.stepProgressLabel}>{`Step ${clamped} of ${total}`}</Text>
    </View>
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
        trackColor={{ false: colors.borderHairline, true: colors.accentDeep }}
        thumbColor={value ? colors.accent : colors.bgSurface}
        ios_backgroundColor={colors.borderHairline}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  focusScreen: { backgroundColor: colors.focusCanvas },
  screenScroll: { flex: 1, backgroundColor: 'transparent' },
  screenContent: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: 20,
  },
  compactHorizontalPadding: {
    paddingHorizontal: 16,
  },
  header: { gap: spacing.sm },
  headerProminentTitle: { ...type.pageTitle, maxWidth: 560 },
  stepProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  stepProgressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepProgressDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.borderHairline,
  },
  stepProgressDotActive: {
    backgroundColor: colors.accentDeep,
  },
  stepProgressLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  headerSubtitle: { ...type.pageSubtitle, maxWidth: 460 },
  buttonText: { ...type.button },
  primaryButtonText: { color: colors.buttonText, flexShrink: 1, minWidth: 0 },
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
  primaryButtonContent: {
    maxWidth: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryPressed: { backgroundColor: colors.accentHover, transform: [{ scale: 0.99 }] },
  segmentedTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  segmentedTab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
  },
  segmentedTabActive: {
    backgroundColor: colors.accent,
  },
  segmentedTabText: { ...type.bodySmall, fontFamily: fonts.sansMedium, color: colors.textMuted },
  segmentedTabTextActive: { color: colors.onAccent },
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
