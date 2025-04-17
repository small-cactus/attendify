import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Logo from '../components/Logo';
import { v4 as uuidv4 } from 'uuid';

interface EventInfo {
  name: string;
  event_date: string;
  club_id: string;
  club_name?: string; // Optional: Fetch club name too
}

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
        .select('name, event_date, club_id, clubs ( name )'
        )
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
          name: data.name,
          event_date: data.event_date,
          club_id: data.club_id,
          club_name: clubName
        };
        setEventInfo(flatData);
      }
      setLoading(false);
    };
    
    fetchEventInfo();
  }, [inviteCode]);

  const handleCheckin = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!eventInfo || !memberName.trim()) {
       setCheckinError('Please enter your name.');
       return;
     }
     setCheckinLoading(true);
     setCheckinError(null);
     setCheckinSuccess(false);

     try {
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
        const { data: eventData, error: eventFetchError } = await supabase
            .from('events')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();
        
        if (eventFetchError || !eventData) {
            throw eventFetchError || new Error('Could not verify event details for check-in.');
        }
        const eventId = eventData.id;

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
          <p className="text-gray-500">Loading Event Information...</p>
        ) : error ? (
          <div>
             <p className="text-red-600 mb-4">{error}</p>
             <button onClick={() => navigate('/')} className="text-sm text-black border-b border-gray-300 hover:border-black">
                Back to Home
             </button>
          </div>
        ) : eventInfo ? (
          checkinSuccess ? (
            <div>
              <h2 className="text-2xl font-semibold text-green-600 mb-3">Checked In!</h2>
              <p className="text-gray-700 mb-5">You've successfully checked in to <span className="font-medium">{eventInfo.name}</span> for {eventInfo.club_name}.</p>
              <button 
                onClick={() => navigate('/')} // Or maybe a club page?
                className="px-5 py-2 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-1">Checking in for:</p>
              <h1 className="text-3xl font-bold text-black mb-1">
                {eventInfo.name}
              </h1>
              <p className="text-md text-gray-700 mb-2">({eventInfo.club_name})</p>
              <p className="text-sm text-gray-500 mb-6">
                {new Date(eventInfo.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
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
                  disabled={checkinLoading}
                >
                  {checkinLoading ? 'Checking In...' : 'Check In'}
                </button>
              </form>
               <p className="text-xs text-gray-400 mt-4">
                 Please enter the name associated with your club membership.
               </p>
            </>
          )
        ) : (
           <p className="text-gray-500">Could not load event information.</p>
        )}
      </div>
    </div>
  );
};

export default EventCheckinPage; 