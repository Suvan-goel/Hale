import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '../components/PageHeader';
import { PrimaryButton, Screen, SecondaryButton } from '../components/ui';
import { colors, fonts, spacing, type } from '../theme';
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
  return (
    <Screen contentStyle={styles.screenContent}>
      <PageHeader title={presentation.header.title} />
      <ResultsIntro
        subtitle={presentation.header.subtitle}
        milestoneLabel={presentation.header.milestoneLabel}
        completedAtLabel={presentation.header.completedAtLabel}
      />

      <FocusSummary focus={presentation.focus} />

      <View style={styles.resultsSection}>
        {presentation.domains.map((domain, index) => (
          <FreshDomainResultRow
            key={domain.id}
            domain={domain}
            isLast={index === presentation.domains.length - 1}
          />
        ))}
      </View>

      {presentation.caveat ? <Caveat text={presentation.caveat} /> : null}

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
  const backAction = presentation.actions.find((action) => action.action.type === 'done');
  const onBack =
    presentation.header.showBackButton && backAction
      ? () => onAction(backAction.action)
      : undefined;

  return (
    <Screen contentStyle={styles.screenContent}>
      <PageHeader
        title={presentation.header.title}
        onBack={onBack}
        backAccessibilityLabel={presentation.header.backAccessibilityLabel ?? 'Back'}
      />
      <ResultsIntro
        milestoneLabel={presentation.header.milestoneLabel}
        completedAtLabel={presentation.header.completedAtLabel}
      />

      <FocusSummary focus={presentation.focus} />

      <View style={styles.resultsSection}>
        {presentation.domains.map((domain, index) => (
          <DomainAreaRow
            key={domain.id}
            domain={domain}
            isLast={index === presentation.domains.length - 1}
          />
        ))}
      </View>

      {presentation.caveat ? <Caveat text={presentation.caveat} /> : null}

      <ActionStack actions={presentation.actions} onAction={onAction} />
    </Screen>
  );
}

function ResultsIntro({
  subtitle,
  milestoneLabel,
  completedAtLabel,
}: {
  subtitle?: string;
  milestoneLabel?: string;
  completedAtLabel?: string;
}) {
  const checkUpContextLabel =
    milestoneLabel && completedAtLabel
      ? `${milestoneLabel} · ${completedAtLabel}`
      : milestoneLabel ?? completedAtLabel;

  if (!subtitle && !checkUpContextLabel) return null;
  return (
    <View style={styles.introMetaRow}>
      {subtitle ? <Text style={styles.introSubtitle}>{subtitle}</Text> : null}
      {checkUpContextLabel ? (
        <Text style={styles.checkUpContextLabel}>{checkUpContextLabel}</Text>
      ) : null}
    </View>
  );
}

function FocusSummary({
  focus,
}: {
  focus: UnifiedCheckUpResultsPresentation['focus'];
}) {
  return (
    <View style={styles.focusSection}>
      <Text style={styles.focusKicker}>{focus.kicker}</Text>
      <Text style={styles.focusValue}>{focus.title}</Text>
      <Text style={styles.focusBody}>{focus.body}</Text>
    </View>
  );
}

function Caveat({ text }: { text: string }) {
  return (
    <View style={styles.caveatSection}>
      <Text style={styles.caveat}>{text}</Text>
    </View>
  );
}

function FreshDomainResultRow({
  domain,
  isLast,
}: {
  domain: UnifiedDomainResultCard;
  isLast: boolean;
}) {
  return <CompactDomainResultRow domain={domain} isLast={isLast} />;
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
  return <CompactDomainResultRow domain={domain} isLast={isLast} />;
}

// Stacked left-aligned hierarchy matching the Progress "Current level" stat:
// title leads, the takeaway explains, the metric sits beneath — never a value
// right-aligned across a gap from its label.
function CompactDomainResultRow({
  domain,
  isLast,
}: {
  domain: UnifiedDomainResultCard;
  isLast: boolean;
}) {
  const metricDisplay = splitMetricDisplay(domain.metricValue);
  return (
    <View
      style={[styles.domainRow, isLast && styles.domainRowLast]}
      accessible
      accessibilityLabel={domain.accessibilityLabel}
    >
      <Text style={styles.domainTitle}>{domain.title}</Text>
      {domain.interpretation ? (
        <Text style={styles.domainTakeaway}>{domain.interpretation}</Text>
      ) : null}
      <Text style={styles.domainMetricValue} accessibilityLabel={domain.metricValue}>
        {metricDisplay ? (
          <>
            <Text style={styles.domainMetricNumber}>{metricDisplay.value}</Text>
            {metricDisplay.unit ? (
              <Text style={styles.domainMetricUnit}>
                {' '}
                {metricDisplay.unit}
              </Text>
            ) : null}
          </>
        ) : (
          domain.metricValue
        )}
      </Text>
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

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.xl,
  },
  introMetaRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  checkUpContextLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    letterSpacing: 0,
    marginLeft: 'auto',
  },
  introSubtitle: {
    ...type.pageSubtitle,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 220,
  },
  focusSection: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  focusKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  focusValue: {
    fontFamily: fonts.serifRegular,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  focusBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
    maxWidth: 390,
  },
  resultsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  domainRow: {
    minHeight: 88,
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  domainRowLast: {
    borderBottomWidth: 0,
  },
  domainTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  domainTakeaway: {
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  domainMetricValue: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    paddingTop: spacing.xs,
  },
  domainMetricNumber: {
    fontFamily: fonts.sansRegular,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  domainMetricUnit: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  caveat: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  caveatSection: {
    paddingTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
});
