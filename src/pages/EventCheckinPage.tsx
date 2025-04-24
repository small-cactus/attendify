import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Logo from '../components/Logo';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance } from '../utils/geolocation'; // Import helpers
import { IonIcon } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';

interface EventInfo {
  id: string; // Need event ID for attendance
  name: string;
  event_date: string;
  club_id: string;
  club_name?: string;
  checkin_location_enabled?: boolean;
  checkin_code_enabled?: boolean;
  checkin_qr_enabled?: boolean;
  checkin_only_during_event?: boolean;
  location_lat?: number | null;
  location_lng?: number | null;
  location_radius_meters?: number | null;
}

type LocationPermissionStatus = 'prompt' | 'checking' | 'granted' | 'denied';

// Shared transition for content (blur lingers longer than fade)
const TAB_TRANSITION = {
  opacity: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
  filter: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
};

const tabVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(16px)',
    scale: 0.97,
    y: -20
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    y: 0,
    transition: {
      ...TAB_TRANSITION,
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    filter: 'blur(16px)',
    scale: 0.97,
    y: -20,
    transition: {
      ...TAB_TRANSITION,
      duration: 0.2
    }
  }
};

const EventCheckinPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Location state
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<LocationPermissionStatus>('prompt');
  const [locationError, setLocationError] = useState<string | null>(null); // Specific error for location part
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  // Fetch member_uuid from localStorage
  const [memberUuid, setMemberUuid] = useState<string | null>(null);
  useEffect(() => {
    setMemberUuid(localStorage.getItem('attendify_member_id'));
  }, []);

  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!inviteCode) {
        setError('Invalid event link.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      // Fetch event details AND club name using the invite code
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, name, event_date, club_id, clubs ( name ), checkin_location_enabled, checkin_code_enabled, checkin_qr_enabled, checkin_only_during_event, location_lat, location_lng, location_radius_meters')
        .eq('invite_code', inviteCode)
        .single();
        
      if (fetchError || !data) {
        setError('Could not load event information. Please check the code or link.');
        setEventInfo(null);
      } else {
        // Flatten the result and safely access club name
        let clubName = 'Unknown Club';
        if (data.clubs && typeof data.clubs === 'object' && 'name' in data.clubs) {
           // We expect an object here due to .single() and the join syntax
           clubName = (data.clubs as { name: string }).name;
        }
        
        const flatData: EventInfo = {
          id: data.id, // Store event ID
          name: data.name,
          event_date: data.event_date,
          club_id: data.club_id,
          club_name: clubName,
          checkin_location_enabled: data.checkin_location_enabled,
          checkin_code_enabled: data.checkin_code_enabled,
          checkin_qr_enabled: data.checkin_qr_enabled,
          checkin_only_during_event: data.checkin_only_during_event,
          location_lat: data.location_lat,
          location_lng: data.location_lng,
          location_radius_meters: data.location_radius_meters
        };
        setEventInfo(flatData);
      }
      setLoading(false);
    };
    
    fetchEventInfo();
  }, [inviteCode]);

  // Function to request and verify location
  const requestLocationAndCheck = async () => {
    if (!eventInfo || !eventInfo.checkin_location_enabled) {
      // Shouldn't be called if not needed, but safety check
      setLocationPermissionStatus('granted'); // Treat as granted if not required
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationPermissionStatus('denied');
      return;
    }
    if (!eventInfo.location_lat || !eventInfo.location_lng || !eventInfo.location_radius_meters) {
      setLocationError('Event location data is missing. Cannot verify position.');
      setLocationPermissionStatus('denied'); // Can't proceed
      return;
    }

    setIsVerifyingLocation(true);
    setLocationError(null);
    setLocationPermissionStatus('checking');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const distance = calculateDistance(
          eventInfo.location_lat!,
          eventInfo.location_lng!,
          userLat,
          userLng
        );

        if (distance <= eventInfo.location_radius_meters!) {
          setLocationPermissionStatus('granted');
          setLocationError(null); // Clear any previous errors
        } else {
          setLocationPermissionStatus('denied');
          setLocationError(`You must be within ${eventInfo.location_radius_meters} meters of the event location. You are approximately ${Math.round(distance)} meters away.`);
        }
        setIsVerifyingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationPermissionStatus('denied');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please grant permission in your browser settings and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('The request to get user location timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while getting location.');
            break;
        }
        setIsVerifyingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Automatically request location if required when event info loads
  useEffect(() => {
    if (eventInfo && eventInfo.checkin_location_enabled) {
      requestLocationAndCheck();
    }
    // If location is not required, set status to granted immediately
    else if (eventInfo && !eventInfo.checkin_location_enabled) {
       setLocationPermissionStatus('granted');
       setLocationError(null);
       setIsVerifyingLocation(false);
    }
  }, [eventInfo]); // Re-run when eventInfo is loaded

  const handleCheckin = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!eventInfo || !memberName.trim()) {
       setCheckinError('Please enter your name.');
       return;
     }
     setCheckinLoading(true);
     setCheckinError(null);
     setCheckinSuccess(false);
     setLocationError(null); // Clear previous location errors on new attempt

     try {
        // >> LOCATION CHECK <<
        if (eventInfo.checkin_location_enabled) {
          if (isVerifyingLocation) {
            setCheckinError('Please wait while your location is being verified.');
            setCheckinLoading(false);
            return;
          }
          if (locationPermissionStatus !== 'granted') {
            // Trigger a new check or show existing error
            if (!locationError) {
               // Instead of awaiting here, rely on the user clicking retry, 
               // or the initial useEffect check. If status is not granted and no error,
               // it likely means it's still checking or needs user action (permission).
                setCheckinError('Location not verified. Please grant permission or click retry.');
                setCheckinLoading(false);
                return;
            } else {
              // Show the specific location error if one exists
              setCheckinError(locationError);
              setCheckinLoading(false);
              return;
            }
          }
          // If status is granted, proceed
        }

        // ENFORCE CHECK-IN RESTRICTIONS
        // 1. Time window restriction
        if (eventInfo.checkin_only_during_event && eventInfo.event_date) {
          // Assume event_date is the start time, and optionally add end time if available in schema
          const now = new Date();
          const start = new Date(eventInfo.event_date);
          // If you have event_end_time, use it; otherwise, just check not before start
          if (now < start) {
            setCheckinError('Check-in is not allowed before the event starts.');
            setCheckinLoading(false);
            return;
          }
        }
        // 2. Location restriction
        // Removed the previous basic geo check from here, as it's handled above

        // 1. Find or create member
        let memberId: number | null = null;
        let finalMemberUuid = memberUuid || uuidv4(); // Use existing or generate new UUID

        // Try finding member by UUID first (if available)
        if (memberUuid) {
          const { data: memberByUuid } = await supabase
            .from('members')
            .select('id')
            .eq('club_id', eventInfo.club_id)
            .eq('member_uuid', memberUuid)
            .single();
          if (memberByUuid) {
            memberId = memberByUuid.id;
          }
        }

        // If not found by UUID, try finding by name
        if (!memberId) {
            const { data: memberByName, error: nameError } = await supabase
              .from('members')
              .select('id, member_uuid')
              .eq('club_id', eventInfo.club_id)
              .eq('name', memberName.trim())
              .single();

            if (nameError && nameError.code !== 'PGRST116') {
              throw nameError; // Throw unexpected errors
            }

            if (memberByName) {
              // Found member by name
              memberId = memberByName.id;
              finalMemberUuid = memberByName.member_uuid || finalMemberUuid; // Use existing DB UUID if available
              // If member found by name had no UUID or didn't match stored UUID, update it
              if (!memberByName.member_uuid || (memberUuid && memberUuid !== memberByName.member_uuid)) {
                await supabase.from('members').update({ member_uuid: finalMemberUuid }).eq('id', memberId);
                localStorage.setItem('attendify_member_id', finalMemberUuid); // Update localStorage
                setMemberUuid(finalMemberUuid); // Update state
              }
            } else {
              // Member not found by UUID or name
              // Prompt user to join instead of creating member
              setCheckinError(`Member '${memberName.trim()}' not found for ${eventInfo.club_name || 'this club'}. Please join the club first.`);
              setCheckinLoading(false);
              return; // Stop the check-in process
            }
        }

        // If we reached here, memberId must be valid
        if (!memberId) {
            // This should technically not be reachable if the logic above is correct
            throw new Error('Failed to identify member.'); 
        }

        // 2. Check for existing attendance record
        // Removed the initial incorrect check based on inviteCode
        
        // Re-fetch event ID properly - needed for attendance table
        // Use eventId from eventInfo fetched earlier
        const eventId = eventInfo.id;

        // Check again with proper event ID
        const { data: existingAttendanceProper, error: attendanceCheckErrorProper } = await supabase
            .from('attendance')
            .select('id')
            .eq('event_id', eventId)
            .eq('member_id', memberId)
            .maybeSingle(); // Use maybeSingle to handle 0 or 1 result without error
        
        if (attendanceCheckErrorProper) {
            throw attendanceCheckErrorProper;
        }

        if (existingAttendanceProper) {
          // Already checked in
          setCheckinSuccess(true);
          // Optionally set a specific message for already checked in?
        } else {
          // 3. Add record to attendance table
          const { error: insertAttendanceError } = await supabase
            .from('attendance')
            .insert([{ 
              event_id: eventId, 
              member_id: memberId
            }]);

          if (insertAttendanceError) {
            throw insertAttendanceError;
          }
          setCheckinSuccess(true);
        }

     } catch (error: any) {
        console.error('Error during check-in:', error);
        setCheckinError(`Check-in failed: ${error.message || 'Please try again.'}`);
     } finally {
        setCheckinLoading(false);
     }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-6 relative">
      {/* Branding */}
      <div className="absolute top-6 left-6">
        <Logo showText={true} />
      </div>
      <div className="absolute bottom-6 left-6 text-sm text-gray-400">
        Powered by Attendify
      </div>

      <div className="text-center max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-500">Loading Event Information...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
             <p className="text-red-600 mb-4">{error}</p>
             <button onClick={() => navigate('/')} className="text-sm text-black border-b border-gray-300 hover:border-black">
                Back to Home
             </button>
          </motion.div>
        ) : eventInfo ? (
          checkinSuccess ? (
            <motion.div
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-2xl font-semibold text-green-600 mb-3">Checked In!</h2>
              <p className="text-gray-700 mb-5">You've successfully checked in to <span className="font-medium">{eventInfo.name}</span> for {eventInfo.club_name}.</p>
              <button 
                onClick={() => navigate('/')} // Or maybe a club page?
                className="px-5 py-2 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
              >
                Go to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="text-sm text-gray-500 mb-1">Checking in for:</p>
              <h1 className="text-3xl font-bold text-black mb-1">
                {eventInfo.name}
              </h1>
              <p className="text-md text-gray-700 mb-2">({eventInfo.club_name})</p>
              <p className="text-sm text-gray-500 mb-6">
                {new Date(eventInfo.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              {/* Conditional Location Notice */}
              {eventInfo.checkin_location_enabled && eventInfo.location_lat && eventInfo.location_lng && (
                // Show 'Required' notice ONLY if status is not yet granted
                (locationPermissionStatus === 'prompt' || locationPermissionStatus === 'checking' || locationPermissionStatus === 'denied') && (
                   <div className="mb-6 text-sm p-3 rounded-lg border border-yellow-200 bg-yellow-50 flex items-center gap-2">
                      <IonIcon icon={locationOutline} className="text-yellow-700 text-xl flex-shrink-0" />
                      <div className="text-yellow-800">
                        <span className="font-medium">Location Required:</span> You must be near the event location to check in.
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${eventInfo.location_lat},${eventInfo.location_lng}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 hover:text-blue-800 underline"
                        >
                          View Map
                        </a>
                        {/* Show specific error or retry button if denied */}
                        {locationPermissionStatus === 'denied' && (
                          <div className="text-red-700 font-medium mt-1">
                             <p>{locationError || 'Location check failed.'}</p>
                              <button 
                                onClick={requestLocationAndCheck} 
                                className="mt-1 underline text-red-700 hover:text-red-900 font-medium"
                                disabled={isVerifyingLocation}
                              >
                                Retry Location Check
                              </button>
                          </div>
                        )}
                      </div>
                   </div>
                )
              )}

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {eventInfo.checkin_location_enabled && <EventTypeBadge type="geo" />}
                {eventInfo.checkin_qr_enabled && !eventInfo.checkin_code_enabled && <EventTypeBadge type="qr" />}
                {eventInfo.checkin_only_during_event && <EventTypeBadge type="time" />}
              </div>

              {/* Restriction check logic */}
              {(() => {
                // Restriction checks
                let restrictionError = '';
                // 1. Time window restriction
                if (eventInfo.checkin_only_during_event && eventInfo.event_date) {
                  const now = new Date();
                  const start = new Date(eventInfo.event_date);
                  if (now < start) {
                    restrictionError = 'Check-in is not allowed before the event starts.';
                  }
                }
                // 2. Location restriction (prompt, but don't block UI since we can't check until user interacts)
                // (If you want to block, you could require a button to "Check my location" first)
                if (!restrictionError && eventInfo.checkin_location_enabled && typeof window !== 'undefined') {
                  // Removed the simple navigator check here, handled by the more detailed status above/below
                }
                if (restrictionError) {
                    // Don't render the form if time restriction fails
                    return <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">{restrictionError}</div>;
                }
                return null;
              })()}
              {/* Only show name input and check-in if no restriction error */}
              {(() => {
                let restrictionError = '';
                if (eventInfo.checkin_only_during_event && eventInfo.event_date) {
                  const now = new Date();
                  const start = new Date(eventInfo.event_date);
                  if (now < start) restrictionError = 'Check-in is not allowed before the event starts.';
                }
                if (!restrictionError && eventInfo.checkin_location_enabled && typeof window !== 'undefined') {
                  // Removed the simple navigator check here, handled by the more detailed status above/below
                }
                if (restrictionError) return null;
                return (
                  <form onSubmit={handleCheckin} className="space-y-4">
                    <div>
                      <label htmlFor="memberName" className="block text-xs font-medium text-gray-600 mb-1 text-left">Your Name</label>
                      <input
                        id="memberName"
                        type="text"
                        placeholder="Enter the name you used to join"
                        value={memberName}
                        onChange={e => setMemberName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                        disabled={checkinLoading}
                      />
                    </div>
                    {checkinError && (
                      <div className="text-red-600 text-xs">
                        {checkinError}
                        {/* Add link to join page if error is due to member not found */}
                        {checkinError.includes('not found for') && eventInfo && (
                          <button 
                            onClick={() => navigate(`/join/${eventInfo.club_id}`)}
                            className="ml-2 underline text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Join Club Now
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={checkinLoading || isVerifyingLocation || (eventInfo.checkin_location_enabled && locationPermissionStatus !== 'granted')}
                    >
                      {checkinLoading ? 'Checking In...' 
                       : isVerifyingLocation ? 'Verifying Location...' 
                       : (eventInfo.checkin_location_enabled && locationPermissionStatus === 'denied') ? 'Check Location' // Button text could change based on status
                        : 'Check In'}
                    </button>
                  </form>
                );
              })()}
              <p className="text-xs text-gray-400 mt-4">
                Please enter the name associated with your club membership.
              </p>
            </motion.div>
          )
        ) : (
           <p className="text-gray-500">Could not load event information.</p>
        )}
      </div>
    </div>
  );
};

const eventTypeExplanations: Record<string, string> = {
  geo: 'Geo-fenced: You must be at the event location to check in.',
  code: 'Code Required: You must enter a code to check in.',
  qr: 'QR/Direct: You can check in by scanning a QR code or using a direct link.',
  time: 'Time Window: You can only check in during the event time window.'
};

function EventTypeBadge({ type }: { type: 'geo' | 'code' | 'qr' | 'time' }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <span
        className={
          'px-2 py-0.5 rounded text-xs font-medium ' +
          (type === 'geo' ? 'bg-blue-100 text-blue-700' :
           type === 'code' ? 'bg-yellow-100 text-yellow-700' :
           type === 'qr' ? 'bg-green-100 text-green-700' :
           'bg-purple-100 text-purple-700')
        }
      >
        {type === 'geo' && 'Geo-fenced'}
        {type === 'code' && 'Code Required'}
        {type === 'qr' && 'QR/Direct'}
        {type === 'time' && 'Time Window'}
        <button
          type="button"
          aria-label="What does this mean?"
          className="ml-1 text-gray-400 hover:text-black focus:outline-none"
          style={{ fontSize: '1em', verticalAlign: 'middle' }}
          onClick={() => setShow(s => !s)}
        >
          &#9432;
        </button>
      </span>
      {show && (
        <div className="absolute z-10 left-0 mt-2 w-56 p-2 bg-white border border-gray-300 rounded shadow text-xs text-gray-700">
          {eventTypeExplanations[type]}
        </div>
      )}
    </span>
  );
}

export default EventCheckinPage; 