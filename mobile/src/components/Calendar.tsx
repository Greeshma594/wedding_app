import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  WEEKDAYS_SHORT,
  formatDate,
  monthGrid,
  monthLabel,
  parseISODate,
  todayISO,
  type ISODate,
} from '../lib/dates';
import { colors, radius, space, type } from '../theme';

interface CalendarProps {
  selected: ISODate | null;
  onSelect: (date: ISODate) => void;
  /** Number of blocked dresses per day, shown as a dot with a count. */
  marks?: Record<ISODate, number>;
  minDate?: ISODate;
  onMonthChange?: (year: number, month: number) => void;
}

export function Calendar({ selected, onSelect, marks, minDate, onMonthChange }: CalendarProps) {
  const start = parseISODate(selected ?? todayISO());
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const today = todayISO();

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    const next = { year: d.getFullYear(), month: d.getMonth() };
    setView(next);
    onMonthChange?.(next.year, next.month);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Previous month" onPress={() => shift(-1)} style={styles.navButton}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={type.heading}>{monthLabel(view.year, view.month)}</Text>
        <Pressable accessibilityLabel="Next month" onPress={() => shift(1)} style={styles.navButton}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS_SHORT.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {monthGrid(view.year, view.month).map((week, i) => (
        <View key={i} style={styles.week}>
          {week.map((day, j) => {
            if (!day) return <View key={j} style={styles.day} />;
            const disabled = minDate ? day < minDate : false;
            const isSelected = day === selected;
            const count = marks?.[day] ?? 0;
            return (
              <Pressable
                key={j}
                accessibilityLabel={`${formatDate(day)}${count ? `, ${count} blocked` : ''}`}
                disabled={disabled}
                onPress={() => onSelect(day)}
                style={[styles.day, isSelected && styles.daySelected, disabled && { opacity: 0.3 }]}>
                <Text
                  style={[
                    styles.dayText,
                    day === today && styles.dayToday,
                    isSelected && styles.dayTextSelected,
                  ]}>
                  {Number(day.slice(8))}
                </Text>
                {count > 0 ? (
                  <Text style={[styles.mark, isSelected && styles.dayTextSelected]}>{count}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string;
  value: ISODate | null;
  onChange: (date: ISODate) => void;
  minDate?: ISODate;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: space.xs + 2, flex: 1 }}>
      <Text style={type.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.dateInput}>
        <Text style={{ fontSize: 16, color: value ? colors.ink : colors.muted }}>
          {value ? formatDate(value) : 'Choose date'}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={type.heading}>{label}</Text>
            <Calendar
              selected={value ?? minDate ?? null}
              minDate={minDate}
              onSelect={(d) => {
                onChange(d);
                setOpen(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { gap: space.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  navText: { fontSize: 22, color: colors.accent, lineHeight: 24 },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.muted },
  day: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    margin: 1,
  },
  daySelected: { backgroundColor: colors.accent },
  dayText: { fontSize: 15, color: colors.ink },
  dayToday: { fontWeight: '800', color: colors.accent, textDecorationLine: 'underline' },
  dayTextSelected: { color: '#fff' },
  mark: { fontSize: 10, fontWeight: '700', color: colors.gold },
  dateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(42,31,45,0.45)', justifyContent: 'center', padding: space.lg },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
});
