// components/ui/date-range-picker.tsx

import React from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onValueChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ value, onValueChange }: DateRangePickerProps) {
  return (
    <DayPicker
      mode="range"
      selected={value}
      onSelect={onValueChange}
      numberOfMonths={2}
    />
  );
}