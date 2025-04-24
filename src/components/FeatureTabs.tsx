import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Local icon wrapper – re-uses the radial-gradient backgrounds that already exist across the site
const FeatureIcon: React.FC<{ children: React.ReactNode; style: React.CSSProperties }> = ({ children, style }) => (
  <div
    className="bg-gradient-to-br w-12 h-12 flex items-center justify-center rounded-xl shadow-lg"
    style={style}
  >
    {children}
  </div>
);

interface FeatureItem {
  title: string;
  description: string;
  gradient: string;
  // We will store a ready-to-render svg element
  icon: React.ReactNode;
}

interface Category {
  id: string;
  label: string;
  features: FeatureItem[];
}

/**
 * Interactive tabbed feature showcase.
 * – Uses a pill-style tab bar for switching categories.
 * – Each category animates into view using framer-motion.
 */
const FeatureTabs: React.FC = () => {
  // Build the data once – gradients & titles borrowed from existing Welcome page.
  const categories: Category[] = [
    {
      id: 'checkin',
      label: 'Check-in',
      features: [
        {
          title: 'Geo-Fenced Check-in',
          description: 'Only allow check-ins when members are physically at your event location',
          gradient: 'radial-gradient(circle at top left, #6366f1, #38bdf8, #f472b6)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          title: 'Time-Based Check-in',
          description: 'Set specific time windows when check-ins are allowed',
          gradient: 'radial-gradient(circle at top right, #fbbf24, #f472b6, #38bdf8)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          title: 'QR Code Check-in',
          description: 'Quick and easy check-in by scanning a QR code',
          gradient: 'radial-gradient(circle at bottom left, #34d399, #fbbf24, #f472b6)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-2 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          ),
        },
        {
          title: 'Link Check-in',
          description: 'Share a simple link for instant check-ins',
          gradient: 'radial-gradient(circle at bottom right, #f472b6, #6366f1, #34d399)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          ),
        },
        {
          title: 'Code Check-in',
          description: 'Use simple codes for quick access to events',
          gradient: 'radial-gradient(circle at 60% 40%, #38bdf8, #fbbf24, #6366f1)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      id: 'join',
      label: 'Join',
      features: [
        {
          title: 'QR Code Join',
          description: 'Scan a QR code to instantly join a club',
          gradient: 'radial-gradient(circle at top left, #38bdf8, #fbbf24, #34d399)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-2 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          ),
        },
        {
          title: 'Link Join',
          description: 'Click a link to join instantly',
          gradient: 'radial-gradient(circle at top right, #6366f1, #f472b6, #fbbf24)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          title: 'Code Join',
          description: 'Enter a simple code to join',
          gradient: 'radial-gradient(circle at bottom, #fbbf24, #38bdf8, #f472b6)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          ),
        },
      ],
    },
    {
      id: 'manage',
      label: 'Manage',
      features: [
        {
          title: 'Event Scheduling',
          description: 'Schedule events with location, time, and recurring options',
          gradient: 'radial-gradient(circle at top left, #a78bfa, #f472b6, #fbbf24)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          ),
        },
        {
          title: 'Pre-approval List',
          description: 'Pre-approve members for quick and accurate check-ins',
          gradient: 'radial-gradient(circle at top right, #f472b6, #34d399, #6366f1)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
        {
          title: 'Export Data',
          description: 'Export attendance data to CSV for analysis',
          gradient: 'radial-gradient(circle at bottom, #10b981, #f59e42, #818cf8)',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
        },
      ],
    },
  ];

  const [activeId, setActiveId] = useState(categories[0].id);

  const activeCategory = categories.find((c) => c.id === activeId)!;

  return (
    <div className="mb-20 py-16 px-4 sm:px-6 lg:px-8 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="relative flex justify-center mb-14">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none ${cat.id === activeId ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {cat.label}
            {cat.id === activeId && (
              <motion.div
                className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-black rounded-full"
                layoutId="active-tab-underline"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Features grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {activeCategory.features.map((f) => (
            <motion.div
              key={f.title}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <FeatureIcon style={{ background: f.gradient }}>{f.icon}</FeatureIcon>
              <h4 className="text-lg font-semibold mt-4 mb-1.5 text-gray-900">{f.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FeatureTabs; 