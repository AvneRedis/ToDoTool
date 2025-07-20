import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const isToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year
  }

  // Generate calendar days
  const calendarDays = []
  
  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false
    })
  }
  
  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isToday: isToday(day)
    })
  }
  
  // Next month's leading days
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isToday: false
    })
  }

  return (
    <div className="mini-calendar" style={{
      padding: '0px 1rem',
      margin: '-0.5rem 0px 1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <button
          onClick={goToPrevMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.125rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft style={{ width: '0.875rem', height: '0.875rem', color: 'var(--gray-600)' }} />
        </button>
        
        <h3 style={{
          fontSize: '0.8rem',
          fontWeight: '600',
          color: 'var(--gray-900)',
          margin: 0
        }}>
          {monthNames[month]} {year}
        </h3>
        
        <button
          onClick={goToNextMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.125rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRight style={{ width: '0.875rem', height: '0.875rem', color: 'var(--gray-600)' }} />
        </button>
      </div>

      {/* Day names */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.125rem',
        marginBottom: '0.25rem'
      }}>
        {dayNames.map((dayName, index) => (
          <div
            key={fullDayNames[index]}
            style={{
              fontSize: '0.65rem',
              fontWeight: '500',
              color: 'var(--gray-500)',
              textAlign: 'center',
              padding: '0.125rem'
            }}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.125rem'
      }}>
        {calendarDays.map((dayObj, index) => (
          <div
            key={index}
            style={{
              fontSize: '0.65rem',
              textAlign: 'center',
              padding: '0.25rem 0.125rem',
              borderRadius: 'var(--radius-sm)',
              color: dayObj.isCurrentMonth
                ? (dayObj.isToday ? 'white' : 'var(--gray-900)')
                : 'var(--gray-400)',
              backgroundColor: dayObj.isToday
                ? 'var(--primary-500)'
                : 'transparent',
              fontWeight: dayObj.isToday ? '600' : '400',
              cursor: dayObj.isCurrentMonth ? 'pointer' : 'default'
            }}
          >
            {dayObj.day}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MiniCalendar
