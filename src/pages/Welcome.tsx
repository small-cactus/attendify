import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-12"
      >
        <h1 className="mb-3 flex justify-center">
          <Logo 
            imageClassName="w-12 h-12 md:w-14 md:h-14"
            textClassName="text-4xl md:text-5xl"
          />
        </h1>
        <p className="text-md text-gray-600 max-w-md mx-auto">
          Simple attendance management
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-md p-6 flex flex-col h-full"
        >
          <div className="mb-4">
            <div className="mb-2 bg-gray-800 w-10 h-10 flex items-center justify-center rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-black">Club Owner</h2>
            <p className="text-gray-600 text-sm mt-1">Create and manage your clubs</p>
          </div>
          
          <ul className="space-y-3 mb-6 flex-grow">
            <li className="flex items-start">
              <span className="text-black text-sm">• Create unlimited clubs</span>
            </li>
            <li className="flex items-start">
              <span className="text-black text-sm">• Track attendance for events</span>
            </li>
            <li className="flex items-start">
              <span className="text-black text-sm">• Generate and manage invite codes</span>
            </li>
            <li className="flex items-start">
              <span className="text-black text-sm">• Preapprove members for quick access</span>
            </li>
          </ul>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all"
          >
            Sign In / Register
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-md p-6 flex flex-col h-full"
        >
          <div className="mb-4">
            <div className="mb-2 bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full">
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-black">Club Member</h2>
            <p className="text-gray-600 text-sm mt-1">Join clubs and attend events</p>
          </div>
          
          <ul className="space-y-3 mb-6 flex-grow">
            <li className="flex items-start">
              <span className="text-black text-sm">• Join clubs with invite codes</span>
            </li>
            <li className="flex items-start">
              <span className="text-black text-sm">• Check in to events easily</span>
            </li>
            <li className="flex items-start">
              <span className="text-black text-sm">• No account required</span>
            </li>
            <li className="flex items-start">
              <span className="text-black text-sm">• Secure and private</span>
            </li>
          </ul>
          
          <button
            onClick={() => navigate('/join-flow')}
            className="w-full py-3 px-4 bg-gray-100 text-black border border-gray-200 font-medium rounded-md hover:bg-gray-200 transition-all"
          >
            Join a Club
          </button>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="text-gray-500 text-sm"
      >
        <a href="#" className="text-black border-b border-gray-200 hover:border-black transition-all">
          Contact Support
        </a>
      </motion.div>
    </div>
  );
};

export default Welcome; 