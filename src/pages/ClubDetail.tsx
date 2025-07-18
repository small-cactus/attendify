import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import CreateEventModal from '../components/CreateEventModal';
import { parseLocalDate } from '../lib/utils';
import { IonIcon } from '@ionic/react';
import { calendarOutline, peopleOutline, statsChartOutline, personCircleOutline, trashOutline, shareOutline, createOutline, copyOutline } from 'ionicons/icons';

// Re-declare or import interfaces if needed
interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  access_code: string;
  created_at: string;
}

// Reuse Event interface from ClubDetail or define it here
interface Event {
  id: string;
  club_id: string;
  name: string;
  event_date: string; // Store as ISO string
  invite_code: string;
  created_at: string;
  // Add fields for badges and editing
  checkin_location_enabled?: boolean;
  checkin_code_enabled?: boolean;
  checkin_qr_enabled?: boolean; // Derived field
  checkin_only_during_event?: boolean;
  location_lat?: number | null;
  location_lng?: number | null;
  location_radius_meters?: number | null;
  recurrence?: string;
  recurrence_until?: string | null; // Store as ISO string or null
  event_start_time?: string | null; // Store as ISO string or null
  event_end_time?: string | null; // Store as ISO string or null
}

interface Member {
  id: string;
  club_id: string;
  name: string;
  preapproved: boolean;
  created_at: string;
}

// Shared transition for tab content (blur lingers longer than fade)
const TAB_TRANSITION = {
  opacity: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
  filter: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
};

// Animation variants for tab content
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

