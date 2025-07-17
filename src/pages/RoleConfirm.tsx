import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

const RoleConfirm: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleOwner = () => {
    localStorage.setItem('owner_confirmed', 'true');
    navigate('/clubs');
  };

  const handleStudent = async () => {
    if (!window.confirm('This will delete your club owner account. Your participation will remain. Continue?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      if (rpcError) throw rpcError;
      await signOut();
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4">Select your role</h1>
        <p className="mb-6 text-gray-700">
          It looks like you have a club owner account and are also in a club. Students should not have club owner accounts. If you continue as a student, your club owner account will be deleted but you will remain in your club.
        </p>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="space-y-4">
          <button
            onClick={handleOwner}
            className="w-full px-6 py-2 bg-black text-white rounded-md disabled:opacity-50"
            disabled={loading}
          >
            I'm a Club Owner
          </button>
          <button
            onClick={handleStudent}
            className="w-full px-6 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
            disabled={loading}
          >
            I'm a Student
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default RoleConfirm;
