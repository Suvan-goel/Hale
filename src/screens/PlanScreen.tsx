import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/ui';
import { MenuIcon } from '../navigation/icons';
import type {
  OfficialCheckUpBlockedReason,
  PhysicalTrainingFocus,
  ProgrammeJourneyProgress,
  ProgrammeTodayViewModel,
} from '../programme';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const PLAN_JOURNEY_HERO = require('../../assets/images/pearl-plan-twelve-week-hero-v11.png');

export interface PlanJourneySummary {
  progress: ProgrammeJourneyProgress;
  physicalFocus: PhysicalTrainingFocus | null;
}

export type PlanWeekSessionState = 'complete' | 'next' | 'planned';
export interface PlanWeekSessionRow {
  session: 1 | 2 | 3;
  state: PlanWeekSessionState;
}

export function planWeekSessionRows(
  creditedSessions: number,
  checkUpIsNext = false
): readonly PlanWeekSessionRow[] {
  const credited = Math.min(3, Math.max(0, Math.floor(creditedSessions)));
  return ([1, 2, 3] as const).map((session) => ({
    session,
    state:
      session <= credited
        ? 'complete'
        : !checkUpIsNext && session === credited + 1
          ? 'next'
          : 'planned',
  }));
}

/** Plan explains the programme and may launch only the explicitly next session. */
export function PlanScreen({
  today,
  journey,
  checkUpBlockedReason,
  checkUpDraftInProgress = false,
  onOpenSettings,
  onStartNextSession,
}: {
  today: ProgrammeTodayViewModel;
  journey: PlanJourneySummary;
  checkUpBlockedReason?: OfficialCheckUpBlockedReason;
  checkUpDraftInProgress?: boolean;
  onOpenSettings: () => void;
  onStartNextSession: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen
      contentStyle={[
        styles.screenContent,
        { paddingHorizontal: responsive.isCompactWidth ? spacing.xl : spacing.xxl },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, responsive.isCompactPhone && styles.compactTitle]}>
          Your plan
        </Text>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <MenuIcon size={24} color={colors.textPrimary} strokeWidth={1.55} />
        </Pressable>
      </View>

      {journey.progress.status === 'active' ? (
        <ActivePlan
          today={today}
          journey={journey}
          checkUpDraftInProgress={checkUpDraftInProgress}
          onStartNextSession={onStartNextSession}
        />
      ) : journey.progress.status === 'completed' ? (
        <CompletedPlan
          today={today}
          focus={journey.physicalFocus}
          onStartNextSession={onStartNextSession}
        />
      ) : (
        <PreBaselinePlan
          today={today}
          blockedReason={checkUpBlockedReason}
          checkUpDraftInProgress={checkUpDraftInProgress}
        />
      )}
    </Screen>
  );
}

function ActivePlan({
  today,
  journey,
  checkUpDraftInProgress,
  onStartNextSession,
}: {
  today: ProgrammeTodayViewModel;
  journey: PlanJourneySummary;
  checkUpDraftInProgress: boolean;
  onStartNextSession: () => void;
}) {
  const { progress, physicalFocus } = journey;
  const phase = progress.currentPhase ?? 1;
  const week = progress.currentWeek ?? 1;
  const programmeWeek = (phase - 1) * 4 + week;
  const credited = Math.min(3, progress.currentWeekSummary?.creditedSessions ?? 0);
  const checkUpIsNext = today.primaryAction.type === 'start_baseline_checkup';
  const checkUpLabel = checkUpDraftInProgress
    ? 'Continue'
    : progress.retestDue
    ? 'Ready'
    : progress.retestDueAtIso
      ? formatPlanDate(progress.retestDueAtIso)
      : null;

  return (
    <>
      <JourneyProgress currentPhase={phase} />

      <View style={styles.programmeStatus}>
        <Text style={styles.eyebrow}>WEEK {programmeWeek} OF 12</Text>
        <Text style={styles.phaseHeading}>Phase {phase}</Text>
        <Text style={styles.phaseSubtitle}>{phaseSubtitle(phase)}</Text>
        {physicalFocus ? <FocusPill label={`${planFocusLabel(physicalFocus)} focus`} /> : null}
      </View>

      <PlanJourneyHero />

      <View style={styles.weekSection}>
        <View style={styles.weekHeading}>
          <Text style={styles.eyebrow}>This week</Text>
          <Text style={styles.weekProgress}>{credited} of 3 complete</Text>
        </View>
        <View style={styles.sessionRows}>
          {planWeekSessionRows(credited, checkUpIsNext).map((row, index, rows) => (
            <SessionRow
              key={row.session}
              row={row}
              isFirst={index === 0}
              isLast={index === rows.length - 1}
              description={sessionDescription(row, today, physicalFocus, checkUpIsNext)}
              detail={sessionMeta(row, today)}
              onStart={row.state === 'next' ? onStartNextSession : undefined}
            />
          ))}
        </View>
      </View>

      {checkUpLabel ? <SummaryRow label="Next check-up" value={checkUpLabel} /> : null}
    </>
  );
}

