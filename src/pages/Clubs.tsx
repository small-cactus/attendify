import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CreateClubModal from '../components/CreateClubModal';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  access_code: string;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.25
    }
  }
};

function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const Clubs: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchClubs = async () => {
      if (!user) return;
      setFetching(true);
      setError(null);
      const { data: ownerRows, error: ownerError } = await supabase
        .from('club_owners')
        .select('club_id')
        .eq('user_id', user.id);
      if (ownerError) {
        setError('Failed to fetch clubs.');
        setClubs([]);
        setFetching(false);
        return;
      }
      const clubIds = (ownerRows || []).map((row: any) => row.club_id).filter(Boolean);
      if (!clubIds.length) {
        setClubs([]);
        setError(null);
        setFetching(false);
        return;
      }
      const validClubIds = clubIds.filter(id => typeof id === 'string' && id.length > 0);
      console.log('Fetching clubs with IDs:', validClubIds);
      if (!validClubIds.length) {
        setClubs([]);
        setError(null);
        setFetching(false);
        return;
      }
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, description, category, access_code, created_at')
        .in('id', validClubIds);
      if (clubsError) {
        setError('Failed to fetch clubs.');
        setClubs([]);
      } else {
        setClubs(clubsData || []);
        setError(null);
      }
      setFetching(false);
    };
    fetchClubs();
  }, [user]);

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (club.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClub = async (clubData: { name: string; description: string; category: string }) => {
    if (!user) return;
    setError(null);
    const access_code = generateAccessCode();
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert([{
        name: clubData.name,
        access_code,
        description: clubData.description || '',
        category: clubData.category || '',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (clubError || !club) {
      console.error('Club creation error:', clubError);
      if (typeof window !== 'undefined') {
        alert('Club creation error: ' + (clubError?.message || 'Unknown error'));
      }
      setError('Failed to create club.');
      return;
    }
    await supabase
      .from('club_settings')
      .insert([{ club_id: club.id, preapproved_only: false }]);
    const { error: ownerError } = await supabase
      .from('club_owners')
      .insert([{ club_id: club.id, user_id: user.id }]);
    if (ownerError) {
      setError('Failed to assign club owner.');
      return;
    }
    setShowCreateModal(false);
    setFetching(true);
    const { data: ownerRows } = await supabase
      .from('club_owners')
      .select('club_id')
      .eq('user_id', user.id);
    const clubIds = (ownerRows || []).map((row: any) => row.club_id).filter(Boolean);
    const validClubIds = clubIds.filter(id => typeof id === 'string' && id.length > 0);
    if (!validClubIds.length) {
      setClubs([]);
      setError(null);
      setFetching(false);
      return;
    }
    const { data: clubsData } = await supabase
      .from('clubs')
      .select('id, name, description, category, access_code, created_at')
      .in('id', validClubIds);
    setClubs(clubsData || []);
    setFetching(false);
  };

  return (
    <Layout>
      <motion.div 
        className="min-h-screen py-10 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            className="text-left mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h1 className="text-3xl font-semibold text-black mb-2">My Clubs</h1>
            <p className="text-md text-gray-600">
              Manage your clubs, events, and members.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-md bg-white border border-gray-200 
                         focus:outline-none focus:border-black focus:ring-1 focus:ring-black
                         text-black placeholder-gray-400"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Create Club
            </motion.button>
          </motion.div>
          
          {error && <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          
          {fetching ? (
            <div className="text-center py-16 text-gray-500">Loading clubs...</div>
          ) : (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredClubs.length > 0 ? (
                filteredClubs.map(club => (
                  <motion.div
                    key={club.id}
                    className="bg-white border border-gray-200 rounded-md p-5 cursor-pointer hover:border-black transition-all group"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-black group-hover:text-black/80 transition-colors">
                        {club.name}
                      </h3>
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {club.access_code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden">
                      {club.description || 'No description provided'}
                    </p>
                    <div className="text-xs text-gray-400">
                      {club.category}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="md:col-span-2 lg:col-span-3"
                  variants={itemVariants}
                >
                  <div className="border border-gray-200 rounded-md text-center py-16 px-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-lg text-black mb-2">
                        {searchQuery ? 'No clubs found' : 'No clubs yet'}
                      </p>
                      <p className="text-sm text-gray-500 mb-6">
                        {searchQuery
                          ? "No clubs matched your search. Try different keywords."
                          : "Get started by creating your first club."
                        }
                      </p>
                      <motion.button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        + Create Club
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      <CreateClubModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClub}
      />
    </Layout>
  );
};

export default Clubs; 