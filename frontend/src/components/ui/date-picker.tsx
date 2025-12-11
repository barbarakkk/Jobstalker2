import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, getMonth, setMonth, setYear, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  type?: "date" | "month"
  min?: string
  max?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
  type = "date",
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (value && value.trim() !== '') {
      try {
        const date = new Date(value + (type === "month" ? "-01" : ""))
        if (!isNaN(date.getTime())) {
          return date
        }
      } catch (e) {
        // Invalid date, use current date
      }
    }
    return new Date()
  })

  const selectedDate = value && value.trim() !== '' ? (() => {
    try {
      const date = new Date(value + (type === "month" ? "-01" : ""))
      return !isNaN(date.getTime()) ? date : null
    } catch (e) {
      return null
    }
  })() : null
  const minDate = min ? new Date(min + (type === "month" ? "-01" : "")) : null
  const maxDate = max ? new Date(max + (type === "month" ? "-01" : "")) : null

  const handleDateSelect = (date: Date) => {
    if (type === "month") {
      const monthValue = format(date, "yyyy-MM")
      onChange?.(monthValue)
    } else {
      const dateValue = format(date, "yyyy-MM-dd")
      onChange?.(dateValue)
    }
    setOpen(false)
  }

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
      return newMonth
    })
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentMonth, monthIndex)
    setCurrentMonth(newDate)
    if (type === "month") {
      handleDateSelect(newDate)
    }
  }

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentMonth, year)
    setCurrentMonth(newDate)
    if (type === "month") {
      handleDateSelect(newDate)
    }
  }

  const handleYearChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const currentYear = getYear(prev)
      const newYear = direction === "prev" ? currentYear - 1 : currentYear + 1
      return setYear(prev, newYear)
    })
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const displayValue = value && value.trim() !== ''
    ? (() => {
        try {
          if (type === "month") {
            const date = new Date(value + "-01")
            if (!isNaN(date.getTime())) {
              return format(date, "MMM yyyy")
            }
          } else {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              return format(date, "MMM dd, yyyy")
            }
          }
        } catch (e) {
          // Invalid date
        }
        return ""
      })()
    : ""

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Generate year options (current year ± 50 years)
  const currentYear = getYear(new Date())
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i)

  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close month/year picker when main popover closes
  React.useEffect(() => {
    if (!open) {
      setShowMonthYearPicker(false)
    }
  }, [open])

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        variant="outline"
        type="button"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className,
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue || <span>{placeholder}</span>}
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-auto rounded-lg border bg-white p-3 shadow-lg">
          {type === "date" ? (
            <div className="flex flex-col space-y-4">
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 text-sm font-semibold hover:bg-gray-100"
                  onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                >
                  {format(currentMonth, "MMMM yyyy")}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMonthChange("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMonthChange("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Month/Year Picker */}
              {showMonthYearPicker && (
                <div className="mb-4 rounded-lg border bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-2 text-xs font-semibold text-gray-600">Month</div>
                      <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <Button
                            key={i}
                            variant={getMonth(currentMonth) === i ? "default" : "ghost"}
                            className="h-8 text-xs"
                            onClick={() => {
                              handleMonthSelect(i)
                              setShowMonthYearPicker(false)
                            }}
                          >
                            {format(new Date(2024, i, 1), "MMM")}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold text-gray-600">Year</div>
                      <div className="date-picker-year-list max-h-48 overflow-y-auto rounded border bg-white p-1">
                        <div className="grid grid-cols-3 gap-1">
                          {years.map((year) => (
                            <Button
                              key={year}
                              variant={getYear(currentMonth) === year ? "default" : "ghost"}
                              className="h-8 text-xs"
                              onClick={() => {
                                handleYearSelect(year)
                                setShowMonthYearPicker(false)
                              }}
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Grid */}
              <div className="space-y-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, dayIdx) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isToday = isSameDay(day, new Date())
                    const isDisabled = isDateDisabled(day)

                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => !isDisabled && handleDateSelect(day)}
                        disabled={isDisabled}
                        className={cn(
                          "h-9 w-9 rounded-md text-sm transition-colors",
                          isCurrentMonth ? "text-gray-900" : "text-gray-400",
                          isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                          !isSelected && isCurrentMonth && "hover:bg-gray-100",
                          isToday && !isSelected && "bg-blue-50 text-blue-600 font-semibold",
                          isDisabled && "cursor-not-allowed opacity-30",
                          !isDisabled && !isSelected && "hover:bg-gray-100"
                        )}
                      >
                        {format(day, "d")}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    onChange?.("")
                    setOpen(false)
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    handleDateSelect(new Date())
                  }}
                >
                  Today
                </Button>
              </div>
            </div>
          ) : (
            // Month picker
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleYearChange("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    className="h-8 px-3 text-sm font-semibold hover:bg-gray-100"
                    onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                  >
                    {format(currentMonth, "yyyy")}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                  {showMonthYearPicker && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border bg-white p-2 shadow-lg">
                      <div className="date-picker-year-list max-h-64 overflow-y-auto pr-1">
                        <div className="grid grid-cols-3 gap-1">
                          {years.map((year) => (
                            <Button
                              key={year}
                              variant={getYear(currentMonth) === year ? "default" : "ghost"}
                              className="h-8 text-xs"
                              onClick={() => {
                                handleYearSelect(year)
                                setShowMonthYearPicker(false)
                              }}
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleYearChange("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthDate = new Date(getYear(currentMonth), i, 1)
                  const isSelected = selectedDate && getYear(selectedDate) === getYear(currentMonth) && getMonth(selectedDate) === i
                  const isCurrentMonth = getMonth(new Date()) === i && getYear(new Date()) === getYear(currentMonth)

                  return (
                    <Button
                      key={i}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-12 text-sm",
                        isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                        isCurrentMonth && !isSelected && "border-blue-300 bg-blue-50"
                      )}
                      onClick={() => handleMonthSelect(i)}
                    >
                      {format(monthDate, "MMM")}
                    </Button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    onChange?.("")
                    setOpen(false)
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    handleDateSelect(new Date())
                  }}
                >
                  This Month
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
