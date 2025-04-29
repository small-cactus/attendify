import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { supabase } from '../utils/supabaseClient';
import CharFadeIn from '../components/CharFadeIn';

// Page transition with blur
const pageVariants = {
  initial: { 
    opacity: 0,
    filter: 'blur(12px)',
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Staggered item animation for left side content
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const staggerItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 15, 
    filter: 'blur(8px)' 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// New container blur fade variant (inspired by Welcome.tsx)
const containerBlurFadeVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(8px)',
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Add this from Dashboard.tsx
const fadeInBlurVariants = {
  hidden: { 
    opacity: 0,
    filter: "blur(12px)",
    scale: 0.98
  },
  visible: { 
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      opacity: { duration: 0.35, ease: [0.2, 0, 0.2, 1] },
      filter: { duration: 0.4, ease: [0.2, 0, 0.2, 1] },
      scale: { duration: 0.35, ease: [0.2, 0, 0.2, 1] }
    }
  },
  exit: { 
    opacity: 0,
    filter: "blur(12px)",
    scale: 0.98,
    transition: {
      opacity: { duration: 0.25, ease: [0.2, 0, 0.2, 1] },
      filter: { duration: 0.3, ease: [0.2, 0, 0.2, 1] },
      scale: { duration: 0.25, ease: [0.2, 0, 0.2, 1] }
    }
  }
};

// Function to generate access code
function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const Login: React.FC = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [formId, setFormId] = useState(`${isSignUp ? 'signup' : 'signin'}-${Date.now()}`);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  // For signup flow
  const [signupStep, setSignupStep] = useState<'intro' | 'demo' | 'form'>('intro');
  const [demoClubId, setDemoClubId] = useState<string | null>(null);
  const [demoQrUrl, setDemoQrUrl] = useState<string | null>(null);
  const [demoJoined, setDemoJoined] = useState(false);
  const [demoInterval, setDemoInterval] = useState<number | null>(null);
  const [joinNotification, setJoinNotification] = useState(false);
  const [joinData, setJoinData] = useState<{name: string; timeAgo: string} | null>(null);
  const demoJoinTriggered = useRef(false);
  
  const navigate = useNavigate();

  // Page load animation
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Demo cleanup on unmount
  useEffect(() => {
    return () => {
      if (demoClubId) {
        cleanupDemoClub(demoClubId);
      }
      
      if (demoInterval) {
        clearInterval(demoInterval);
      }
    };
  }, [demoClubId, demoInterval]);

  // Create a temporary demo club
  const createDemoClub = async () => {
    try {
      setLocalLoading(true);
      console.log('[DEMO] Starting demo club creation');
      demoJoinTriggered.current = false;
      
      const access_code = generateAccessCode();
      console.log('[DEMO] Generated access_code:', access_code);
      
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert([
          { 
            name: `Demo Club ${Math.floor(Math.random() * 10000)}`,
            description: 'A temporary club for demonstration purposes',
            created_at: new Date().toISOString(),
            access_code,
            category: 'Demo'
          }
        ])
        .select()
        .single();
        
      console.log('[DEMO] Club insert response:', { club, clubError });
      
      if (clubError || !club) {
        console.error('[DEMO] Error creating demo club:', clubError);
        if (clubError && clubError.details) {
          console.error('[DEMO] Supabase error details:', clubError.details);
        }
        setError('Could not create demo. Please try again.');
        setLocalLoading(false);
        return null;
      }
      
      // Set club settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('club_settings')
        .insert([{ club_id: club.id, preapproved_only: false }]);
        
      console.log('[DEMO] club_settings insert response:', { settingsData, settingsError });
      
      // Store the club ID for cleanup
      setDemoClubId(club.id);
      
      // Generate QR code URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://attendify.app/join/${club.access_code}`)}`;
      setDemoQrUrl(qrUrl);
      console.log('[DEMO] QR code URL:', qrUrl);
      
      // Start checking for joins
      startCheckingForJoins(club.id);
      setLocalLoading(false);
      return club.id;
    } catch (err) {
      console.error('Error in demo creation:', err);
      setError('Something went wrong. Please try again.');
      setLocalLoading(false);
      return null;
    }
  };

  // Poll for club joins
  const startCheckingForJoins = (clubId: string) => {
    if (demoInterval) {
      clearInterval(demoInterval);
    }
    
    const intervalId = window.setInterval(async () => {
      if (demoJoinTriggered.current) {
        return;
      }
      
      console.log(`[DEMO Polling] Checking club ${clubId} for members...`);
      
      const { data, error: memberError } = await supabase
        .from('members')
        .select('id, name, member_uuid, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      console.log('[DEMO Polling] Query result:', { data_length: data?.length, data, memberError });
      
      if (memberError) {
        console.error('[DEMO Polling] Error fetching members:', memberError);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('[DEMO Polling] Member detected via data.length!');
        if (demoJoinTriggered.current) return;
        demoJoinTriggered.current = true;
        
        setDemoJoined(true);
        clearInterval(intervalId);
        setDemoInterval(null);
        
        if (data && data.length > 0) {
          const joinedMember = data[0];
          const newJoinData = {
            name: joinedMember.name || 'Someone',
            timeAgo: 'just now'
          };
          setJoinData(newJoinData);
          setJoinNotification(true);
        }
      }
    }, 3000);
    
    setDemoInterval(intervalId);
  };

  // Clean up demo club
  const cleanupDemoClub = async (clubId: string) => {
    if (!clubId) return;
    
    try {
      await supabase.from('clubs').delete().eq('id', clubId);
      setDemoClubId(null);
    } catch (err) {
      console.error('Error cleaning up demo club:', err);
    }
  };

  // Clean up *previous* demo clubs and members
  const cleanupPreviousDemos = async () => {
    console.log('[DEMO Cleanup] Starting cleanup of previous demos...');
    try {
      // Find all clubs marked as Demo
      const { data: demoClubs, error: findError } = await supabase
        .from('clubs')
        .select('id')
        .eq('category', 'Demo');

      if (findError) {
        console.error('[DEMO Cleanup] Error finding demo clubs:', findError);
        return; // Don't proceed if we can't find clubs
      }

      if (!demoClubs || demoClubs.length === 0) {
        console.log('[DEMO Cleanup] No previous demo clubs found to clean up.');
        return;
      }

      const demoClubIds = demoClubs.map(club => club.id);
      console.log(`[DEMO Cleanup] Found ${demoClubIds.length} demo clubs to potentially clean up:`, demoClubIds);

      // Delete members associated with these demo clubs
      const { error: memberDeleteError } = await supabase
        .from('members')
        .delete()
        .in('club_id', demoClubIds);

      if (memberDeleteError) {
        console.error('[DEMO Cleanup] Error deleting demo members:', memberDeleteError);
        // Continue to try deleting clubs anyway, some might not have members
      } else {
        console.log(`[DEMO Cleanup] Successfully deleted members for demo clubs: ${demoClubIds.join(', ')}`);
      }

      // Delete the demo clubs
      const { error: clubDeleteError } = await supabase
        .from('clubs')
        .delete()
        .in('id', demoClubIds);

      if (clubDeleteError) {
        console.error('[DEMO Cleanup] Error deleting demo clubs:', clubDeleteError);
      } else {
        console.log(`[DEMO Cleanup] Successfully deleted demo clubs: ${demoClubIds.join(', ')}`);
      }

      console.log('[DEMO Cleanup] Finished cleanup.');

    } catch (err) {
      console.error('Error during demo cleanup process:', err);
    }
  };

  // Start the demo
  const startDemo = async () => {
    setLocalLoading(true);
    // Clean up any existing demo data first
    await cleanupPreviousDemos();
    
    setSignupStep('demo');
    await createDemoClub();
    setLocalLoading(false);
  };

  // Check if email exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      setIsCheckingEmail(true);
      const { error } = await signIn(email, "check-only-placeholder");
      
      setIsCheckingEmail(false);
      
      if (error && error.message && 
         (error.message.toLowerCase().includes("invalid login credentials") || 
          error.message.toLowerCase().includes("user not found"))) {
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking email:", err);
      setIsCheckingEmail(false);
      return false;
    }
  };

  // Toggle between sign-in and sign-up
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setFormId(`${!isSignUp ? 'signup' : 'signin'}-${Date.now()}`);
  };

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !isSignUp) {
      navigate('/clubs');
    }
  }, [user, navigate, isSignUp]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    
    if (isSignUp) {
      const emailExists = await checkEmailExists(email);
      
      if (emailExists) {
        // Try to sign in with the provided password
        const { error: signInError } = await signIn(email, password);
        if (!signInError) {
          setLocalLoading(false);
          navigate('/clubs');
          return;
        } else {
          setError("An account with this email already exists, but the password is incorrect.");
          setLocalLoading(false);
          return;
        }
      }
      
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
        setLocalLoading(false);
        return;
      }
      setSuccess('Sign up successful! Please check your email and verify your account before logging in.');
      setLocalLoading(false);
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        setLocalLoading(false);
        return;
      }
      setLocalLoading(false);
      navigate('/clubs');
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col md:flex-row bg-gray-50"
      variants={pageVariants}
      initial="initial"
      animate={pageLoaded ? "animate" : "initial"}
    >
      {/* Left side - branding and info */}
      <div className="md:w-1/2 bg-gradient-to-br from-black to-gray-900 p-8 md:p-16 flex flex-col justify-between">
        <motion.div 
          className="text-white mb-10 md:mb-0"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex items-center" variants={staggerItemVariants}>
            {/* Use Logo component correctly for both icon and text */}
            <Logo showText={true} size={32} darkMode={true} />
          </motion.div>
          
          <motion.div className="mt-16 md:mt-20 md:max-w-md">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold mb-6 text-white"
              variants={staggerItemVariants}
            >
              The modern way to manage attendance
            </motion.h1>
            
            <motion.p 
              className="text-gray-300 text-lg mb-8"
              variants={staggerItemVariants}
            >
              Create clubs, share QR codes, and track attendance effortlessly.
            </motion.p>
            
            {/* Features */}
            <div className="space-y-8 mt-12">
              <motion.div className="flex items-start" variants={staggerItemVariants}>
                <div className="bg-white bg-opacity-10 p-2.5 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Simple club creation</h3>
                  <p className="text-gray-300 text-sm mt-1">Set up your club in seconds</p>
                </div>
              </motion.div>
              
              <motion.div className="flex items-start" variants={staggerItemVariants}>
                <div className="bg-white bg-opacity-10 p-2.5 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">QR code sharing</h3>
                  <p className="text-gray-300 text-sm mt-1">Members join with a quick scan</p>
                </div>
              </motion.div>
              
              <motion.div className="flex items-start" variants={staggerItemVariants}>
                <div className="bg-white bg-opacity-10 p-2.5 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Track attendance</h3>
                  <p className="text-gray-300 text-sm mt-1">For meetings, events and more</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.p 
          className="text-gray-400 text-sm"
          variants={staggerItemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1 }}
        >
          Are you a club member? <a href="/join" className="text-white underline hover:no-underline">Join a club here</a>
        </motion.p>
      </div>
      
      {/* Right side - authentication */}
      <div className="md:w-1/2 p-6 md:p-12 flex items-center justify-center bg-white">
        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success-message"
                variants={containerBlurFadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="bg-white p-0">
                  <div className="mb-8 text-center">
                    <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 inline-flex mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-semibold mb-3">Verification needed</h3>
                    <p className="text-gray-600">
                      Check your email for a verification link. After verifying, return here to sign in.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsSignUp(false);
                      setEmail("");
                      setPassword("");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
                  >
                    Return to sign in
                  </button>
                </div>
              </motion.div>
            ) : isSignUp ? (
              <AnimatePresence mode="wait">
                {signupStep === 'intro' && (
                  <motion.div
                    key="signup-intro"
                    variants={containerBlurFadeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white p-8 rounded-xl border border-gray-100"
                  >
                    <h2 className="text-2xl font-bold text-black mb-6">
                      Ready to get started?
                    </h2>
                    
                    <div className="space-y-6 mb-8">
                      <button
                        onClick={startDemo}
                        className="w-full py-3.5 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-medium flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Try a quick demo first
                      </button>
                      
                      <button
                        onClick={() => setSignupStep('form')}
                        className="w-full py-3.5 px-4 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium"
                      >
                        Skip to sign up
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-6 text-center">
                      <p className="text-gray-500 mb-2">Already have an account?</p>
                      <button
                        onClick={toggleSignUp}
                        className="text-black hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {signupStep === 'demo' && (
                  <motion.div
                    key="signup-demo"
                    variants={containerBlurFadeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white p-0"
                  >
                    <AnimatePresence mode="wait">
                      {!joinNotification ? (
                        <motion.div
                          key="scan"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, filter: 'blur(5px)' }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-2xl font-semibold text-black mb-2">
                            Scan this QR code
                          </h2>
                          <p className="text-gray-500 mb-6">
                            Use your phone camera to join a demo club
                          </p>
                          
                          <div className="flex justify-center mb-8"> 
                            {demoQrUrl ? (
                              <motion.div
                                initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.98 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                                transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}                                className="relative"
                              >
                                <div className="bg-white border-2 border-gray-200 rounded-lg p-3 transition-opacity">
                                  <img 
                                    src={demoQrUrl} 
                                    alt="QR Code" 
                                    className="w-48 h-48" 
                                  />
                                </div>
                              </motion.div>
                            ) : (
                              <div className="animate-pulse bg-gray-200 w-48 h-48 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400">Loading...</span>
                              </div>
                            )}
                          </div>
                          
                          {demoQrUrl && demoClubId && process.env.NODE_ENV === 'development' && (
                            <button
                              type="button"
                              className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg mb-6 text-sm hover:bg-gray-200 transition-all"
                              onClick={() => {
                                const match = demoQrUrl.match(/join%2F([A-Z0-9]+)/);
                                const code = match ? match[1] : '';
                                if (code) {
                                  window.open(`/join/${code}?debug=1&autojoin=1`, '_blank');
                                }
                              }}
                            >
                              Dev: Join from link
                            </button>
                          )}
                          
                          <button
                            onClick={() => setSignupStep('form')}
                            className="w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
                          >
                            Skip to sign up
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="joined"
                          variants={fadeInBlurVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="relative text-center"
                        >
                          {/* Success animation container */}
                          <div className="mb-8">
                            <motion.div 
                              className="relative mx-auto w-64 h-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            >
                              {/* User joined animation */}
                              <motion.div
                                className="absolute inset-0 flex flex-col items-center justify-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                              >
                                {/* Profile circle with initial */}
                                <motion.div 
                                  className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-2xl font-medium mb-3"
                                  initial={{ scale: 0, rotate: -20 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                                >
                                  {joinData?.name?.[0]?.toUpperCase() || 'A'}
                                </motion.div>
                                
                                {/* Name */}
                                <motion.div
                                  className="text-lg font-medium text-black"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.5, duration: 0.3 }}
                                >
                                  {joinData?.name || 'Anonymous'}
                                </motion.div>
                                
                                {/* Join status */}
                                <motion.div
                                  className="flex items-center mt-2 text-green-600 font-medium"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.6, duration: 0.3 }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Joined Successfully
                                </motion.div>
                              </motion.div>
                              
                              {/* Improved pulsing glow effect */}
                              <motion.div
                                className="absolute inset-0 rounded-lg shadow-[0_0_0_4px_rgba(34,197,94,0.4)]"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: [0, 0.6, 0] }}
                                transition={{
                                  duration: 2.5,
                                  ease: "easeInOut",
                                  repeat: Infinity,
                                  repeatDelay: 0.5,
                                  times: [0, 0.5, 1]
                                }}
                              />
                              <motion.div
                                className="absolute inset-0 rounded-lg shadow-[0_0_0_6px_rgba(34,197,94,0.2)]"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1.3, opacity: [0, 0.4, 0] }}
                                transition={{
                                  duration: 2.5,
                                  ease: "easeInOut",
                                  repeat: Infinity,
                                  repeatDelay: 0.5,
                                  delay: 0.3,
                                  times: [0, 0.5, 1]
                                }}
                              />
                            </motion.div>
                          </div>

                          <h2 className="text-2xl font-semibold text-black mb-3">
                            It took 0.3 seconds to join.
                          </h2>
                          
                          <p className="text-gray-600 mb-8">
                            You just saw how quickly someone can join your club.
                          </p>

                          <div className="space-y-4">
                            <motion.button
                              onClick={() => {
                                setSignupStep('form');
                                setJoinNotification(false);
                              }}
                              className="w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Continue to sign up
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                setJoinNotification(false);
                                setDemoJoined(false);
                                demoJoinTriggered.current = false;
                                if (demoClubId) {
                                  startCheckingForJoins(demoClubId);
                                }
                              }}
                              className="w-full py-3 px-4 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Reset demo
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                
                {signupStep === 'form' && (
                  <motion.div
                    key={formId}
                    variants={containerBlurFadeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white border-0 p-0"
                  >
                    <h2 className="text-2xl font-semibold text-black mb-8">
                      Create an account
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onBlur={() => { if (email) setShowPasswordInput(true); }}
                          required
                          className="w-full px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                          disabled={localLoading || loading}
                        />
                      </div>
                      
                      {showPasswordInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                            <input
                              type="password"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              required
                              className="w-full px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                              disabled={localLoading || loading}
                            />
                            <p className="text-xs text-gray-500 mt-2">Password must be at least 8 characters</p>
                          </div>
                        </motion.div>
                      )}
                      
                      {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={localLoading || loading || !password || isCheckingEmail}
                        className="w-full py-3.5 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                      >
                        {localLoading || loading || isCheckingEmail ? (
                          <>
                            <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isCheckingEmail ? 'Checking email...' : 'Creating account...'}
                          </>
                        ) : (
                          'Create account'
                        )}
                      </button>
                    </form>
                    
                    <div className="mt-8 pt-6 text-center border-t border-gray-100">
                      <p className="text-gray-600 mb-3">{isSignUp ? 'Already have an account?' : "Don't have an account?"}</p>
                      <button
                        onClick={toggleSignUp}
                        className="text-black font-medium hover:text-gray-600 transition-colors"
                      >
                        {isSignUp ? 'Sign in' : 'Create account'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <motion.div
                key={formId}
                variants={containerBlurFadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white border-0 p-0"
              >
                <h2 className="text-2xl font-semibold text-black mb-8">
                  Sign in
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => { if (email) setShowPasswordInput(true); }}
                      required
                      className="w-full px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                      disabled={localLoading || loading}
                    />
                  </div>
                  
                  {showPasswordInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          className="w-full px-4 py-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                          disabled={localLoading || loading}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={localLoading || loading || !password}
                    className="w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {localLoading || loading ? (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </>
                    ) : (
                      isSignUp ? 'Create account' : 'Sign in'
                    )}
                  </button>
                </form>
                
                <div className="mt-8 pt-6 text-center border-t border-gray-100">
                  <p className="text-gray-600 mb-3">{isSignUp ? 'Already have an account?' : "Don't have an account?"}</p>
                  <button
                    onClick={toggleSignUp}
                    className="text-black font-medium hover:text-gray-600 transition-colors"
                  >
                    {isSignUp ? 'Sign in' : 'Create account'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="text-center mt-6">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;