const ClubDetail: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State previously in Clubs.tsx modal + loading/error for club details
  const [club, setClub] = useState<Club | null>(null);
  const [loadingClub, setLoadingClub] = useState(true);
  const [errorClub, setErrorClub] = useState<string | null>(null);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [currentTab, setCurrentTab] = useState<'events' | 'members' | 'attendance'>('events');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [deleteAllMembersLoading, setDeleteAllMembersLoading] = useState(false); // State for delete all action
  
  const [attendanceTab, setAttendanceTab] = useState<'byEvent' | 'byMember'>('byEvent');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const csvRef = useRef<HTMLAnchorElement>(null);

  // State to control the create event modal
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [createEventError, setCreateEventError] = useState<string | null>(null); // Error specifically for the creation process
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null); // State to hold the event being edited
  const [openMenuEventId, setOpenMenuEventId] = useState<string | null>(null); // Track which event menu is open
  const [showFullDescription, setShowFullDescription] = useState(false); // Track description expansion

  // Check user auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuEventId) {
        setOpenMenuEventId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuEventId]);

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
      setCreateEventError(null);
      const { data, error } = await supabase
        .from('events')
        // Select ALL fields needed for display and editing
        .select(`
          id, club_id, name, event_date, invite_code, created_at,
          checkin_location_enabled, checkin_code_enabled, checkin_only_during_event,
          location_lat, location_lng, location_radius_meters,
          recurrence, recurrence_until, event_start_time, event_end_time
        `)
        .eq('club_id', clubId)
        .order('event_date', { ascending: false });
      if (error) {
        setCreateEventError('Failed to fetch events.');
        setEvents([]);
      } else {
        // Add derived checkin_qr_enabled logic
        const eventsWithQrFlag = (data || []).map(event => ({
          ...event,
          checkin_qr_enabled: !event.checkin_code_enabled 
        }));
        setEvents(eventsWithQrFlag);
      }
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
  
  const handleCreateEventSubmit = async (eventData: any) => {
    if (!clubId) return;
    setCreateEventError(null);

    try {
      let error: any;
      if (eventToEdit) {
        // --- Update existing event ---
        const { error: updateError } = await supabase
          .from('events')
          .update({ ...eventData })
          .eq('id', eventToEdit.id);
        error = updateError;
      } else {
        // --- Insert new event ---
        const { error: insertError } = await supabase
          .from('events')
          .insert([{ ...eventData, club_id: clubId, created_at: new Date().toISOString() }]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving event:', error);
        throw new Error(error.message || `Failed to ${eventToEdit ? 'update' : 'create'} event. Please try again.`);
      }

      // Close modal and reset editing state on success
      setIsCreateEventModalOpen(false);
      setEventToEdit(null); // Clear the event being edited

      // Refetch events to update the list
      const { data: refetchData, error: refetchError } = await supabase
        .from('events')
        // Select ALL fields needed for display and editing, including the time fields
        .select(`
          id, club_id, name, event_date, invite_code, created_at,
          checkin_location_enabled, checkin_code_enabled, checkin_only_during_event,
          location_lat, location_lng, location_radius_meters,
          recurrence, recurrence_until, event_start_time, event_end_time 
        `)
        .eq('club_id', clubId)
        .order('event_date', { ascending: false });

      if (refetchError) {
        console.error('Error refetching events:', refetchError);
        setCreateEventError(`Event ${eventToEdit ? 'updated' : 'created'}, but failed to update the list.`);
      } else {
        // Add checkin_qr_enabled logic (QR is enabled if checkin_code_enabled is false)
        const eventsWithQrFlag = (refetchData || []).map(event => ({
          ...event,
          checkin_qr_enabled: !event.checkin_code_enabled 
        }));
        setEvents(eventsWithQrFlag);
      }

    } catch (error: any) {
        setCreateEventError(error.message);
        throw error;
    }
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

  // Delete an event by id
  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    setCreateEventError('Deleting event...');
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      setCreateEventError('Failed to delete event.');
    } else {
      // Refetch events
      const { data } = await supabase
        .from('events')
        .select('id, club_id, name, event_date, invite_code, created_at')
        .eq('club_id', clubId)
        .order('event_date', { ascending: false });
      setEvents(data || []);
    }
  };
  
  // Delete a member by id
  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member? This action cannot be undone.')) return;
    setMemberLoading(true);
    const { error } = await supabase.from('members').delete().eq('id', memberId);
    if (error) {
      setMemberError('Failed to remove member.');
    } else {
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

  // Delete all members for the club
  const handleDeleteAllMembers = async () => {
    if (!clubId || members.length === 0) return; // Don't proceed if no club or no members
    if (!window.confirm(`Are you sure you want to remove ALL ${members.length} preapproved member(s)? This action cannot be undone.`)) return;

    setDeleteAllMembersLoading(true);
    setMemberError(null);

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('club_id', clubId);

    if (error) {
      console.error('Error deleting all members:', error);
      setMemberError('Failed to remove all members. Please try again.');
    } else {
      setMembers([]); // Clear the list immediately on success
      // Optionally, refetch to confirm, though setting to [] is faster UI-wise
      // const { data } = await supabase.from('members').select('...').eq(...);
      // setMembers(data || []);
    }
    setDeleteAllMembersLoading(false);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <Link to="/clubs" className="text-xs sm:text-sm text-gray-500 sm:hover:text-black mb-3 inline-block">
            &larr; Back to My Clubs
          </Link>
          <div className="flex flex-col">
            {/* Mobile layout */}
            <div className="sm:hidden">
              <h1 className="text-2xl font-semibold text-black mb-2">{club.name}</h1>
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mb-3">
                {club.category}
              </span>
              <div className="flex flex-row gap-2 mb-3">
                <Link 
                  to={`/clubs/${clubId}/join-qr`}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2"
                  target="_blank" 
                >
                  Share
                  <IonIcon icon={shareOutline} className="text-base" />
                </Link>
                <button
                  className="font-mono bg-gray-100 px-4 py-2 rounded-xl text-sm transition-colors group inline-flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(club.access_code);
                    // Show a temporary success state
                    const button = e.currentTarget;
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<span class="text-green-600">Copied!</span>';
                    setTimeout(() => {
                      button.innerHTML = originalContent;
                    }, 2000);
                  }}
                >
                  <span className="text-gray-900">Code: {club.access_code}</span>
                  <IonIcon icon={copyOutline} className="text-sm text-gray-400" />
                </button>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-semibold text-black mb-2">{club.name}</h1>
                <div className="text-base text-gray-600 mb-3">
                  {club.description && club.description.length > 100 ? (
                    <div>
                      <span>
                        {showFullDescription 
                          ? club.description 
                          : `${club.description.substring(0, 100)}...`
                        }
                      </span>
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="ml-2 text-gray-900 font-medium hover:text-black transition-colors text-sm"
                      >
                        {showFullDescription ? 'less' : 'more'}
                      </button>
                    </div>
                  ) : (
                    <span>{club.description}</span>
                  )}
                </div>
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {club.category}
                </span>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Link 
                  to={`/clubs/${clubId}/join-qr`}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-black transition-all duration-200 flex items-center gap-2"
                  target="_blank" 
                >
                  Share
                  <IonIcon icon={shareOutline} className="text-base" />
                </Link>
                <button
                  className="font-mono bg-gray-100 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors group inline-flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(club.access_code);
                    // Show a temporary success state
                    const button = e.currentTarget;
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<span class="text-green-600">Copied!</span>';
                    setTimeout(() => {
                      button.innerHTML = originalContent;
                    }, 2000);
                  }}
                >
                  <span className="text-gray-900">Code: {club.access_code}</span>
                  <IonIcon icon={copyOutline} className="text-sm text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:space-x-1 border-b border-gray-200 mb-6 sm:mb-8">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              className={`px-3 sm:px-4 pb-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'events' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 sm:hover:text-black'
              }`}
              onClick={() => setCurrentTab('events')}
            >
              Events
            </button>
            <button
              className={`px-3 sm:px-4 pb-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'members' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 sm:hover:text-black'
              }`}
              onClick={() => setCurrentTab('members')}
            >
              Members
            </button>
            <button
              className={`px-3 sm:px-4 pb-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'attendance' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 sm:hover:text-black'
              }`}
              onClick={() => setCurrentTab('attendance')}
            >
              Attendance
            </button>
            {/* Delete Button - moved to end */}
            <div className="flex-grow hidden sm:block"></div>
            <button
              onClick={handleDeleteClub}
              className="px-3 pb-2 text-xs sm:text-sm font-medium text-red-600 sm:hover:text-red-800 sm:hover:border-b-2 sm:hover:border-red-600 transition-all whitespace-nowrap ml-auto"
            >
              Delete Club
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab} // Trigger animation on tab change
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            {currentTab === 'events' && (
              <div>
                {/* Header with Create Event Button */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                    <IonIcon icon={calendarOutline} className="text-lg sm:text-xl" />
                    Manage Events
                  </h3>
                  <button
                    onClick={() => setIsCreateEventModalOpen(true)}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-900 text-white rounded-xl font-medium text-sm sm:hover:bg-black transition-all duration-200"
                  >
                    Create Event
                  </button>
                </div>

                {/* Display event creation error if any */}
                {createEventError && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">{createEventError}</div>}

                {events.length > 0 ? (
                  <ul className="mb-6 grid grid-cols-1 gap-4">
                    {events.map(event => (
                      <li key={event.id} className="group bg-white rounded-2xl border border-gray-200 relative">
                        <div className="p-4 sm:p-6 md:p-8">
                          <div className="flex flex-col">
                            {/* Date indicator in top left */}
                            <div className="absolute top-4 left-4 bg-gray-100 rounded-lg p-2 text-center min-w-[3rem]">
                              <div className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                                {parseLocalDate(event.event_date).getDate()}
                              </div>
                              <div className="text-xs text-gray-600 leading-tight">
                                {parseLocalDate(event.event_date).toLocaleString('en-US', { month: 'short' })}
                              </div>
                            </div>
                            
                            <div className="flex items-start justify-between gap-3 ml-16">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                                  {event.name}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                  {(() => {
                                    try {
                                      const dateParts = event.event_date.split('-');
                                      const eventDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                                      
                                      if (event.event_start_time) {
                                        let timeString = event.event_start_time;
                                        if (timeString.includes('T')) {
                                          timeString = timeString.split('T')[1];
                                        }
                                        const timeParts = timeString.split(':');
                                        if (timeParts.length >= 2) {
                                          eventDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
                                        }
                                      }
                                      
                                      return eventDate.toLocaleString('en-US', {
                                        weekday: 'long',
                                        hour: event.event_start_time ? 'numeric' : undefined,
                                        minute: event.event_start_time ? '2-digit' : undefined
                                      });
                                    } catch (error) {
                                      return event.event_date;
                                    }
                                  })()}
                                </p>
                              </div>
                              
                              {/* Event type badges - hidden on mobile */}
                              <div className="hidden sm:flex flex-wrap gap-2">
                                {event.checkin_location_enabled && <EventTypeBadge type="geo" />}
                                {event.checkin_qr_enabled && !event.checkin_code_enabled && <EventTypeBadge type="qr" />}
                                {event.checkin_code_enabled && <EventTypeBadge type="code" />}
                                {event.checkin_only_during_event && <EventTypeBadge type="time" />}
                              </div>
                            </div>
                            
                            <div className="flex flex-row items-center justify-between text-sm text-gray-500 mt-3">
                              <Link
                                to={`/events/${event.invite_code}/checkin-qr`}
                                target="_blank"
                                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-900 text-white rounded-xl font-medium text-sm sm:hover:bg-black transition-all duration-200 flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Share
                                <IonIcon icon={shareOutline} className="text-base" />
                              </Link>
                              
                              <div className="flex flex-row items-center gap-2">
                                <button
                                  className="font-mono bg-gray-100 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:hover:bg-gray-200 transition-colors group inline-flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(event.invite_code);
                                    // Show a temporary success state
                                    const button = e.currentTarget;
                                    const originalContent = button.innerHTML;
                                    button.innerHTML = '<span class="text-green-600">Copied!</span>';
                                    setTimeout(() => {
                                      button.innerHTML = originalContent;
                                    }, 2000);
                                  }}
                                >
                                  <span className="text-gray-900">Code: {event.invite_code}</span>
                                  <IonIcon icon={copyOutline} className="text-sm text-gray-400 sm:group-hover:text-gray-600" />
                                </button>
                                
                                {/* Three dots menu button */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuEventId(openMenuEventId === event.id ? null : event.id);
                                    }}
                                    className="p-2 bg-gray-100 rounded-lg sm:hover:bg-gray-200 transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                  </button>
                                  
                                  {/* Dropdown menu */}
                                  {openMenuEventId === event.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEventToEdit(event);
                                          setIsCreateEventModalOpen(true);
                                          setOpenMenuEventId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 sm:hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <IonIcon icon={createOutline} className="text-base" />
                                        Edit Event
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteEvent(event.id);
                                          setOpenMenuEventId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 sm:hover:bg-red-50 flex items-center gap-2"
                                      >
                                        <IonIcon icon={trashOutline} className="text-base" />
                                        Delete Event
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mb-6 text-center text-sm text-gray-500 py-6 border border-gray-200 rounded-md">No events created yet.</div>
                )}
              </div>
            )}

            {currentTab === 'members' && (
              <div>
                {/* Updated Header with Delete All button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                    <IonIcon icon={peopleOutline} className="text-lg sm:text-xl" />
                    <span className="hidden sm:inline">Manage Preapproved Members</span>
                    <span className="sm:hidden">Members</span>
                  </h3>
                  <button
                    onClick={handleDeleteAllMembers}
                    className="px-3 py-1 text-xs bg-red-600 text-white font-medium rounded sm:hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={memberLoading || deleteAllMembersLoading || members.length === 0}
                  >
                    {deleteAllMembersLoading ? 'Removing...' : 'Remove All'}
                  </button>
                </div>

                {/* Add Member Form - styled as card */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-5 border border-gray-200 rounded-md bg-white">
                  <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-grow">
                      <label htmlFor="memberName" className="block text-xs font-medium text-gray-600 mb-1">Member Name</label>
                      <input
                        id="memberName"
                        type="text"
                        placeholder="Name to preapprove"
                        value={memberName}
                        onChange={e => setMemberName(e.target.value)}
                        required
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                        disabled={memberLoading}
                      />
                    </div>
                    <div className="self-end">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-black text-white font-medium rounded-md sm:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={memberLoading}
                      >
                        {memberLoading ? 'Adding...' : 'Add'}
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
                      <li key={member.id} className="p-2 sm:p-3 rounded border border-gray-200 flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 sm:gap-3 flex-grow">
                          <IonIcon icon={personCircleOutline} className="text-xl sm:text-2xl text-gray-400 flex-shrink-0" />
                          <div className="flex flex-col flex-grow min-w-0">
                            <span className="text-black truncate">{member.name}</span>
                            {member.preapproved && (
                              <span className="mt-0.5 text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded self-start">
                                Preapproved
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="ml-2 sm:ml-3 p-1 text-red-600 sm:hover:text-red-800 rounded sm:hover:bg-red-100 transition-all flex-shrink-0"
                          disabled={memberLoading}
                          aria-label="Remove member"
                        >
                          <IonIcon icon={trashOutline} className="text-base sm:text-lg" />
                        </button>
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
                 <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center justify-between mb-4">
                   <h3 className="text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                     <IonIcon icon={statsChartOutline} className="text-lg sm:text-xl" />
                     Attendance
                   </h3>
                   <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                        <div className="flex space-x-1">
                            <button
                              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                attendanceTab === 'byEvent' 
                                  ? 'bg-gray-800 text-white' 
                                  : 'bg-gray-100 text-black sm:hover:bg-gray-200'
                              }`}
                              onClick={() => setAttendanceTab('byEvent')}
                            >
                              <span className="hidden sm:inline">By Event</span>
                              <span className="sm:hidden">Event</span>
                            </button>
                            <button
                              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                attendanceTab === 'byMember' 
                                  ? 'bg-gray-800 text-white' 
                                  : 'bg-gray-100 text-black sm:hover:bg-gray-200'
                              }`}
                              onClick={() => setAttendanceTab('byMember')}
                            >
                              <span className="hidden sm:inline">By Member</span>
                              <span className="sm:hidden">Member</span>
                            </button>
                          </div>
                          <a ref={csvRef} style={{ display: 'none' }} />
                          <button
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-800 text-white font-medium rounded-md sm:hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleExportCSV}
                            disabled={attendanceLoading || !attendanceData.length}
                          >
                            <span className="hidden sm:inline">Export CSV</span>
                            <span className="sm:hidden">CSV</span>
                          </button>
                    </div>
                  </div>
                  
                  {attendanceLoading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading attendance...</div>
                  ) : attendanceData.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 sm:p-3 text-left font-medium text-gray-600">{attendanceTab === 'byEvent' ? 'Event' : 'Member'}</th>
                            <th className="p-2 sm:p-3 text-left font-medium text-gray-600 hidden sm:table-cell">{attendanceTab === 'byEvent' ? 'Member' : 'Event'}</th>
                            <th className="p-2 sm:p-3 text-left font-medium text-gray-600 hidden sm:table-cell">Event Date</th>
                            <th className="p-2 sm:p-3 text-left font-medium text-gray-600">Check-in</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {attendanceData
                            .sort((a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime()) // Sort by check-in time desc
                            .map(row => (
                            <tr key={row.id} className="sm:hover:bg-gray-50">
                              <td className="p-2 sm:p-3 text-gray-800">
                                <div className="sm:hidden">
                                  <div className="font-medium">{attendanceTab === 'byEvent' ? row.event?.name : row.member?.name}</div>
                                  <div className="text-gray-500">{attendanceTab === 'byEvent' ? row.member?.name : row.event?.name}</div>
                                </div>
                                <div className="hidden sm:block">{attendanceTab === 'byEvent' ? row.event?.name : row.member?.name}</div>
                              </td>
                              <td className="p-2 sm:p-3 text-gray-800 hidden sm:table-cell">{attendanceTab === 'byEvent' ? row.member?.name : row.event?.name}</td>
                              <td className="p-2 sm:p-3 text-gray-500 hidden sm:table-cell">{row.event?.event_date ? parseLocalDate(row.event.event_date).toLocaleDateString() : ''}</td>
                              <td className="p-2 sm:p-3 text-gray-500">
                                <div className="sm:hidden">{new Date(row.attended_at).toLocaleDateString()}</div>
                                <div className="hidden sm:block">{new Date(row.attended_at).toLocaleString()}</div>
                              </td>
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

        {/* Render the Create Event Modal */}
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => {
            setIsCreateEventModalOpen(false);
            setEventToEdit(null); // Reset editing state when closing
          }}
          onSubmit={handleCreateEventSubmit}
          eventToEdit={eventToEdit}
        />

      </div>
    </Layout>
  );
};

export default ClubDetail;

// --- EventTypeBadge Component (copied from Dashboard) ---
const eventTypeExplanations: Record<string, string> = {
  geo: 'Geo-fenced: Check-in requires device location to be at the event.',
  code: 'Code Required: Check-in requires entering the event code.',
  qr: 'QR/Direct: Check-in via QR code scan or direct link.',
  time: 'Time Window: Check-in is only allowed during the specified event time.'
};

function EventTypeBadge({ type }: { type: 'geo' | 'code' | 'qr' | 'time' }) {
  const [show, setShow] = useState(false);
  const typeStyles: Record<string, string> = {
    geo: 'bg-blue-100 text-blue-700',
    code: 'bg-yellow-100 text-yellow-700',
    qr: 'bg-green-100 text-green-700',
    time: 'bg-purple-100 text-purple-700'
  };
  const typeLabels: Record<string, string> = {
    geo: 'Geo-fenced',
    code: 'Code Only',
    qr: 'QR/Link',
    time: 'Time Restricted'
  };

  return (
    <span className="relative inline-block" onMouseLeave={() => setShow(false)}>
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${typeStyles[type] || ''}`}
        onMouseEnter={() => setShow(true)}
        onClick={() => setShow(!show)}
      >
        {typeLabels[type]}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 opacity-60">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      </span>
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 left-0 mt-1.5 w-56 p-2 bg-white border border-gray-300 rounded-md shadow-lg text-xs text-gray-700"
          >
            {eventTypeExplanations[type]}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Keep interfaces at the end or import from a types file
/*
interface Club { ... }
interface Event { ... }
interface Member { ... }
*/ 