function PreBaselinePlan({
  today,
  blockedReason,
  checkUpDraftInProgress,
}: {
  today: ProgrammeTodayViewModel;
  blockedReason?: OfficialCheckUpBlockedReason;
  checkUpDraftInProgress: boolean;
}) {
  if (blockedReason === 'health_data_consent_required') {
    return (
      <BlockedPlan
        today={today}
        title="Your conservative plan"
        body="The camera check-up is off, so sessions begin at conservative levels."
      />
    );
  }
  if (blockedReason === 'gentle_start_safety_gate') {
    return (
      <BlockedPlan
        today={today}
        title="Gentle Start is active"
        body="Sessions stay at the easiest starting levels while the Movement Check-Up remains unavailable."
      />
    );
  }

  const checkUpNext = today.primaryAction.type === 'start_baseline_checkup';
  const starterComplete = checkUpNext || checkUpDraftInProgress;
  return (
    <View style={styles.preBaselineSection}>
      <Text style={styles.eyebrow}>STARTING YOUR PLAN</Text>
      <View style={styles.preparationRows}>
        <PreparationRow index="1" title="Starter session" state={starterComplete ? 'Complete' : 'Next'} />
        <PreparationRow
          index="2"
          title="Movement Check-Up"
          state={checkUpDraftInProgress ? 'Continue' : checkUpNext ? 'Next' : 'After starter'}
        />
      </View>
      <Text style={styles.caption}>8 min · No video shown or saved</Text>
    </View>
  );
}

function BlockedPlan({
  today,
  title,
  body,
}: {
  today: ProgrammeTodayViewModel;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.blockedSection}>
      <Text style={styles.eyebrow}>YOUR PLAN</Text>
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.blockedNextSession}>
        <Text style={styles.eyebrow}>Next session</Text>
        <Text style={styles.nextSessionPreview}>{nextSessionDetail(today)}</Text>
      </View>
    </View>
  );
}

function CompletedPlan({
  today,
  focus,
  onStartNextSession,
}: {
  today: ProgrammeTodayViewModel;
  focus: PhysicalTrainingFocus | null;
  onStartNextSession: () => void;
}) {
  return (
    <>
      <JourneyProgress completedAll />

      <View style={styles.programmeStatus}>
        <Text style={styles.eyebrow}>12-WEEK JOURNEY</Text>
        <Text style={styles.phaseHeading}>Programme complete</Text>
        {focus ? <FocusPill label={`Continuing focus · ${planFocusLabel(focus)}`} /> : null}
      </View>

      <PlanJourneyHero />

      <View style={styles.weekSection}>
        <View style={styles.weekHeading}>
          <Text style={styles.eyebrow}>This week</Text>
        </View>
        <View style={styles.sessionRows}>
          {planWeekSessionRows(0).map((row, index, rows) => (
            <SessionRow
              key={row.session}
              row={row}
              isFirst={index === 0}
              isLast={index === rows.length - 1}
              description={sessionDescription(row, today, focus, false)}
              detail={sessionMeta(row, today)}
              onStart={row.state === 'next' ? onStartNextSession : undefined}
            />
          ))}
        </View>
      </View>

      <SummaryRow label="Movement Check-Ups" value="Saved in Progress" />
    </>
  );
}

