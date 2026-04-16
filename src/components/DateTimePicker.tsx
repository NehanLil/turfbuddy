import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  time,
  onDateChange,
  onTimeChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const selectedDate = date ? new Date(date) : new Date();

  const popularTimes = [
    { label: 'Morning', times: ['06:00', '07:00', '08:00', '09:00'] },
    { label: 'Afternoon', times: ['12:00', '13:00', '14:00', '15:00'] },
    { label: 'Evening', times: ['17:00', '18:00', '19:00', '20:00'] },
  ];

  const handleQuickDate = (days: number) => {
    const newDate = addDays(startOfDay(new Date()), days);
    onDateChange(format(newDate, 'yyyy-MM-dd'));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onDateChange(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      onTimeChange(format(selectedTime, 'HH:mm'));
    }
  };

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDateLabel = () => {
    if (!date) return 'Select a date';
    const dateObj = new Date(date);
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    return format(dateObj, 'EEEE, MMM d');
  };

  return (
    <View style={styles.container}>
      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Date *</Text>
        
        {/* Quick Date Buttons */}
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={[
              styles.quickButton,
              date && isToday(new Date(date)) && styles.quickButtonActive,
            ]}
            onPress={() => handleQuickDate(0)}
          >
            <Text
              style={[
                styles.quickButtonText,
                date && isToday(new Date(date)) && styles.quickButtonTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickButton,
              date && isTomorrow(new Date(date)) && styles.quickButtonActive,
            ]}
            onPress={() => handleQuickDate(1)}
          >
            <Text
              style={[
                styles.quickButtonText,
                date && isTomorrow(new Date(date)) && styles.quickButtonTextActive,
              ]}
            >
              Tomorrow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.quickButtonText}>📅 Pick Date</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Date Preview */}
        {date && (
          <View style={styles.preview}>
            <Text style={styles.previewIcon}>📅</Text>
            <Text style={styles.previewText}>{getDateLabel()}</Text>
            <Text style={styles.previewYear}>
              {format(new Date(date), 'yyyy')}
            </Text>
          </View>
        )}
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Time *</Text>

        {/* Popular Time Slots */}
        <ScrollView style={styles.timeSlotsContainer} nestedScrollEnabled>
          {popularTimes.map((group) => (
            <View key={group.label} style={styles.timeGroup}>
              <Text style={styles.timeGroupLabel}>{group.label}</Text>
              <View style={styles.timeSlots}>
                {group.times.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.timeSlot,
                      time === t && styles.timeSlotActive,
                    ]}
                    onPress={() => onTimeChange(t)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        time === t && styles.timeSlotTextActive,
                      ]}
                    >
                      {formatTimeDisplay(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Custom Time Button */}
        <TouchableOpacity
          style={styles.customTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.customTimeButtonText}>
            🕐 {time ? formatTimeDisplay(time) : 'Enter custom time'}
          </Text>
        </TouchableOpacity>

        {/* Selected Time Preview */}
        {time && (
          <View style={[styles.preview, { backgroundColor: '#8b5cf620' }]}>
            <Text style={styles.previewIcon}>🕐</Text>
            <Text style={[styles.previewText, { color: '#8b5cf6' }]}>
              {formatTimeDisplay(time)}
            </Text>
          </View>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={time ? new Date(`2000-01-01T${time}`) : new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  quickButtonTextActive: {
    color: '#fff',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#38bdf820',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf830',
  },
  previewIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#38bdf8',
    flex: 1,
  },
  previewYear: {
    fontSize: 12,
    color: '#6b7280',
  },
  timeSlotsContainer: {
    maxHeight: 300,
  },
  timeGroup: {
    marginBottom: 16,
  },
  timeGroupLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '22%',
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeSlotTextActive: {
    color: '#fff',
  },
  customTimeButton: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  customTimeButtonText: {
    fontSize: 13,
    color: '#6b7280',
  },
});

