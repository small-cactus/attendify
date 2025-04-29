import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Logo from '../components/Logo';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

interface ClubInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

// Shared transition for content
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

const ClubJoinPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [step, setStep] = useState(clubId ? 2 : 1); // Start at step 2 if clubId is provided
  const [isDemo, setIsDemo] = useState(false);

  // Fetch member_uuid from localStorage on load
  const [, setMemberUuid] = useState<string | null>(null);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    setMemberUuid(localStorage.getItem('attendify_member_id'));
  }, []);

  // Debug: Log all supabase responses and errors
  const debugLog = (...args: any[]) => {
    if (window.location.search.includes('debug=1')) {
      console.log('[JOIN DEBUG]', ...args);
    }
  };

  // Handle name input and suggestions
  const handleNameInput = (inputValue: string) => {
    setMemberName(inputValue);
    
    if (inputValue.length > 0) {
      // Get stored clubs and their member names
      const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]') as Array<{id: string, name: string, member_name: string}>;
      const existingNames = storedClubs.map(club => club.member_name).filter(Boolean);
      
      // Find suggestions that start with the input value
      const matchingSuggestions = [...new Set(existingNames)]
        .filter(name => name.toLowerCase().startsWith(inputValue.toLowerCase()));
      
      setSuggestedNames(matchingSuggestions);
      setShowSuggestions(matchingSuggestions.length > 0);
    } else {
      setSuggestedNames([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestedName = (name: string) => {
    setMemberName(name);
    setShowSuggestions(false);
  };

  // If clubId is provided, fetch club info directly
  useEffect(() => {
    const fetchClubInfoById = async () => {
      if (!clubId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('clubs')
          .select('id, name, description, category')
          .eq('access_code', clubId)
          .single();
        debugLog('fetchClubInfoById', { data, fetchError });
        if (fetchError || !data) {
          setError('Could not load club information. Please check the link.');
          setClubInfo(null);
          setStep(1); // Go back to step 1 if there's an error
        } else {
          setClubInfo(data);
          // Check if this is a demo club
          if (data.category === 'Demo') {
            setIsDemo(true);
            // Prefill with demo username if this is a demo club
            const demoName = `Demo User ${Math.floor(Math.random() * 1000)}`;
            setMemberName(demoName);
            
            // For enhanced demo experience, auto-join after a short delay
            if (window.location.search.includes('autojoin=1')) {
              setTimeout(() => {
                const joinButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (joinButton) joinButton.click();
              }, 1500);
            }
          }
        }
      } catch (error: any) {
        debugLog('fetchClubInfoById catch', error);
        console.error('Error fetching club info:', error);
        setError(`Failed to load club: ${error.message || 'Please try again.'}`);
        setStep(1); // Go back to step 1 if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubInfoById();
  }, [clubId]);

  const verifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setJoinError('Please enter an invite code.');
      return;
    }
    
    setJoinLoading(true);
    setJoinError(null);
    
    try {
      // Find club by invite code
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, description')
        .eq('access_code', inviteCode)
        .single();
      debugLog('verifyInviteCode', { club, clubError });
      if (clubError || !club) {
        setJoinError('Invalid invite code. Please try again.');
        setJoinLoading(false);
        return;
      }

      setClubInfo(club);
      setJoinLoading(false);
      setStep(2); // Move to step 2 (name input)
    } catch (error: any) {
      debugLog('verifyInviteCode catch', error);
      console.error('Error verifying invite code:', error);
      setJoinError(`Failed to verify code: ${error.message || 'Please try again.'}`);
      setJoinLoading(false);
    }
  };

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubInfo || !memberName.trim()) {
      setJoinError('Please enter your name.');
      return;
    }
    setJoinLoading(true);
    setJoinError(null);

    try {
      // Check if member with this name already exists in club
      const { data: existingMember, error: existingMemberError } = await supabase
        .from('members')
        .select('id, member_uuid')
        .eq('club_id', clubInfo.id)
        .eq('name', memberName.trim())
        .single();
      debugLog('handleJoinClub existingMember', { existingMember, existingMemberError });
      if (existingMemberError && existingMemberError.code !== 'PGRST116') { // Ignore 'No rows found' error
        throw existingMemberError;
      }

      // Initialize finalMemberUuid
      let finalMemberUuid;

      if (existingMember) {
        // Member already exists in this club
        // Use their existing UUID if they have one, otherwise generate new
        finalMemberUuid = existingMember.member_uuid || uuidv4();
        
        // Update the member's UUID if it was missing
        if (!existingMember.member_uuid) {
          const updateRes = await supabase.from('members').update({ member_uuid: finalMemberUuid }).eq('id', existingMember.id);
          debugLog('handleJoinClub update member_uuid', updateRes);
        }
      } else {
        // Member does not exist in this club, always generate a new UUID
        // This ensures we don't reuse UUIDs across different members
        finalMemberUuid = uuidv4();
        
        // Create new member
        const { error: insertError, data: insertData } = await supabase
          .from('members')
          .insert([{ 
            club_id: clubInfo.id, 
            name: memberName.trim(), 
            member_uuid: finalMemberUuid,
            preapproved: false // Defaulting to false as no preapproval check here
          }]);
        debugLog('handleJoinClub insert member', { insertData, insertError });
        if (insertError) {
          throw insertError;
        }
      }
      
      // Store the member UUID in localStorage
      localStorage.setItem('attendify_member_id', finalMemberUuid);
      setMemberUuid(finalMemberUuid); // Update state
      
      // Record club membership in localStorage
      const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]');
      // Avoid duplicates
      if (!storedClubs.some((c: any) => c.id === clubInfo.id)) {
          storedClubs.push({
            id: clubInfo.id,
            name: clubInfo.name,
            member_name: memberName.trim() // Store the name used to join this specific club
          });
          localStorage.setItem('attendify_clubs', JSON.stringify(storedClubs));
      } else {
          // Optional: Update name if it changed for an existing club record
          const clubIndex = storedClubs.findIndex((c: any) => c.id === clubInfo.id);
          if (clubIndex !== -1 && storedClubs[clubIndex].member_name !== memberName.trim()) {
              storedClubs[clubIndex].member_name = memberName.trim();
              localStorage.setItem('attendify_clubs', JSON.stringify(storedClubs));
          }
      }
      
      debugLog('handleJoinClub success', { finalMemberUuid });
      setStep(3); // Move to success step
    } catch (error: any) {
      debugLog('handleJoinClub catch', error);
      console.error('Error joining club:', error);
      setJoinError(`Failed to join club: ${error.message || 'Please try again.'}`);
    } finally {
      setJoinLoading(false);
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
        {loading && clubId ? (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-500">Loading Club Information...</p>
          </motion.div>
        ) : error && clubId ? (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => navigate('/join')} className="text-sm text-black border-b border-gray-300 hover:border-black">
              Try Another Club Code
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h1 className="text-3xl font-bold text-black mb-3">Join Club</h1>
                <p className="text-gray-600 mb-6">Enter the invite code provided by your club organizer</p>
                
                <form onSubmit={verifyInviteCode} className="space-y-4">
                  <div>
                    <label htmlFor="inviteCode" className="block text-xs font-medium text-gray-600 mb-1 text-left">Invite Code</label>
                    <input
                      id="inviteCode"
                      type="text"
                      placeholder="Enter the invite code"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                      disabled={joinLoading}
                    />
                  </div>
                  {joinError && <p className="text-red-600 text-xs">{joinError}</p>}
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={joinLoading}
                  >
                    {joinLoading ? 'Verifying...' : 'Continue'}
                  </button>
                  <button 
                    onClick={() => navigate('/')} 
                    type="button"
                    className="w-full mt-2 text-sm text-gray-600 hover:text-black"
                  >
                    Back to Home
                  </button>
                </form>
              </motion.div>
            )}
            
            {step === 2 && clubInfo && (
              <motion.div
                key="step2"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h1 className="text-3xl font-bold text-black mb-1">
                  {clubInfo.name}
                </h1>
                <p className="text-md text-gray-700 mb-6">Enter your name to complete joining</p>
                
                <form onSubmit={handleJoinClub} className="space-y-4">
                  <div>
                    <label htmlFor="memberName" className="block text-xs font-medium text-gray-600 mb-1 text-left">Your Name</label>
                    <div className="relative">
                      <input
                        id="memberName"
                        type="text"
                        placeholder="Enter your full name"
                        value={memberName}
                        onChange={e => handleNameInput(e.target.value)}
                        onFocus={() => memberName.length > 0 && suggestedNames.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                        disabled={joinLoading}
                      />
                      {showSuggestions && suggestedNames.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-y-auto">
                          {suggestedNames.map((name, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                              onClick={() => selectSuggestedName(name)}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {joinError && <p className="text-red-600 text-xs">{joinError}</p>}
                  <div className="flex space-x-3">
                    {!clubId && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 px-4 bg-gray-100 text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-all border border-gray-200"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`${!clubId ? 'flex-1' : 'w-full'} px-4 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={joinLoading}
                    >
                      {joinLoading ? 'Joining...' : 'Join Club'}
                    </button>
                  </div>
                </form>
                <p className="text-xs text-gray-400 mt-4">
                  By joining, you agree to share your name with the club organizers.
                </p>
              </motion.div>
            )}
            
            {step === 3 && clubInfo && (
              <motion.div
                key="step3"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-green-600 mb-3">Successfully Joined!</h2>
                <p className="text-gray-700 mb-5">You have successfully joined <span className="font-medium">{clubInfo.name}</span> as {memberName}.</p>
                <div className="flex flex-col space-y-3">
                  {isDemo ? (
                    <motion.button 
                      className="w-full px-5 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
                      onClick={() => {
                        // Focus the opener window (main demo tab)
                        if (window.opener) {
                          window.opener.focus();
                        }
                        // Close the current tab
                        window.close();
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Return to Demo
                    </motion.button>
                  ) : (
                    <>
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-5 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
                      >
                        Go to Dashboard
                      </button>
                      <button 
                        onClick={() => window.location.reload()}
                        className="w-full px-5 py-2.5 text-sm bg-gray-100 text-black font-medium rounded-lg hover:bg-gray-200 transition-all border border-gray-200"
                      >
                        Join Another Club
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ClubJoinPage; 