import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clubData: {
    name: string;
    description: string;
    category: string;
  }) => void;
}

const CATEGORIES = [
  'Academic',
  'Arts',
  'Athletics',
  'Community Service',
  'Culture',
  'EAGLE',
  'Technology',
  'Other'
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const CreateClubModal: React.FC<CreateClubModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', description: '', category: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div 
            className="w-full max-w-lg mx-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#1d1d1f]/10">
                <div className="flex items-center justify-between">
                  <motion.h2 
                    className="text-2xl font-semibold text-[#1d1d1f]"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Create New Club
                  </motion.h2>
                  <motion.button
                    onClick={onClose}
                    className="text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit} 
                className="p-6 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-[#1d1d1f]">
                    Club Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-transparent
                             focus:outline-none focus:border-[#1d1d1f]/30 focus:bg-white
                             text-[#1d1d1f] placeholder-[#1d1d1f]/40 transition-all duration-200"
                    placeholder="Enter club name"
                    required
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label htmlFor="category" className="block text-sm font-medium text-[#1d1d1f]">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-transparent
                             focus:outline-none focus:border-[#1d1d1f]/30 focus:bg-white
                             text-[#1d1d1f] transition-all duration-200"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label htmlFor="description" className="block text-sm font-medium text-[#1d1d1f]">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-transparent
                             focus:outline-none focus:border-[#1d1d1f]/30 focus:bg-white
                             text-[#1d1d1f] placeholder-[#1d1d1f]/40 transition-all duration-200
                             min-h-[100px] resize-y"
                    placeholder="Describe your club's purpose and activities"
                    required
                  />
                </motion.div>

                <motion.div 
                  className="flex justify-end gap-3 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="secondary-button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="primary-button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Club
                  </motion.button>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateClubModal; 