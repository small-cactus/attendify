import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import CharFadeIn from '../components/CharFadeIn';
import { Users, Calendar, CheckCircle, User, ArrowRight, Clock, MapPin, BarChart3, PlusCircle, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { parseLocalDate } from '../lib/utils';

interface EventData {
  id: string;
  name: string;
  event_date: string;
  invite_code: string;
  club_id: string;
  club_name?: string;
  club_owner?: string;
  checkin_location_enabled?: boolean;
  checkin_code_enabled?: boolean;
  checkin_qr_enabled?: boolean;
  checkin_only_during_event?: boolean;
  event_start_time?: string | null;
  event_end_time?: string | null;
  has_attended?: boolean;
}

interface Club {
  id: string;
  name: string;
  description?: string;
  category?: string;
  owner_name?: string;
  owner_id?: string;
  member_name?: string;
  access_code?: string;
}

interface Member {
  id: string;
  name: string;
  preapproved?: boolean;
}

interface Attendance {
  id: string;
  event_name: string;
  event_date: string;
  attended_at: string;
  member_name: string;
}

// Helper to resolve the actual start time for an event
const getEventStartDate = (event: EventData): Date => {
  if (event.event_start_time) {
    // Handle both full timestamp strings and plain time strings
    const direct = new Date(event.event_start_time);
    if (!isNaN(direct.getTime())) return direct;

    // If only a time was provided, combine with the event date
    if (event.event_date) {
      const combined = new Date(`${event.event_date}T${event.event_start_time}`);
      if (!isNaN(combined.getTime())) return combined;
    }
  }
  return parseLocalDate(event.event_date);
};

// CSS-based animations to prevent flicker
const useStaggeredCSS = (shouldAnimate: boolean, itemCount: number) => {
  return shouldAnimate ? 
    Array.from({ length: itemCount }, (_, i) => ({
      opacity: 1,
      transition: `opacity 350ms ease-out ${i * 60}ms, transform 350ms ease-out ${i * 60}ms`,
      transform: 'translateY(0px)'
    })) :
    Array.from({ length: itemCount }, () => ({
      opacity: 0,
      transform: 'translateY(10px)',
      transition: 'opacity 350ms ease-out, transform 350ms ease-out'
    }));
};

// Define subcomponents for each tab's content

// Events Tab Content
const AllEventsSection: React.FC<{ 
  loading: boolean;
  upcomingEvents: EventData[];
  pastEvents: EventData[];
  eventAttendees: Record<string, Member[]>;
  userName: string;
}> = ({ loading, upcomingEvents, pastEvents, eventAttendees, userName }) => (
  <div
    key="events"
                    className="bg-white rounded-b-2xl border border-gray-200 border-t-0 px-3 py-6"
  >
    {loading && (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="opacity-0">Loading</div>
      </div>
    )}
    
    {!loading && (
      <div
                              >
        {/* Next upcoming event highlight */}
        {upcomingEvents.length > 0 && upcomingEvents.some(e => e.has_attended) && (
          <div className="mb-6">
            {(() => {
              // Find the next event that student is checked into
              const nextCheckedEvent = upcomingEvents
                .filter(e => e.has_attended)
                .sort((a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime())[0];

              if (nextCheckedEvent) {
                const eventDate = getEventStartDate(nextCheckedEvent);
                const now = new Date();
                const diffTime = eventDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return (
                  <div className="bg-black rounded-xl p-6 relative overflow-hidden text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="z-10">
                        <div className="bg-white text-black text-xs font-medium px-2.5 py-0.5 rounded-full inline-block mb-2">
                          You're checked in!
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{nextCheckedEvent.name}</h3>
                        <div className="flex items-center text-gray-300 mb-2">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">{eventDate.toLocaleString()}</span>
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 inline-block">
                          <span className="text-sm font-medium text-white">
                            {diffDays > 0 
                              ? `Starting in ${diffDays} day${diffDays !== 1 ? 's' : ''}` 
                              : 'Starting today!'}
                          </span>
                        </div>
                      </div>
                      {nextCheckedEvent.checkin_location_enabled && (
                        <div className="flex items-center bg-white bg-opacity-10 rounded-lg px-4 py-2 z-10">
                          <MapPin className="w-5 h-5 text-white mr-2" />
                          <span className="text-sm font-medium">Location required for this event</span>
                        </div>
                      )}
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <CheckCircle className="w-32 h-32 text-white" />
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        <UpcomingEventsSection 
          loading={loading}
          upcomingEvents={upcomingEvents}
          eventAttendees={eventAttendees}
          userName={userName}
        />
        
        <PastEventsSection 
          loading={loading}
          pastEvents={pastEvents}
          eventAttendees={eventAttendees}
          userName={userName}
        />
      </div>
    )}
  </div>
);

const UpcomingEventsSection: React.FC<{
  loading: boolean;
  upcomingEvents: EventData[];
  eventAttendees: Record<string, Member[]>;
  userName: string;
}> = ({ loading, upcomingEvents, eventAttendees, userName }) => {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  
  const toggleTitle = (eventId: string) => {
    setExpandedTitles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };
  

  
  return (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-5">
      <Calendar className="w-5 h-5 text-gray-700" />
      <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
    </div>
    
    {loading && (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="opacity-0">Loading</div>
      </div>
    )}
    
    {!loading && upcomingEvents.length > 0 && (
      <div className="space-y-4">
        {upcomingEvents
          .sort((a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime())
          .map((event, _) => {
            const eventDate = getEventStartDate(event);
            const now = new Date();
            const diffTime = eventDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return (
              <div 
                key={event.id} 
                className={`relative rounded-2xl border transition-all hover:shadow-sm ${
                  event.has_attended 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Absolute Date Badge - Clean Design */}
                <div className={`absolute top-4 left-4 rounded-lg p-2 text-center min-w-[3rem] ${
                  event.has_attended 
                    ? 'bg-white bg-opacity-10' 
                    : 'bg-gray-100'
                }`}>
                  <div className={`text-xl font-bold ${
                    event.has_attended ? 'text-white' : 'text-gray-900'
                  }`}>
                    {eventDate.getDate()}
                  </div>
                  <div className={`text-xs ${
                    event.has_attended ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {eventDate.toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between gap-3 ml-16">
                      <div className="flex-1 min-w-0">
                      {/* Event Title */}
                      <h3 
                        className={`text-lg sm:text-xl md:text-2xl font-bold mb-3 leading-tight cursor-pointer transition-all ${
                          expandedTitles.has(event.id) ? '' : 'truncate'
                        } ${
                          event.has_attended ? 'text-white' : 'text-gray-900'
                        }`}
                        onClick={() => toggleTitle(event.id)}
                        title={event.name}
                      >
                        {event.name}
                      </h3>
                      
                      {/* Event Date/Time - Mobile shows relative time, Desktop shows full date */}
                      <div className={`flex items-center gap-2 text-sm mb-4 ${
                        event.has_attended ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <Clock className="w-4 h-4" />
                        {/* Mobile: Show relative time */}
                        <span className="sm:hidden">
                          {diffDays > 1 
                            ? `Starts in ${diffDays} days` 
                            : diffDays === 1 
                              ? 'Tomorrow'
                              : 'Today'}
                        </span>
                        {/* Desktop: Show full date/time */}
                        <span className="hidden sm:inline">{eventDate.toLocaleString()}</span>
                      </div>
                    
                    {/* Requirements - Hidden on Mobile for Cleanliness */}
                    {(event.checkin_location_enabled || event.checkin_qr_enabled || event.checkin_only_during_event) && (
                      <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                        {event.checkin_location_enabled && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            event.has_attended 
                              ? 'bg-white bg-opacity-10 text-white' 
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            <MapPin className="w-3.5 h-3.5" />
                            Location Required
                          </span>
                        )}
                        {event.checkin_qr_enabled && !event.checkin_code_enabled && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            event.has_attended 
                              ? 'bg-white bg-opacity-10 text-white' 
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h-1m-2-11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM13 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5z" />
                            </svg>
                            QR Code
                          </span>
                        )}
                        {event.checkin_only_during_event && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            event.has_attended 
                              ? 'bg-white bg-opacity-10 text-white' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            Time Restricted
                          </span>
                        )}
                      </div>
                    )}
                      </div>
                    </div>
                    
                    {/* Bottom action area - Following club detail pattern */}
                    <div className="flex flex-row items-center justify-between text-sm mt-3">
                      {/* Check-in button on left */}
                      {event.has_attended ? (
                        <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white bg-opacity-10 text-white rounded-xl font-medium text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Checked In</span>
                        </div>
                      ) : (
                        <Link 
                          to={`/checkin/${event.invite_code}`}
                          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-all duration-200 flex items-center gap-2"
                        >
                          <span>Check In</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                      
                      {/* Attendee count on right */}
                      {eventAttendees[event.id] && eventAttendees[event.id].length > 0 && (
                        <div className={`flex items-center gap-2 mr-4 ${
                          event.has_attended ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          <Users className="w-4 h-4" />
                          <span>{eventAttendees[event.id].length} attendee{eventAttendees[event.id].length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
      
      {!loading && upcomingEvents.length === 0 && (
        <div className="text-center py-12 px-4">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 font-medium">No upcoming events scheduled</p>
          <p className="text-sm text-gray-400">Check back later for new events</p>
        </div>
      )}
    </div>
  );
};

const PastEventsSection: React.FC<{
  loading: boolean;
  pastEvents: EventData[];
  eventAttendees: Record<string, Member[]>;
  userName: string;
}> = ({ loading, pastEvents, eventAttendees, userName }) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  
  const toggleTitle = (eventId: string) => {
    setExpandedTitles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };
  
  useEffect(() => {
    if (!loading && pastEvents.length > 0) {
      requestAnimationFrame(() => setShouldAnimate(true));
    }
  }, [loading, pastEvents.length]);
  
  const eventStyles = useStaggeredCSS(shouldAnimate, pastEvents.length);
  
  return (
    <div className="">
      <div className="flex items-center gap-2 mb-5">
        <CheckCircle className="w-5 h-5 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-800">Past Events</h2>
      </div>
      
      {loading && (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="opacity-0">Loading</div>
        </div>
      )}
      
      {!loading && pastEvents.length > 0 && (
        <div className="space-y-4">
          {pastEvents.map((event, index) => {
            const eventDate = getEventStartDate(event);
            const now = new Date();
            const diffTime = now.getTime() - eventDate.getTime();
            const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return (
              <div 
                key={event.id}
                style={eventStyles[index] || {}}
                className={`relative rounded-2xl border transition-all will-change-transform hover:shadow-sm ${ 
                  event.has_attended 
                    ? 'border-gray-200 bg-white' 
                    : 'border-gray-200 bg-gray-50 opacity-75'
                }`}
              >
                {/* Absolute Date Badge */}
                <div className="absolute top-4 left-4 bg-gray-100 rounded-lg p-2 text-center min-w-[3rem]">
                  <div className="text-xl font-bold text-gray-900">
                    {eventDate.getDate()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {eventDate.toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between gap-3 ml-16">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className={`text-lg sm:text-xl md:text-2xl font-bold cursor-pointer transition-all ${
                            expandedTitles.has(event.id) ? '' : 'truncate'
                          } ${
                            event.has_attended ? 'text-gray-900' : 'text-gray-600'
                          }`}
                          onClick={() => toggleTitle(event.id)}
                          title={event.name}
                        >
                          {event.name}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 mt-1">
                          {/* Mobile: Show relative time */}
                          <span className="sm:hidden">
                            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                          </span>
                          {/* Desktop: Show full date/time */}
                          <span className="hidden sm:inline">{eventDate.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Bottom action area - Following club detail pattern */}
                    <div className="flex flex-row items-center justify-between text-sm mt-3">
                      {/* Status badge on left */}
                      {event.has_attended ? (
                        <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-black text-white rounded-xl font-medium text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Attended</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Missed</span>
                        </div>
                      )}
                      
                      {/* Attendee count on right */}
                      {eventAttendees[event.id] && eventAttendees[event.id].length > 0 && (
                        <div className="flex items-center gap-2 text-gray-500 mr-4">
                          <Users className="w-4 h-4" />
                          <span>{eventAttendees[event.id].length} attendee{eventAttendees[event.id].length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!loading && pastEvents.length === 0 && (
        <div
          className="text-center py-12 px-4"
          style={{
            opacity: shouldAnimate ? 1 : 0,
            transition: 'opacity 300ms ease-out 200ms'
          }}
        >
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 font-medium">No past events</p>
          <p className="text-sm text-gray-400">
            Once you attend events, they'll appear here
          </p>
        </div>
      )}
    </div>
  );
};

// Members Tab Content
const MembersSection: React.FC<{ 
  loading: boolean;
  members: Member[];
  userName: string;
}> = ({ loading, members, userName }) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => setShouldAnimate(true));
    }
  }, [loading]);
  
  const memberStyles = useStaggeredCSS(shouldAnimate, members.length);
  
  return (
  <div
    className="bg-white rounded-b-2xl border border-gray-200 border-t-0 px-3 py-6"
    style={{
      opacity: shouldAnimate ? 1 : 0,
      transform: shouldAnimate ? 'translateY(0px)' : 'translateY(10px)',
      transition: 'opacity 300ms ease-out, transform 300ms ease-out'
    }}
  >
    <div className="flex items-center gap-2 mb-5">
      <Users className="w-5 h-5 text-gray-700" />
      <h2 className="text-xl font-semibold text-gray-800">Club Members</h2>
    </div>
    
    {loading && (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="opacity-0">Loading</div>
      </div>
    )}
    
    {!loading && members.length > 0 && (
      <div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 border border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{members.length}</span> member{members.length !== 1 ? 's' : ''} in this club
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-black h-2.5 w-2.5 rounded-full"></span>
            <span className="text-gray-600">You are highlighted</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {members.map((member, index) => (
            <div 
              key={member.id}
              style={memberStyles[index] || {}}
              className={`p-4 rounded-lg ${
                member.name === userName
                  ? 'bg-black text-white' 
                  : 'bg-white border border-gray-100 hover:border-gray-200 transition-all'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  member.name === userName 
                    ? 'bg-white bg-opacity-20'
                    : 'bg-gray-100'
                }`}>
                  <User className={`w-5 h-5 ${member.name === userName ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`font-medium block truncate ${member.name === userName ? 'text-white' : 'text-gray-800'}`}>
                    {member.name}
                  </span>
                  {member.name === userName ? (
                    <span className="text-xs text-gray-300">
                      This is you
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Member
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {!loading && members.length === 0 && (
      <div
                                className="text-center py-12 px-4"
      >
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2 font-medium">No members found</p>
        <p className="text-sm text-gray-400">
          Members will appear here once they join
        </p>
      </div>
    )}
  </div>
  );
};

// Attendance Tab Content
const AttendanceSection: React.FC<{ 
  loading: boolean;
  records: Attendance[];
  ownerPreviewMode?: boolean;
}> = ({ loading, records, ownerPreviewMode }) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => setShouldAnimate(true));
    }
  }, [loading]);
  
  return (
  <div
    className="bg-white rounded-b-2xl border border-gray-200 border-t-0 px-3 py-6"
    style={{
      opacity: shouldAnimate ? 1 : 0,
      transform: shouldAnimate ? 'translateY(0px)' : 'translateY(10px)',
      transition: 'opacity 300ms ease-out, transform 300ms ease-out'
    }}
  >
    <div className="flex items-center gap-2 mb-5">
      <BarChart3 className="w-5 h-5 text-gray-700" />
      <h2 className="text-xl font-semibold text-gray-800">My Attendance</h2>
    </div>
    {ownerPreviewMode ? (
      <div className="text-center py-12 px-4">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2 font-medium">Attendance preview is not available for owners.</p>
        <p className="text-sm text-gray-400">You are not a member of this club, so you have no attendance records.</p>
      </div>
    ) : loading ? (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="opacity-0">Loading</div>
      </div>
    ) : records.length > 0 ? (
      <div
                              >
        {/* Attendance Summary Card */}
        <div className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <CheckCircle className="w-5 h-5" />
            Attendance Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Events Attended</p>
              <p className="text-3xl font-bold text-black">{records.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">First Attendance</p>
              <p className="text-md font-medium text-gray-800">
                {records.length > 0 
                  ? new Date(records
                      .sort((a, b) => new Date(a.attended_at).getTime() - new Date(b.attended_at).getTime())[0]
                      .attended_at).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Latest Attendance</p>
              <p className="text-md font-medium text-gray-800">
                {records.length > 0 
                  ? new Date(records
                      .sort((a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime())[0]
                      .attended_at).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Attendance Table / Mobile Cards */}
        <div>
          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Event Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records
                  .sort((a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime())
                  .map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{record.event_name}</td>
                    <td className="py-3 px-4 text-gray-600">{parseLocalDate(record.event_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(record.attended_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards - Shown on Mobile Only */}
          <div className="md:hidden space-y-3">
            {records
              .sort((a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime())
              .map(record => (
              <div key={record.id} className="border border-gray-200 rounded-xl p-4 bg-white transition-all">
                <h4 className="font-medium text-gray-900 mb-2">{record.event_name}</h4>
                <div className="mt-1 text-sm space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{parseLocalDate(record.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{new Date(record.attended_at).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <span className="text-xs px-2 py-1 bg-black text-white rounded-full">
                      Attended
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div
                                className="text-center py-12 px-4"
      >
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2 font-medium">No attendance records yet</p>
        <p className="text-sm text-gray-400">
          Check in to events to start building your attendance history
        </p>
      </div>
    )}
  </div>
  );
};


interface ClubContentWithFadeProps {
  selectedClubId: string | null;
  activeTab: 'events' | 'members' | 'attendance';
  selectedClub: Club | null;
  userClubs: Club[];
  userName: string;
  handleClubChange: (clubId: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<'events' | 'members' | 'attendance'>>;
  loadingEvents: boolean;
  upcomingEvents: EventData[];
  pastEvents: EventData[];
  eventAttendees: Record<string, Member[]>;
  loadingMembers: boolean;
  clubMembers: Member[];
  loadingAttendance: boolean;
  attendanceRecords: Attendance[];
  ownerPreviewMode: boolean;
}

const ClubContentWithFade: React.FC<ClubContentWithFadeProps> = ({
  selectedClubId,
  activeTab,
  selectedClub,
  userClubs,
  userName,
  handleClubChange,
  setActiveTab,
  loadingEvents,
  upcomingEvents,
  pastEvents,
  eventAttendees,
  loadingMembers,
  clubMembers,
  loadingAttendance,
  attendanceRecords,
  ownerPreviewMode
}) => {
  // Determine if the current tab content is loading
  const isCurrentTabLoading = 
    (activeTab === 'events' && loadingEvents) || 
    (activeTab === 'members' && loadingMembers) || 
    (activeTab === 'attendance' && loadingAttendance);
    
  // Only key the outer container by selectedClubId, not by activeTab
  return (
    <div>
      <div
        key={selectedClubId || 'none'}
                                      >
        {/* Welcome header with student name - Updated with monochrome design */}
        <div
          className="mb-4 sm:mb-6 md:mb-8 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 lg:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-1 sm:mb-2">Welcome, <CharFadeIn text={userName + "!"} speed={1.2} gradient={false} /></h1>
              <p className="text-sm sm:text-base text-gray-600">
                {userClubs.length === 1 
                  ? `Ready to engage with your club?` 
                  : `Select a club from the dropdown below.`}
              </p>
            </div>
            {userClubs.length > 1 && (
              <div className="relative w-full md:w-64 flex-shrink-0">
                <label htmlFor="club-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Clubs
                </label>
                <div className="relative">
                  <select
                    id="club-select"
                    value={selectedClubId || ''}
                    onChange={(e) => handleClubChange(e.target.value)}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black appearance-none"
                  >
                    {userClubs.map(club => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Club content with smooth transitions */}
        {selectedClub && (
          <div className="mb-6 sm:mb-8">
            {/* Updated Tab Navigation - More seamless design */}
            <div className="flex rounded-t-2xl bg-white border border-gray-200 border-b-0 mb-0 overflow-x-auto">
              {[ 
                { key: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> }, 
                { key: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> }, 
                { key: 'attendance', label: 'My Attendance', icon: <BarChart3 className="w-4 h-4" /> } 
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'events' | 'members' | 'attendance')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-w-0 flex-1 sm:flex-initial justify-center ${
                    activeTab === tab.key 
                      ? 'bg-white text-black border-b-2 border-black' 
                      : 'hover:bg-gray-50 text-gray-500 hover:text-black'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-1 hidden xs:inline sm:inline">{tab.label}</span>
                  <span className="ml-1 xs:hidden sm:hidden">{tab.key === 'events' ? 'Events' : tab.key === 'members' ? 'Members' : 'Records'}</span>
                </button>
              ))}
            </div>
            
            {/* Tab content using AnimatePresence and subcomponents - Using key={activeTab} for targeted cross-fade */}
            <div>
              <div 
                key={activeTab}
                                                // Animate once on mount, keep visible during subsequent loads
                                                className="relative"
              >
                {/* Loading overlay */}
                {isCurrentTabLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-b-2xl border border-t-0 border-gray-200">
                    <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-black animate-spin"></div>
                  </div>
                )}
                
                {activeTab === 'events' && (
                  <AllEventsSection 
                    loading={loadingEvents}
                    upcomingEvents={upcomingEvents}
                    pastEvents={pastEvents}
                    eventAttendees={eventAttendees}
                    userName={userName}
                  />
                )}
                {activeTab === 'members' && (
                  <MembersSection 
                    loading={loadingMembers}
                    members={clubMembers}
                    userName={userName}
                  />
                )}
                {activeTab === 'attendance' && (
                  <AttendanceSection 
                    loading={loadingAttendance}
                    records={attendanceRecords}
                    ownerPreviewMode={ownerPreviewMode}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // Students can access the dashboard without signing in, so only redirect
  // creators who attempt to use owner features.
  useEffect(() => {
    if (!authLoading && !user) {
      // No automatic redirect; dashboard works in guest mode
      return;
    }
  }, [authLoading, user]);

  // Fetch user profile after auth is loaded and user is present
  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('profiles')
        .select('name, email, role')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          console.log('Profile fetch result:', { data, error });
          if (error || !data) {
            setProfile(null);
          } else {
            setProfile(data);
          }
        });
    } else if (!user) {
      setProfile(null);
    }
  }, [authLoading, user]);

  const [ownerPreviewMode, setOwnerPreviewMode] = useState(false);

  // Fetch joined clubs from localStorage so the dashboard works for guests too
  useEffect(() => {
    if (authLoading) return;
    setOwnerPreviewMode(false); // Reset preview mode when loading from localStorage
    setLoadingClubs(true);
    try {
      const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]');
      setUserClubs(storedClubs);
      if (storedClubs.length > 0) {
        setSelectedClubId(storedClubs[0].id);
        setSelectedClub(storedClubs[0]);
        setUserName(storedClubs[0].member_name || 'Member');
      } else {
        setUserName('Member');
      }
    } catch (error) {
      setUserClubs([]);
      setUserName('Member');
    } finally {
      setLoadingClubs(false);
    }
  }, [authLoading, user]);

  const [activeTab, setActiveTab] = useState<'events' | 'members' | 'attendance'>('events');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  
  const [clubMembers, setClubMembers] = useState<Member[]>([]);
  const [eventAttendees, setEventAttendees] = useState<Record<string, Member[]>>({});
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Helper to check if we should show the creator view
  const isAuthenticatedCreator = () => {
    return !!user && profile?.role === 'owner';
  };

  // Helper function to safely get creator name text
  const getCreatorNameText = () => {
    if (!profile) return 'Member';
    if (profile.role === 'owner') {
      return profile.name || 'Creator';
    }
    return 'Member';
  };

  // Fetch club details ONLY when a valid club ID is selected
  useEffect(() => {
    const fetchClubDetails = async () => {
      // Explicitly return if no valid club ID is selected
      if (!selectedClubId) {
        setSelectedClub(null); // Clear any previous club details
        return;
      }
      
      try {
        // Get complete club details
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('id, name, description, category, access_code')
          .eq('id', selectedClubId)
          .single();
        
        if (clubError) throw clubError;
        
        if (clubData) {
          // Determine the correct display name based on context
          let displayUserName = userName; // Start with current userName
          // No owner check by user_id, just use preview mode logic
          if (ownerPreviewMode) {
            displayUserName = profile?.name || 'Creator';
          } else {
            // If member is viewing a joined club, userName should reflect member_name for THAT club
            // This requires finding the specific club in userClubs if it exists
            const joinedClub = userClubs.find(c => c.id === selectedClubId);
            displayUserName = joinedClub?.member_name || 'Member';
          }
          setUserName(displayUserName);
          setSelectedClub({
            ...clubData,
            member_name: displayUserName
          });
        } else {
          // If club data not found for the ID, clear selected club
          setSelectedClub(null);
        }
      } catch (error) {
        console.error('Error fetching club details:', error);
        setSelectedClub(null); // Clear on error
      }
    };
    
    fetchClubDetails();
    // Dependencies: selectedClubId, userName (for potential default setting), profile?.role (for creator checks), user?.id (for creator checks), userClubs (for member name lookup)
  }, [selectedClubId, profile?.role, user?.id, userClubs]);

  // Key fix: Reset event data when the club changes
  useEffect(() => {
    if (selectedClubId) {
      // Reset event data when selected club changes
      setUpcomingEvents([]);
      setPastEvents([]);
      setLoadingEvents(true);
    }
  }, [selectedClubId]);

  // Now revise the effect that fetches club events to ensure it properly filters by the selected club
  useEffect(() => {
    const fetchEvents = async () => {
      // *** CRITICAL FIX: Only fetch if a valid club ID is selected ***
      if (!selectedClubId) {
        setUpcomingEvents([]); // Ensure event lists are empty if no club is selected
        setPastEvents([]);
        setEventAttendees({});
        setLoadingEvents(false); // Set loading to false as there's nothing to load
        return; 
      }
      
      setLoadingEvents(true); // Set loading true ONLY if we proceed to fetch
      
      try {
        const today = new Date();
        const todayISO = today.toISOString();
        
        // IMPORTANT: Add explicit filtering by club_id
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('events')
          .select('id, name, event_date, invite_code, club_id, checkin_location_enabled, checkin_code_enabled, checkin_qr_enabled, checkin_only_during_event, event_start_time, event_end_time')
          .eq('club_id', selectedClubId) // Explicitly filter by selected club
          .gte('event_date', todayISO)
          .order('event_date', { ascending: true });
        
        if (upcomingError) throw upcomingError;
        
        // IMPORTANT: Add explicit filtering by club_id
        const { data: pastData, error: pastError } = await supabase
          .from('events')
          .select('id, name, event_date, invite_code, club_id, checkin_location_enabled, checkin_code_enabled, checkin_qr_enabled, checkin_only_during_event, event_start_time, event_end_time')
          .eq('club_id', selectedClubId) // Explicitly filter by selected club
          .lt('event_date', todayISO)
          .order('event_date', { ascending: false });
        
        if (pastError) throw pastError;
        
        // Determine if we need to check attendance (is the user a member or creator previewing?)
        let memberIdForAttendanceCheck: string | null = null;
        const memberUuid = localStorage.getItem('attendify_member_id');

        if (profile?.role !== 'owner' && memberUuid) {
          // Regular member: Find their membership ID for this specific club
          const { data: memberData } = await supabase
            .from('members')
            .select('id')
            .eq('club_id', selectedClubId)
            .eq('member_uuid', memberUuid)
            .single();
          if (memberData) {
            memberIdForAttendanceCheck = memberData.id;
          }
        } else if (profile?.role === 'owner' && user?.id === selectedClub?.owner_id) {
          // Creator viewing their OWN club: Check attendance using their *creator* ID if they are also a member
          // This requires checking if the owner is *also* listed in the members table for this club
          const { data: creatorMemberData } = await supabase
            .from('members')
            .select('id')
            .eq('club_id', selectedClubId)
            .eq('user_id', user.id) // Check if owner's user_id exists in members
            .maybeSingle(); // Use maybeSingle as owner might not be a member
            
          if (creatorMemberData) {
             memberIdForAttendanceCheck = creatorMemberData.id;
          }
        }

        let attendedIds: string[] = [];
        if (memberIdForAttendanceCheck) {
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('event_id')
            .eq('member_id', memberIdForAttendanceCheck);
            
          attendedIds = attendanceData?.map(a => a.event_id) || [];
        }
        
        // Process events and mark attendance
        const enhanceEvent = (event: any) => ({
          ...event,
          club_name: selectedClub?.name,
          club_owner: selectedClub?.owner_name,
          has_attended: attendedIds.includes(event.id)
        });

        setUpcomingEvents(upcomingData?.map(enhanceEvent) || []);
        setPastEvents(pastData?.map(enhanceEvent) || []);
        
        // Fetch attendees for each event (remains the same)
        const allEvents = [...(upcomingData || []), ...(pastData || [])];
        const attendeesByEvent: Record<string, Member[]> = {};
        
        for (const event of allEvents) {
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('member_id')
            .eq('event_id', event.id);
          
          if (attendanceData && attendanceData.length > 0) {
            const memberIds = attendanceData.map(a => a.member_id);
            
            const { data: membersData } = await supabase
              .from('members')
              .select('id, name')
              .in('id', memberIds);
            
            if (membersData) {
              attendeesByEvent[event.id] = membersData;
            }
          } else {
            attendeesByEvent[event.id] = [];
          }
        }
        
        setEventAttendees(attendeesByEvent);
      } catch (error) {
        console.error('Error fetching events:', error);
        setUpcomingEvents([]); // Clear on error
        setPastEvents([]);
        setEventAttendees({});
      } finally {
        setLoadingEvents(false); // Ensure loading is set to false
      }
    };
    
    fetchEvents();
    // Refresh events when selectedClubId changes OR when selectedClub details (like owner_id) become available
  }, [selectedClubId, selectedClub?.owner_id, profile?.role, user?.id]);

  // Fetch members when tab is active
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedClubId || activeTab !== 'members') return;
      
      setLoadingMembers(true);
      
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, name, preapproved')
          .eq('club_id', selectedClubId)
          .order('name');
        
        if (error) throw error;
        
        setClubMembers(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };
    
    fetchMembers();
  }, [selectedClubId, activeTab]);

  // Fetch attendance records when tab is active
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedClubId || activeTab !== 'attendance') return;
      if (ownerPreviewMode) {
        setAttendanceRecords([]);
        setLoadingAttendance(false);
        return;
      }
      setLoadingAttendance(true);
      try {
        // Get all events for this club
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, name, event_date')
          .eq('club_id', selectedClubId);
        
        if (eventsError) throw eventsError;
        
        if (!eventsData || eventsData.length === 0) {
          setAttendanceRecords([]);
          setLoadingAttendance(false);
          return;
        }
        
        // Get member UUID from localStorage
        const memberUuid = localStorage.getItem('attendify_member_id');
        
        if (!memberUuid) {
          setAttendanceRecords([]);
          setLoadingAttendance(false);
          return;
        }
        
        // Get member's ID for this club
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('club_id', selectedClubId)
          .eq('member_uuid', memberUuid)
          .single();
        
        if (memberError && memberError.code !== 'PGRST116') throw memberError;
        
        if (!memberData) {
          setAttendanceRecords([]);
          setLoadingAttendance(false);
          return;
        }
        
        // Get attendance records for this member
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('id, event_id, attended_at')
          .eq('member_id', memberData.id);
        
        if (attendanceError) throw attendanceError;
        
        if (!attendanceData || attendanceData.length === 0) {
          setAttendanceRecords([]);
          setLoadingAttendance(false);
          return;
        }
        
        // Map events to attendance records
        const records = attendanceData.map(record => {
          const event = eventsData.find(e => e.id === record.event_id);
          
          return {
            id: record.id,
            event_name: event?.name || 'Unknown Event',
            event_date: event?.event_date || '',
            attended_at: record.attended_at,
            member_name: userName
          };
        });
        
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [selectedClubId, activeTab, userName, ownerPreviewMode]);

  // Handle club selection
  const handleClubChange = (clubId: string) => {
    setSelectedClubId(clubId);
    
    // Load new club data in the background
    const club = userClubs.find(c => c.id === clubId);
    if (club) {
      setSelectedClub(club);
      // Set userName based on role
      if (profile?.role === 'owner') {
        setUserName(profile?.name || 'Creator'); // Use creator's actual name
      } else {
        setUserName(club.member_name || 'Member'); // Use member name from joined club data
      }
      
      // Set loading states for the appropriate tab
      if (activeTab === 'members') {
        setLoadingMembers(true);
      } else if (activeTab === 'attendance') {
        setLoadingAttendance(true);
      }
      
      // Always load events for the selected club
      setLoadingEvents(true);
    }
  };

  // Function for owners to load their owned clubs into the student view
  const loadOwnedClubsAsStudent = async () => {
    setOwnerPreviewMode(true);
    console.log('loadOwnedClubsAsStudent called', { user, profile });
    if (!isAuthenticatedCreator() || !user?.id) {
      console.log('loadOwnedClubsAsStudent early return', { isAuthenticatedCreator: isAuthenticatedCreator(), userId: user?.id });
      return;
    }
    setLoadingClubs(true);
    try {
      // Fetch clubs where the user is the owner (from club_owners table)
      const { data: ownerRows, error: ownerError } = await supabase
        .from('club_owners')
        .select('club_id')
        .eq('user_id', user.id);
      if (ownerError) throw ownerError;
      const clubIds = (ownerRows || []).map((row: any) => row.club_id).filter(Boolean);
      console.log('clubIds', clubIds); // TEMP DEBUG
      console.log('typeof clubIds[0]', typeof clubIds[0]);
      console.log('Array.isArray(clubIds)', Array.isArray(clubIds));
      if (!clubIds.length) {
        setUserClubs([]);
        setSelectedClubId(null);
        setSelectedClub(null);
        setUserName(profile?.name || 'Creator');
        setLoadingClubs(false);
        return;
      }
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, description, category, access_code')
        .in('id', clubIds);
      console.log('clubsData', clubsData, 'clubsError', clubsError);
      if (clubsError) throw clubsError;
      setUserClubs(clubsData || []);
      if (clubsData && clubsData.length > 0) {
        setSelectedClubId(clubsData[0].id);
        setSelectedClub(clubsData[0]);
        setUserName(profile?.name || 'Creator');
      } else {
        setSelectedClubId(null);
        setSelectedClub(null);
        setUserName(profile?.name || 'Creator');
      }
    } catch (error) {
      setUserClubs([]);
      setSelectedClubId(null);
      setSelectedClub(null);
      setUserName(profile?.name || 'Creator');
    } finally {
      setLoadingClubs(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-5 lg:p-6">
          {/* LOADING STATE: Show spinner and debug info */}
          {authLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-black animate-spin mb-4"></div>
              <p className="text-gray-600 mb-8">Loading authentication...</p>
            </div>
          ) : loadingClubs ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-black animate-spin mb-4"></div>
              <p className="text-gray-600 mb-8">Loading dashboard state...</p>
            </div>
          ) : 
          /* NO CLUBS VIEW: Show when loadingClubs is false and userClubs is empty */
          userClubs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 text-center">
              <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4 sm:mb-6" strokeWidth={1} />
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                {isAuthenticatedCreator() ? `Hi ${getCreatorNameText()}, you haven't joined any clubs yet!` : 'Welcome to Attendify'}
              </h2>
              {isAuthenticatedCreator() ? (
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                  Join a club as a student to see this view populated, any club you join will treat you like a student, or preview how students will see your owned clubs.
                </p>
              ) : (
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                  You're not a member of any clubs yet. Join a club to track your attendance and connect with other members.
                </p>
              )}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/join')}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                                    >
                  <PlusCircle className="w-4 h-4" />
                  Join a Club
                </button>
                {isAuthenticatedCreator() && (
                  <button
                    onClick={loadOwnedClubsAsStudent}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-white text-black border border-gray-300 font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                                          >
                    <Users className="w-4 h-4" /> 
                    View Your Clubs as Student
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Welcome header with student name - Updated with monochrome design */}
              <ClubContentWithFade 
                selectedClubId={selectedClubId}
                activeTab={activeTab}
                selectedClub={selectedClub}
                userClubs={userClubs}
                userName={userName}
                handleClubChange={handleClubChange}
                setActiveTab={setActiveTab}
                loadingEvents={loadingEvents}
                upcomingEvents={upcomingEvents}
                pastEvents={pastEvents}
                eventAttendees={eventAttendees}
                loadingMembers={loadingMembers}
                clubMembers={clubMembers}
                loadingAttendance={loadingAttendance}
                attendanceRecords={attendanceRecords}
                ownerPreviewMode={ownerPreviewMode}
              />
            </>
          )}
        </div>
      
      {/* Footer */}
      <footer className="mt-12 pt-8 pb-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Logo showText={true} imageClassName="w-6 h-6" textClassName="text-sm" />
              <span className="ml-2 text-sm text-gray-500">Making attendance simple</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/" className="text-sm text-gray-500 hover:text-black transition-colors">
                Home
              </Link>
              <Link to="/join" className="text-sm text-gray-500 hover:text-black transition-colors">
                Join Another Club
              </Link>
              <a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">
                Help & Support
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Attendify. All rights reserved.
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Dashboard;
