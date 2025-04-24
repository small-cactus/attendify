import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { 
  chevronBack, 
  chevronForward,
  timeOutline,
  calendarOutline,
} from 'ionicons/icons';
import NumberFlow from '@number-flow/react';

interface CustomDateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDateTime: (date: Date | null) => void;
  initialDate?: Date | null;
  mode: 'date' | 'time' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
  anchorEl?: HTMLElement | null; // Reference to the input element
  minTime?: Date; // Add minTime prop
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CustomDateTimePickerModal: React.FC<CustomDateTimePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDateTime,
  initialDate,
  mode,
  minDate,
  maxDate,
  anchorEl,
  minTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');
  const [pendingView, setPendingView] = useState<'date' | 'time' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalSize, setModalSize] = useState<{width: number, height: number} | null>(null);

  // Calculate position based on anchor element relative to its offset parent
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorEl && isOpen) {
      const top = anchorEl.offsetTop + anchorEl.offsetHeight + 4; // Position below the anchor + 4px gap
      // Dynamically set width based on view
      const pickerWidth = view === 'time' ? 380 : 320;
      const left = anchorEl.offsetLeft + (anchorEl.offsetWidth / 2) - (pickerWidth / 2);
      // Ensure the picker doesn't go off the left edge of the screen/container
      const adjustedLeft = Math.max(0, left);
      setPosition({ top, left: adjustedLeft });
    }
  }, [anchorEl, isOpen, view]);

  // Update the useEffect for initialization
  useEffect(() => {
    if (isOpen) {
      console.log("Modal opening with initialDate:", initialDate?.toString(), "mode:", mode);
      
      // Get base date to use - either initialDate or current time
      let date = initialDate;
      
      // If no initialDate is provided, use current time
      if (!date) {
        date = new Date();
        // Round to nearest 5 minutes for a cleaner default time
        const minutes = Math.round(date.getMinutes() / 5) * 5;
        date.setMinutes(minutes);
        console.log("No initialDate provided, using current time:", date.toString());
      }
      
      setSelectedDate(date);
      setCurrentMonth(date);
      
      // Set time values from the date
      const hours12 = formatHours(date.getHours());
      const mins = date.getMinutes().toString().padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
      
      console.log(`Setting time values - Hours: ${hours12}, Minutes: ${mins}, Period: ${ampm}`);
      
      setHours(hours12);
      setMinutes(mins);
      setPeriod(ampm);
      
      // Choose initial view based on mode
      if (mode === 'time') {
        console.log("Time mode detected, setting view to time");
        setView('time');
      } else if (mode === 'date') {
        setView('date');
      } else {
        // For datetime mode, start with date view
        setView('date');
      }
    }
  }, [isOpen, initialDate, mode]);

  const formatHours = (hour: number): string => {
    if (hour === 0) return '12';
    if (hour > 12) return (hour - 12).toString();
    return hour.toString();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = Array(42).fill(null);
    
    for (let i = 0; i < daysInMonth; i++) {
      days[i + startingDay] = i + 1;
    }
    
    return days;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    }
    const isSameDay = selectedDate &&
      newDate.getFullYear() === selectedDate.getFullYear() &&
      newDate.getMonth() === selectedDate.getMonth() &&
      newDate.getDate() === selectedDate.getDate();
    setSelectedDate(newDate);
    // If datetime mode, and the user clicks the already-selected date, trigger the transition like the Next button
    if (mode === 'datetime') {
      if (isSameDay) {
        requestViewChange('time');
      } else {
        // If a new date is selected, do not auto-advance
      }
    }
  };

  const handleTimeChange = () => {
    if (!selectedDate) return;
    
    let hours24 = parseInt(hours);
    if (period === 'PM' && hours24 !== 12) hours24 += 12;
    if (period === 'AM' && hours24 === 12) hours24 = 0;
    
    console.log(`Converting time: ${hours}:${minutes} ${period} → ${hours24}:${minutes} (24hr)`);
    
    const newDate = new Date(selectedDate);
    newDate.setHours(hours24, parseInt(minutes));
    console.log(`Time change result: ${newDate.toString()}`);
    setSelectedDate(newDate);
    return newDate;
  };

  const handleTimeConfirm = () => {
    const newDate = handleTimeChange();
    if (newDate) {
      // --- MinTime Validation ---
      if (minTime) {
        // Only compare time if the date part is the same (i.e., today)
        const newDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        const minTimeOnly = new Date(minTime.getFullYear(), minTime.getMonth(), minTime.getDate());
        
        if (newDateOnly.getTime() === minTimeOnly.getTime() && newDate < minTime) {
          alert(`Selected time (${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) cannot be before the minimum time (${minTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`);
          return; // Prevent confirming
        }
      }
      // --- End MinTime Validation ---

      console.log('handleTimeConfirm called, newDate:', newDate, 'hours:', hours, 'minutes:', minutes, 'period:', period);
      onSelectDateTime(newDate);
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    // Ignore time component for min/max date comparison
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (minDate) {
      const minDateOnly = new Date(minDate);
      minDateOnly.setHours(0, 0, 0, 0);
      if (dateOnly < minDateOnly) return true;
    }
    if (maxDate) {
      const maxDateOnly = new Date(maxDate);
      maxDateOnly.setHours(0, 0, 0, 0);
      if (dateOnly > maxDateOnly) return true;
    }
    return false;
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Do not close the modal when clicking inside it
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && 
          (!anchorEl || !anchorEl.contains(event.target as Node))) {
        onClose();
      }
    };

    if (isOpen) {
      // Use mousedown instead of click to prevent date selection from closing modal
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  // Add mount/unmount debug log
  useEffect(() => {
    console.log('CustomDateTimePickerModal mounted', { isOpen, mode });
    return () => {
      console.log('CustomDateTimePickerModal unmounted', { isOpen, mode });
    };
  }, []);

  // Shared transition for header and content (blur lingers longer than fade)
  const TRANSITION = {
    opacity: { duration: 0.16, ease: 'easeInOut' },
    filter: { duration: 0.28, ease: 'easeInOut' }
  };

  // Animation variants
  const modalVariants = {
    hidden: { 
      opacity: 0,
      filter: 'blur(16px)',
      scale: 0.9,
      y: -20
    },
    visible: { 
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      y: 0,
      transition: {
        ...TRANSITION,
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0,
      filter: 'blur(16px)',
      scale: 0.9,
      y: -20,
      transition: {
        ...TRANSITION,
        duration: 0.2
      }
    }
  };

  // Coordinated view change handler
  const requestViewChange = (nextView: 'date' | 'time') => {
    if (view !== nextView && !isTransitioning) {
      setPendingView(nextView);
      setIsTransitioning(true);
    }
  };

  // Lock modal size before transition
  useEffect(() => {
    if (isTransitioning && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setModalSize({ width: rect.width, height: rect.height });
    }
    if (!isTransitioning) {
      setModalSize(null);
    }
  }, [isTransitioning]);

  // When switching to time view, set the time picker's state to selectedDate's time (if set), otherwise to current time
  useEffect(() => {
    if (view === 'time' && !pendingView) {
      let date = selectedDate;
      if (!date) {
        date = new Date();
      }
      const hours12 = formatHours(date.getHours());
      const mins = date.getMinutes().toString().padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
      setHours(hours12);
      setMinutes(mins);
      setPeriod(ampm);
    }
  }, [view, pendingView]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Darker backdrop without blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />
          {/* Picker Modal */}
          <motion.div
            ref={modalRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              zIndex: 60,
              width: modalSize ? modalSize.width : undefined,
              height: modalSize ? modalSize.height : undefined,
            }}
            className={`bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 ${!modalSize ? (view === 'time' ? 'w-[380px] h-[405px]' : 'w-[320px] h-[445px]') : ''}`}
            layout
          >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100"
              layout
            >
              <div className="relative w-full" style={{ minHeight: 32 }}>
                <AnimatePresence mode="sync" initial={false}>
                  {(!pendingView) && (
                    <motion.h4
                      key={view}
                      className="absolute left-0 right-0 text-md font-semibold text-gray-900 flex items-center gap-2 justify-start"
                      initial={{ opacity: 0, filter: 'blur(16px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(16px)' }}
                      transition={TRANSITION}
                    >
                      <IonIcon icon={view === 'date' ? calendarOutline : timeOutline} className="text-lg" />
                      {view === 'date' ? 'Select Date' : 'Select Time'}
                    </motion.h4>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Content container with layout animation */}
            <div className="pt-4 pb-6 px-6">
              <AnimatePresence mode="sync" initial={false} onExitComplete={() => {
                if (pendingView) {
                  setView(pendingView);
                  setPendingView(null);
                  setIsTransitioning(false);
                }
              }}>
                {view === 'date' && !pendingView && (
                  <motion.div
                    key="date"
                    initial={{ opacity: 0, filter: 'blur(16px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(16px)' }}
                    transition={TRANSITION}
                  >
                    {/* Date View */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                    >
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Stop event propagation
                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          type="button"
                        >
                          <IonIcon icon={chevronBack} className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium">
                          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Stop event propagation
                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          type="button"
                        >
                          <IonIcon icon={chevronForward} className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                        
                        {getDaysInMonth(currentMonth).map((day, index) => {
                          if (day === null) {
                            return <div key={index} className="aspect-square" />;
                          }
                          
                          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                          const isSelected = selectedDate?.toDateString() === date.toDateString();
                          const isDisabled = isDateDisabled(date);
                          const isToday = date.toDateString() === new Date().toDateString();
                          
                          return (
                            <button
                              key={index}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent event bubbling
                                if (!isDisabled) {
                                  handleDateSelect(day);
                                }
                              }}
                              disabled={isDisabled}
                              className={`
                                aspect-square flex items-center justify-center text-sm rounded-xl
                                transition-all relative
                                ${isSelected ? 'bg-black text-white' : 'hover:bg-gray-100'}
                                ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                                ${isToday && !isSelected ? 'text-blue-600 font-medium' : ''}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      {mode === 'datetime' && (
                        <div className="flex justify-end mt-0 w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              requestViewChange('time');
                            }}
                            className="px-4 py-2 text-sm bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-all flex items-center gap-1"
                          >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </button>
                        </div>
                      )}
                      {mode === 'date' && (
                        <div className="flex justify-end mt-0 w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              if (selectedDate) {
                                onSelectDateTime(selectedDate);
                                onClose();
                              }
                            }}
                            className="px-3 py-1.5 text-sm bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-all"
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
                {view === 'time' && !pendingView && (
                  <motion.div
                    key="time"
                    initial={{ opacity: 0, filter: 'blur(16px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(16px)' }}
                    transition={TRANSITION}
                  >
                    {/* Time View */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                    >
                      {/* Modern Time Picker UI */}
                      <div className="flex items-center justify-center gap-3 py-4 px-2">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              const currentHour = parseInt(hours);
                              let newHour = currentHour + 1;
                              if (newHour > 12) newHour = 1;
                              setHours(newHour.toString().padStart(2, '0'));
                            }}
                            className="w-14 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl mb-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 15l-7.5-7.5L4.5 15" />
                            </svg>
                          </button>
                          <div className="w-20 h-24 flex items-center justify-center bg-gray-100 rounded-xl text-6xl font-semibold text-black mb-2 px-2">
                            <NumberFlow
                              value={parseInt(hours)}
                              className="px-4"
                              animated
                              spinTiming={{ duration: 500, easing: 'cubic-bezier(0, 0, 0.2, 1)' }}
                              transformTiming={{ duration: 500, easing: 'ease-in-out' }}
                              opacityTiming={{ duration: 350, easing: 'ease-out' }}
                              style={{ fontSize: '3.75rem', fontWeight: 600, color: 'black' }}
                            />
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              const currentHour = parseInt(hours);
                              let newHour = currentHour - 1;
                              if (newHour < 1) newHour = 12;
                              setHours(newHour.toString().padStart(2, '0'));
                            }}
                            className="w-14 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl mt-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9l7.5 7.5 7.5-7.5" />
                            </svg>
                          </button>
                        </div>

                        <span className="text-6xl font-bold mx-2">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              const currentMinutes = parseInt(minutes);
                              let newMinutes = currentMinutes + 1;
                              if (newMinutes >= 60) newMinutes = 0;
                              setMinutes(newMinutes.toString().padStart(2, '0'));
                            }}
                            className="w-14 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl mb-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 15l-7.5-7.5L4.5 15" />
                            </svg>
                          </button>
                          <div className="w-20 h-24 flex items-center justify-center bg-gray-100 rounded-xl text-6xl font-semibold text-black mb-2 px-2">
                            <NumberFlow
                              value={parseInt(minutes)}
                              className="px-4"
                              animated
                              spinTiming={{ duration: 500, easing: 'cubic-bezier(0, 0, 0.2, 1)' }}
                              transformTiming={{ duration: 500, easing: 'ease-in-out' }}
                              opacityTiming={{ duration: 350, easing: 'ease-out' }}
                              style={{ fontSize: '3.75rem', fontWeight: 600, color: 'black' }}
                            />
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              const currentMinutes = parseInt(minutes);
                              let newMinutes = currentMinutes - 1;
                              if (newMinutes < 0) newMinutes = 59;
                              setMinutes(newMinutes.toString().padStart(2, '0'));
                            }}
                            className="w-14 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl mt-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9l7.5 7.5 7.5-7.5" />
                            </svg>
                          </button>
                        </div>

                        {/* AM/PM Toggle */}
                        <div className="ml-4 relative flex flex-col items-center justify-center bg-gray-100 rounded-xl p-1 space-y-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              setPeriod('AM');
                            }}
                            className={`relative z-10 w-16 px-4 py-1.5 text-sm font-medium focus:outline-none transition-colors rounded-lg
                              ${period === 'AM' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {period === 'AM' && (
                              <motion.div
                                className="absolute inset-0 bg-white shadow-sm rounded-lg z-0"
                                layoutId="amPmBg"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10">AM</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              setPeriod('PM');
                            }}
                            className={`relative z-10 w-16 px-4 py-1.5 text-sm font-medium focus:outline-none transition-colors rounded-lg
                              ${period === 'PM' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {period === 'PM' && (
                              <motion.div
                                className="absolute inset-0 bg-white shadow-sm rounded-lg z-0"
                                layoutId="amPmBg"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10">PM</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between mt-6 w-full">
                        {mode === 'datetime' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent event bubbling
                              requestViewChange('date');
                            }}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Back
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent event bubbling
                            handleTimeConfirm();
                          }}
                          className="px-4 py-2 text-sm bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-all ml-auto flex items-center gap-1"
                        >
                          Confirm
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomDateTimePickerModal; 