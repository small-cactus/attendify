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
  'FALCON',
  'Technology',
  'Other'
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      duration: 0.5,
      bounce: 0.3
    }
  },
  exit: {
    opacity: 0,
    y: 100,
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
    // Keep modal open logic handled by parent
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div 
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-16 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-3"></div>
            
            {/* Header */}
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Create New Club
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Build your community space</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form 
              onSubmit={handleSubmit} 
              className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-10rem)] sm:max-h-[calc(85vh-10rem)]"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 bg-white transition-all duration-200 hover:border-gray-300"
                  placeholder="Give your club an awesome name"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 bg-white appearance-none pr-12 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                    required
                  >
                    <option value="">Choose a category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 bg-white min-h-[120px] resize-y transition-all duration-200 hover:border-gray-300"
                  placeholder="What makes your club special? Share your vision..."
                  required
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-6 py-3.5 text-base bg-gray-100 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  className="flex-1 sm:flex-initial px-8 py-3.5 text-base bg-gray-900 text-white font-semibold rounded-full hover:bg-black transition-all duration-200 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Club
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateClubModal; 