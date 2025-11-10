import type { ComponentType } from 'react';
export interface DateTimePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  onChange?: (...args: any[]) => void;
  [key: string]: unknown;
}
const DateTimePicker: ComponentType<DateTimePickerProps>;
export default DateTimePicker;
