// LibreView CSV Parser
// Parses FreeStyle Libre 3 glucose data exports

import type { GlucoseReading, DailyGlucoseData, ParsedLibreViewData } from '../types';

interface CSVRow {
  [key: string]: string;
}

/**
 * Parse a LibreView CSV export file
 */
export function parseLibreViewCSV(csvContent: string): ParsedLibreViewData {
  const lines = csvContent.trim().split(/\r?\n/);
  
  // LibreView CSVs have metadata rows before the header
  // Find the actual header row (contains "Device" column)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].toLowerCase().includes('device') && lines[i].toLowerCase().includes('timestamp')) {
      headerIndex = i;
      break;
    }
  }
  
  const headers = parseCSVLine(lines[headerIndex]);
  const rows: CSVRow[] = [];
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: CSVRow = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }
  
  // Detect unit from header
  const unit = detectUnit(headers);
  
  // Extract device info from first data row
  const deviceName = rows[0]?.['Device'] || 'Unknown Device';
  const serialNumber = rows[0]?.['Serial Number'] || '';
  
  // Parse glucose readings
  const readings = parseGlucoseReadings(rows, unit);
  
  // Group by day
  const days = groupReadingsByDay(readings);
  
  return {
    days,
    unit,
    deviceName,
    serialNumber,
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

/**
 * Detect glucose unit from CSV headers
 */
function detectUnit(headers: string[]): 'mg/dL' | 'mmol/L' {
  const headerStr = headers.join(' ').toLowerCase();
  if (headerStr.includes('mmol/l')) {
    return 'mmol/L';
  }
  return 'mg/dL';
}

/**
 * Find the glucose column name (varies by region/export)
 */
function findGlucoseColumn(row: CSVRow): string | null {
  const possibleColumns = [
    'Historic Glucose mg/dL',
    'Historic Glucose mmol/L',
    'Scan Glucose mg/dL',
    'Scan Glucose mmol/L',
    'Historic Glucose (mg/dL)',
    'Historic Glucose (mmol/L)',
  ];
  
  for (const col of possibleColumns) {
    if (col in row && row[col]) {
      return col;
    }
  }
  
  // Try partial match
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().includes('historic glucose') && row[key]) {
      return key;
    }
    if (key.toLowerCase().includes('scan glucose') && row[key]) {
      return key;
    }
  }
  
  return null;
}

/**
 * Find the timestamp column name
 */
function findTimestampColumn(row: CSVRow): string | null {
  const possibleColumns = [
    'Device Timestamp',
    'Timestamp',
    'Time',
    'Date/Time',
  ];
  
  for (const col of possibleColumns) {
    if (col in row) {
      return col;
    }
  }
  
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().includes('timestamp')) {
      return key;
    }
  }
  
  return null;
}

/**
 * Parse glucose readings from CSV rows
 */
function parseGlucoseReadings(rows: CSVRow[], unit: 'mg/dL' | 'mmol/L'): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  
  if (rows.length === 0) return readings;
  
  const timestampCol = findTimestampColumn(rows[0]);
  
  for (const row of rows) {
    const glucoseCol = findGlucoseColumn(row);
    if (!glucoseCol || !timestampCol) continue;
    
    const valueStr = row[glucoseCol];
    const timestampStr = row[timestampCol];
    
    // Skip invalid readings (Lo, Hi, or empty)
    if (!valueStr || valueStr === 'Lo' || valueStr === 'Hi') continue;
    
    const value = parseFloat(valueStr);
    if (isNaN(value)) continue;
    
    // Convert mmol/L to mg/dL for internal consistency
    const normalizedValue = unit === 'mmol/L' ? value * 18.0182 : value;
    
    // Parse timestamp
    const timestamp = parseTimestamp(timestampStr);
    if (!timestamp) continue;
    
    // Determine record type
    const recordType = glucoseCol.toLowerCase().includes('scan') ? 1 : 0;
    
    readings.push({
      timestamp,
      value: normalizedValue,
      recordType,
    });
  }
  
  // Sort by timestamp
  readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return readings;
}

/**
 * Parse various timestamp formats
 */
function parseTimestamp(str: string): Date | null {
  if (!str) return null;
  
  // Don't use native Date parsing as it's inconsistent across browsers
  // LibreView typically uses: DD-MM-YYYY HH:MM or DD/MM/YYYY HH:MM (European)
  
  // Match various date formats with time
  const parts = str.match(/(\d{1,4})[-\/.](\d{1,2})[-\/.](\d{1,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (parts) {
    const [, p1, p2, p3, hour, minute] = parts;
    let year: number, month: number, day: number;
    
    if (p1.length === 4) {
      // YYYY-MM-DD format (ISO-like)
      year = parseInt(p1);
      month = parseInt(p2) - 1;
      day = parseInt(p3);
    } else if (p3.length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY format
      year = parseInt(p3);
      
      const n1 = parseInt(p1);
      const n2 = parseInt(p2);
      
      if (n1 > 12) {
        // First number > 12, must be day: DD-MM-YYYY
        day = n1;
        month = n2 - 1;
      } else if (n2 > 12) {
        // Second number > 12, must be day: MM-DD-YYYY
        month = n1 - 1;
        day = n2;
      } else {
        // Both <= 12, ambiguous
        // LibreView uses European format (DD-MM-YYYY) by default
        day = n1;
        month = n2 - 1;
      }
    } else {
      // YY-MM-DD or other short format
      year = 2000 + parseInt(p1);
      month = parseInt(p2) - 1;
      day = parseInt(p3);
    }
    
    return new Date(year, month, day, parseInt(hour), parseInt(minute));
  }
  
  // Fallback: try native parsing for ISO format
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  return null;
}

/**
 * Group readings by day and calculate stats
 */
function groupReadingsByDay(readings: GlucoseReading[]): Map<string, DailyGlucoseData> {
  const days = new Map<string, DailyGlucoseData>();
  
  for (const reading of readings) {
    const dateKey = formatDateKey(reading.timestamp);
    
    if (!days.has(dateKey)) {
      days.set(dateKey, {
        date: dateKey,
        readings: [],
        wavetable: null,
        stats: { min: Infinity, max: -Infinity, avg: 0, timeInRange: 0 },
      });
    }
    
    days.get(dateKey)!.readings.push(reading);
  }
  
  // Calculate stats for each day
  for (const [, dayData] of days) {
    calculateDayStats(dayData);
  }
  
  return days;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate statistics for a day's readings
 */
function calculateDayStats(dayData: DailyGlucoseData): void {
  const values = dayData.readings.map(r => r.value);
  
  if (values.length === 0) {
    dayData.stats = { min: 0, max: 0, avg: 0, timeInRange: 0 };
    return;
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Time in range (70-180 mg/dL)
  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const timeInRange = (inRange / values.length) * 100;
  
  dayData.stats = { min, max, avg, timeInRange };
}

/**
 * Get sorted list of available dates
 */
export function getAvailableDates(data: ParsedLibreViewData): string[] {
  return Array.from(data.days.keys()).sort();
}

/**
 * Format a date string for display
 */
export function formatDateForDisplay(dateKey: string): string {
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

