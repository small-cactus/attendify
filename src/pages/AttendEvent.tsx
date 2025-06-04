import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { parseLocalDate } from '../lib/utils';
import { getCloseMatches } from '../utils/nameMatcher';

interface Event {
  id: string;
  name: string;
  event_date: string;
  invite_code: string;
  club_id: string;
  club_name?: string;
  checkin_location_enabled?: boolean;
  checkin_qr_enabled?: boolean;
  checkin_code_enabled?: boolean;
  checkin_code?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_radius_meters?: number | null;
  recurrence?: string;
  recurrence_until?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
  checkin_only_during_event?: boolean;
}

interface ClubMember {
  name: string;
  id: string;
  member_uuid: string | null;
}

const AttendEvent: React.FC = () => {
  const [view, setView] = useState<'code' | 'events'>('events'); // Default to events view
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberUuid, setMemberUuid] = useState<string | null>(null);
  const [savedClubs, setSavedClubs] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [nameMatches, setNameMatches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load member data from localStorage and fetch available events
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      
      // Get member data from localStorage
      const storedMemberId = localStorage.getItem('attendify_member_id');
      if (storedMemberId) {
        setMemberUuid(storedMemberId);
        
        // Get saved clubs
        const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]');
        if (storedClubs.length > 0) {
          setSavedClubs(storedClubs);
          setMemberName(storedClubs[0]?.member_name || '');
        }
      }
      
      // Fetch available events (limited to upcoming events in next 7 days)
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        // First, get the events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            invite_code,
            club_id,
            checkin_location_enabled,
            checkin_qr_enabled,
            checkin_code_enabled,
            checkin_code,
            location_lat,
            location_lng,
            location_radius_meters,
            recurrence,
            recurrence_until,
            event_start_time,
            event_end_time,
            checkin_only_during_event
          `)
          .gte('event_date', today.toISOString())
          .lte('event_date', nextWeek.toISOString())
          .order('event_date', { ascending: true });
        
        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          setIsLoading(false);
          return;
        }
        
        if (!eventsData || eventsData.length === 0) {
          setAvailableEvents([]);
          setIsLoading(false);
          return;
        }
        
        // For each event, get its club details
        const enhancedEvents: Event[] = [];
        
        for (const event of eventsData) {
          const { data: clubData } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', event.club_id)
            .single();
          
          enhancedEvents.push({
            id: event.id,
            name: event.name,
            event_date: event.event_date,
            invite_code: event.invite_code,
            club_id: event.club_id,
            club_name: clubData?.name || 'Unknown Club',
            checkin_location_enabled: event.checkin_location_enabled,
            checkin_qr_enabled: event.checkin_qr_enabled,
            checkin_code_enabled: event.checkin_code_enabled,
            checkin_code: event.checkin_code,
            location_lat: event.location_lat,
            location_lng: event.location_lng,
            location_radius_meters: event.location_radius_meters,
            recurrence: event.recurrence,
            recurrence_until: event.recurrence_until,
            event_start_time: event.event_start_time,
            event_end_time: event.event_end_time,
            checkin_only_during_event: event.checkin_only_during_event
          });
        }
        
        setAvailableEvents(enhancedEvents);
      } catch (error) {
        console.error('Error in data fetching:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  const verifyInviteCode = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Find event by invite code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          event_date,
          invite_code,
          club_id,
          checkin_location_enabled,
          checkin_qr_enabled,
          checkin_code_enabled,
          checkin_code,
          location_lat,
          location_lng,
          location_radius_meters,
          recurrence,
          recurrence_until,
          event_start_time,
          event_end_time,
          checkin_only_during_event
        `)
        .eq('invite_code', inviteCode)
        .single();
      
      if (eventError || !eventData) {
        setError('Invalid event code. Please check and try again.');
        setLoading(false);
        return;
      }
      
      // Get the club name
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', eventData.club_id)
        .single();

      // Now fetch preapproved members for this club for autocomplete
      await fetchClubMembers(eventData.club_id);
      
      // Create the event object
      const event: Event = {
        id: eventData.id,
        name: eventData.name,
        event_date: eventData.event_date,
        invite_code: eventData.invite_code,
        club_id: eventData.club_id,
        club_name: clubData?.name || 'Unknown Club',
        checkin_location_enabled: eventData.checkin_location_enabled,
        checkin_qr_enabled: eventData.checkin_qr_enabled,
        checkin_code_enabled: eventData.checkin_code_enabled,
        checkin_code: eventData.checkin_code,
        location_lat: eventData.location_lat,
        location_lng: eventData.location_lng,
        location_radius_meters: eventData.location_radius_meters,
        recurrence: eventData.recurrence,
        recurrence_until: eventData.recurrence_until,
        event_start_time: eventData.event_start_time,
        event_end_time: eventData.event_end_time,
        checkin_only_during_event: eventData.checkin_only_during_event
      };
      
      setEventDetails(event);
      setLoading(false);
      setStep(2);
    } catch (error) {
      console.error('Error verifying event code:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const selectEvent = async (event: Event) => {
    setError(null);
    setLoading(true);
    
    try {
      // Fetch preapproved members for this club for autocomplete
      await fetchClubMembers(event.club_id);
      
      setEventDetails(event);
      setLoading(false);
      setStep(2);
    } catch (error) {
      console.error('Error selecting event:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const fetchClubMembers = async (clubId: string) => {
    try {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name, member_uuid')
        .eq('club_id', clubId);
        
      if (membersError) {
        console.error('Error fetching club members:', membersError);
      } else {
        setClubMembers(members || []);
      }
    } catch (error) {
      console.error('Error fetching club members:', error);
    }
  };

  const handleNameInput = (input: string) => {
    setMemberName(input);

    if (input.trim() !== '') {
      const matches = getCloseMatches(
        input,
        clubMembers.map(member => member.name)
      );
      setNameMatches(matches);
    } else {
      setNameMatches([]);
    }
  };
  
  const selectName = (name: string) => {
    setMemberName(name);
    setNameMatches([]);
  };

  const handleAttendance = async () => {
    setError(null);
    setLoading(true);
    
    if (!eventDetails) {
      setError('No event selected.');
      setLoading(false);
      return;
    }
    
    try {
      // ENFORCE CHECK-IN RESTRICTIONS
      // 1. Check-in method: QR/direct or code
      if (eventDetails.checkin_qr_enabled === false && eventDetails.checkin_code_enabled === false) {
        setError('Check-in is not enabled for this event.');
        setLoading(false);
        return;
      }
      // If code is required, prompt for code and check
      if (eventDetails.checkin_code_enabled) {
        if (!inviteCode || (eventDetails.checkin_code && inviteCode !== eventDetails.checkin_code)) {
          setError('Invalid check-in code for this event.');
          setLoading(false);
          return;
        }
      }
      // 2. Location restriction
      if (eventDetails.checkin_location_enabled) {
        if (!navigator.geolocation) {
          setError('Location check-in is required, but your device does not support geolocation.');
          setLoading(false);
          return;
        }
        const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
        });
        let position;
        try {
          position = await getPosition();
        } catch (geoErr) {
          setError('Location permission denied or unavailable.');
          setLoading(false);
          return;
        }
        const { latitude, longitude } = position.coords;
        const toRad = (x: number) => x * Math.PI / 180;
        const dist = (() => {
          if (eventDetails.location_lat == null || eventDetails.location_lng == null || !eventDetails.location_radius_meters) return Infinity;
          const R = 6371000; // meters
          const dLat = toRad(latitude - eventDetails.location_lat);
          const dLon = toRad(longitude - eventDetails.location_lng);
          const lat1 = toRad(eventDetails.location_lat);
          const lat2 = toRad(latitude);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        })();
        if (dist > (eventDetails.location_radius_meters || 0)) {
          setError('You are not at the event location.');
          setLoading(false);
          return;
        }
      }
      // 3. Time window restriction
      if (eventDetails.checkin_only_during_event) {
        if (eventDetails.event_start_time && eventDetails.event_end_time) {
          const now = new Date();
          const start = new Date(eventDetails.event_start_time);
          const end = new Date(eventDetails.event_end_time);
          if (now < start || now > end) {
            setError('Check-in is only allowed during the event time window.');
            setLoading(false);
            return;
          }
        }
      }
      
      // First check if member exists for this club
      let memberId;
      
      if (memberUuid) {
        // Try to find member by UUID
        const { data: existingMember } = await supabase
          .from('members')
          .select('id')
          .eq('club_id', eventDetails.club_id)
          .eq('member_uuid', memberUuid)
          .single();
          
        if (existingMember) {
          memberId = existingMember.id;
        }
      }
      
      // If no member found, create a new one
      if (!memberId) {
        // Check if member with same name exists
        const { data: nameMatch } = await supabase
          .from('members')
          .select('id, member_uuid')
          .eq('club_id', eventDetails.club_id)
          .eq('name', memberName)
          .single();
          
        if (nameMatch) {
          // Use existing member
          memberId = nameMatch.id;
          
          // If this member had no UUID before, update it
          if (!nameMatch.member_uuid && memberUuid) {
            await supabase
              .from('members')
              .update({ member_uuid: memberUuid })
              .eq('id', memberId);
          } 
          // If we didn't have UUID but member has one, store it
          else if (nameMatch.member_uuid && !memberUuid) {
            localStorage.setItem('attendify_member_id', nameMatch.member_uuid);
            setMemberUuid(nameMatch.member_uuid);
          }
        } else {
          // Member not found by UUID or name
          setError(`Member '${memberName}' not found for ${eventDetails.club_name || 'this club'}. Please join the club first.`);
          setLoading(false);
          return; // Stop the check-in process
        }
      }
      
      // Record attendance
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([{ 
          event_id: eventDetails.id, 
          member_id: memberId 
        }]);
        
      if (attendanceError) {
        // Check if it's a unique constraint error (already attended)
        if (attendanceError.code === '23505') {
          setSuccess('You have already checked in to this event!');
        } else {
          setError('Failed to record attendance. Please try again.');
        }
        setLoading(false);
        return;
      }
      
      setSuccess('Attendance recorded successfully!');
      setLoading(false);
      setStep(3);
    } catch (error) {
      console.error('Error recording attendance:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseLocalDate(dateString);
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

    const date = parseLocalDate(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'Past';
    if (diffHours < 1) return 'Soon';
    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Tomorrow';
    return `In ${Math.floor(diffHours / 24)} days`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-md p-8"
            >
              <h2 className="text-2xl font-semibold mb-1 text-black">
                Check in
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Select an event or enter an event code
              </p>
              
              {savedClubs.length > 0 && (
                <div className="mb-6">
                  <p className="text-black mb-2 font-medium text-sm">Welcome back, {memberName}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {savedClubs.map((club, idx) => (
                      <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                        {club.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setView('events')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                      view === 'events' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    Available Events
                  </button>
                  <button
                    onClick={() => setView('code')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                      view === 'code' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    Enter Code
                  </button>
                </div>
                
                {view === 'code' ? (
                  <div>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Event code"
                      className="w-full px-4 py-3 text-base tracking-wider text-black border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                      disabled={loading}
                    />
                    
                    <button
                      onClick={verifyInviteCode}
                      disabled={!inviteCode.trim() || loading}
                      className="w-full mt-4 py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Continue'}
                    </button>
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : availableEvents.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {availableEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => selectEvent(event)}
                            className="w-full p-3 border border-gray-200 rounded-md text-left hover:bg-gray-50 transition-all flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-black">{event.name}</div>
                              <div className="text-xs text-gray-500">{event.club_name}</div>
                              <div className="text-xs mt-1 text-gray-400">{formatDate(event.event_date)}</div>
                            </div>
                            <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-black">
                              {formatRelativeTime(event.event_date)}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-gray-200 rounded-md">
                        <p className="text-gray-500 mb-2">No upcoming events available</p>
                        <p className="text-sm text-gray-400">Try entering an event code instead</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-md bg-gray-50 border border-gray-200 text-red-600 text-sm">
                  {error}
                  {/* Add link to join page if error is due to member not found */}
                  {error.includes('not found for') && (
                    <a 
                       href="/join" // Link to the general join flow
                       className="ml-2 underline text-blue-600 hover:text-blue-800 text-xs"
                     >
                       Join a Club
                     </a>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <a 
                  href="/join" 
                  className="text-sm text-black border-b border-gray-200 hover:border-black transition-all"
                >
                  Join a club first
                </a>
              </div>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-md p-8"
            >
              <h2 className="text-2xl font-semibold mb-4 text-black">
                Event details
              </h2>
              
              <div className="mb-6 border border-gray-200 p-4 rounded-md">
                <p className="text-black font-medium">{eventDetails?.name}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {eventDetails?.club_name}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {formatDate(eventDetails?.event_date || '')}
                </p>
              </div>
              
              {!savedClubs.length && (
                <div className="mb-6 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => handleNameInput(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 text-base text-black border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                    disabled={loading}
                    required
                  />
                  
                  {/* Name autocomplete suggestions */}
                  {nameMatches.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-y-auto">
                      {nameMatches.map((name, index) => (
                        <li 
                          key={index}
                          onClick={() => selectName(name)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 rounded-md bg-gray-50 border border-gray-200 text-red-600 text-sm">
                  {error}
                  {/* Add link to join page if error is due to member not found */}
                  {error.includes('not found for') && (
                    <a 
                       href="/join" // Link to the general join flow
                       className="ml-2 underline text-blue-600 hover:text-blue-800 text-xs"
                     >
                       Join a Club
                     </a>
                  )}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 rounded-md bg-gray-50 border border-gray-200 text-gray-800 text-sm">
                  {success}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-black font-medium rounded-md hover:bg-gray-200 transition-all border border-gray-200"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleAttendance}
                  disabled={(!memberName && !savedClubs.length) || loading}
                  className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Checking in...' : 'Check in'}
                </button>
              </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-md p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold mb-2 text-black">
                Checked in
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                You've successfully checked in to {eventDetails?.name}
              </p>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => {
                    setStep(1);
                    setView('events');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all"
                >
                  Check in to another event
                </button>
                <a
                  href="/dashboard"
                  className="py-3 px-4 bg-gray-100 text-black font-medium rounded-md hover:bg-gray-200 transition-all border border-gray-200"
                >
                  Go to Dashboard
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="mt-4 text-center"
        >
          <a href="/dashboard" className="text-sm text-gray-600 border-b border-transparent hover:border-gray-600 transition-all">
            Go to Dashboard
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendEvent; 