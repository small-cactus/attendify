import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import Layout from '../components/Layout';

const JoinClub: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    // Find club by access code
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('access_code', accessCode)
      .single();
    if (clubError || !club) {
      setError('Invalid access code.');
      setLoading(false);
      return;
    }
    // Check if member already exists
    const { data: existing, error: memberError } = await supabase
      .from('members')
      .select('id, preapproved')
      .eq('club_id', club.id)
      .eq('name', name)
      .single();
    if (memberError && memberError.code !== 'PGRST116') {
      setError('Error checking member.');
      setLoading(false);
      return;
    }
    if (existing) {
      setSuccess(existing.preapproved
        ? 'You are already a preapproved member!'
        : 'You are already a member!');
      setLoading(false);
      return;
    }
    // Add member
    const { error: addError } = await supabase
      .from('members')
      .insert([{ club_id: club.id, name, preapproved: false }]);
    if (addError) {
      setError('Failed to join club.');
      setLoading(false);
      return;
    }
    setSuccess('Successfully joined the club!');
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#1d1d1f]">Join a Club</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club Access Code</label>
              <input
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              {loading ? 'Joining...' : 'Join Club'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default JoinClub; 