import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Logo from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';

interface EventInfo {
  id: string;
  name: string;
  club_id: string;
  club_name: string;
}

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

const CheckinCodePage: React.FC = () => {
  const navigate = useNavigate();
  const { inviteCode: paramCode } = useParams<{ inviteCode?: string }>();
  const location = useLocation();
  const [codeInput, setCodeInput] = useState('');
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [hasClub, setHasClub] = useState(false);

  useEffect(() => {
    try {
      const storedClubs = JSON.parse(
        localStorage.getItem('attendify_clubs') || '[]'
      );
      setHasClub(Array.isArray(storedClubs) && storedClubs.length > 0);
    } catch {
      setHasClub(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCode = paramCode || params.get('code') || '';
    if (urlCode) {
      setCodeInput(urlCode.toUpperCase());
      verifyCodeInput(urlCode.toUpperCase());
    }
  }, [paramCode, location.search]);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    verifyCodeInput(codeInput);
  };

  const verifyCodeInput = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, name, club_id, clubs ( name )')
        .eq('invite_code', code)
        .single();

      if (fetchError || !data) {
        setError('Invalid event code.');
      } else {
        let clubName = 'Unknown Club';
        if (data.clubs && typeof data.clubs === 'object' && 'name' in data.clubs) {
          clubName = (data.clubs as { name: string }).name;
        }
        const info: EventInfo = {
          id: data.id,
          name: data.name,
          club_id: data.club_id,
          club_name: clubName
        };
        setEventInfo(info);
        setStep(2);
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-6 relative">
      <div className="absolute top-6 left-6">
        <Logo showText={true} />
      </div>
      <div className="absolute bottom-6 left-6 text-sm text-gray-400">Powered by Attendify</div>

      <div className="text-center max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <AnimatePresence mode="wait">
          {!hasClub ? (
            <motion.div key="join" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <h1 className="text-3xl font-bold text-black mb-3">Join a Club</h1>
              <p className="text-gray-600 mb-6">You need to join a club before checking in.</p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate('/join')}
                  className="w-full px-4 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
                >
                  Join a Club
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full mt-2 text-sm text-gray-600 hover:text-black"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div key="step1" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <h1 className="text-3xl font-bold text-black mb-3">Check In</h1>
              <p className="text-gray-600 mb-6">Enter the event code provided by your club</p>
              <form onSubmit={verifyCode} className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="block text-xs font-medium text-gray-600 mb-1 text-left">Event Code</label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
                <button onClick={() => navigate('/')} type="button" className="w-full mt-2 text-sm text-gray-600 hover:text-black">
                  Back to Home
                </button>
              </form>
            </motion.div>
          ) : null}

          {step === 2 && eventInfo && (
            <motion.div key="step2" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <h1 className="text-3xl font-bold text-black mb-1">{eventInfo.name}</h1>
              <p className="text-md text-gray-700 mb-6">Club: {eventInfo.club_name}</p>
              <p className="text-sm text-gray-600 mb-6">Is this the correct club?</p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate(`/attend/${codeInput}`)}
                  className="w-full px-4 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
                >
                  Yes, continue
                </button>
                <button
                  onClick={() => navigate('/join')}
                  className="w-full px-4 py-2.5 text-sm bg-gray-100 text-black font-medium rounded-lg hover:bg-gray-200 transition-all border border-gray-200"
                >
                  No, join a club
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setCodeInput('');
                    setEventInfo(null);
                  }}
                  className="w-full mt-2 text-sm text-gray-600 hover:text-black"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckinCodePage;

