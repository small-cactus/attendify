import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { ShieldCheck, User as UserIcon } from 'lucide-react';

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
      <div className="max-w-md mx-auto p-6 text-center space-y-6">
        <h1 className="text-2xl font-semibold">Choose how you want to continue</h1>
        <p className="text-gray-700">
          You're signed in as a club owner and you've also joined a club as a student. Owners often create a student account to preview their club. Select the view you want below.
        </p>
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <button
            onClick={handleOwner}
            className="border border-gray-200 rounded-lg p-4 flex flex-col items-center hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            <ShieldCheck className="w-8 h-8 mb-2" />
            <span className="font-medium">I'm a Club Owner</span>
          </button>
          <button
            onClick={handleStudent}
            className="border border-gray-200 rounded-lg p-4 flex flex-col items-center hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            <UserIcon className="w-8 h-8 mb-2" />
            <span className="font-medium">I'm a Student</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Continuing as a student will delete your owner account but won't remove your club participation.
        </p>
      </div>
    </Layout>
  );
};

export default RoleConfirm;
