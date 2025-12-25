/**
 * Date utility functions for East African Time (EAT)
 * EAT is UTC+3
 */

/**
 * Convert a date string or Date object to East African Time
 * @param date - Date string (ISO format) or Date object
 * @returns Date object in EAT timezone
 */
export function toEAT(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // EAT is UTC+3, so we add 3 hours to UTC time
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const eatTime = new Date(utcTime + (3 * 3600000)); // Add 3 hours for EAT
  return eatTime;
}

/**
 * Format date in East African Time
 * @param date - Date string (ISO format) or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in EAT
 */
export function formatDateEAT(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
): string {
  const eatDate = toEAT(date);
  return eatDate.toLocaleDateString('en-US', {
    ...options,
    timeZone: 'Africa/Nairobi' // Nairobi is in EAT timezone
  });
}

/**
 * Format date and time in East African Time
 * @param date - Date string (ISO format) or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string in EAT
 */
export function formatDateTimeEAT(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const eatDate = toEAT(date);
  return eatDate.toLocaleString('en-US', {
    ...options,
    timeZone: 'Africa/Nairobi'
  });
}

/**
 * Get current date/time in EAT
 * @returns Current Date object in EAT
 */
export function getCurrentEAT(): Date {
  return toEAT(new Date());
}

/**
 * Format date for display (short format)
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string (e.g., "Nov 12, 2025")
 */
export function formatDateShort(date: string | Date): string {
  return formatDateEAT(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date and time for display
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date and time string (e.g., "Nov 12, 2025, 2:30 PM")
 */
export function formatDateTime(date: string | Date): string {
  return formatDateTimeEAT(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}


