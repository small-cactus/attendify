import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

interface ClubInfo {
  name: string;
  access_code: string;
}

const ClubJoinQR: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubInfo = async () => {
      if (!clubId) {
        setError('Club ID not found.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('clubs')
        .select('name, access_code')
        .eq('id', clubId)
        .single();
        
      if (fetchError || !data) {
        setError('Could not load club information. Please check the link.');
        setClubInfo(null);
      } else {
        setClubInfo(data);
      }
      setLoading(false);
    };
    
    fetchClubInfo();
  }, [clubId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-6 relative">
      {/* Attendify Branding (Top Left) */}
      <div className="absolute top-6 left-6">
        <Logo showText={true} />
      </div>
      
      {/* Attendify Branding (Bottom Left) */}
      <div className="absolute bottom-6 left-6 text-sm text-gray-400">
        <span className="inline-flex items-center gap-1">
          Powered by Attendify
        </span>
      </div>
      
      {loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-gray-500">Loading QR Code...</span>
        </motion.div>
      ) : error ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-black border-b border-gray-300 hover:border-black">
            Back to Home
          </Link>
        </motion.div>
      ) : clubInfo ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center flex flex-col items-center max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-black mb-2">
            {clubInfo.name}
          </h1>
          <p className="text-gray-600 mb-8">
            Scan the code below with your device to join the club
          </p>
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 inline-block mb-8">
            <QRCodeCanvas 
              value={`${window.location.origin}/join/${clubId}`}
              size={256} 
              level="H" 
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
           <p className="text-sm text-gray-500 mb-2">Or enter code:</p>
           <p className="text-2xl font-mono tracking-widest p-4 bg-gray-50 rounded-lg text-black inline-block mb-2 border border-gray-200">
             {clubInfo.access_code}
           </p>
           <p className="text-sm text-gray-500 mb-8">
             at <span className="font-medium text-gray-800">attendify.app/join</span>
           </p>
           <Link 
             to={`/clubs/${clubId}`}
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

export default ClubJoinQR;