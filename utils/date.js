import { format } from 'date-fns';

export function toDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}



