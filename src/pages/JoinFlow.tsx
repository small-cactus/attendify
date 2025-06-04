import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { getCloseMatches } from '../utils/nameMatcher';

const JoinFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [clubDetails, setClubDetails] = useState<any>(null);
  const [preapprovedMembers, setPreapprovedMembers] = useState<string[]>([]);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for existing member ID in localStorage
  useEffect(() => {
    const memberId = localStorage.getItem('attendify_member_id');
    if (memberId) {
      // Could fetch member details here if needed
    }
  }, []);

  const verifyInviteCode = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Find club by invite code
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('access_code', inviteCode)
        .single();
      
      if (clubError || !club) {
        setError('Invalid invite code. Please try again.');
        setLoading(false);
        return;
      }

      // Get all members so we can suggest names and identify preapproved ones
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('name, preapproved')
        .eq('club_id', club.id);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else if (members) {
        setPreapprovedMembers(members.filter(m => m.preapproved).map(m => m.name));
        setMemberNames(members.map(m => m.name));
      }

      setClubDetails(club);
      setLoading(false);
      setStep(2);
    } catch (error) {
      console.error('Error verifying invite code:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputName = e.target.value;
    setName(inputName);

    if (inputName.trim() !== '') {
      setAutocompleteSuggestions(getCloseMatches(inputName, memberNames));
    } else {
      setAutocompleteSuggestions([]);
    }
  };

  const selectAutocompleteSuggestion = (suggestion: string) => {
    setName(suggestion);
    setAutocompleteSuggestions([]);
  };

  const completeJoinProcess = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Check if member with this name already exists in club
      const { data: existingMember } = await supabase
        .from('members')
        .select('id, member_uuid')
        .eq('club_id', clubDetails.id)
        .eq('name', name)
        .single();

      let memberUuid;
      
      if (existingMember) {
        // Use existing member UUID if present
        memberUuid = existingMember.member_uuid || uuidv4();
      } else {
        // Generate new UUID for the member
        memberUuid = uuidv4();
        
        // Determine if member is preapproved
        const isPreapproved = preapprovedMembers.includes(name);
        
        // Add member to database
        const { error: insertError } = await supabase
          .from('members')
          .insert([{ 
            club_id: clubDetails.id, 
            name, 
            member_uuid: memberUuid,
            preapproved: isPreapproved
          }]);
          
        if (insertError) {
          setError('Failed to join club. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Store member UUID in localStorage
      localStorage.setItem('attendify_member_id', memberUuid);
      
      // Record club membership in localStorage
      const storedClubs = JSON.parse(localStorage.getItem('attendify_clubs') || '[]');
      storedClubs.push({
        id: clubDetails.id,
        name: clubDetails.name,
        member_name: name
      });
      localStorage.setItem('attendify_clubs', JSON.stringify(storedClubs));
      
      setLoading(false);
      setStep(3);
    } catch (error) {
      console.error('Error joining club:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-md p-8"
            >
              <h2 className="text-2xl font-semibold mb-1 text-black">
                Join a club
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Enter the invite code provided by your club owner
              </p>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code"
                  className="w-full px-4 py-3 text-base tracking-wider text-black border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-md bg-gray-50 border border-gray-200 text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <button
                onClick={verifyInviteCode}
                disabled={!inviteCode.trim() || loading}
                className="w-full py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
              
              <div className="mt-6 flex justify-center">
                <a href="/" className="text-sm text-black border-b border-gray-200 hover:border-black transition-all">
                  Back to home
                </a>
              </div>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-md p-8"
            >
              <h2 className="text-2xl font-semibold mb-1 text-black">
                {clubDetails?.name}
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Enter your name to join this club
              </p>
              
              <div className="mb-6 relative">
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Your name"
                  className="w-full px-4 py-3 text-base text-black border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                  disabled={loading}
                />
                
                {/* Autocomplete suggestions */}
                {autocompleteSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md max-h-60 overflow-auto">
                    {autocompleteSuggestions.map((suggestion, index) => (
                      <li 
                        key={index}
                        onClick={() => selectAutocompleteSuggestion(suggestion)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-black"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-md bg-gray-50 border border-gray-200 text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-black font-medium rounded-md hover:bg-gray-200 transition-all border border-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={completeJoinProcess}
                  disabled={!name.trim() || loading}
                  className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Club'}
                </button>
              </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-md p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold mb-1 text-black">
                Joined
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                You have successfully joined {clubDetails?.name}
              </p>
              
              <p className="text-gray-500 mb-6 text-xs px-4">
                Your unique member ID has been saved to this device for easy check-in to events.
              </p>
              
              <div className="flex flex-col space-y-3">
                <a 
                  href="/attend" 
                  className="py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all"
                >
                  Attend an Event
                </a>
                <a 
                  href="/" 
                  className="py-3 px-4 bg-gray-100 text-black font-medium rounded-md hover:bg-gray-200 transition-all border border-gray-200"
                >
                  Back to Home
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JoinFlow; 