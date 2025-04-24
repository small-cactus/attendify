import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !isSignUp) {
      navigate('/clubs');
    }
  }, [user, navigate, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    if (isSignUp) {
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
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-6">
          <Logo showText={true} size={45} />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-gray-200 rounded-md p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-black mb-1">
              {isSignUp ? 'Create account' : 'Sign in'}
            </h2>
            <p className="text-gray-600 text-sm">
              {isSignUp 
                ? 'For club owners to create and manage clubs' 
                : 'Access your clubs and manage attendance'}
            </p>
          </div>
          
          {success ? (
            <div className="border border-gray-200 rounded-md p-6 mb-6">
              <h3 className="text-lg font-medium mb-2 text-black">Verification needed</h3>
              <p className="text-gray-600 text-sm mb-4">
                Check your email for a verification link. After verifying, return here to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                  disabled={localLoading || loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                  disabled={localLoading || loading}
                />
              </div>
              {error && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={localLoading || loading}
                className="w-full py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          )}
          
          {!success && (
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-black border-b border-gray-200 hover:border-black text-sm transition-all"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Are you a club member? <a href="/join-flow" className="text-black border-b border-gray-200 hover:border-black transition-all">Join a club here</a>
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="mt-4 text-center"
        >
          <a href="/" className="text-sm text-gray-600 border-b border-transparent hover:border-gray-600 transition-all">
            Back to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 