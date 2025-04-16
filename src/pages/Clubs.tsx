import React, { useState } from 'react';
import Layout from '../components/Layout';
import CreateClubModal from '../components/CreateClubModal';
import { motion } from 'framer-motion';

interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

const Clubs: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClub = (clubData: { name: string; description: string; category: string }) => {
    const newClub: Club = {
      id: Date.now().toString(),
      ...clubData,
      memberCount: 1
    };
    setClubs([newClub, ...clubs]);
  };

  return (
    <Layout>
      <motion.div 
        className="min-h-screen py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="hero-text mb-6">Your Clubs</h1>
            <p className="hero-subtitle max-w-2xl mx-auto">
              Join existing clubs or create your own. Track attendance, manage members, and organize events all in one place.
            </p>
          </motion.div>

          {/* Search and Create */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-xl border border-[#1d1d1f]/10 
                         focus:outline-none focus:border-[#1d1d1f]/30 focus:ring-0
                         text-[#1d1d1f] placeholder-[#1d1d1f]/40"
              />
              <svg
                className="absolute right-4 top-3.5 w-5 h-5 text-[#1d1d1f]/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="primary-button whitespace-nowrap"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create New Club
            </motion.button>
          </motion.div>

          {/* Clubs Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredClubs.length > 0 ? (
              filteredClubs.map(club => (
                <motion.div
                  key={club.id}
                  className="glass-card feature-card cursor-pointer group"
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <motion.div 
                      className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 
                              flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <span className="text-lg font-semibold text-[#1d1d1f]">
                        {club.name.charAt(0)}
                      </span>
                    </motion.div>
                    <span className="text-sm text-[#1d1d1f]/60">
                      {club.memberCount} member{club.memberCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2 group-hover:text-[#1d1d1f]/80 transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-[#424245] mb-4">
                    {club.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1d1d1f]/60">
                      {club.category}
                    </span>
                    <motion.button 
                      className="text-sm font-medium text-[#1d1d1f] hover:text-[#1d1d1f]/70 transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      Join Club →
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="col-span-full"
                variants={itemVariants}
              >
                <div className="glass-card text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-xl text-[#1d1d1f] mb-4">No clubs found</p>
                    <p className="text-[#424245] mb-8">
                      {searchQuery
                        ? "We couldn't find any clubs matching your search"
                        : "Create your first club to get started!"}
                    </p>
                    <motion.button
                      onClick={() => setShowCreateModal(true)}
                      className="primary-button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Create New Club
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
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