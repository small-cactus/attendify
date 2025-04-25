import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Logo from '../components/Logo';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance } from '../utils/geolocation'; // Import helpers
import { motion, AnimatePresence } from 'framer-motion';

// Additional imports for map
import { MapPin } from 'lucide-react';

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

interface Club {
  id: string;
  name: string;
  member_name: string;
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

// Format time remaining helper function
const formatTimeRemaining = (targetDate: string): string => {
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  
  // If in the past, return empty string
  if (diffMs < 0) return '';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
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
  const [, setCheckinSuccess] = useState(false);

  // Location state
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<LocationPermissionStatus>('prompt');
  const [locationError, setLocationError] = useState<string | null>(null); // Specific error for location part
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  // New states for enhanced functionalities
  const [step, setStep] = useState(inviteCode ? 2 : 1); // Start at step 2 if inviteCode is provided
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventInfo[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [view, setView] = useState<'events' | 'code'>('events'); // Default to events view
  const [isChangingName, setIsChangingName] = useState(false); // Flag to show name change UI

  // Fetch member_uuid from localStorage
  const [memberUuid, setMemberUuid] = useState<string | null>(null);

  // Add these new state variables to track user location
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    const storedMemberId = localStorage.getItem('attendify_member_id');
    setMemberUuid(storedMemberId);
    
    // Load club memberships from localStorage
    const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]') as Club[];
    setUserClubs(storedClubs);
    
    // If clubs exist, automatically select the first one and set the member name
    if (storedClubs.length > 0) {
      // Set member name from the first club (they should all have the same name)
      setMemberName(storedClubs[0].member_name);
      
      // If only one club, automatically select it
      if (storedClubs.length === 1) {
        setSelectedClubId(storedClubs[0].id);
      }
      
      // If multiple clubs are found, show club dropdown in first step
      setShowClubDropdown(storedClubs.length > 1);
    }
  }, []);

  // Load event information if inviteCode is provided
  useEffect(() => {
    if (inviteCode) {
      fetchEventByInviteCode(inviteCode);
    } else {
      // If no inviteCode, we're on the /attend route
      // Only fetch available events if a club is selected
      if (selectedClubId) {
        fetchAvailableEvents(selectedClubId);
      }
      setLoading(false);
    }
  }, [inviteCode, selectedClubId]);

  const fetchEventByInviteCode = async (code: string) => {
      setLoading(true);
      setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, name, event_date, club_id, clubs ( name ), checkin_location_enabled, checkin_code_enabled, checkin_qr_enabled, checkin_only_during_event, location_lat, location_lng, location_radius_meters')
        .eq('invite_code', code)
        .single();
        
      if (fetchError || !data) {
        setError('Could not load event information. Please check the code or link.');
        setEventInfo(null);
        setStep(1); // Go back to step 1 if there's an error
      } else {
        // Flatten the result and safely access club name
        let clubName = 'Unknown Club';
        if (data.clubs && typeof data.clubs === 'object' && 'name' in data.clubs) {
           clubName = (data.clubs as { name: string }).name;
        }
        
        const flatData: EventInfo = {
          id: data.id,
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
        
        // Auto-fill member name if this club matches one of the user's saved clubs
        const matchingClub = userClubs.find(club => club.id === flatData.club_id);
        if (matchingClub) {
          setMemberName(matchingClub.member_name);
        }
        
        // Check for location requirements
        if (flatData.checkin_location_enabled) {
          requestLocationAndCheck(flatData);
        } else {
          setLocationPermissionStatus('granted');
        }
      }
    } catch (error: any) {
      console.error('Error fetching event info:', error);
      setError(`Failed to load event: ${error.message || 'Please try again.'}`);
      setStep(1); // Go back to step 1 if there's an error
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableEvents = async (clubId: string) => {
    setLoading(true);
    
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, event_date, invite_code, club_id,
          checkin_location_enabled, checkin_qr_enabled, checkin_code_enabled,
          checkin_only_during_event, location_lat, location_lng, location_radius_meters
        `)
        .eq('club_id', clubId)
        .gte('event_date', today.toISOString())
        .lte('event_date', nextWeek.toISOString())
        .order('event_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        // Get the club name
        const { data: clubData } = await supabase
          .from('clubs')
          .select('name')
          .eq('id', clubId)
          .single();
          
        const clubName = clubData?.name || 'Unknown Club';
        
        // Add club_name to each event
        const eventsWithClub = data.map(event => ({
          ...event,
          club_name: clubName
        }));
        
        setAvailableEvents(eventsWithClub);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to request and verify location
  const requestLocationAndCheck = async (event: EventInfo | null = null) => {
    const eventToCheck = event || eventInfo;
    
    if (!eventToCheck || !eventToCheck.checkin_location_enabled) {
      setLocationPermissionStatus('granted');
      return;
    }
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationPermissionStatus('denied');
      return;
    }
    
    if (!eventToCheck.location_lat || !eventToCheck.location_lng || !eventToCheck.location_radius_meters) {
      setLocationError('Event location data is missing. Cannot verify position.');
      setLocationPermissionStatus('denied');
      return;
    }

    setIsVerifyingLocation(true);
    setLocationError(null);
    setLocationPermissionStatus('checking');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatitude = position.coords.latitude;
        const userLongitude = position.coords.longitude;
        
        // Store the user coordinates in state
        setUserLat(userLatitude);
        setUserLng(userLongitude);

        const distance = calculateDistance(
          eventToCheck.location_lat!,
          eventToCheck.location_lng!,
          userLatitude,
          userLongitude
        );

        if (distance <= eventToCheck.location_radius_meters!) {
          setLocationPermissionStatus('granted');
          setLocationError(null);
        } else {
          setLocationPermissionStatus('denied');
          setLocationError(`You must be within ${eventToCheck.location_radius_meters} meters of the event location. You are approximately ${Math.round(distance)} meters away.`);
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

  const handleNameInput = (inputValue: string) => {
    setMemberName(inputValue);
    
    if (inputValue.length > 0) {
      // Get stored clubs and their member names
      const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]') as Array<{id: string, name: string, member_name: string}>;
      const existingNames = storedClubs.map(club => club.member_name).filter(Boolean);
      
      // Find suggestions that start with the input value
      const matchingSuggestions = [...new Set(existingNames)]
        .filter(name => name.toLowerCase().startsWith(inputValue.toLowerCase()));
      
      setSuggestedNames(matchingSuggestions);
      setShowSuggestions(matchingSuggestions.length > 0);
    } else {
      setSuggestedNames([]);
      setShowSuggestions(false);
    }
  };
  
  const selectSuggestedName = (name: string) => {
    setMemberName(name);
    setShowSuggestions(false);
  };

  const verifyEventCode = async () => {
    if (!codeInput.trim()) {
      setError('Please enter an event code.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await fetchEventByInviteCode(codeInput);
      setStep(2);
    } catch (error: any) {
      console.error('Error verifying event code:', error);
      setError(`Failed to verify code: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const selectEvent = (event: EventInfo) => {
    setEventInfo(event);
    
    // Check for location requirements
    if (event.checkin_location_enabled) {
      requestLocationAndCheck(event);
    } else {
       setLocationPermissionStatus('granted');
    }
    
    setStep(2);
  };

  const handleCheckin = async () => {
     if (!eventInfo || !memberName.trim()) {
       setCheckinError('Please enter your name.');
       return;
     }
     
     setCheckinLoading(true);
     setCheckinError(null);

     try {
        // Location check
        if (eventInfo.checkin_location_enabled) {
          if (isVerifyingLocation) {
            setCheckinError('Please wait while your location is being verified.');
            setCheckinLoading(false);
            return;
          }
          if (locationPermissionStatus !== 'granted') {
            if (!locationError) {
                setCheckinError('Location not verified. Please grant permission or click retry.');
                setCheckinLoading(false);
                return;
            } else {
              setCheckinError(locationError);
              setCheckinLoading(false);
              return;
            }
          }
        }

        // Time window restriction
        if (eventInfo.checkin_only_during_event && eventInfo.event_date) {
          const now = new Date();
          const start = new Date(eventInfo.event_date);
          if (now < start) {
            setCheckinError('Check-in is not allowed before the event starts.');
            setCheckinLoading(false);
            return;
          }
        }

        // Find or create member
        let memberId: number | null = null;
        let finalMemberUuid = memberUuid || uuidv4();

        // Try finding member by UUID first
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
              throw nameError;
            }

            if (memberByName) {
              memberId = memberByName.id;
              finalMemberUuid = memberByName.member_uuid || finalMemberUuid;
              
              if (!memberByName.member_uuid || (memberUuid && memberUuid !== memberByName.member_uuid)) {
                await supabase.from('members').update({ member_uuid: finalMemberUuid }).eq('id', memberId);
                localStorage.setItem('attendify_member_id', finalMemberUuid);
                setMemberUuid(finalMemberUuid);
              }
            } else {
              setCheckinError(`Member '${memberName.trim()}' not found for ${eventInfo.club_name || 'this club'}. Please join the club first.`);
              setCheckinLoading(false);
              return;
            }
        }

        if (!memberId) {
            throw new Error('Failed to identify member.'); 
        }

        const eventId = eventInfo.id;

        // Check for existing attendance
        const { data: existingAttendance, error: attendanceCheckError } = await supabase
            .from('attendance')
            .select('id')
            .eq('event_id', eventId)
            .eq('member_id', memberId)
            .maybeSingle();
        
        if (attendanceCheckError) {
            throw attendanceCheckError;
        }

        if (existingAttendance) {
          setCheckinSuccess(true);
        } else {
          // Add attendance record
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
        
        setStep(3);

     } catch (error: any) {
        console.error('Error during check-in:', error);
        setCheckinError(`Check-in failed: ${error.message || 'Please try again.'}`);
     } finally {
        setCheckinLoading(false);
     }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'Past';
    if (diffHours < 1) return 'Soon';
    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Tomorrow';
    return `In ${Math.floor(diffHours / 24)} days`;
  };

  // Create a helper function to generate the map URL
  const getMapUrl = (eventLat: number, eventLng: number, userLat: number | null, userLng: number | null) => {
    // If we have both coordinates, create a map with both markers and appropriate zoom
    if (userLat !== null && userLng !== null) {
      // Show both markers
      return `https://maps.google.com/maps?q=${eventLat},${eventLng}&markers=color:red|${eventLat},${eventLng}&markers=color:blue|${userLat},${userLng}&z=13&output=embed`;
    }
    
    // Default to just showing the event location
    return `https://maps.google.com/maps?q=${eventLat},${eventLng}&z=15&output=embed`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 relative">
      {/* Mobile centered logo (hidden on larger screens) */}
      <div className="sm:hidden w-full flex justify-center mb-6 absolute top-6">
        <Logo showText={true} imageClassName="w-6 h-6" textClassName="text-sm" />
      </div>
      
      {/* Desktop positioned logo (hidden on mobile) */}
      <div className="hidden sm:block absolute top-6 left-6">
        <Logo showText={true} />
      </div>
      
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-xs sm:text-sm text-gray-400">
        Powered by Attendify
      </div>

      <div className="text-center w-full max-w-md bg-white p-5 sm:p-8 rounded-xl border border-gray-200 shadow-sm mt-14 sm:mt-0">
        {loading && !inviteCode ? (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-500">Loading...</p>
          </motion.div>
        ) : error && !inviteCode ? (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
             <p className="text-red-600 mb-4">{error}</p>
             <button onClick={() => navigate('/dashboard')} className="text-sm text-black border-b border-gray-300 hover:border-black">
                Back to Dashboard
             </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-3">Check In</h1>
                
                {memberName && (
                  <div className="mb-4 py-2 px-3 bg-gray-50 border border-gray-100 rounded-xl inline-flex items-center flex-wrap justify-center">
                    <span className="text-gray-700 text-sm mr-2">Checking in as:</span>
                    <span className="font-medium text-black">{memberName}</span>
                    <button
                      onClick={() => setIsChangingName(true)}
                      className="ml-2 text-xs text-gray-500 hover:text-black underline"
                    >
                      Change
                    </button>
                  </div>
                )}
                
                {isChangingName ? (
                  <div className="mb-6 p-3 sm:p-4 border border-gray-200 rounded-xl bg-white">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-left">Enter your name</h3>
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={memberName}
                        onChange={e => handleNameInput(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                      />
                      {showSuggestions && suggestedNames.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-y-auto">
                          {suggestedNames.map((name, index) => (
                            <div
                              key={index}
                              className="px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                              onClick={() => selectSuggestedName(name)}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsChangingName(false)}
                        className="px-3 py-2 text-xs bg-black text-white rounded-lg hover:bg-gray-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          // Restore original name and cancel
                          if (userClubs.length > 0) {
                            setMemberName(userClubs[0].member_name);
                          }
                          setIsChangingName(false);
                        }}
                        className="px-3 py-2 text-xs border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-6">Enter an event code or select from upcoming events</p>
                )}

                {userClubs.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-gray-700 mb-3">You haven't joined any clubs yet. Join a club first to check in to events.</p>
                    <button
                      onClick={() => navigate('/join')}
                      className="w-full px-4 py-3 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
                    >
                      Join a Club
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard')} 
                      type="button"
                      className="w-full mt-2 text-sm text-gray-600 hover:text-black"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : (
                  <>
                    {showClubDropdown && (
                      <div className="mb-6">
                        <label htmlFor="clubSelect" className="block text-xs font-medium text-gray-600 mb-1 text-left">Select Club</label>
                        <div className="relative">
                          <select
                            id="clubSelect"
                            value={selectedClubId || ''}
                            onChange={(e) => setSelectedClubId(e.target.value)}
                            className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white pr-8 appearance-none"
                          >
                            <option value="">Select a club</option>
                            {userClubs.map((club) => (
                              <option key={club.id} value={club.id}>
                                {club.name}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedClubId && (
                      <>
                        <div className="flex space-x-2 mb-4">
                          <button
                            onClick={() => setView('events')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                              view === 'events' 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-black hover:bg-gray-200'
                            }`}
                          >
                            Upcoming Events
                          </button>
                          <button
                            onClick={() => setView('code')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                              view === 'code' 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-black hover:bg-gray-200'
                            }`}
                          >
                            Enter Code
                          </button>
                        </div>

                        {view === 'events' ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {availableEvents.length > 0 ? (
                              availableEvents.map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => selectEvent(event)}
                                  className="w-full p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center"
                                >
                                  <div>
                                    <div className="font-medium text-black">{event.name}</div>
                                    <div className="text-xs text-gray-400">{formatDate(event.event_date)}</div>
                                  </div>
                                  <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-lg text-black mt-2 sm:mt-0 inline-block sm:block">
                                    {formatRelativeTime(event.event_date)}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="text-center py-6 border border-gray-200 rounded-xl">
                                <p className="text-gray-500 mb-2">No upcoming events found</p>
                                <p className="text-sm text-gray-400">Try entering an event code instead</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={codeInput}
                              onChange={(e) => setCodeInput(e.target.value)}
                              placeholder="Enter event code"
                              className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                            />
                            <button
                              onClick={verifyEventCode}
                              className="w-full px-4 py-3 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!codeInput.trim() || loading}
                            >
                              {loading ? 'Verifying...' : 'Continue'}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    <button 
                      onClick={() => navigate('/dashboard')} 
                      type="button"
                      className="w-full mt-6 text-sm text-gray-600 hover:text-black"
                    >
                      Back to Dashboard
                    </button>
                  </>
                )}
              </motion.div>
            )}
            
            {step === 2 && eventInfo && (
              <motion.div
                key="step2"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <p className="text-sm text-gray-500 mb-1">Checking in for:</p>
                <h1 className="text-xl sm:text-3xl font-bold text-black mb-1">
                  {eventInfo.name}
                </h1>
                <p className="text-md text-gray-700 mb-2">{eventInfo.club_name}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {formatDate(eventInfo.event_date)}
                </p>
                
                {/* User name display with option to change */}
                <div className="mb-4 py-2 px-3 bg-gray-50 border border-gray-100 rounded-xl inline-flex items-center flex-wrap justify-center">
                  <span className="text-gray-700 text-sm mr-2">Checking in as:</span>
                  <span className="font-medium text-black">{memberName}</span>
                  <button
                    onClick={() => setIsChangingName(true)}
                    className="ml-2 text-xs text-gray-500 hover:text-black underline"
                  >
                    Change
                  </button>
                </div>

                {/* Time restriction notice */}
                {eventInfo.checkin_only_during_event && eventInfo.event_date && (() => {
                  const now = new Date();
                  const start = new Date(eventInfo.event_date);
                  if (now < start) {
                    const timeRemaining = formatTimeRemaining(eventInfo.event_date);
                    return (
                      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm">
                        <div className="flex items-start">
                          <div className="mr-2 mt-0.5 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Event hasn't started yet</p>
                            <p className="text-xs mt-1">Check-in will be available when the event begins</p>
                            {timeRemaining && (
                              <p className="text-xs mt-1 font-medium">Time until event: {timeRemaining}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Location restriction notice */}
                {eventInfo.checkin_location_enabled && eventInfo.location_lat && eventInfo.location_lng && (
                  (locationPermissionStatus === 'prompt' || locationPermissionStatus === 'checking' || locationPermissionStatus === 'denied') && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm">
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5 flex-shrink-0">
                          <MapPin className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Location verification needed</p>
                          {locationError && locationPermissionStatus === 'denied' && (
                            <p className="text-xs mt-1 text-gray-600">{locationError}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Map embed - use the helper function to create the URL */}
                      <div className="mt-3 h-44 sm:h-36 w-full rounded-xl overflow-hidden border border-gray-200">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ border: 0 }}
                          src={getMapUrl(eventInfo.location_lat!, eventInfo.location_lng!, userLat, userLng)}
                          allowFullScreen
                        ></iframe>
                      </div>
                      
                      {locationPermissionStatus === 'denied' && (
                        <div className="mt-3 flex justify-end">
                          <button 
                            onClick={() => requestLocationAndCheck()} 
                            className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-200 transition-colors"
                            disabled={isVerifyingLocation}
                          >
                            {isVerifyingLocation ? 'Checking...' : 'Retry Location Check'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}

                {isChangingName ? (
                  <div className="mb-4 p-3 sm:p-4 border border-gray-200 rounded-xl bg-white">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-left">Enter your name</h3>
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={memberName}
                        onChange={e => handleNameInput(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                      />
                      {showSuggestions && suggestedNames.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-y-auto">
                          {suggestedNames.map((name, index) => (
                            <div
                              key={index}
                              className="px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                              onClick={() => selectSuggestedName(name)}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsChangingName(false)}
                        className="px-3 py-2 text-xs bg-black text-white rounded-lg hover:bg-gray-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          // Restore original name and cancel
                          if (userClubs.length > 0) {
                            setMemberName(userClubs[0].member_name);
                          }
                          setIsChangingName(false);
                        }}
                        className="px-3 py-2 text-xs border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    {/* General error message in a more subtle style */}
                    {checkinError && !checkinError.includes('not found for') && 
                     !checkinError.includes('Check-in is not allowed') && 
                     !checkinError.includes('Location') && (
                      <div className="w-full mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm">
                        {checkinError}
                      </div>
                    )}
                    
                    {/* Member not found error with join button */}
                    {checkinError && checkinError.includes('not found for') && (
                      <div className="w-full mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                          <div className="font-medium">Member not found</div>
                          <div className="text-xs text-gray-500 mt-1">You need to join this club first</div>
                        </div>
                        <button 
                          onClick={() => navigate(`/join/${eventInfo.club_id}`)}
                          className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-200 w-full sm:w-auto"
                        >
                          Join Club
                        </button>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 px-4 bg-gray-100 text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-all border border-gray-200"
                        disabled={checkinLoading}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCheckin}
                        className="flex-1 px-4 py-3 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={checkinLoading || isVerifyingLocation || (eventInfo.checkin_location_enabled && locationPermissionStatus !== 'granted')}
                      >
                        {checkinLoading ? 'Checking In...' 
                        : isVerifyingLocation ? 'Verifying...' 
                        : 'Check In'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {step === 3 && eventInfo && (
              <motion.div
                key="step3"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-green-600 mb-3">Checked In!</h2>
                <p className="text-gray-700 mb-5">You've successfully checked in to <span className="font-medium">{eventInfo.name}</span> as <span className="font-medium">{memberName}</span>.</p>
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full px-5 py-3 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
                  >
                    Go to Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setStep(1);
                      setEventInfo(null);
                      setCheckinError(null);
                      setLocationPermissionStatus('prompt');
                      setLocationError(null);
                    }}
                    className="w-full px-5 py-3 text-sm bg-gray-100 text-black font-medium rounded-lg hover:bg-gray-200 transition-all border border-gray-200"
                  >
                    Check In to Another Event
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default EventCheckinPage; 