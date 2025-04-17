import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

interface EventInfo {
  name: string;
  club_id: string;
  club_name?: string;
}

const EventCheckinQR: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!inviteCode) {
        setError('Invite code not found.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      // Fetch event details AND club name using the invite code
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('name, club_id, clubs ( name )'
        )
        .eq('invite_code', inviteCode)
        .single();
        
      if (fetchError || !data) {
        setError('Could not load event information. Please check the link or code.');
        setEventInfo(null);
      } else {
         // Flatten the result and safely access club name
         let clubName = 'Unknown Club';
         if (data.clubs && typeof data.clubs === 'object' && 'name' in data.clubs) {
            clubName = (data.clubs as { name: string }).name;
         }        
         const flatData: EventInfo = {
          name: data.name,
          club_id: data.club_id,
          club_name: clubName
        };
        setEventInfo(flatData);
      }
      setLoading(false);
    };
    
    fetchEventInfo();
  }, [inviteCode]);

  const checkinUrl = eventInfo ? `${window.location.origin}/checkin/${inviteCode}` : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-6 relative">
      {/* Branding */}
      <div className="absolute top-6 left-6">
        <Logo showText={true} />
      </div>
      <div className="absolute bottom-6 left-6 text-sm text-gray-400">
        Powered by Attendify
      </div>
      
      {loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-gray-500">Loading QR Code...</span>
        </motion.div>
      ) : error ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
           <button 
             onClick={() => navigate(-1)} // Go back to previous page (likely ClubDetail)
             className="text-black border-b border-gray-300 hover:border-black"
            >
              Go Back
           </button>
        </motion.div>
      ) : eventInfo ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center flex flex-col items-center max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-black mb-1">
            {eventInfo.name}
          </h1>
           <p className="text-lg text-gray-700 mb-2">({eventInfo.club_name})</p>
          <p className="text-gray-600 mb-8">
            Scan the code below with your device to check in
          </p>
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 inline-block mb-8">
            <QRCodeCanvas 
              value={checkinUrl}
              size={256} 
              level="H" // High error correction level
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
           <p className="text-sm text-gray-500 mb-2">Or go to:</p>
           <p className="text-lg font-mono break-all p-4 bg-gray-50 rounded-lg text-black inline-block mb-2 border border-gray-200">
             {checkinUrl}
           </p>
            <p className="text-sm text-gray-500 mb-8">
             and enter your name.
           </p>
           <Link 
             to={`/clubs/${eventInfo.club_id}`}
             className="px-6 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all duration-200"
           >
             Back to Club Details
           </Link>
        </motion.div>
      ) : (
        <p className="text-gray-500">Could not display QR code.</p>
      )}
    </div>
  );
};

export default EventCheckinQR; 