import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BackArrowButton } from '../components/BackArrowButton';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import type {
  UnifiedCheckUpResultsAction,
  UnifiedCheckUpResultsPresentation,
  UnifiedDomainResultCard,
  UnifiedResultsActionViewModel,
} from './types';

export function CheckUpResultsShell({
  presentation,
  onAction,
}: {
  presentation: UnifiedCheckUpResultsPresentation;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  if (presentation.variant === 'history') {
    return <HistoryResultsVariant presentation={presentation} onAction={onAction} />;
  }
  return <FreshResultsVariant presentation={presentation} onAction={onAction} />;
}

function FreshResultsVariant({
  presentation,
  onAction,
}: {
  presentation: UnifiedCheckUpResultsPresentation;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const responsive = useResponsiveLayout();

  return (
    <Screen contentStyle={styles.freshScreenContent}>
      <ScreenHeader
        eyebrow={presentation.header.eyebrow ?? 'Movement Check-Up'}
        title={presentation.header.title}
        subtitle={presentation.header.subtitle}
      />

      <View style={[styles.freshFocusCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <Text style={styles.focusKicker}>{presentation.focus.kicker}</Text>
        <Text style={styles.freshFocusValue}>{presentation.focus.title}</Text>
        <Text style={styles.focusBody}>{presentation.focus.body}</Text>
      </View>

      <Card style={styles.freshAreasPanel}>
        {presentation.domains.map((domain, index) => (
          <FreshDomainResultRow
            key={domain.id}
            domain={domain}
            isLast={index === presentation.domains.length - 1}
          />
        ))}
      </Card>

      {presentation.caveat ? <Text style={styles.caveat}>{presentation.caveat}</Text> : null}

      <ActionStack actions={presentation.actions} onAction={onAction} />
    </Screen>
  );
}

function HistoryResultsVariant({
  presentation,
  onAction,
}: {
  presentation: UnifiedCheckUpResultsPresentation;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const responsive = useResponsiveLayout();
  const backAction = presentation.actions.find((action) => action.action.type === 'done');

  return (
    <Screen contentStyle={styles.historyScreenContent}>
      {presentation.header.showBackButton && backAction ? (
        <BackArrowButton
          accessibilityLabel={presentation.header.backAccessibilityLabel ?? 'Back'}
          onPress={() => onAction(backAction.action)}
        />
      ) : null}
      <ScreenHeader
        eyebrow={presentation.header.eyebrow ?? 'Saved check-up'}
        title={presentation.header.title}
        subtitle={presentation.header.subtitle}
      />
      {presentation.header.completedAtLabel ? (
        <Text style={styles.dateLabel}>{presentation.header.completedAtLabel}</Text>
      ) : null}

      <View style={[styles.focusOverviewCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <Text style={styles.focusKicker}>{presentation.focus.kicker}</Text>
        <Text style={styles.focusValue}>{presentation.focus.title}</Text>
        <Text style={styles.focusBody}>{presentation.focus.body}</Text>
      </View>

      <Card style={styles.areasPanel}>
        {presentation.domains.map((domain, index) => (
          <DomainAreaRow
            key={domain.id}
            domain={domain}
            isLast={index === presentation.domains.length - 1}
          />
        ))}
      </Card>

      {presentation.caveat ? <Text style={styles.caveat}>{presentation.caveat}</Text> : null}

      <ActionStack actions={presentation.actions} onAction={onAction} />
    </Screen>
  );
}

function FreshDomainResultRow({
  domain,
  isLast,
}: {
  domain: UnifiedDomainResultCard;
  isLast: boolean;
}) {
  const metricDisplay = splitMetricDisplay(domain.metricValue);
  return (
    <View style={[styles.freshDomainRow, isLast && styles.freshDomainRowLast]}>
      <View style={styles.freshDomainIcon}>
        <DomainGlyph iconToken={domain.iconToken} flush />
      </View>
      <View style={styles.freshDomainCopy}>
        <Text style={styles.freshDomainTitle}>{domain.title}</Text>
        {domain.interpretation ? (
          <Text style={styles.freshDomainStatus}>{domain.interpretation}</Text>
        ) : null}
        <Text style={styles.freshDomainMetric} accessibilityLabel={domain.metricValue}>
          {metricDisplay ? (
            <>
              <Text style={styles.freshDomainMetricNumber}>{metricDisplay.value}</Text>
              {metricDisplay.unit ? (
                <Text style={styles.freshDomainMetricUnit}>
                  {metricDisplay.separator}
                  {metricDisplay.unit}
                </Text>
              ) : null}
            </>
          ) : (
            domain.metricValue
          )}
        </Text>
      </View>
    </View>
  );
}

function ActionStack({
  actions,
  onAction,
}: {
  actions: readonly UnifiedResultsActionViewModel[];
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const buttonActions = actions.filter((action) => action.id !== 'back' && action.id !== 'done-back');
  if (buttonActions.length === 0) return null;
  return (
    <View style={styles.actions}>
      {buttonActions.map((action) =>
        action.button === 'primary' ? (
          <PrimaryButton
            key={action.id}
            title={action.label}
            disabled={action.disabled}
            accessibilityLabel={action.accessibilityLabel}
            onPress={() => {
              if (!action.disabled) onAction(action.action);
            }}
          />
        ) : (
          <SecondaryButton
            key={action.id}
            title={action.label}
            disabled={action.disabled}
            accessibilityLabel={action.accessibilityLabel}
            onPress={() => {
              if (!action.disabled) onAction(action.action);
            }}
          />
        )
      )}
    </View>
  );
}

function DomainAreaRow({
  domain,
  isLast,
}: {
  domain: UnifiedDomainResultCard;
  isLast: boolean;
}) {
  const metricDisplay = domain.metricValue ? splitMetricDisplay(domain.metricValue) : null;
  return (
    <View style={[styles.domainAreaRow, isLast && styles.domainAreaRowLast]}>
      <View style={styles.domainAreaHeader}>
        <DomainGlyph iconToken={domain.iconToken} />
        <View style={styles.domainTitleCopy}>
          <Text style={styles.domainTitle}>{domain.title}</Text>
          {domain.interpretation ? (
            <Text style={domain.tone === 'attention' ? styles.domainTakeawayAttention : styles.domainTakeaway}>
              {domain.interpretation}
            </Text>
          ) : null}
        </View>
      </View>

      {domain.body ? <Text style={styles.domainBody}>{domain.body}</Text> : null}

      {domain.metricLabel || domain.metricValue ? (
        <View style={styles.domainMetricStrip}>
          <Text style={styles.domainMetricLabel}>{domain.metricLabel}</Text>
          <Text style={styles.domainMetricValue} accessibilityLabel={domain.metricValue}>
            {metricDisplay ? (
              <>
                <Text style={styles.domainMetricNumber}>{metricDisplay.value}</Text>
                {metricDisplay.unit ? (
                  <Text style={styles.domainMetricUnit}>
                    {metricDisplay.separator}
                    {metricDisplay.unit}
                  </Text>
                ) : null}
              </>
            ) : (
              domain.metricValue
            )}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function splitMetricDisplay(display: string): { value: string; separator: string; unit: string } | null {
  const match = display.trim().match(/^(-?\d+(?:\.\d+)?)(\s*)(.*)$/);
  if (!match) return null;
  return {
    value: match[1],
    separator: match[2],
    unit: match[3],
  };
}

function DomainGlyph({
  iconToken,
  flush,
}: {
  iconToken: UnifiedDomainResultCard['iconToken'];
  flush?: boolean;
}) {
  const stroke = colors.accentDeep;
  return (
    <View style={[styles.domainIcon, flush && styles.domainIconFlush]}>
      <Svg width={25} height={25} viewBox="0 0 24 24" accessibilityElementsHidden>
        {iconToken === 'strength' ? (
          <>
            <Path d="M5 14h14" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" />
            <Path d="M7 10v8M17 10v8M10 12h4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
          </>
        ) : iconToken === 'balance' ? (
          <>
            <Path d="M12 5v12" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M7 18h10" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
            <Circle cx={12} cy={5} r={2.2} stroke={stroke} strokeWidth={1.5} fill="none" />
            <Path d="M8 10c2.2 1.3 5.8 1.3 8 0" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <Path d="M6 16c3.7-7.7 8.6-7.7 12 0" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Path d="M7 17h10" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
            <Circle cx={12} cy={10} r={2.1} stroke={stroke} strokeWidth={1.5} fill="none" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  freshScreenContent: { gap: spacing.lg },
  historyScreenContent: { gap: 20 },
  dateLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  freshFocusCard: {
    gap: spacing.sm,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  focusOverviewCard: {
    gap: spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    boxShadow: `0 18px 38px ${colors.shadowSoft}`,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  focusKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  freshFocusValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  focusValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  focusBody: {
    ...type.cardBody,
    color: colors.textSecondary,
    maxWidth: 340,
  },
  freshAreasPanel: {
    paddingHorizontal: 18,
    paddingVertical: 0,
  },
  freshDomainRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  freshDomainRowLast: {
    borderBottomWidth: 0,
  },
  freshDomainIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  freshDomainCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  freshDomainTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
  },
  freshDomainStatus: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  freshDomainMetric: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  freshDomainMetricNumber: {
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  freshDomainMetricUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  areasPanel: {
    paddingHorizontal: 24,
    paddingVertical: 2,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    boxShadow: `0 14px 32px ${colors.shadowSoft}`,
  },
  domainIcon: {
    width: 30,
    height: 30,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconFlush: {
    marginTop: 0,
  },
  domainAreaRow: {
    gap: 10,
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  domainAreaRowLast: {
    borderBottomWidth: 0,
  },
  domainAreaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  domainTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  domainTitle: {
    ...type.cardTitle,
    fontSize: 24,
    lineHeight: 31,
  },
  domainTakeaway: {
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  domainTakeawayAttention: {
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  domainBody: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
    paddingLeft: 44,
    paddingRight: 4,
  },
  domainMetricStrip: {
    minHeight: 44,
    marginLeft: 44,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  domainMetricValue: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flexShrink: 0,
  },
  domainMetricNumber: {
    fontFamily: fonts.sansMedium,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  domainMetricUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  domainMetricLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
    flex: 1,
  },
  caveat: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.md },
});
