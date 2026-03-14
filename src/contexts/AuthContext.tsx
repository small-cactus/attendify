import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase, supabaseAuthStorageKey } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [signedOut, setSignedOut] = useState(false);
  
  // Memoize the user object to prevent unnecessary re-renders when the user data is identical
  const stableUser = useMemo(() => {
    return user;
  }, [user?.id, user?.email, user?.created_at]); // Only change when key properties change

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (signedOut) {
      navigate('/login');
      setSignedOut(false);
    }
  }, [signedOut, navigate]);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (data.user) {
      // Insert into profiles table if not exists
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        role: 'owner', // default to owner, can be changed later
        created_at: new Date().toISOString(),
      });
    }
    setLoading(false);
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    
    // Sign out from Supabase with explicit session cleanup
    await supabase.auth.signOut({ scope: 'global' });
    
    // Clear student view data from localStorage when owner signs out
    localStorage.removeItem('attendify_clubs');
    localStorage.removeItem('attendify_member_id'); 
    localStorage.removeItem('owner_confirmed');
    
    // Force clear any remaining Supabase session data
    localStorage.removeItem(supabaseAuthStorageKey);
    sessionStorage.removeItem(supabaseAuthStorageKey);
    
    // Explicitly set user to null to ensure clean state
    setUser(null);
    setSignedOut(true);
    setLoading(false);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: stableUser,
    loading,
    signUp,
    signIn,
    signOut
  }), [stableUser, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
