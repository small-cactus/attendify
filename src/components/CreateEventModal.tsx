import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomDatePicker, CustomSelect, CustomRadio, CustomCheckbox } from './FormComponents';
import LocationPicker from './LocationPicker';
import LocationPermissionModal from './LocationPermissionModal';
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

  // --- Effect to pre-fill form when editing ---
  useEffect(() => {
    if (isEditing && eventToEdit) {
      setEventName(eventToEdit.name);
      setEventDateObj(new Date(eventToEdit.event_date)); // Convert string date back to Date object
      setCheckinMethod(eventToEdit.checkin_code_enabled ? 'code' : 'qr');
      setCheckinLocationEnabled(!!eventToEdit.checkin_location_enabled);
      setLocationLat(eventToEdit.location_lat?.toString() || '');
      setLocationLng(eventToEdit.location_lng?.toString() || '');
      setLocationRadius(eventToEdit.location_radius_meters?.toString() || '');
      setRecurrence(eventToEdit.recurrence || 'none');
      setRecurrenceUntilObj(eventToEdit.recurrence_until ? new Date(eventToEdit.recurrence_until) : null);
      setRepeatForever(eventToEdit.recurrence !== 'none' && eventToEdit.recurrence_until === null);
      setCheckinOnlyDuringEvent(!!eventToEdit.checkin_only_during_event);
      setEventStartTimeObj(eventToEdit.event_start_time ? new Date(eventToEdit.event_start_time) : null);
      setEventEndTimeObj(eventToEdit.event_end_time ? new Date(eventToEdit.event_end_time) : null);

      // Note: We don't pre-fill 'hasLocationPermissionBeenGranted'
      // as permission might have changed or needs re-confirmation.
    }
    // No need to reset here, the effect below handles resetting when isOpen changes to false.
  }, [isEditing, eventToEdit, isOpen]); // Add isOpen to re-run when modal opens with new data


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

  // --- Reset form state when modal opens for CREATE or closes ---
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
    } else if (isOpen && !isEditing) {
       // Explicitly reset only when opening for CREATE
       // This prevents edit state from being cleared if modal re-renders while open
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
       setEventLoading(false);
       setHasLocationPermissionBeenGranted(false);
    }
  }, [isOpen, isEditing]); // Add isEditing

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

    // Construct the data payload
    const eventDataPayload: Partial<Event> = {
        name: eventName,
        event_date: eventDateObj.toISOString(), // Send full ISO string, let DB handle date part if needed
        // invite_code should NOT be updated during edit, remove from here
        checkin_location_enabled: checkinLocationEnabled,
        checkin_qr_enabled: checkinMethod === 'qr',
        checkin_code_enabled: checkinMethod === 'code',
        // checkin_code: null, // Code management might be separate
        location_lat: checkinLocationEnabled ? (locationLat ? parseFloat(locationLat) : null) : null,
        location_lng: checkinLocationEnabled ? (locationLng ? parseFloat(locationLng) : null) : null,
        location_radius_meters: checkinLocationEnabled ? (locationRadius ? parseInt(locationRadius) : null) : null,
        recurrence,
        recurrence_until: recurrence !== 'none' ? (repeatForever ? null : recurrenceUntilObj?.toISOString()) : null, // Send full ISO string
        event_start_time: checkinOnlyDuringEvent ? eventStartTimeObj?.toISOString() : null,
        event_end_time: checkinOnlyDuringEvent ? eventEndTimeObj?.toISOString() : null,
        checkin_only_during_event: checkinOnlyDuringEvent,
      };

    // Add invite_code only when creating
    if (!isEditing) {
      eventDataPayload.invite_code = generateAccessCode(8);
    }


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


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                    <CustomDatePicker
                    selected={eventDateObj}
                    onChange={(date) => setEventDateObj(date)}
                    placeholderText="Select event date"
                    minDate={new Date()} // Keep minDate for create, might remove/adjust for edit
                    isClearable
                    disabled={eventLoading}
                    className="w-full" // Ensure CustomDatePicker accepts className or has wrapper
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
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden" // Prevents content spill during animation
                            >
                                <label className="block text-xs font-medium text-gray-600 mb-1">Repeat until</label>
                                <CustomDatePicker
                                    selected={repeatForever ? null : recurrenceUntilObj}
                                    onChange={(date) => setRecurrenceUntilObj(date)}
                                    minDate={eventDateObj || undefined} // Use minDate based on event date
                                    placeholderText="Select end date"
                                    disabled={eventLoading || repeatForever}
                                    isClearable
                                    className="w-full"
                                />
                                <div className="mt-2">
                                    <CustomCheckbox
                                        checked={repeatForever}
                                        onChange={checked => {
                                            setRepeatForever(checked);
                                            if (checked) setRecurrenceUntilObj(null); // Clear specific date if repeating forever
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
                        onChange={setCheckinOnlyDuringEvent}
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
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-6 space-y-2 pb-2" // Indent time pickers
                       >
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                           <CustomDatePicker
                             selected={eventStartTimeObj}
                             onChange={(date) => setEventStartTimeObj(date)}
                             showTimeSelect showTimeSelectOnly timeIntervals={15}
                             timeCaption="Time" dateFormat="h:mm aa"
                             placeholderText="Select start time"
                             disabled={eventLoading} className="w-full"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                           <CustomDatePicker
                             selected={eventEndTimeObj}
                             onChange={(date) => setEventEndTimeObj(date)}
                             showTimeSelect showTimeSelectOnly timeIntervals={15}
                             timeCaption="Time" dateFormat="h:mm aa"
                             placeholderText="Select end time"
                             // Ensure minTime is set based on startTimeObj if available
                             // Check react-datepicker documentation for the correct prop name if 'minTime' is not right
                             // minTime={eventStartTimeObj ? new Date(eventStartTimeObj) : undefined}
                             // filterTime={(time: Date) => eventStartTimeObj ? time.getTime() > eventStartTimeObj.getTime() : true} // Basic filter
                             disabled={eventLoading} className="w-full"
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
                             transition={{ duration: 0.2 }}
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