import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';

// Re-declare or import interfaces if needed
interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  access_code: string;
  created_at: string;
}

interface Event {
  id: string;
  club_id: string;
  name: string;
  event_date: string;
  invite_code: string;
  created_at: string;
}

interface Member {
  id: string;
  club_id: string;
  name: string;
  preapproved: boolean;
  created_at: string;
}

function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const ClubDetail: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State previously in Clubs.tsx modal + loading/error for club details
  const [club, setClub] = useState<Club | null>(null);
  const [loadingClub, setLoadingClub] = useState(true);
  const [errorClub, setErrorClub] = useState<string | null>(null);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  
  const [currentTab, setCurrentTab] = useState<'events' | 'members' | 'attendance'>('events');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  
  const [attendanceTab, setAttendanceTab] = useState<'byEvent' | 'byMember'>('byEvent');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const csvRef = useRef<HTMLAnchorElement>(null);

  // Check user auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch club details
  useEffect(() => {
    const fetchClubDetails = async () => {
      if (!clubId || !user) return;
      setLoadingClub(true);
      setErrorClub(null);
      
      // Verify user owns this club first
      const { data: ownerCheck, error: ownerError } = await supabase
        .from('club_owners')
        .select('club_id')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .maybeSingle(); // Use maybeSingle to handle no rows

      if (ownerError) {
        console.error('Error checking club ownership:', ownerError);
        setErrorClub('Error verifying club ownership.');
        setLoadingClub(false);
        return;
      }

      if (!ownerCheck) {
        setErrorClub('You do not have permission to view this club.');
        setClub(null);
        setLoadingClub(false);
        // Optionally navigate away: navigate('/clubs');
        return;
      }
      
      // Fetch club details
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
        
      if (error || !data) {
        setErrorClub('Failed to load club details.');
        setClub(null);
      } else {
        setClub(data);
      }
      setLoadingClub(false);
    };
    fetchClubDetails();
  }, [clubId, user]);

  // Fetch events for the club
  useEffect(() => {
    const fetchEvents = async () => {
      if (!clubId) return;
      setEventLoading(true);
      setEventError(null);
      const { data, error } = await supabase
        .from('events')
        .select('id, club_id, name, event_date, invite_code, created_at')
        .eq('club_id', clubId)
        .order('event_date', { ascending: false });
      if (error) {
        setEventError('Failed to fetch events.');
        setEvents([]);
      } else {
        setEvents(data || []);
      }
      setEventLoading(false);
    };
    fetchEvents();
  }, [clubId]);

  // Fetch members when tab is active
  useEffect(() => {
    const fetchMembers = async () => {
      if (!clubId || currentTab !== 'members') return;
      setMemberLoading(true);
      setMemberError(null);
      const { data, error } = await supabase
        .from('members')
        .select('id, club_id, name, preapproved, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      if (error) {
        setMemberError('Failed to fetch members.');
        setMembers([]);
      } else {
        setMembers(data || []);
      }
      setMemberLoading(false);
    };
    fetchMembers();
  }, [clubId, currentTab]);

  // Fetch attendance data when tab is active
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!clubId || currentTab !== 'attendance' || !events.length) {
        setAttendanceData([]); // Clear data if conditions not met
        return;
      }
      setAttendanceLoading(true);
      const eventIds = events.map(e => e.id);
      if (eventIds.length === 0) {
          setAttendanceData([]);
          setAttendanceLoading(false);
          return;
      }
      const { data } = await supabase
        .from('attendance')
        .select('id, attended_at, event:events(name, event_date), member:members(name)')
        .in('event_id', eventIds);
      setAttendanceData(data || []);
      setAttendanceLoading(false);
    };
    fetchAttendance();
  }, [clubId, currentTab, events]);

  // --- Event Handlers (Moved from Clubs.tsx Modal) --- 
  
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    setEventError(null);
    setEventLoading(true);
    const invite_code = generateAccessCode(8);
    const { error } = await supabase
      .from('events')
      .insert([{
        club_id: clubId,
        name: eventName,
        event_date: eventDate,
        invite_code,
        created_at: new Date().toISOString()
      }]);
    if (error) {
      setEventError('Failed to create event.');
    } else {
      setEventName('');
      setEventDate('');
      // Refetch events
      const { data } = await supabase
        .from('events')
        .select('id, club_id, name, event_date, invite_code, created_at')
        .eq('club_id', clubId)
        .order('event_date', { ascending: false });
      setEvents(data || []);
    }
    setEventLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    setMemberError(null);
    setMemberLoading(true);
    const { error } = await supabase
      .from('members')
      .insert([{ club_id: clubId, name: memberName, preapproved: true }]);
    if (error) {
      setMemberError('Failed to add member.');
    } else {
      setMemberName('');
      // Refetch members
      const { data } = await supabase
        .from('members')
        .select('id, club_id, name, preapproved, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      setMembers(data || []);
    }
    setMemberLoading(false);
  };

  const handleDeleteClub = async () => {
    if (!clubId || !club) return;
    if (!window.confirm(`Are you sure you want to delete the club "${club.name}"? This action cannot be undone.`)) return;
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) {
      alert('Failed to delete club.');
      return;
    }
    navigate('/clubs'); // Navigate back to the list after deletion
  };

  const handleExportCSV = () => {
    if (!attendanceData.length || !club) return;
    let csv = 'Event,Date,Member,Attended At\n';
    attendanceData.forEach(row => {
      csv += `${row.event?.name || ''},${row.event?.event_date || ''},${row.member?.name || ''},${row.attended_at || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    if (csvRef.current) {
      csvRef.current.href = url;
      csvRef.current.download = `${club.name || 'attendance'}.csv`;
      csvRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  
  // --- Render Logic --- 

  if (authLoading || loadingClub) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <span className="text-gray-500">Loading Club Details...</span>
        </div>
      </Layout>
    );
  }
  
  if (errorClub) {
     return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 mb-4">{errorClub}</p>
          <Link to="/clubs" className="text-black border-b border-gray-300 hover:border-black">
            Back to My Clubs
          </Link>
        </div>
      </Layout>
    );
  }
  
  if (!club) {
    // This case might be hit briefly or if permissions fail silently
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-500">Club not found or access denied.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/clubs" className="text-sm text-gray-500 hover:text-black mb-2 inline-block">
            &larr; Back to My Clubs
          </Link>
          <h1 className="text-3xl font-semibold text-black mb-1">{club.name}</h1>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
            <span className="text-gray-500">{club.category}</span>
            <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
              Code: {club.access_code}
            </span>
            {/* Link to QR page - Icon Removed */}
            <Link 
              to={`/clubs/${clubId}/join-qr`}
              className="text-sm text-black border-b border-gray-300 hover:border-black transition-colors"
              target="_blank" 
            >
              Show Join QR Code
            </Link>
          </div>
          <p className="text-md text-gray-600 mt-3 max-w-3xl">{club.description}</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 mb-8">
          <button
            className={`px-4 pb-2 text-sm font-medium transition-all ${
              currentTab === 'events' 
                ? 'border-b-2 border-black text-black' 
                : 'text-gray-500 hover:text-black'
            }`}
            onClick={() => setCurrentTab('events')}
          >
            Events
          </button>
          <button
            className={`px-4 pb-2 text-sm font-medium transition-all ${
              currentTab === 'members' 
                ? 'border-b-2 border-black text-black' 
                : 'text-gray-500 hover:text-black'
            }`}
            onClick={() => setCurrentTab('members')}
          >
            Members
          </button>
          <button
            className={`px-4 pb-2 text-sm font-medium transition-all ${
              currentTab === 'attendance' 
                ? 'border-b-2 border-black text-black' 
                : 'text-gray-500 hover:text-black'
            }`}
            onClick={() => setCurrentTab('attendance')}
          >
            Attendance
          </button>
           {/* Delete Button - moved to end */}
           <div className="flex-grow"></div>
           <button
             onClick={handleDeleteClub}
             className="px-3 pb-2 text-sm font-medium text-red-600 hover:text-red-800 hover:border-b-2 hover:border-red-600 transition-all"
           >
             Delete Club
           </button>
        </div>

        {/* Tab Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab} // Trigger animation on tab change
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {currentTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-black">Manage Events</h3>
                  {eventLoading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading events...</div>
                  ) : events.length > 0 ? (
                    <ul className="mb-6 space-y-3">
                      {events.map(event => (
                        <li key={event.id} className="p-4 rounded border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium text-md text-black">{event.name}</div>
                            <div className="text-sm text-gray-500 mt-0.5">{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            <div className="text-sm font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded inline-block mt-2">
                              Invite Code: {event.invite_code}
                            </div>
                          </div>
                          <div className="p-1 bg-white border border-gray-300 rounded ml-auto">
                            <QRCodeCanvas value={event.invite_code} size={50} level="L" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mb-6 text-center text-sm text-gray-500 py-6 border border-gray-200 rounded-md">No events created yet.</div>
                  )}
                  
                  {/* Create Event Form - styled as a card */}
                  <div className="mt-6 p-5 border border-gray-200 rounded-md bg-white">
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <h4 className="text-md font-semibold text-black">Create New Event</h4>
                      <div>
                        <label htmlFor="eventName" className="block text-xs font-medium text-gray-600 mb-1">Event Name</label>
                        <input
                          id="eventName"
                          type="text"
                          placeholder="e.g., Weekly Meeting"
                          value={eventName}
                          onChange={e => setEventName(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                          disabled={eventLoading}
                        />
                      </div>
                      <div>
                        <label htmlFor="eventDate" className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                        <input
                          id="eventDate"
                          type="date"
                          value={eventDate}
                          onChange={e => setEventDate(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                          disabled={eventLoading}
                        />
                      </div>
                      {eventError && <div className="text-red-600 text-xs">{eventError}</div>}
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={eventLoading}
                      >
                        {eventLoading ? 'Creating...' : 'Create Event'}
                      </button>
                    </form>
                  </div>
              </div>
            )}

            {currentTab === 'members' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-black">Manage Preapproved Members</h3>
                 {/* Add Member Form - styled as card */}                 
                 <div className="mb-6 p-5 border border-gray-200 rounded-md bg-white">
                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow">
                            <label htmlFor="memberName" className="block text-xs font-medium text-gray-600 mb-1">Member Name</label>
                            <input
                                id="memberName"
                                type="text"
                                placeholder="Name to preapprove for joining"
                                value={memberName}
                                onChange={e => setMemberName(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                                disabled={memberLoading}
                            />
                        </div>
                        <div className="self-end">
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-4 py-2 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={memberLoading}
                            >
                                {memberLoading ? 'Adding...' : 'Add Member'}
                            </button>
                        </div>
                    </form>
                    {memberError && <div className="text-red-600 text-xs mt-2">{memberError}</div>}
                 </div>
                 
                 {/* Member List */}                 
                  {memberLoading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading members...</div>
                  ) : members.length > 0 ? (
                    <ul className="space-y-2">
                      {members.map(member => (
                        <li key={member.id} className="p-3 rounded border border-gray-200 flex items-center justify-between text-sm">
                          <span className="text-black">{member.name}</span>
                          {member.preapproved && <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">Preapproved</span>}
                          {/* TODO: Add button to remove preapproval or member */}                        
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-6 border border-gray-200 rounded-md">No members added yet.</div>
                  )}
              </div>
            )}

            {currentTab === 'attendance' && (
              <div>
                 <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold text-black">Attendance Records</h3>
                   <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                            <button
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                attendanceTab === 'byEvent' 
                                  ? 'bg-gray-800 text-white' 
                                  : 'bg-gray-100 text-black hover:bg-gray-200'
                              }`}
                              onClick={() => setAttendanceTab('byEvent')}
                            >
                              By Event
                            </button>
                            <button
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                attendanceTab === 'byMember' 
                                  ? 'bg-gray-800 text-white' 
                                  : 'bg-gray-100 text-black hover:bg-gray-200'
                              }`}
                              onClick={() => setAttendanceTab('byMember')}
                            >
                              By Member
                            </button>
                          </div>
                          <a ref={csvRef} style={{ display: 'none' }} />
                          <button
                            className="px-3 py-1.5 text-xs bg-gray-800 text-white font-medium rounded-md hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleExportCSV}
                            disabled={attendanceLoading || !attendanceData.length}
                          >
                            Export CSV
                          </button>
                    </div>
                  </div>
                  
                  {attendanceLoading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading attendance...</div>
                  ) : attendanceData.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-left font-medium text-gray-600">{attendanceTab === 'byEvent' ? 'Event' : 'Member'}</th>
                            <th className="p-3 text-left font-medium text-gray-600">{attendanceTab === 'byEvent' ? 'Member' : 'Event'}</th>
                            <th className="p-3 text-left font-medium text-gray-600">Event Date</th>
                            <th className="p-3 text-left font-medium text-gray-600">Checked In At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {attendanceData
                            .sort((a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime()) // Sort by check-in time desc
                            .map(row => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="p-3 text-gray-800">{attendanceTab === 'byEvent' ? row.event?.name : row.member?.name}</td>
                              <td className="p-3 text-gray-800">{attendanceTab === 'byEvent' ? row.member?.name : row.event?.name}</td>
                              <td className="p-3 text-gray-500">{new Date(row.event?.event_date).toLocaleDateString()}</td>
                              <td className="p-3 text-gray-500">{new Date(row.attended_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-6 border border-gray-200 rounded-md">No attendance data found.</div>
                  )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </Layout>
  );
};

export default ClubDetail;

// Keep interfaces at the end or import from a types file
/*
interface Club { ... }
interface Event { ... }
interface Member { ... }
*/ 