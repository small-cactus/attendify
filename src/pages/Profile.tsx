import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { motion } from 'framer-motion';
import Layout from '../components/Layout'; // Import Layout

const Profile: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('name, email, role')
          .eq('id', user.id)
          .single();
        if (profileError || !data) {
          console.error("Profile fetch error:", profileError);
          setProfile(null); // Ensure profile is null if fetch fails
        } else {
          setProfile(data);
          setNameInput(data?.name || '');
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameSuccess(false); // Reset success message
    setError(null);
    const role = profile?.role || 'owner';
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, name: nameInput, role }, { onConflict: 'id' })
      .eq('id', user.id);
      
    if (upsertError) {
      console.error("Save name error:", upsertError);
      setError('Failed to save name. Please try again.');
      setSavingName(false);
      return;
    }
    setNameSuccess(true);
    setProfile((prev: any) => ({ ...prev, name: nameInput, role }));
    setSavingName(false);
    setTimeout(() => setNameSuccess(false), 3000); // Hide success message after 3s
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to welcome page
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible and will delete all associated clubs and data.')) return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      // Call a Supabase function to handle cascading deletes (safer)
      const { error: functionError } = await supabase.rpc('delete_user_account');
      
      if (functionError) {
        throw functionError;
      }
      
      // If function runs successfully, sign out and redirect
      await signOut();
      navigate('/'); // Redirect to welcome after successful deletion
      
    } catch (err: any) {
      console.error("Delete account error:", err);
      setDeleteError(`Failed to delete account: ${err.message || 'Please try again.'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <span className="text-gray-500">Loading Settings...</span>
        </div>
      </Layout>
    );
  }
  
  if (!user) return null; // Should be redirected by effect

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-semibold text-black mb-6">Settings</h1>

          {/* Profile Information Section */}
          <div className="mb-8 p-6 border border-gray-200 rounded-md bg-white">
            <h2 className="text-lg font-medium text-black mb-4">Profile Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-black">{profile?.email || user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="text-black capitalize">{profile?.role || 'Owner'}</span>
              </div>
            </div>
          </div>

          {/* Update Name Section */}
          <div className="mb-8 p-6 border border-gray-200 rounded-md bg-white">
            <h2 className="text-lg font-medium text-black mb-4">Display Name</h2>
            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                  placeholder="Your full name"
                  disabled={savingName}
                />
              </div>
              {nameSuccess && <div className="text-green-600 text-xs">Name saved successfully!</div>}
              {error && <div className="text-red-600 text-xs">{error}</div>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingName || nameInput === (profile?.name || '')}
                  className="px-4 py-2 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingName ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Actions Section */}
          <div className="p-6 border border-red-200 rounded-md bg-red-50">
            <h2 className="text-lg font-medium text-red-800 mb-3">Account Actions</h2>
             <button
              onClick={handleSignOut}
              className="w-full mb-3 px-4 py-2 text-sm bg-white text-black border border-gray-300 font-medium rounded-md hover:bg-gray-50 transition-all"
            >
              Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-4 py-2 text-sm bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={deleting}
            >
              {deleting ? 'Deleting Account...' : 'Delete Account Permanently'}
            </button>
            {deleteError && <div className="text-red-700 text-xs mt-2">{deleteError}</div>}
            <p className="text-xs text-red-600 mt-3">
              Warning: Deleting your account is irreversible and will remove all associated clubs and data.
            </p>
          </div>
          
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile; 