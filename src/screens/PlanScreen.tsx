import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeaderLogo } from '../components/HeaderLogo';
import { Card, Screen } from '../components/ui';
import { SettingsIcon } from '../navigation/icons';
import type {
  OfficialCheckUpBlockedReason,
  PhysicalTrainingFocus,
  ProgrammeJourneyProgress,
  ProgrammeTodayViewModel,
} from '../programme';
import { colors, fonts, radius, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

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

/** Plan explains the programme. Home remains the only primary action surface. */
export function PlanScreen({
  today,
  journey,
  checkUpBlockedReason,
  onOpenSettings,
}: {
  today: ProgrammeTodayViewModel;
  journey: PlanJourneySummary;
  checkUpBlockedReason?: OfficialCheckUpBlockedReason;
  onOpenSettings: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>
            Plan
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <SettingsIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
        </Pressable>
      </View>

      {journey.progress.status === 'active' ? (
        <ActivePlan today={today} journey={journey} />
      ) : journey.progress.status === 'completed' ? (
        <CompletedPlan focus={journey.physicalFocus} />
      ) : (
        <PreBaselinePlan today={today} blockedReason={checkUpBlockedReason} />
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>How your plan adapts</Text>
        <Text style={styles.body}>
          Strength and Balance results set each four-week focus. Sessions then adjust as you
          train, so future exercises are not presented as fixed promises.
        </Text>
        <Text style={styles.caption}>
          Everyday Clarity is tracked separately in Progress and never changes your exercises.
        </Text>
      </Card>
    </Screen>
  );
}

function ActivePlan({
  today,
  journey,
}: {
  today: ProgrammeTodayViewModel;
  journey: PlanJourneySummary;
}) {
  const { progress, physicalFocus } = journey;
  const phase = progress.currentPhase ?? 1;
  const week = progress.currentWeek ?? 1;
  const credited = Math.min(3, progress.currentWeekSummary?.creditedSessions ?? 0);
  const checkUpIsNext = today.primaryAction.type === 'start_baseline_checkup';
  const checkUpLabel = progress.retestDue
    ? 'Ready now'
    : progress.retestDueAtIso
      ? formatPlanDate(progress.retestDueAtIso)
      : 'After this phase';

  return (
    <>
      <Card style={styles.card}>
        <Text style={styles.eyebrow}>YOUR 12-WEEK PLAN</Text>
        <Text style={styles.planTitle}>Phase {phase} of 3 · Week {week} of 4</Text>
        <View style={styles.phaseRow} accessibilityLabel={`Phase ${phase} of 3`}>
          {([1, 2, 3] as const).map((item) => (
            <View
              key={item}
              style={[
                styles.phase,
                item === phase && styles.phaseActive,
                item < phase && styles.phaseComplete,
              ]}
            >
              <Text style={[styles.phaseText, item === phase && styles.phaseTextActive]}>
                Phase {item}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryRows}>
          <SummaryRow label="Focus" value={focusLabel(physicalFocus)} />
          <SummaryRow label="This week" value={`${credited} of 3 complete · 2 is enough`} />
          <SummaryRow label="Next check-up" value={checkUpLabel} />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>This week</Text>
        <Text style={styles.body}>Three sessions are planned. Two still counts as a successful week.</Text>
        <View style={styles.sessionRows}>
          {planWeekSessionRows(credited, checkUpIsNext).map((row) => (
            <SessionRow
              key={row.session}
              row={row}
              detail={
                row.state === 'next'
                  ? nextSessionDetail(today)
                  : row.state === 'planned' && checkUpIsNext
                    ? 'Available after your check-up'
                    : undefined
              }
            />
          ))}
        </View>
        {checkUpIsNext ? (
          <View style={styles.nextStep}>
            <Text style={styles.nextStepTitle}>Your check-up is the next step</Text>
            <Text style={styles.nextStepBody}>Return to Home when you’re ready to begin.</Text>
          </View>
        ) : null}
      </Card>
    </>
  );
}

function PreBaselinePlan({
  today,
  blockedReason,
}: {
  today: ProgrammeTodayViewModel;
  blockedReason?: OfficialCheckUpBlockedReason;
}) {
  if (blockedReason === 'health_data_consent_required') {
    return (
      <PlanStateCard
        eyebrow="YOUR PLAN"
        title="Your private starter plan"
        body="The camera check-up is off because health-data consent was declined. Sessions remain available on Home and begin conservatively."
      />
    );
  }
  if (blockedReason === 'gentle_start_safety_gate') {
    return (
      <PlanStateCard
        eyebrow="YOUR PLAN"
        title="Gentle Start is active"
        body="Sessions stay at the easiest starting levels while the effort-based Movement Check-Up remains off."
      />
    );
  }

  const checkUpNext = today.primaryAction.type === 'start_baseline_checkup';
  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>BEFORE PHASE 1</Text>
      <Text style={styles.planTitle}>
        {checkUpNext ? 'Your Movement Check-Up is next' : 'One starter session comes first'}
      </Text>
      <Text style={styles.body}>
        {checkUpNext
          ? 'The check-up sets a measured Strength or Balance focus for the first four-week phase.'
          : 'After your starter session, the private Movement Check-Up sets the focus for Phase 1.'}
      </Text>
      <View style={styles.preparationRows}>
        <PreparationRow index="1" title="Starter session" state={checkUpNext ? 'Complete' : 'Next on Home'} />
        <PreparationRow index="2" title="Movement Check-Up" state={checkUpNext ? 'Next on Home' : 'After your starter'} />
        <PreparationRow index="3" title="Phase 1" state="Four-week focus" />
      </View>
    </Card>
  );
}

function CompletedPlan({ focus }: { focus: PhysicalTrainingFocus | null }) {
  return (
    <PlanStateCard
      eyebrow="YOUR 12-WEEK PLAN"
      title="All three phases complete"
      body={`Your baseline and three monthly check-ups are saved in Progress. Continuing sessions use your final ${focusLabel(focus).toLowerCase()}.`}
    />
  );
}

function PlanStateCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <SummaryRow label="Weekly rhythm" value="3 planned · 2 is enough" />
    </Card>
  );
}

function SessionRow({ row, detail }: { row: PlanWeekSessionRow; detail?: string }) {
  const stateLabel = row.state === 'complete' ? 'Complete' : row.state === 'next' ? 'Up next' : 'Planned';
  return (
    <View
      style={styles.sessionRow}
      accessible
      accessibilityLabel={`Session ${row.session}. ${stateLabel}${detail ? `. ${detail}` : ''}`}
    >
      <View style={[styles.marker, row.state === 'complete' && styles.markerComplete]}>
        <Text style={styles.markerText}>{row.state === 'complete' ? '✓' : row.session}</Text>
      </View>
      <View style={styles.sessionCopy}>
        <Text style={styles.sessionTitle}>Session {row.session}</Text>
        {detail ? <Text style={styles.sessionDetail}>{detail}</Text> : null}
      </View>
      <Text style={[styles.sessionState, row.state === 'next' && styles.sessionStateNext]}>
        {stateLabel}
      </Text>
    </View>
  );
}

function PreparationRow({ index, title, state }: { index: string; title: string; state: string }) {
  return (
    <View style={styles.preparationRow}>
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

function focusLabel(focus: PhysicalTrainingFocus | null): string {
  if (focus === 'strength') return 'Strength focus';
  if (focus === 'balance') return 'Balance focus';
  return 'Balanced focus';
}

function nextSessionDetail(today: ProgrammeTodayViewModel): string {
  return `${Math.round(today.sessionPreview.estimatedMinutes)} min · ${today.sessionPreview.mainPatternTitles.join(' · ')}`;
}

function formatPlanDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'After this phase'
    : new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date);
}

const styles = StyleSheet.create({
  screenContent: { gap: spacing.xl },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minWidth: 0 },
  title: { ...type.pageTitle, color: colors.textPrimary },
  settingsButton: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  card: { gap: spacing.lg },
  eyebrow: { ...type.cardCaption, color: colors.accentDeep, fontFamily: fonts.sansMedium, letterSpacing: 0.7 },
  planTitle: { fontFamily: fonts.serifMedium, fontSize: 26, lineHeight: 32, color: colors.textPrimary },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
  body: { ...type.bodySmall, color: colors.textSecondary },
  caption: { ...type.cardBody, color: colors.textTertiary },
  phaseRow: { flexDirection: 'row', gap: spacing.sm },
  phase: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.bgElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderHairline },
  phaseActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentDeep },
  phaseComplete: { borderColor: colors.accentBorder },
  phaseText: { ...type.cardCaption, color: colors.textSecondary },
  phaseTextActive: { color: colors.textPrimary, fontFamily: fonts.sansMedium },
  summaryRows: { gap: 0 },
  summaryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline },
  summaryLabel: { ...type.cardBody, color: colors.textSecondary },
  summaryValue: { ...type.cardBody, color: colors.textPrimary, fontFamily: fonts.sansMedium, textAlign: 'right', flexShrink: 1 },
  sessionRows: { gap: 0 },
  sessionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline },
  marker: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderHairline },
  markerComplete: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  markerText: { ...type.cardBody, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  sessionCopy: { flex: 1, minWidth: 0, gap: 2 },
  sessionTitle: { ...type.bodySmall, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  sessionDetail: { ...type.cardCaption, color: colors.textSecondary },
  sessionState: { ...type.cardCaption, color: colors.textTertiary },
  sessionStateNext: { color: colors.accentDeep, fontFamily: fonts.sansMedium },
  nextStep: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.sm, backgroundColor: colors.accentSoft },
  nextStepTitle: { ...type.bodySmall, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  nextStepBody: { ...type.cardBody, color: colors.textSecondary },
  preparationRows: { gap: 0 },
  preparationRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline },
  preparationIndex: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated },
  preparationIndexText: { ...type.cardCaption, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  preparationTitle: { ...type.cardBody, color: colors.textPrimary, flex: 1 },
  preparationState: { ...type.cardCaption, color: colors.textSecondary, textAlign: 'right', flexShrink: 1 },
  pressed: { opacity: 0.78 },
});