function JourneyProgress({
  currentPhase,
  completedAll = false,
}: {
  currentPhase?: 1 | 2 | 3;
  completedAll?: boolean;
}) {
  return (
    <View
      style={styles.journeyProgress}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={completedAll ? 'All three programme phases complete' : `Phase ${currentPhase} of 3`}
    >
      <View style={styles.journeyLabels}>
        {([1, 2, 3] as const).map((phase) => {
          const complete = completedAll || (currentPhase !== undefined && phase < currentPhase);
          const current = phase === currentPhase;
          return (
            <Text
              key={phase}
              style={[
                styles.journeyLabel,
                complete && styles.journeyLabelComplete,
                current && styles.journeyLabelCurrent,
              ]}
            >
              {complete ? '✓ ' : ''}{journeyPhaseName(phase)}
            </Text>
          );
        })}
      </View>
      <View style={styles.journeyTrack}>
        {([1, 2, 3] as const).map((phase) => {
          const complete = completedAll || (currentPhase !== undefined && phase < currentPhase);
          const current = phase === currentPhase;
          return (
            <View
              key={phase}
              style={[
                styles.journeySegment,
                complete && styles.journeySegmentComplete,
                current && styles.journeySegmentCurrent,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function FocusPill({ label }: { label: string }) {
  return <Text style={styles.focusLabel}>{label}</Text>;
}

function PlanJourneyHero() {
  return (
    <View style={styles.heroFrame}>
      <Image
        source={PLAN_JOURNEY_HERO}
        style={styles.heroImage}
        resizeMode="cover"
        accessible={false}
      />
    </View>
  );
}

function SessionRow({
  row,
  description,
  detail,
  isFirst,
  isLast,
  onStart,
}: {
  row: PlanWeekSessionRow;
  description: string;
  detail?: string;
  isFirst: boolean;
  isLast: boolean;
  onStart?: () => void;
}) {
  const stateLabel = sessionStateLabel(row.state);
  return (
    <View
      style={styles.sessionRow}
      accessible={onStart === undefined}
      accessibilityLabel={`Session ${row.session}. ${description}. ${stateLabel}${detail ? `. ${detail}` : ''}`}
    >
      <View style={styles.timelineRail}>
        {!isFirst ? <View style={[styles.timelineLine, styles.timelineLineTop]} /> : null}
        {!isLast ? <View style={[styles.timelineLine, styles.timelineLineBottom]} /> : null}
        <View style={[
          styles.marker,
          row.state === 'complete' && styles.markerComplete,
          row.state === 'next' && styles.markerNext,
          row.state === 'planned' && styles.markerPlanned,
        ]}>
          <Text style={[
            styles.markerText,
            row.state === 'complete' && styles.markerTextComplete,
            row.state === 'next' && styles.markerTextNext,
          ]}>{row.state === 'complete' ? '✓' : row.session}</Text>
        </View>
      </View>
      <View style={styles.sessionCopy}>
        <Text style={styles.sessionTitle}>Session {row.session}</Text>
        <Text style={styles.sessionDescription} numberOfLines={2}>{description}</Text>
        {detail ? (
          <Text style={[styles.sessionDetail, row.state === 'next' && styles.sessionDetailNext]}>
            {detail}
          </Text>
        ) : null}
      </View>
      {onStart ? (
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel={`Start session ${row.session}`}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function sessionStateLabel(state: PlanWeekSessionState): string {
  if (state === 'complete') return 'Complete';
  if (state === 'next') return 'Next';
  return 'Planned';
}

function sessionDescription(
  row: PlanWeekSessionRow,
  today: ProgrammeTodayViewModel,
  focus: PhysicalTrainingFocus | null,
  checkUpIsNext: boolean
): string {
  if (checkUpIsNext && row.state === 'planned') return 'Set after your Movement Check-Up';
  if (row.state === 'next') return today.sessionPreview.mainPatternTitles.join(' · ');
  if (focus === 'strength') return 'Strength emphasis · Balance included';
  if (focus === 'balance') return 'Balance emphasis · Strength included';
  return 'Strength and balance';
}

function sessionMeta(row: PlanWeekSessionRow, today: ProgrammeTodayViewModel): string {
  if (row.state === 'next') {
    return `${Math.round(today.sessionPreview.estimatedMinutes)} min · Next`;
  }
  return sessionStateLabel(row.state);
}

function PreparationRow({ index, title, state }: { index: string; title: string; state: string }) {
  return (
    <View
      style={styles.preparationRow}
      accessible
      accessibilityLabel={`Step ${index}. ${title}. ${state}`}
    >
      <View style={styles.preparationIndex}><Text style={styles.preparationIndexText}>{index}</Text></View>
      <Text style={styles.preparationTitle}>{title}</Text>
      <Text style={styles.preparationState}>{state}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export function planFocusLabel(focus: PhysicalTrainingFocus | null): string {
  if (focus === 'strength') return 'Strength';
  if (focus === 'balance') return 'Balance';
  if (focus === 'balanced') return 'Balanced';
  return 'Focus unavailable';
}

function phaseSubtitle(phase: 1 | 2 | 3): string {
  if (phase === 1) return 'Build foundations';
  if (phase === 2) return 'Build strength';
  return 'Move with confidence';
}

function journeyPhaseName(phase: 1 | 2 | 3): string {
  if (phase === 1) return 'Foundations';
  if (phase === 2) return 'Build';
  return 'Progress';
}

function nextSessionDetail(today: ProgrammeTodayViewModel): string {
  return `${Math.round(today.sessionPreview.estimatedMinutes)} min · ${today.sessionPreview.mainPatternTitles.join(' · ')}`;
}

function formatPlanDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'Scheduled'
    : new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date);
}

const styles = StyleSheet.create({
  screenContent: { gap: spacing.xl },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  title: { fontFamily: fonts.serifRegular, fontSize: 48, lineHeight: 54, letterSpacing: -0.8, color: colors.textPrimary, flexShrink: 1 },
  compactTitle: { fontSize: 42, lineHeight: 48 },
  settingsButton: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.cardCaption, color: colors.textPrimary, fontFamily: fonts.sansMedium, letterSpacing: 1.5, fontSize: 12, textTransform: 'uppercase' },
  journeyProgress: { gap: spacing.sm },
  journeyLabels: { flexDirection: 'row', alignItems: 'center' },
  journeyLabel: { ...type.cardCaption, flex: 1, color: colors.textTertiary, fontFamily: fonts.sansMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.4, textAlign: 'center', textTransform: 'uppercase' },
  journeyLabelComplete: { color: colors.accentGold },
  journeyLabelCurrent: { color: colors.accentDeep },
  journeyTrack: { flexDirection: 'row', gap: spacing.xs },
  journeySegment: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.bgElevated },
  journeySegmentComplete: { backgroundColor: colors.accentGold },
  journeySegmentCurrent: { backgroundColor: colors.accentDeep },
  programmeStatus: { gap: spacing.xs },
  phaseHeading: { fontFamily: fonts.serifMedium, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  phaseSubtitle: { ...type.bodySmall, color: colors.textSecondary },
  focusLabel: { ...type.bodySmall, color: colors.accentDeep, fontFamily: fonts.sansMedium, marginTop: spacing.xs },
  heroFrame: { width: '100%', aspectRatio: 1.9 },
  heroImage: { width: '100%', height: '100%' },
  planTitle: { fontFamily: fonts.serifMedium, fontSize: 26, lineHeight: 32, color: colors.textPrimary },
  body: { ...type.bodySmall, color: colors.textSecondary },
  caption: { ...type.cardBody, color: colors.textSecondary },
  summaryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline },
  summaryLabel: { ...type.cardBody, color: colors.textSecondary },
  summaryValue: { ...type.cardBody, color: colors.textPrimary, fontFamily: fonts.sansMedium, textAlign: 'right', flexShrink: 1 },
  weekSection: { gap: 0 },
  weekHeading: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  weekProgress: { ...type.cardCaption, color: colors.textSecondary },
  sessionRows: { gap: 0 },
  sessionRow: { minHeight: 104, flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  timelineRail: { width: 36, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  timelineLine: { position: 'absolute', left: 17, width: 1, backgroundColor: colors.accentBorder },
  timelineLineTop: { top: 0, bottom: '50%' },
  timelineLineBottom: { top: '50%', bottom: 0 },
  marker: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.accentBorder, zIndex: 2 },
  markerComplete: { backgroundColor: colors.background, borderColor: colors.accentGold },
  markerNext: { borderColor: colors.accentDeep },
  markerPlanned: { borderColor: colors.accentBorder },
  markerText: { ...type.cardBody, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  markerTextComplete: { color: colors.accentGold },
  markerTextNext: { color: colors.accentDeep },
  sessionCopy: { flex: 1, minWidth: 0, gap: spacing.xs, justifyContent: 'center', paddingVertical: spacing.md },
  sessionTitle: { ...type.bodySmall, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  sessionDescription: { ...type.cardCaption, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  sessionDetail: { ...type.cardCaption, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  sessionDetailNext: { color: colors.accentDeep, fontFamily: fonts.sansMedium },
  startButton: { minWidth: 70, minHeight: 48, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.accent },
  startButtonPressed: { backgroundColor: colors.accentHover, transform: [{ scale: 0.98 }] },
  startButtonText: { ...type.cardBody, color: colors.onAccent, fontFamily: fonts.sansMedium },
  preparationRows: { gap: 0 },
  preparationRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline },
  preparationIndex: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated },
  preparationIndexText: { ...type.cardCaption, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  preparationTitle: { ...type.cardBody, color: colors.textPrimary, flex: 1 },
  preparationState: { ...type.cardCaption, color: colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'right', flexShrink: 1 },
  preBaselineSection: { gap: spacing.lg },
  blockedSection: { gap: spacing.lg },
  nextSessionPreview: { ...type.bodySmall, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  blockedNextSession: { gap: spacing.xs, paddingTop: spacing.sm },
  pressed: { opacity: 0.78 },
});
