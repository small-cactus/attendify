import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  name: string;
  event_date: string;
  invite_code: string;
  club_id: string;
  club_name?: string;
  checkin_location_enabled?: boolean;
  checkin_code_enabled?: boolean;
  checkin_qr_enabled?: boolean;
  checkin_only_during_event?: boolean;
}

const Dashboard: React.FC = () => {
  const [joinableEvents, setJoinableEvents] = useState<Event[]>([]);
  const [nonJoinableEvents, setNonJoinableEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [clubMembers, setClubMembers] = useState<Record<string, { clubName: string; members: { id: string; name: string }[] }>>({});
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [eventAttendees, setEventAttendees] = useState<Record<string, { eventName: string; clubName: string; attendees: { id: string; name: string }[] }>>({});
  const [loadingAttendees, setLoadingAttendees] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingEvents(true);
      setLoadingMembers(true);
      setLoadingAttendees(true);
      // Get member UUID and clubs from localStorage
      const memberUuid = localStorage.getItem('attendify_member_id');
      const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]');
      // Only use the most recently joined club
      const club = storedClubs.length > 0 ? storedClubs[storedClubs.length - 1] : null;
      const clubId = club ? club.id : null;
      if (!clubId) {
        setJoinableEvents([]);
        setNonJoinableEvents([]);
        setClubMembers({});
        setEventAttendees({});
        setLoadingEvents(false);
        setLoadingMembers(false);
        setLoadingAttendees(false);
        return;
      }

      // Fetch all upcoming events for this club (next 30 days)
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, event_date, invite_code, club_id, checkin_location_enabled, checkin_code_enabled, checkin_qr_enabled, checkin_only_during_event')
        .eq('club_id', clubId)
        .gte('event_date', today.toISOString())
        .lte('event_date', nextMonth.toISOString())
        .order('event_date', { ascending: true });
      if (eventsError || !eventsData) {
        setJoinableEvents([]);
        setNonJoinableEvents([]);
        setLoadingEvents(false);
      } else {
        // Fetch club name
        const { data: clubData } = await supabase
          .from('clubs')
          .select('id, name')
          .eq('id', clubId)
          .single();
        const clubName = clubData?.name || 'Unknown Club';
        // Fetch attendance for this member in this club
        let attendedEventIds: string[] = [];
        if (memberUuid) {
          const { data: memberRows } = await supabase
            .from('members')
            .select('id')
            .eq('club_id', clubId)
            .eq('member_uuid', memberUuid);
          const memberIds = (memberRows || []).map((m: any) => m.id);
          if (memberIds.length > 0) {
            const { data: attendanceRows } = await supabase
              .from('attendance')
              .select('event_id')
              .in('member_id', memberIds);
            attendedEventIds = (attendanceRows || []).map((a: any) => a.event_id);
          }
        }
        // Classify events
        const joinable: Event[] = [];
        const nonJoinable: Event[] = [];
        for (const event of eventsData) {
          const withClubName = { ...event, club_name: clubName };
          if (!attendedEventIds.includes(event.id)) {
            joinable.push(withClubName);
          } else {
            nonJoinable.push(withClubName);
          }
        }
        setJoinableEvents(joinable);
        setNonJoinableEvents(nonJoinable);
        setLoadingEvents(false);

        // Fetch club members for this club
        const { data: membersData } = await supabase
          .from('members')
          .select('id, club_id, name')
          .eq('club_id', clubId);
        setClubMembers({
          [clubId]: {
            clubName,
            members: (membersData || []).map((m: any) => ({ id: m.id, name: m.name }))
          }
        });
        setLoadingMembers(false);

        // Fetch event attendees for joinable and attended events in this club
        const relevantEventIds = [
          ...joinable.map(e => e.id),
          ...nonJoinable.map(e => e.id)
        ];
        if (relevantEventIds.length > 0) {
          // Fetch event info (name, club) for these events
          const eventInfoMap: Record<string, { name: string; club_id: string }> = {};
          (eventsData || []).forEach((e: any) => {
            eventInfoMap[e.id] = { name: e.name, club_id: e.club_id };
          });
          // Fetch attendance records for these events
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('event_id, member_id')
            .in('event_id', relevantEventIds);
          // Fetch member names for all relevant member_ids
          const attendeeMemberIds = Array.from(new Set((attendanceData || [])
            .map((a: any) => a.member_id)));
          let memberNameMap: Record<string, string> = {};
          if (attendeeMemberIds.length > 0) {
            const { data: memberNames } = await supabase
              .from('members')
              .select('id, name')
              .in('id', attendeeMemberIds);
            (memberNames || []).forEach((m: any) => {
              memberNameMap[m.id] = m.name;
            });
          }
          // Group attendees by event
          const attendeesByEvent: Record<string, { eventName: string; clubName: string; attendees: { id: string; name: string }[] }> = {};
          relevantEventIds.forEach(eventId => {
            attendeesByEvent[eventId] = {
              eventName: eventInfoMap[eventId]?.name || 'Unknown Event',
              clubName,
              attendees: []
            };
          });
          (attendanceData || []).forEach((a: any) => {
            if (attendeesByEvent[a.event_id] && memberNameMap[a.member_id]) {
              attendeesByEvent[a.event_id].attendees.push({ id: a.member_id, name: memberNameMap[a.member_id] });
            }
          });
          setEventAttendees(attendeesByEvent);
        } else {
          setEventAttendees({});
        }
        setLoadingAttendees(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-semibold text-black mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Joinable Events */}
          <Card>
            <CardHeader>
              <CardTitle>Events You Can Join</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <p className="text-sm text-gray-500">Loading joinable events...</p>
              ) : joinableEvents.length > 0 ? (
                <ul className="space-y-3">
                  {joinableEvents.map(event => (
                    <li key={event.id} className="p-3 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <span className="font-medium text-black block">{event.name}</span>
                        <span className="text-xs text-gray-500">{event.club_name}</span>
                        <div className="text-xs text-gray-400 mt-1">{new Date(event.event_date).toLocaleString()}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {event.checkin_location_enabled && <EventTypeBadge type="geo" />}
                          {event.checkin_qr_enabled && !event.checkin_code_enabled && <EventTypeBadge type="qr" />}
                          {event.checkin_only_during_event && <EventTypeBadge type="time" />}
                        </div>
                      </div>
                      <Link 
                        to={`/checkin/${event.invite_code}`}
                        className="flex-shrink-0 mt-2 sm:mt-0 px-3 py-1.5 text-xs bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all text-center"
                      >
                        Check In
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No upcoming events you can join.</p>
              )}
            </CardContent>
          </Card>

          {/* Section: Other Events */}
          <Card>
            <CardHeader>
              <CardTitle>Other Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <p className="text-sm text-gray-500">Loading other events...</p>
              ) : nonJoinableEvents.length > 0 ? (
                <ul className="space-y-3">
                  {nonJoinableEvents.map(event => (
                    <li key={event.id} className="p-3 rounded border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between opacity-70 gap-2">
                      <div className="flex-grow">
                        <span className="font-medium text-black block">{event.name}</span>
                        <span className="text-xs text-gray-500">{event.club_name}</span>
                        <div className="text-xs text-gray-400 mt-1">{new Date(event.event_date).toLocaleString()}</div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-gray-500 rounded mt-2 sm:mt-0">Invite: {event.invite_code}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No other upcoming events found.</p>
              )}
            </CardContent>
          </Card>

          {/* Section: Club Members */}
          <Card>
            <CardHeader>
              <CardTitle>Your Clubs & Members</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <p className="text-sm text-gray-500">Loading club members...</p>
              ) : Object.keys(clubMembers).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(clubMembers).map(([clubId, { clubName, members }]) => (
                    <div key={clubId} className="p-3 rounded border border-gray-100">
                      <div className="font-medium text-black mb-1.5">{clubName}</div>
                      {members.length > 0 ? (
                        <div className="text-sm text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                          {members.map(member => (
                            <span key={member.id} className="whitespace-nowrap">{member.name}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No members found.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">You are not a member of any clubs yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Section: Event Attendees */}
          <Card>
            <CardHeader>
              <CardTitle>Event Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAttendees ? (
                <p className="text-sm text-gray-500">Loading event attendees...</p>
              ) : Object.keys(eventAttendees).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(eventAttendees).map(([eventId, { eventName, clubName, attendees }]) => (
                    <div key={eventId} className="p-3 rounded border border-gray-100">
                      <div className="font-medium text-black mb-1.5">
                        {eventName} <span className="text-xs text-gray-500">({clubName})</span>
                      </div>
                      {attendees.length > 0 ? (
                        <div className="text-sm text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                          {attendees.map(att => (
                            <span key={att.id} className="whitespace-nowrap">{att.name}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No attendees found for this event.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No event attendance data available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
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

export default Dashboard; 