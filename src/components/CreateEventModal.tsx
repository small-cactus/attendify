import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect, CustomRadio, CustomCheckbox } from './FormComponents';
import LocationPicker from './LocationPicker';
import LocationPermissionModal from './LocationPermissionModal';
import CustomDateTimePickerModal from './CustomDateTimePickerModal';
// import { supabase } from '../utils/supabaseClient'; // Import supabase if needed for unique code check
import { IonIcon } from '@ionic/react'; // Import IonIcon
import {
  addCircleOutline, // For modal title (create)
  pencilOutline, // For modal title (edit)
  qrCodeOutline, // For Check-in Method
  repeatOutline, // For Recurrence
  lockClosedOutline, // For Restrictions
  timeOutline, // For Time Restriction
  locationOutline // For Location Restriction
} from 'ionicons/icons'; // Import specific icons

// Reuse Event interface from ClubDetail or define it here
interface Event {
  id: string;
  club_id: string;
  name: string;
  event_date: string;
  invite_code: string;
  created_at: string;
  checkin_location_enabled?: boolean;
  checkin_code_enabled?: boolean;
  checkin_qr_enabled?: boolean;
  checkin_only_during_event?: boolean;
  location_lat?: number | null;
  location_lng?: number | null;
  location_radius_meters?: number | null;
  recurrence?: string;
  recurrence_until?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
}

