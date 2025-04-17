import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Logo from '../components/Logo';

interface ClubInfo {
  name: string;
  description?: string;
}

const ClubJoinPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const fetchClubInfo = async () => {
      if (!clubId) {
        setError('Invalid club link.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('clubs')
        .select('name, description')
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

  const handleJoinClub = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!clubId || !memberName.trim()) {
       setJoinError('Please enter your name.');
       return;
     }
     setJoinLoading(true);
     setJoinError(null);
     setJoinSuccess(false);

     // TODO: Implement join logic (check if preapproved or add to members table)
     // For now, simulate success
     await new Promise(resolve => setTimeout(resolve, 1000)); 
     console.log(`Attempting to join club ${clubId} as ${memberName}`);
     
     // Placeholder: Replace with actual Supabase call
     // const { data, error } = await supabase.rpc('join_club_or_check_preapproval', { p_club_id: clubId, p_member_name: memberName });
     
     // if (error) {
     //   setJoinError(`Failed to join: ${error.message}`);
     // } else if (data === 'joined') {
     //   setJoinSuccess(true);
     // } else if (data === 'pending') {
     //    setJoinError('Your request to join is pending approval.'); // Or show a different success state
     // } else {
     //   setJoinError('An unknown error occurred.');
     // }
     setJoinSuccess(true); // Temporary success for demo

     setJoinLoading(false);
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
        {loading ? (
          <p className="text-gray-500">Loading Club Information...</p>
        ) : error ? (
          <div>
             <p className="text-red-600 mb-4">{error}</p>
             <button onClick={() => navigate('/')} className="text-sm text-black border-b border-gray-300 hover:border-black">
                Back to Home
             </button>
          </div>
        ) : clubInfo ? (
          joinSuccess ? (
            <div>
              <h2 className="text-2xl font-semibold text-green-600 mb-3">Successfully Joined!</h2>
              <p className="text-gray-700 mb-5">You have successfully joined <span className="font-medium">{clubInfo.name}</span>.</p>
              <button 
                onClick={() => navigate('/')} // Redirect to a member dashboard later?
                className="px-5 py-2 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-black mb-2">
                Join {clubInfo.name}
              </h1>
              {clubInfo.description && (
                <p className="text-gray-600 mb-6">{clubInfo.description}</p>
              )}
              <form onSubmit={handleJoinClub} className="space-y-4">
                <div>
                  <label htmlFor="memberName" className="block text-xs font-medium text-gray-600 mb-1 text-left">Your Name</label>
                  <input
                    id="memberName"
                    type="text"
                    placeholder="Enter your full name"
                    value={memberName}
                    onChange={e => setMemberName(e.target.value)}
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
                  {joinLoading ? 'Joining...' : 'Request to Join'}
                </button>
              </form>
               <p className="text-xs text-gray-400 mt-4">
                  By joining, you agree to share your name with the club organizers.
               </p>
            </>
          )
        ) : (
           <p className="text-gray-500">Could not load club information.</p>
        )}
      </div>
    </div>
  );
};

export default ClubJoinPage; 