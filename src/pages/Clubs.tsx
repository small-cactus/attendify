import React, { useState, useEffect, useRef, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CreateClubModal from '../components/CreateClubModal';
import DebugPanel, { debugLog } from '../components/DebugPanel';
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

function generateAccessCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const Clubs: React.FC = () => {
  const authData = useAuth();
  const { user, loading } = authData;
  const navigate = useNavigate();
  
  // Track auth context changes
  const authCallCount = useRef(0);
  authCallCount.current++;
  debugLog(`useAuth hook called #${authCallCount.current} | user: ${user?.id || 'null'} | loading: ${loading}`, 'state');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const isInitialLoad = useRef(true);
  const renderCount = useRef(0);
  const isFetchingRef = useRef(false);
  
  // Track previous values to identify what caused the render
  const prevValues = useRef({
    userRef: null as typeof user, // Track object reference
    userId: null as string | null,
    loading: true,
    fetching: true,
    shouldAnimate: false,
    clubsLength: 0,
    searchQuery: '',
    showCreateModal: false,
    error: null as typeof error
  });

  // Log every render (but only when component actually re-renders)
  renderCount.current++;
  
  // Detect what caused this render
  const currentValues = {
    userRef: user,
    userId: user?.id || null,
    loading,
    fetching,
    shouldAnimate,
    clubsLength: clubs.length,
    searchQuery,
    showCreateModal,
    error
  };
  
  const changedValues = [];
  if (prevValues.current.userId !== currentValues.userId) {
    changedValues.push(`userId: ${prevValues.current.userId} → ${currentValues.userId}`);
  }
  if (prevValues.current.userRef !== currentValues.userRef) {
    changedValues.push(`userRef: ${prevValues.current.userRef === currentValues.userRef ? 'same' : 'CHANGED'} (${currentValues.userId})`);
  }
  if (prevValues.current.loading !== currentValues.loading) {
    changedValues.push(`loading: ${prevValues.current.loading} → ${currentValues.loading}`);
  }
  if (prevValues.current.fetching !== currentValues.fetching) {
    changedValues.push(`fetching: ${prevValues.current.fetching} → ${currentValues.fetching}`);
  }
  if (prevValues.current.shouldAnimate !== currentValues.shouldAnimate) {
    changedValues.push(`shouldAnimate: ${prevValues.current.shouldAnimate} → ${currentValues.shouldAnimate}`);
  }
  if (prevValues.current.clubsLength !== currentValues.clubsLength) {
    changedValues.push(`clubs.length: ${prevValues.current.clubsLength} → ${currentValues.clubsLength}`);
  }
  if (prevValues.current.searchQuery !== currentValues.searchQuery) {
    changedValues.push(`searchQuery: "${prevValues.current.searchQuery}" → "${currentValues.searchQuery}"`);
  }
  if (prevValues.current.showCreateModal !== currentValues.showCreateModal) {
    changedValues.push(`showCreateModal: ${prevValues.current.showCreateModal} → ${currentValues.showCreateModal}`);
  }
  if (prevValues.current.error !== currentValues.error) {
    changedValues.push(`error: ${prevValues.current.error} → ${currentValues.error}`);
  }
  
  const renderCause = changedValues.length > 0 
    ? `Changed: ${changedValues.join(', ')}` 
    : (renderCount.current === 1 || renderCount.current === 2 ? 'Initial mount/Strict Mode' : 'Unknown cause - possible parent re-render or context change');
  
  // Use useEffect to log state changes only when they actually change
  useEffect(() => {
    debugLog(`Clubs component render #${renderCount.current} | ${renderCause}`, 'render');
    debugLog(`Current state: user=${user?.id || 'null'} | loading=${loading} | fetching=${fetching} | shouldAnimate=${shouldAnimate} | clubs=${clubs.length}`, 'state');
    
    // Update previous values for next render
    prevValues.current = currentValues;
  });
  
  // Track shouldAnimate changes specifically
  useEffect(() => {
    debugLog(`shouldAnimate changed to: ${shouldAnimate}`, 'state');
  }, [shouldAnimate]);
  

  useEffect(() => {
    debugLog(`useEffect triggered | user: ${user?.id || 'null'} | loading: ${loading} | navigate: ${typeof navigate}`, 'state');
    
    // Handle auth redirect first
    if (!loading && !user) {
      debugLog('Redirecting to login - no user', 'state');
      navigate('/login');
      return;
    }
    
    // Only fetch if we have a user and loading is complete
    if (!user || loading) {
      debugLog(`Skipping fetch - user: ${!!user}, loading: ${loading}`, 'state');
      return;
    }
    
    const fetchClubs = async () => {
      if (isFetchingRef.current) {
        debugLog('fetchClubs already in progress, skipping', 'state');
        return;
      }
      debugLog('Starting fetchClubs', 'state');
      isFetchingRef.current = true;
      
      // Batch state updates to reduce renders
      startTransition(() => {
        setFetching(true);
        setError(null);
        setShouldAnimate(false);
      });
      debugLog('Set fetching=true, shouldAnimate=false', 'state');
      const { data: ownerRows, error: ownerError } = await supabase
        .from('club_owners')
        .select('club_id')
        .eq('user_id', user.id);
      if (ownerError) {
        setError('Failed to fetch clubs.');
        setFetching(false);
        return;
      }
      const clubIds = (ownerRows || []).map((row: any) => row.club_id).filter(Boolean);
      if (!clubIds.length) {
        setError(null);
        setFetching(false);
        return;
      }
      const validClubIds = clubIds.filter(id => typeof id === 'string' && id.length > 0);
      console.log('Fetching clubs with IDs:', validClubIds);
      if (!validClubIds.length) {
        setError(null);
        setFetching(false);
        return;
      }
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, description, category, access_code, created_at')
        .in('id', validClubIds);
      if (clubsError) {
        debugLog('Clubs fetch error', 'error');
        startTransition(() => {
          setError('Failed to fetch clubs.');
          setFetching(false);
        });
      } else {
        debugLog(`Clubs data received: ${(clubsData || []).length} clubs`, 'state');
        
        // Batch the data and state updates
        startTransition(() => {
          setClubs(clubsData || []);
          setError(null);
          setFetching(false);
        });
        
        debugLog('About to trigger animation with requestAnimationFrame', 'animation');
        // Trigger animation after clubs data is set
        requestAnimationFrame(() => {
          debugLog('requestAnimationFrame callback executing - setting shouldAnimate=true', 'animation');
          startTransition(() => {
            setShouldAnimate(true);
          });
        });
      }
      debugLog('Setting fetching=false', 'state');
      isFetchingRef.current = false;
      isInitialLoad.current = false;
    };
    fetchClubs();
  }, [user, loading]); // Remove navigate dependency to prevent unnecessary re-runs


  const filteredClubs = useMemo(() => {
    return clubs.filter(club =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clubs, searchQuery]);
  
  // Log filtered clubs only when the filter result changes
  useEffect(() => {
    debugLog(`Filtered clubs: ${filteredClubs.length} clubs (search: "${searchQuery}")`, 'state');
  }, [filteredClubs.length, searchQuery]);

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
    isFetchingRef.current = true;
    setFetching(true);
    setShouldAnimate(false);
    const { data: ownerRows } = await supabase
      .from('club_owners')
      .select('club_id')
      .eq('user_id', user.id);
    const clubIds = (ownerRows || []).map((row: any) => row.club_id).filter(Boolean);
    const validClubIds = clubIds.filter(id => typeof id === 'string' && id.length > 0);
    if (!validClubIds.length) {
      setError(null);
      setFetching(false);
      isFetchingRef.current = false;
      return;
    }
    const { data: clubsData } = await supabase
      .from('clubs')
      .select('id, name, description, category, access_code, created_at')
      .in('id', validClubIds);
    setClubs(clubsData || []);
    setFetching(false);
    isFetchingRef.current = false;
    // Trigger animation for newly created clubs
    requestAnimationFrame(() => setShouldAnimate(true));
  };

  return (
    <>
      <DebugPanel isVisible={false} />
      <div className="fixed inset-0 bg-gray-50 -z-10"></div>
      <Layout>
        <motion.div 
          className="min-h-screen py-4 sm:py-8 md:py-12"
        >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div 
            className="mb-6 sm:mb-8 md:mb-10 px-1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Clubs</h1>
            <p className="text-base sm:text-lg text-gray-600">
              Manage and organize your communities
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl bg-gray-50 border border-transparent
                           focus:outline-none focus:bg-white focus:border-gray-200
                           text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl sm:hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Club
              </button>
            </div>
          </motion.div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-md bg-white border border-red-200 text-red-600 text-sm sm:text-base flex items-start gap-3"
            >
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
          
          {(fetching && isInitialLoad.current) ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 animate-pulse border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-6 sm:h-7 bg-gray-100 rounded-lg w-2/3 mb-2 sm:mb-3"></div>
                      <div className="h-3 sm:h-4 bg-gray-100 rounded w-full mb-1 sm:mb-2"></div>
                      <div className="h-3 sm:h-4 bg-gray-100 rounded w-4/5"></div>
                    </div>
                    <div className="ml-4 sm:ml-6">
                      <div className="h-8 w-20 sm:h-10 sm:w-24 bg-gray-100 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
                {filteredClubs.length > 0 ? (
                  filteredClubs.map((club, index) => (
                    <div
                      key={club.id}
                      className={`group bg-white rounded-2xl border border-gray-200 sm:hover:border-gray-300 cursor-pointer overflow-hidden transition-all duration-300 sm:hover:shadow-lg sm:hover:-translate-y-0.5 will-change-transform`}
                      style={{
                        opacity: shouldAnimate ? 1 : 0,
                        transition: `opacity 300ms ease-out ${shouldAnimate && isInitialLoad.current ? index * 80 : 0}ms`
                      }}
                      onTransitionEnd={() => debugLog(`Card ${index + 1} (${club.name}) CSS transition completed`, 'animation')}
                      onClick={() => navigate(`/clubs/${club.id}`)}
                    >
                      <div className="p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                              {club.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 sm:px-3 bg-gray-100 text-gray-700 text-xs font-medium rounded-full whitespace-nowrap">
                              {club.category}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
                            <span className="block sm:hidden max-h-10 overflow-hidden text-ellipsis">
                              {(club.description || 'No description available').length > 80 
                                ? `${(club.description || 'No description available').substring(0, 80)}...`
                                : (club.description || 'No description available')
                              }
                            </span>
                            <span className="hidden sm:block">
                              {club.description || 'No description available'}
                            </span>
                          </p>
                          
                          <div className="flex flex-row items-center justify-between text-sm text-gray-500">
                            <div className="flex flex-row items-center gap-2 sm:gap-4">
                              <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-900 text-white rounded-xl font-medium text-sm sm:hover:bg-black transition-all duration-200 flex items-center gap-2 sm:group-hover:translate-x-1">
                                Manage
                                <svg className="w-4 h-4 transition-transform duration-200 sm:group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              <span className="hidden sm:inline-flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                                </svg>
                                Created {new Date(club.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <button
                              className="font-mono bg-gray-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm inline-flex items-center gap-2 sm:hover:bg-gray-100 transition-colors group"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(club.access_code);
                                // Show a temporary success state
                                const button = e.currentTarget;
                                const originalContent = button.innerHTML;
                                button.innerHTML = '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-green-600">Copied!</span>';
                                setTimeout(() => {
                                  button.innerHTML = originalContent;
                                }, 2000);
                              }}
                            >
                              <span className="text-gray-900">Code: {club.access_code}</span>
                              <svg className="w-4 h-4 text-gray-400 sm:group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 text-center py-12 sm:py-16 px-6 sm:px-8">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                        <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        {searchQuery ? 'No clubs found' : 'No clubs yet'}
                      </h3>
                      <p className="text-base text-gray-600 mb-8 max-w-sm mx-auto">
                        {searchQuery
                          ? "Try adjusting your search or create a new club."
                          : "Create your first club to start organizing events and managing members."
                        }
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl sm:hover:bg-black transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Club
                      </button>
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
    </>
  );
};

export default Clubs;