// Helper function to format Date to YYYY-MM-DD (local)
function formatDateToLocalYYYYMMDD(date: Date | null): string | null {
  if (!date) return null;
  // Use local date components to avoid timezone shifts
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to format Date to HH:mm:ss (local)
function formatTimeToLocalHHMMSS(date: Date | null): string | null {
  if (!date) return null;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<void>; // Adjust 'any' to a specific type
  eventToEdit?: Event | null; // Add optional prop for event being edited
}

// Helper function (can be moved to utils)
function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  eventToEdit, // Destructure the new prop
}) => {
  const isEditing = !!eventToEdit;

  // --- State for the form (moved from ClubDetail) ---
  const [eventName, setEventName] = useState('');
  const [eventDateObj, setEventDateObj] = useState<Date | null>(null);
  // const [eventDate, setEventDate] = useState(''); // Can be removed if only Date obj is used
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [checkinMethod, setCheckinMethod] = useState<'qr' | 'code'>('qr');
  const [checkinLocationEnabled, setCheckinLocationEnabled] = useState(false);
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationRadius, setLocationRadius] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceUntilObj, setRecurrenceUntilObj] = useState<Date | null>(null);
  // const [recurrenceUntil, setRecurrenceUntil] = useState(''); // Can be removed
  const [checkinOnlyDuringEvent, setCheckinOnlyDuringEvent] = useState(false);
  const [eventStartTimeObj, setEventStartTimeObj] = useState<Date | null>(null);
  // const [eventStartTime, setEventStartTime] = useState(''); // Can be removed
  const [eventEndTimeObj, setEventEndTimeObj] = useState<Date | null>(null);
  // const [eventEndTime, setEventEndTime] = useState(''); // Can be removed
  const [repeatForever, setRepeatForever] = useState(false);

  // Ref to track the recurrence value inferred from the event name
  const previouslyInferredRecurrenceRef = useRef<string>('none');

  // State for location permission flow within the modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [hasLocationPermissionBeenGranted, setHasLocationPermissionBeenGranted] = useState(false);

  // Add these state variables inside the CreateEventModal component
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRecurrenceEndPickerOpen, setIsRecurrenceEndPickerOpen] = useState(false);

  // Add these refs inside the CreateEventModal component
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const recurrenceEndButtonRef = useRef<HTMLButtonElement>(null);

  // Add refs to store selected times
  const selectedStartTimeRef = useRef<Date | null>(null);
  const selectedEndTimeRef = useRef<Date | null>(null);

  // --- Effect to pre-fill form when editing ---
  useEffect(() => {
    if (isEditing && eventToEdit) {
      setEventName(eventToEdit.name);
      
      // Combine date and time for accurate Date objects
      const baseDateStr = eventToEdit.event_date; // Should be YYYY-MM-DD
      const startTimeStr = eventToEdit.event_start_time; // Should be HH:mm:ss or null
      const endTimeStr = eventToEdit.event_end_time; // Should be HH:mm:ss or null

      // Set the main event date object (date + time if available)
      if (baseDateStr && startTimeStr) {
        if (startTimeStr.includes('T')) {
          setEventDateObj(new Date(startTimeStr));
        } else {
          setEventDateObj(new Date(baseDateStr + 'T' + startTimeStr));
        }
      } else if (baseDateStr) {
        // Fallback: use user's current time with the event date
        const now = new Date();
        const fallback = new Date(baseDateStr + 'T00:00:00');
        fallback.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        setEventDateObj(fallback);
      }

      // Set start time object
      if (startTimeStr) {
        try {
          setEventStartTimeObj(new Date(`${baseDateStr}T${startTimeStr}`));
        } catch (e) {
          console.error("Error parsing start time:", e);
          setEventStartTimeObj(null); // Handle potential parsing errors
        }
      } else {
        setEventStartTimeObj(null);
      }

      // Set end time object
      if (endTimeStr) {
         try {
           setEventEndTimeObj(new Date(`${baseDateStr}T${endTimeStr}`));
         } catch (e) {
          console.error("Error parsing end time:", e);
          setEventEndTimeObj(null); // Handle potential parsing errors
         }
      } else {
        setEventEndTimeObj(null);
      }
      
      setCheckinMethod(eventToEdit.checkin_code_enabled ? 'code' : 'qr');
      setCheckinLocationEnabled(!!eventToEdit.checkin_location_enabled);
      setLocationLat(eventToEdit.location_lat?.toString() || '');
      setLocationLng(eventToEdit.location_lng?.toString() || '');
      setLocationRadius(eventToEdit.location_radius_meters?.toString() || '');
      setRecurrence(eventToEdit.recurrence || 'none');
      setRecurrenceUntilObj(eventToEdit.recurrence_until ? new Date(eventToEdit.recurrence_until) : null);
      setRepeatForever(eventToEdit.recurrence !== 'none' && eventToEdit.recurrence_until === null);
      setCheckinOnlyDuringEvent(!!eventToEdit.checkin_only_during_event);
      setHasLocationPermissionBeenGranted(false); // Reset permission grant status
    }
  }, [isEditing, eventToEdit]);

  // --- Reset form state when modal closes ---
  useEffect(() => {
    if (!isOpen) {
      // Reset all form fields when modal closes (for both create and edit)
      setEventName('');
      setEventDateObj(null);
      setEventError(null);
      setCheckinMethod('qr');
      setCheckinLocationEnabled(false);
      setLocationLat('');
      setLocationLng('');
      setLocationRadius('');
      setRecurrence('none');
      setRecurrenceUntilObj(null);
      setRepeatForever(false);
      setCheckinOnlyDuringEvent(false);
      setEventStartTimeObj(null);
      setEventEndTimeObj(null);
      setEventLoading(false); // Ensure loading state is reset
      setHasLocationPermissionBeenGranted(false); // Reset permission grant status
    }
  }, [isOpen]);

  // --- Effect to infer recurrence from event name ---
  useEffect(() => {
    // Only infer if NOT editing, or if editing and the recurrence hasn't been set yet
    if (!isEditing || (isEditing && !eventToEdit?.recurrence)) {
        const lowerCaseName = eventName.toLowerCase();
        let newlyInferredRecurrence = 'none';

        if (lowerCaseName.includes('weekly')) {
            newlyInferredRecurrence = 'weekly';
        } else if (lowerCaseName.includes('daily')) {
            newlyInferredRecurrence = 'daily';
        } else if (lowerCaseName.includes('monthly')) {
            newlyInferredRecurrence = 'monthly';
        }

        const lastInferred = previouslyInferredRecurrenceRef.current;

        if (recurrence === lastInferred && newlyInferredRecurrence !== recurrence) {
            setRecurrence(newlyInferredRecurrence);
        }

        previouslyInferredRecurrenceRef.current = newlyInferredRecurrence;
    }
  }, [eventName, recurrence, isEditing, eventToEdit?.recurrence]);

  // --- Handlers ---

  const handleInternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError(null);

    if (!eventDateObj) {
      setEventError('Please select an event date.');
      setEventLoading(false);
      return;
    }
    if (checkinOnlyDuringEvent) {
      if (!eventStartTimeObj || !eventEndTimeObj) {
        setEventError('Please select both start and end times for time-restricted check-in.');
        setEventLoading(false);
        return;
      }
      if (eventEndTimeObj <= eventStartTimeObj) {
        setEventError('End time must be after start time.');
        setEventLoading(false);
        return;
      }
    }
    if (recurrence !== 'none' && !recurrenceUntilObj && !repeatForever) {
      setEventError('Please select an end date for recurring events or check "Repeat forever".');
      setEventLoading(false);
      return;
    }
    if (checkinLocationEnabled && (!locationLat || !locationLng || !locationRadius)) {
       console.warn("Location details might be missing for enabled location restriction.");
    }

    // Create helper function for direct time format
    const formatTimeToSQLString = (dateObj: Date | null): string | null => {
      if (!dateObj) return null;
      
      // Format using the local time components to avoid timezone issues
      // YYYY-MM-DD HH:MM:SS format
      const date = formatDateToLocalYYYYMMDD(dateObj);
      const time = formatTimeToLocalHHMMSS(dateObj);
      
      return date + ' ' + time;
    };

    // Construct the data payload
    const eventDataPayload: Partial<Event> = {
        name: eventName,
        event_date: formatDateToLocalYYYYMMDD(eventDateObj)!,
        checkin_location_enabled: checkinLocationEnabled,
        checkin_qr_enabled: checkinMethod === 'qr',
        checkin_code_enabled: checkinMethod === 'code',
        location_lat: checkinLocationEnabled ? (locationLat ? parseFloat(locationLat) : null) : null,
        location_lng: checkinLocationEnabled ? (locationLng ? parseFloat(locationLng) : null) : null,
        location_radius_meters: checkinLocationEnabled ? (locationRadius ? parseInt(locationRadius) : null) : null,
        recurrence,
        recurrence_until: recurrence !== 'none' ? (repeatForever ? null : formatDateToLocalYYYYMMDD(recurrenceUntilObj)) : null,
        
        // Always include the time component from eventDateObj as event_start_time
        event_start_time: eventDateObj ? formatTimeToSQLString(eventDateObj) : null,
        
        // Only include end time if time restriction is enabled
        event_end_time: checkinOnlyDuringEvent && eventEndTimeObj ? formatTimeToSQLString(eventEndTimeObj) : null,
        
        // Set restriction flag only if checkbox is checked
        checkin_only_during_event: checkinOnlyDuringEvent,
    };

    // Add VERY explicit logging
    console.log("SUBMISSION VALUES:", {
        checkinOnlyDuringEvent,
        eventStartTimeObj,
        eventEndTimeObj,
        event_start_time: eventDataPayload.event_start_time,
        event_end_time: eventDataPayload.event_end_time
    });

    // Add invite_code only when creating
    if (!isEditing) {
      eventDataPayload.invite_code = generateAccessCode(8);
    }

    console.log('FINAL VERIFICATION BEFORE SUBMIT:');
    console.log('eventDateObj =', eventDateObj?.toString());
    console.log('eventEndTimeObj =', eventEndTimeObj?.toString());
    console.log('checkinOnlyDuringEvent =', checkinOnlyDuringEvent);
    console.log('Formatted date =', formatDateToLocalYYYYMMDD(eventDateObj));
    console.log('Formatted start time =', formatTimeToSQLString(eventDateObj));
    console.log('Formatted end time =', formatTimeToSQLString(eventEndTimeObj));

    try {
      await onSubmit(eventDataPayload); // Pass the constructed payload
      // onSubmit in parent handles insert/update logic
      // Parent also handles closing the modal and resetting state via onClose
    } catch (error: any) {
      setEventError(error.message || `Failed to ${isEditing ? 'update' : 'create'} event.`);
    } finally {
       setEventLoading(false);
    }
  };

  const handleLocationPermissionConfirm = () => {
    if (!navigator.geolocation) {
      setEventError('Geolocation is not supported by your browser.');
      setIsLocationModalOpen(false);
      return;
    }
    setIsRequestingLocation(true);
    setEventError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLat(position.coords.latitude.toString());
        setLocationLng(position.coords.longitude.toString());
        setLocationRadius('100');
        setCheckinLocationEnabled(true);
        setHasLocationPermissionBeenGranted(true);
        setIsRequestingLocation(false);
        setIsLocationModalOpen(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setEventError(`Failed to get location: ${error.message}. Please set location manually.`);
        setCheckinLocationEnabled(true); // Still allow enabling for manual set
        setHasLocationPermissionBeenGranted(false);
        setIsRequestingLocation(false);
        setIsLocationModalOpen(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocationPermissionClose = () => {
    setIsLocationModalOpen(false);
    // If user closes/denies, ensure the checkbox reflects this if it was toggled
    // setCheckinLocationEnabled(false); // Reverts the initial toggle attempt
  };

  const handleToggleLocationRestriction = (checked: boolean) => {
    if (checked) {
      if (hasLocationPermissionBeenGranted) {
        setCheckinLocationEnabled(true);
      } else {
        setIsLocationModalOpen(true);
        // Don't enable checkinLocationEnabled yet, wait for confirmation/manual input
      }
    } else {
      setCheckinLocationEnabled(false);
    }
  };

  // Update handleCheckTimeRestriction to ALWAYS set times
  const handleCheckTimeRestriction = (checked: boolean) => {
    setCheckinOnlyDuringEvent(checked);
    
    // If enabling time restriction, ALWAYS set times
    if (checked) {
      console.log("Time restriction enabled, FORCING default times");
      
      // Set start time to current time
      const now = new Date();
      const startTime = new Date(now);
      console.log("FORCING default start time:", startTime);
      setEventStartTimeObj(startTime);
      selectedStartTimeRef.current = startTime;
      
      // Set end time to current time + 2 hours
      const endTime = new Date(now);
      endTime.setHours(endTime.getHours() + 2);
      console.log("FORCING default end time:", endTime);
      setEventEndTimeObj(endTime);
      selectedEndTimeRef.current = endTime;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, filter: 'blur(16px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.9, opacity: 0, filter: 'blur(16px)' }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.16, ease: 'easeInOut' },
              filter: { duration: 0.28, ease: 'easeInOut' }
            }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
             <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>

            {/* --- Form content moved here --- */}
            <form onSubmit={handleInternalSubmit} className="space-y-4">
                 {/* Update Title Based on Mode */}
                <h4 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <IonIcon icon={isEditing ? pencilOutline : addCircleOutline} className="text-xl" />
                  {isEditing ? 'Edit Event' : 'Create New Event'}
                </h4>
                {/* Event Name */}
                <div>
                    <label htmlFor="modalEventName" className="block text-xs font-medium text-gray-600 mb-1">Event Name</label>
                    <input
                    id="modalEventName"
                    type="text"
                    placeholder="e.g., Weekly Meeting"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                    disabled={eventLoading}
                    />
                </div>
                {/* Event Date */}
                <div>
                    <label htmlFor="modalEventDate" className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                    <button
                        ref={dateButtonRef}
                        type="button"
                        onClick={() => setIsDatePickerOpen(true)}
                        className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white hover:bg-gray-50 transition-colors"
                        disabled={eventLoading}
                    >
                        {eventDateObj ? eventDateObj.toLocaleDateString() + ' ' + eventDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select event date and time'}
                    </button>
                    <CustomDateTimePickerModal
                        isOpen={isDatePickerOpen}
                        onClose={() => setIsDatePickerOpen(false)}
                        onSelectDateTime={(date) => {
                            if (date) {
                                // If a new date is selected but it doesn't have a custom time set (i.e., it's midnight),
                                // and we had a previous date with a non-midnight time, preserve that time
                                const isDefaultMidnight = date.getHours() === 0 && date.getMinutes() === 0;
                                if (isDefaultMidnight && eventDateObj && (eventDateObj.getHours() !== 0 || eventDateObj.getMinutes() !== 0)) {
                                    // Copy the time from the previous date
                                    date.setHours(eventDateObj.getHours(), eventDateObj.getMinutes(), eventDateObj.getSeconds());
                                } else if (isDefaultMidnight && !eventDateObj) {
                                    // No previous date with time, so use current time
                                    const now = new Date();
                                    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
                                }
                            }
                            setEventDateObj(date);
                        }}
                        initialDate={eventDateObj || null}
                        mode="datetime"
                        minDate={new Date()} // Only allow future dates
                        anchorEl={dateButtonRef.current}
                    />
                </div>
                {/* Check-in Method */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <IonIcon icon={qrCodeOutline} className="text-md" />
                      Check-in Method
                    </label>
                    <CustomRadio
                        selected={checkinMethod}
                        onChange={(value) => setCheckinMethod(value as 'qr' | 'code')}
                        options={[
                        { value: 'qr', label: 'All Methods', description: 'Members can check in by scanning a QR code, entering a code, or using a direct link' },
                        { value: 'code', label: 'Event Code Only', description: 'Members can only check in by entering the event code' }
                        ]}
                        disabled={eventLoading || isEditing} // Disable changing method when editing (invite code is fixed)
                    />
                    {isEditing && <p className="text-xs text-gray-500 mt-1">Check-in method cannot be changed for existing events.</p>}
                 </div>

                {/* Recurrence */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <IonIcon icon={repeatOutline} className="text-md" />
                      Recurrence
                    </label>
                    <CustomSelect
                        value={recurrence}
                        onChange={e => setRecurrence(e.target.value)}
                        options={[
                        { value: 'none', label: 'Does not repeat' },
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' }
                        ]}
                        disabled={eventLoading}
                        className="w-full" // Ensure CustomSelect accepts className or has wrapper
                    />
                    {/* Animate the appearance of recurrence options */}
                    <AnimatePresence initial={false}>
                        {recurrence !== 'none' && (
                            <motion.div
                                key="recurrence-options"
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <label className="block text-xs font-medium text-gray-600 mb-1">Repeat until</label>
                                <button
                                    ref={recurrenceEndButtonRef}
                                    type="button"
                                    onClick={() => !repeatForever && setIsRecurrenceEndPickerOpen(true)}
                                    className={`w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white hover:bg-gray-50 transition-colors ${repeatForever ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={repeatForever || eventLoading}
                                >
                                    {recurrenceUntilObj ? recurrenceUntilObj.toLocaleDateString() : 'Select end date'}
                                </button>
                                <CustomDateTimePickerModal
                                    isOpen={isRecurrenceEndPickerOpen}
                                    onClose={() => setIsRecurrenceEndPickerOpen(false)}
                                    onSelectDateTime={(date) => {
                                        setRecurrenceUntilObj(date);
                                    }}
                                    initialDate={recurrenceUntilObj}
                                    mode="date"
                                    minDate={eventDateObj || undefined}
                                    anchorEl={recurrenceEndButtonRef.current}
                                />
                                <div className="mt-2">
                                    <CustomCheckbox
                                        checked={repeatForever}
                                        onChange={checked => {
                                            setRepeatForever(checked);
                                            if (checked) setRecurrenceUntilObj(null);
                                        }}
                                        label="Repeat forever"
                                        disabled={eventLoading}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Check-in Restrictions */}
                 <div className="space-y-3 pt-4 border-t border-gray-100 mt-4">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <IonIcon icon={lockClosedOutline} className="text-md" />
                      Check-in Restrictions (Optional)
                    </label>
                    {/* Time Restriction */}
                    <CustomCheckbox
                        checked={checkinOnlyDuringEvent}
                        onChange={(checked) => {
                            console.log("Checkbox clicked, new state:", checked);
                            handleCheckTimeRestriction(checked);
                        }}
                        label={
                          <span className="flex items-center gap-1">
                            <IonIcon icon={timeOutline} className="text-sm" />
                            Restrict check-in to event time window
                          </span>
                        }
                        description="Members can only check in between the start and end times"
                        disabled={eventLoading}
                    />
                    <AnimatePresence initial={false}>
                    {checkinOnlyDuringEvent && (
                      <motion.div
                        key="time-restriction-details"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden ml-6 space-y-2 pb-2"
                       >
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Start Time (from event date)</label>
                           <div className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-md text-gray-500">
                             {eventDateObj ? eventDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set in event date'}
                           </div>
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">End Time for Check-in Window</label>
                           <input
                             type="time"
                             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                             value={eventEndTimeObj ? 
                               `${eventEndTimeObj.getHours().toString().padStart(2, '0')}:${eventEndTimeObj.getMinutes().toString().padStart(2, '0')}` 
                               : '00:00'} // Default to 00:00 if null
                             onChange={(e) => {
                               if (e.target.value) {
                                 console.log('Manual time input value:', e.target.value);
                                 const [hours, minutes] = e.target.value.split(':').map(Number);
                                 
                                 // Create a new date object based on the event date or today
                                 const date = new Date();
                                 if (eventDateObj) {
                                   // Preserve the date part from eventDateObj
                                   date.setFullYear(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
                                 }
                                 date.setHours(hours, minutes, 0, 0);
                                 
                                 console.log('Setting end time directly to:', date.toString());
                                 setEventEndTimeObj(date);
                                 selectedEndTimeRef.current = date;
                                 
                                 // Force a re-render to ensure the UI updates
                                 setTimeout(() => {
                                   console.log('After set, eventEndTimeObj is:', eventEndTimeObj);
                                 }, 100);
                               }
                             }}
                             disabled={eventLoading}
                           />
                         </div>
                       </motion.div>
                    )}
                    </AnimatePresence>
                    {/* Location Restriction */}
                    <CustomCheckbox
                        checked={checkinLocationEnabled}
                        onChange={handleToggleLocationRestriction}
                        label={
                          <span className="flex items-center gap-1">
                            <IonIcon icon={locationOutline} className="text-sm" />
                            Restrict check-in to event location
                          </span>
                        }
                        description="Members must be physically at the event location to check in"
                        disabled={eventLoading}
                    />
                     <AnimatePresence initial={false}>
                    {checkinLocationEnabled && (
                        <motion.div
                             key="location-restriction-details"
                             initial={{ opacity: 0, height: 0, marginTop: 0 }}
                             animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                             exit={{ opacity: 0, height: 0, marginTop: 0 }}
                             className="overflow-hidden ml-6 border border-gray-100 rounded-md p-3 bg-gray-50" // Indent map
                        >
                        <LocationPicker
                            latitude={locationLat} longitude={locationLng} radius={locationRadius}
                            setLatitude={setLocationLat} setLongitude={setLocationLng} setRadius={setLocationRadius}
                            disabled={eventLoading}
                        />
                        </motion.div>
                    )}
                    </AnimatePresence>
                 </div>

                 {eventError && <div className="text-red-600 text-xs mt-2">{eventError}</div>}

                 {/* Submit Button - Update Text Based on Mode */}
                <div className="pt-4 border-t border-gray-100 mt-5 flex justify-end">
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={eventLoading}
                    >
                        {eventLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Event')}
                    </button>
                </div>
            </form>

             {/* Location Permission Modal - nested inside Create Event Modal */}
            <LocationPermissionModal
                isOpen={isLocationModalOpen}
                onClose={handleLocationPermissionClose}
                onConfirm={handleLocationPermissionConfirm}
                isRequesting={isRequestingLocation}
             />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal; 