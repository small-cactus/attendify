import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import Logo from '../components/Logo';

interface EventInfo {
  name: string;
  club_id: string;
  club_name?: string;
}

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
    } catch (e) {
      console.error('Failed to copy link', e);
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
      
      {loading ? (
        <motion.div
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <span className="text-gray-500">Loading QR Code...</span>
        </motion.div>
      ) : error ? (
        <motion.div
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="text-center"
        >
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
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
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
          <p className="text-sm text-gray-500 mb-2">
            Or go to <span className="font-medium text-gray-800">attendify.app/attend</span> and enter code:
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <p className="text-3xl font-mono tracking-widest p-4 bg-gray-50 rounded-lg text-black inline-block border border-gray-200">
              {inviteCode}
            </p>
            <button
              onClick={copyLink}
              aria-label="Copy direct link"
              className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              <Copy className="w-5 h-5 text-gray-700" />
            </button>
          </div>
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