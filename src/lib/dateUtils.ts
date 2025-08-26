// Timezone mapping from display names to IANA identifiers
const timezoneMap: { [key: string]: string } = {
  'UTC-8': 'America/Los_Angeles',
  'UTC-7': 'America/Denver', 
  'UTC-6': 'America/Chicago',
  'UTC-5': 'America/New_York',
  'UTC+0': 'UTC',
  'UTC+5:30': 'Asia/Kolkata'
}

// Date and time utility functions
export const formatDate = (date: Date, format: string, timezone?: string): string => {
  try {
    const ianaTimezone = timezone ? (timezoneMap[timezone] || timezone) : 'UTC'
    const options: Intl.DateTimeFormatOptions = {
      timeZone: ianaTimezone
    }

    switch (format) {
      case 'MM/DD/YYYY':
        options.month = '2-digit'
        options.day = '2-digit'
        options.year = 'numeric'
        return new Intl.DateTimeFormat('en-US', options).format(date)
      
      case 'DD/MM/YYYY':
        options.day = '2-digit'
        options.month = '2-digit'
        options.year = 'numeric'
        return new Intl.DateTimeFormat('en-GB', options).format(date)
      
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0]
      
      default:
        return date.toLocaleDateString()
    }
  } catch (error) {
    console.error('Date formatting error:', error)
    return date.toLocaleDateString()
  }
}

export const formatTime = (date: Date, timezone?: string): string => {
  try {
    const ianaTimezone = timezone ? (timezoneMap[timezone] || timezone) : 'UTC'
    return new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date)
  } catch (error) {
    console.error('Time formatting error:', error)
    return date.toLocaleTimeString()
  }
}

export const getTimezoneOffset = (timezone: string): string => {
  try {
    const ianaTimezone = timezoneMap[timezone] || timezone
    const date = new Date()
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: ianaTimezone,
      timeZoneName: 'longOffset'
    })
    const parts = formatter.formatToParts(date)
    const offsetPart = parts.find(part => part.type === 'timeZoneName')
    return offsetPart?.value || '±0'
  } catch {
    return '±0'
  }
}
