import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from './ui';
import { useSystemInsets } from './SystemInsetsProvider';
import {
  ageFromDateOfBirth,
  dateOfBirthInputLabel,
  normalizeDateOfBirth,
} from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type PickerOption = {
  label: string;
  value: number;
};

const MONTH_OPTIONS: readonly PickerOption[] = [
  { label: 'Jan', value: 1 },
  { label: 'Feb', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 4 },
  { label: 'May', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Aug', value: 8 },
  { label: 'Sep', value: 9 },
  { label: 'Oct', value: 10 },
  { label: 'Nov', value: 11 },
  { label: 'Dec', value: 12 },
] as const;

const PICKER_ROW_HEIGHT = 44;

export function DateOfBirthPickerModal({
  visible,
  value,
  title = 'Select date of birth',
  minimumAge = 18,
  maximumAge = 120,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  value?: string | null;
  title?: string;
  minimumAge?: number;
  maximumAge?: number;
  onCancel: () => void;
  onConfirm: (dateOfBirth: string) => void;
}) {
  const responsive = useResponsiveLayout();
  const insets = useSystemInsets();
  const [draft, setDraft] = React.useState<DateParts>(() =>
    initialDateParts(value, minimumAge, maximumAge)
  );

  React.useEffect(() => {
    if (!visible) return;
    setDraft(initialDateParts(value, minimumAge, maximumAge));
  }, [maximumAge, minimumAge, value, visible]);

  const yearOptions = React.useMemo(
    () => yearOptionsForAgeRange(minimumAge, maximumAge),
    [maximumAge, minimumAge]
  );
  const dayOptions = React.useMemo(() => dayOptionsForMonth(draft.year, draft.month), [
    draft.month,
    draft.year,
  ]);
  const selectedDateOfBirth = dateOfBirthFromParts(draft);
  const selectedAge = ageFromDateOfBirth(selectedDateOfBirth, new Date(), {
    minimumAge,
    maximumAge,
  });
  const ageIsValid =
    selectedAge !== null && selectedAge >= minimumAge && selectedAge <= maximumAge;
  const selectedDateLabel = selectedDateOfBirth
    ? dateOfBirthInputLabel(selectedDateOfBirth)
    : 'Select a date';

  const updateMonth = (month: number) =>
    setDraft((current) => clampDatePartsToAgeRange({ ...current, month }, minimumAge, maximumAge));
  const updateDay = (day: number) =>
    setDraft((current) => clampDatePartsToAgeRange({ ...current, day }, minimumAge, maximumAge));
  const updateYear = (year: number) =>
    setDraft((current) => clampDatePartsToAgeRange({ ...current, year }, minimumAge, maximumAge));
  const confirm = () => {
    if (!selectedDateOfBirth || !ageIsValid) return;
    onConfirm(selectedDateOfBirth);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close date picker"
        />
        <View
          style={[
            styles.sheet,
            {
              maxWidth: responsive.maxContentWidth,
              marginBottom: Math.max(insets.bottom, spacing.lg),
            },
            responsive.isCompactPhone && styles.compactSheet,
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.selectedDate}>
                {selectedDateLabel}
                {selectedAge !== null ? ` - Age ${selectedAge}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.pickerColumns}>
            <PickerColumn
              label="Month"
              options={MONTH_OPTIONS}
              value={draft.month}
              onSelect={updateMonth}
            />
            <PickerColumn
              label="Day"
              options={dayOptions}
              value={draft.day}
              onSelect={updateDay}
            />
            <PickerColumn
              label="Year"
              options={yearOptions}
              value={draft.year}
              onSelect={updateYear}
            />
          </View>

          {!ageIsValid ? (
            <Text style={styles.errorText}>
              Choose a date for ages {minimumAge} to {maximumAge}.
            </Text>
          ) : null}

          <View style={styles.footer}>
            <SecondaryButton title="Cancel" onPress={onCancel} style={styles.footerButton} />
            <PrimaryButton
              title="Save"
              onPress={confirm}
              disabled={!ageIsValid}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PickerColumn({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly PickerOption[];
  value: number;
  onSelect: (value: number) => void;
}) {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const selectedIndex = options.findIndex((option) => option.value === value);

  React.useEffect(() => {
    if (selectedIndex < 0) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, (selectedIndex - 2) * PICKER_ROW_HEIGHT),
        animated: false,
      });
    }, 40);
    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.optionList}
        contentContainerStyle={styles.optionListContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label} ${option.label}`}
            >
              <Text
                style={[styles.optionText, selected && styles.optionTextSelected]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function initialDateParts(
  value: string | null | undefined,
  minimumAge: number,
  maximumAge: number
): DateParts {
  const normalized = normalizeDateOfBirth(value);
  const parsed = datePartsFromIso(normalized);
  if (parsed) return clampDatePartsToAgeRange(parsed, minimumAge, maximumAge);

  const today = new Date();
  const defaultAge = Math.max(minimumAge, Math.min(maximumAge, 55));
  return clampDatePartsToAgeRange({
    year: today.getFullYear() - defaultAge,
    month: today.getMonth() + 1,
    day: today.getDate(),
  }, minimumAge, maximumAge, today);
}

export function yearOptionsForAgeRange(
  minimumAge: number,
  maximumAge: number,
  asOf: Date = new Date()
): PickerOption[] {
  const currentYear = asOf.getFullYear();
  const newest = currentYear - minimumAge;
  const oldest = currentYear - maximumAge;
  const options: PickerOption[] = [];
  for (let year = newest; year >= oldest; year -= 1) {
    options.push({ label: String(year), value: year });
  }
  return options;
}

function dayOptionsForMonth(year: number, month: number): PickerOption[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const value = index + 1;
    return { label: String(value), value };
  });
}

function clampDateParts(parts: DateParts): DateParts {
  const month = Math.max(1, Math.min(12, parts.month));
  const day = Math.max(1, Math.min(daysInMonth(parts.year, month), parts.day));
  return { year: parts.year, month, day };
}

export function clampDatePartsToAgeRange(
  parts: DateParts,
  minimumAge: number,
  maximumAge: number,
  asOf: Date = new Date()
): DateParts {
  const clamped = clampDateParts(parts);
  const latest = datePartsYearsBefore(asOf, minimumAge);
  const earliest = datePartsYearsBefore(asOf, maximumAge);

  if (compareDateParts(clamped, earliest) < 0) return earliest;
  if (compareDateParts(clamped, latest) > 0) return latest;
  return clamped;
}

export function dateOfBirthFromParts(parts: DateParts): string | null {
  return normalizeDateOfBirth(`${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`);
}

function datePartsFromIso(value: string | null): DateParts | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function datePartsYearsBefore(date: Date, years: number): DateParts {
  const year = date.getFullYear() - years;
  const month = date.getMonth() + 1;
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return { year, month, day };
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.modalBackdrop,
  },
  sheet: {
    width: '100%',
    gap: spacing.lg,
    borderRadius: radius.modal,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  compactSheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  selectedDate: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  pickerColumns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  columnLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  optionList: {
    maxHeight: PICKER_ROW_HEIGHT * 5,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgBase,
  },
  optionListContent: {
    padding: spacing.xs,
  },
  option: {
    height: PICKER_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.accentDeep,
  },
  optionText: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  optionTextSelected: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
  },
  errorText: {
    ...type.cardCaption,
    color: colors.warningClay,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
  },
});
