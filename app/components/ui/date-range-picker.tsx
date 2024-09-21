import React, { useState, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onValueChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ value, onValueChange }: DateRangePickerProps) {
  const [defaultValue, setDefaultValue] = useState<DateRange | undefined>(value);

  useEffect(() => {
    if (!value) {
      const today = new Date();
      setDefaultValue({ from: today, to: today });
      onValueChange({ from: today, to: today });
    }
  }, [value, onValueChange]);

  return (
    <DayPicker
      mode="range"
      selected={defaultValue}  
      onSelect={(newValue) => {
        setDefaultValue(newValue);
        onValueChange(newValue);
      }}
      numberOfMonths={2}
    />
  );
}