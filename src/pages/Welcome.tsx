import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Users, Plus, X, ArrowRight, QrCode, Trash2, Pencil, BarChart3, CalendarDays, Zap } from "lucide-react";
import Logo from '../components/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CharFadeIn from '../components/CharFadeIn';

// Animation config for staggered entrance with blur effect (from ClubDetail)
const TAB_TRANSITION = {
  opacity: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
  filter: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
};

// Background pattern SVG for plus signs with random positioning
const plusPatternSvg = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Plus 1 -->
  <rect width="2" height="16" x="29" y="22" fill="#EFEFEF" rx="1" ry="1" />
  <rect width="16" height="2" x="22" y="29" fill="#EFEFEF" rx="1" ry="1" />
  
  <!-- Plus 2 -->
  <rect width="2" height="16" x="89" y="62" fill="#EFEFEF" rx="1" ry="1" />
  <rect width="16" height="2" x="82" y="69" fill="#EFEFEF" rx="1" ry="1" />
  
  <!-- Plus 3 -->
  <rect width="2" height="16" x="149" y="32" fill="#EFEFEF" rx="1" ry="1" />
  <rect width="16" height="2" x="142" y="39" fill="#EFEFEF" rx="1" ry="1" />
  
  <!-- Plus 4 -->
  <rect width="2" height="16" x="49" y="132" fill="#EFEFEF" rx="1" ry="1" />
  <rect width="16" height="2" x="42" y="139" fill="#EFEFEF" rx="1" ry="1" />
  
  <!-- Plus 5 -->
  <rect width="2" height="16" x="169" y="142" fill="#EFEFEF" rx="1" ry="1" />
  <rect width="16" height="2" x="162" y="149" fill="#EFEFEF" rx="1" ry="1" />
  
  <!-- Plus 6 -->
  <rect width="2" height="16" x="119" y="102" fill="#EFEFEF" rx="1" ry="1" />
  <rect width="16" height="2" x="112" y="109" fill="#EFEFEF" rx="1" ry="1" />
</svg>
`;

// Encode SVG for CSS background usage
const encodedPlusPattern = encodeURIComponent(plusPatternSvg);
const plusPatternBackground = `url("data:image/svg+xml,${encodedPlusPattern}")`;

// Animation variants
const welcomeVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
    },
  },
};

// New, more complex and slower animation for the showcase headline
const showcaseHeadlineVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(16px)',
    rotate: -2,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    rotate: 0,
    scale: 1,
    transition: {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      filter: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      y: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
      rotate: { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
      staggerChildren: 0.32,
    },
  },
};

const mockupVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(16px)',
    scale: 0.97,
    y: -20
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    y: 0,
    transition: {
      ...TAB_TRANSITION,
      filter: { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  }
};

// Component for event badge (copied from ClubDetail)
const EventTypeBadge = ({ type, label }: { type: string, label: string }) => {
  const typeStyles: Record<string, string> = {
    geo: 'bg-blue-100 text-blue-700',
    code: 'bg-yellow-100 text-yellow-700',
    qr: 'bg-green-100 text-green-700',
    time: 'bg-purple-100 text-purple-700'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1 ${typeStyles[type] || ''}`}>
      {label}
    </span>
  );
};

// Variants for the first step with delay after headline
const stepVariantsWithDelay = {
  ...welcomeVariants,
  visible: {
    ...welcomeVariants.visible,
    transition: {
      ...welcomeVariants.visible.transition,
      delay: 1.28 + 1.2,
      filter: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
    },
  },
};

// Calculate the delay for CTA buttons to animate directly after subtitle
const SUBHEADING_TEXT = "no complexity. no learning curve. just results.";
const SUBHEADING_CHARS = SUBHEADING_TEXT.length;
const SUBHEADING_SPEED = 1.5; // Must match the speed prop used in CharFadeIn for subtitle
const CHAR_STAGGER_DELAY = 0.035;
const CHAR_ANIM_DURATION = 0.7;
const subtitleAnimTime = (SUBHEADING_CHARS * (CHAR_STAGGER_DELAY / SUBHEADING_SPEED)) + (CHAR_ANIM_DURATION / SUBHEADING_SPEED);
const BUTTONS_EARLY_BUFFER = -0.3; // Buttons show up 0.3s before subtitle finishes
const SHOWCASE_LATE_BUFFER = 0.3;  // Showcase words show up 0.3s after buttons
const buttonVariantsWithDelay = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delay: Math.max(0, subtitleAnimTime + BUTTONS_EARLY_BUFFER),
      filter: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    filter: 'blur(16px)',
    transition: {
      opacity: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      y: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      filter: { duration: 1.2, ease: [0.4, 0, 0.2, 1] }, // Slow blur on exit
    },
  },
};

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const showcaseWords = "create. manage. attend.";

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] flex justify-center px-4 py-4 sm:py-8"
      style={{ backgroundImage: plusPatternBackground }}
    >
      <motion.div
        className="w-full max-w-5xl mx-auto py-2 sm:py-6"
        variants={welcomeVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={welcomeVariants}>
          {/* Logo */}
          <motion.div 
            className="mb-4 sm:mb-8"
            variants={welcomeVariants}
          >
            {/* Mobile logo (smaller) */}
            <div className="block sm:hidden mb-8">
              <Logo 
                imageClassName="w-8 h-8"
                textClassName="text-lg"
                size={25}
              />
            </div>
            
            {/* Desktop logo (original size) */}
            <div className="hidden sm:block">
              <Logo 
                imageClassName="w-10 h-10 md:w-12 md:h-12"
                textClassName="text-xl md:text-2xl"
                size={35}
              />
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 tracking-tight px-1 md:leading-[1.15]"
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
          >
            <CharFadeIn text="club management that just works" speed={1.2} className="mobile-word-wrap" />
          </motion.h1>

          {/* Subheading */}
          <div>
            <div className="block sm:hidden mb-6 h-8" />
            <p className="hidden sm:block text-lg sm:text-xl text-neutral-600 mb-6 sm:mb-8 sm:mb-12 px-2 h-14 sm:h-auto">
              <CharFadeIn 
                text="no complexity. no learning curve. just results."
                gradient={false} 
                speed={1.5}
              />
            </p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 sm:mb-24 px-1"
            variants={buttonVariantsWithDelay}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              className="px-6 sm:px-8 py-3 sm:py-4 bg-black text-white font-medium rounded-lg hover:bg-neutral-900 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (auth.user) {
                  navigate('/clubs');
                } else {
                  navigate('/login');
                }
              }}
            >
              create your club
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            <motion.button
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-medium rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200 text-sm sm:text-base"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/join-flow')}
            >
              join existing club
            </motion.button>
          </motion.div>

          {/* App Showcase Section */}
          <motion.div 
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
            className="px-1"
          >
            <motion.h2 
              className="text-xl sm:text-2xl font-medium mb-12 sm:mb-16 text-neutral-800"
              variants={showcaseHeadlineVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'inline-block' }}
            >
              {/* Span for animating characters of the first three words */}
              <motion.span
                style={{ display: 'inline-block', marginRight: 6, marginBottom: 4 }}
                className="sm:mr-2"
                variants={{ hidden: {}, visible: {} }}
                initial="hidden"
                animate="visible"
              >
                <CharFadeIn
                  text={showcaseWords}
                  speed={1.4}
                  startAfter={subtitleAnimTime + SHOWCASE_LATE_BUFFER}
                />
              </motion.span>
              <span style={{ display: 'inline-block', width: '0.3em' }}></span>
              <CharFadeIn
                text={"that's it."}
                speed={0.8}
                gradient={false}
                className="text-neutral-400"
                startAfter={showcaseWords.length * 0.02 + subtitleAnimTime + SHOWCASE_LATE_BUFFER}
              />
            </motion.h2>
            
            {/* Step 1: Create a Club */}
            <motion.div className="mb-20 sm:mb-32 px-1" variants={stepVariantsWithDelay}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="w-full md:w-2/5 text-left bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-6 shadow-sm">
                  {/* Combined Step Number and Title */}
                  <h3 className="text-2xl sm:text-3xl mb-3 sm:mb-4 flex items-baseline gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 font-bold text-xl sm:text-2xl mr-2">1</span>
                    <span className="text-lg sm:text-xl font-bold">ready, set, go!</span>
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">Just a name, and you're live. Forget complicated setups.</p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Zero configuration required</span>
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Automatic join code generation</span>
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Ready the moment you hit create</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="w-full md:w-3/5 relative mt-6 md:mt-0"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Club creation UI mockup - styled like CreateEventModal */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 max-w-sm mx-auto">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    
                    <div className="p-4 sm:p-6 relative">
                      {/* Close button */}
                      <button className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Modal Title - Use Lucide Users icon */}
                      <h4 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 flex items-center gap-1.5">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        Create New Club
                      </h4>
                      
                      {/* Form - Adjusted spacing and input padding */}
                      <div className="space-y-4 sm:space-y-5">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left">Club Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Book Club"
                            value="Book Club"
                            className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                            readOnly
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left">Category</label>
                           <div className="relative">
                            <select 
                              className="w-full appearance-none bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black pr-6 sm:pr-8"
                              disabled
                            >
                              <option>Arts & Literature</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-gray-700">
                              <svg className="fill-current h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left">Description</label>
                          <textarea
                            placeholder="Describe your club's purpose and activities"
                            value="Monthly meetings to discuss books and share recommendations"
                            rows={3}
                            className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white resize-y min-h-[60px] sm:min-h-[70px]"
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                      {/* Footer Buttons - Adjusted padding and added Cancel button */}
                      <div className="flex justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-200 mt-4 sm:mt-6">
                         <button
                          type="button"
                          className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm bg-white text-black border border-gray-300 font-medium rounded-md hover:bg-gray-50 transition-all flex items-center gap-1.5"
                          disabled
                         >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          Cancel
                        </button>
                        <button 
                          className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors duration-150 flex items-center gap-1.5 sm:gap-2"
                          disabled
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          Create Club
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Step 2: Create Events */}
            <motion.div className="mb-20 sm:mb-32 px-1" variants={welcomeVariants}>
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8 md:gap-12">
                <div className="w-full md:w-2/5 text-left bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-6 shadow-sm">
                  {/* Add Combined Step Number and Title */}
                  <h3 className="text-2xl sm:text-3xl mb-3 sm:mb-4 flex items-baseline gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 font-bold text-xl sm:text-2xl mr-2">2</span>
                    <span className="text-lg sm:text-xl font-bold">events in seconds</span>
                  </h3>
                  
                  <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">Go from idea to event instantly. Configure powerful check-in methods with a click.</p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Instant QR code generation</span>
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.978.572l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                      </svg>
                      <span>Optional location & time restrictions</span>
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Simple recurring schedules</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="w-full md:w-3/5 relative mt-6 md:mt-0"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Event creation modal mockup - styled like CreateEventModal with macOS window controls */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 max-w-sm mx-auto">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    
                    <div className="p-4 sm:p-6 relative">
                      {/* Close button */}
                      <button className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Modal Title - Use Lucide Users icon */}
                      <h4 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* addCircleOutline equivalent */}
                        </svg>
                        Create New Event
                      </h4>
                      
                      {/* Form content - Adjusted spacing */}
                      <form className="space-y-3 sm:space-y-4">
                        {/* Event Name */}
                        <div>
                          <label htmlFor="modalEventName" className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 text-left">Event Name</label>
                          <input
                            id="modalEventName"
                            type="text"
                            placeholder="e.g., Weekly Meeting"
                            value="Book Club Meeting"
                            className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                            readOnly
                            disabled
                          />
                        </div>
                        
                        {/* Event Date - Improved styling to match CustomRadio */}
                        <div>
                          <label htmlFor="modalEventDate" className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 text-left">Event Date</label>
                          <button
                            type="button"
                            className="w-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center"
                            disabled
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mr-1.5 sm:mr-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span>October 15, 2023, 6:00 PM</span>
                          </button>
                        </div>

                        {/* Check-in Method - Improved styling to match CustomRadio */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1.5">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /> {/* qrCodeOutline equivalent */}
                            </svg>
                            Check-in Method
                          </label>
                          <div className="space-y-1.5 sm:space-y-2">
                            {/* Selected Option Styling - Mimics CustomRadio selection */}
                            <label className="flex items-start p-2 sm:p-3 border border-black rounded-md bg-white cursor-pointer shadow-sm relative ring-1 ring-black ring-opacity-5">
                              {/* Visual Radio Representation */}
                              <div className="flex items-center h-4 sm:h-5 mt-0.5 sm:mt-0">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-[4px] sm:border-[5px] border-black bg-white" /> {/* Mimics selected state */}
                              </div>
                              {/* Actual hidden radio input */}
                              <input type="radio" name="checkinMethodMockup" className="absolute opacity-0 w-0 h-0" checked readOnly disabled />
                              <div className="ml-2.5 sm:ml-3 flex-grow text-left">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">All Methods</div>
                                <div className="text-[10px] sm:text-xs text-gray-500">QR code, event code, or direct link</div>
                              </div>
                              {/* Removed Checkmark SVG */}
                            </label>
                            {/* Unselected/Disabled Option Styling */}
                            <label className="flex items-start p-2 sm:p-3 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed opacity-70">
                               {/* Visual Radio Representation */}
                              <div className="flex items-center h-4 sm:h-5 mt-0.5 sm:mt-0">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-300 bg-gray-200" /> {/* Mimics unselected/disabled state */}
                              </div>
                              {/* Actual hidden radio input */}
                              <input type="radio" name="checkinMethodMockup" className="absolute opacity-0 w-0 h-0" disabled readOnly />
                              <div className="ml-2.5 sm:ml-3 flex-grow text-left">
                                <div className="text-xs sm:text-sm font-medium text-gray-700">Event Code Only</div>
                                <div className="text-[10px] sm:text-xs text-gray-500">Members only use the code</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Recurrence - Styled select to match CustomSelect */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> {/* repeatOutline equivalent */}
                            </svg>
                            Recurrence
                          </label>
                           <div className="relative">
                            <select 
                              className="w-full appearance-none bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black pr-6 sm:pr-8"
                              disabled
                            >
                              <option>Does not repeat</option>
                              <option>Daily</option>
                              <option>Weekly</option>
                              <option>Monthly</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-gray-700">
                              <svg className="fill-current h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                           </div>
                        </div>

                        {/* Check-in Restrictions - Adjusted spacing, icons, styling */}
                        <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-100 mt-3 sm:mt-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1 sm:mb-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> {/* lockClosedOutline equivalent */}
                            </svg>
                            Check-in Restrictions (Optional)
                          </label>
                          
                          {/* Time Restriction - Styled like CustomCheckbox */}
                          <label className="flex items-start cursor-pointer group">
                            <div className="flex items-center h-4 sm:h-5 mt-0.5 sm:mt-0">
                              <input type="checkbox" checked readOnly className="accent-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 focus:ring-black" disabled />
                            </div>
                            <div className="ml-2 sm:ml-2.5">
                              <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* timeOutline equivalent */}
                                </svg>
                                Restrict to event time window
                              </span>
                              <p className="text-[10px] sm:text-xs text-gray-500">Check-in between start and end times</p>
                            </div>
                          </label>

                          {/* Location Restriction - Styled like CustomCheckbox */}
                          <label className="flex items-start cursor-pointer group">
                            <div className="flex items-center h-4 sm:h-5 mt-0.5 sm:mt-0">
                              <input type="checkbox" checked readOnly className="accent-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 focus:ring-black" disabled />
                            </div>
                            <div className="ml-2 sm:ml-2.5">
                              <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /> {/* locationOutline equivalent */}
                                </svg>
                                Restrict to event location
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-[10px] sm:text-xs text-gray-500">100m radius near <span className="font-medium text-gray-600">Library Rm 201</span></p>
                                <button className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium" disabled>
                                  Set
                                </button>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Submit Button - Adjusted padding and added subtle transition */}
                        <div className="pt-3 sm:pt-4 border-t border-gray-100 mt-3 sm:mt-5 flex justify-end">
                          <button className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors duration-150 flex items-center gap-1.5 sm:gap-2" disabled>
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            Create Event
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Step 3: Check-ins */}
            <motion.div className="mb-20 sm:mb-32 px-1" variants={welcomeVariants}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="w-full md:w-2/5 text-left bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-6 shadow-sm">
                  {/* Combined Step Number and Title */}
                  <h3 className="text-2xl sm:text-3xl mb-3 sm:mb-4 flex items-baseline gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 font-bold text-xl sm:text-2xl mr-2">3</span>
                    <span className="text-lg sm:text-xl font-bold">frictionless check-in</span>
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">Attendees scan, type their name, and they're in. No sign-ups, no friction. Just instant, accurate attendance.</p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0">
                        <path d="M3.75 4.5a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5ZM3.75 9a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-1.5ZM3.75 13.5a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-1.5ZM7.5 4.5a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5ZM7.5 9a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-1.5Zm.75 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5Zm3.75-9a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5ZM12 9a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-1.5Zm.75 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-1.5Z" />
                        <path d="M16.5 4.5a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-.75ZM15.75 9a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-.75Zm.75 4.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-1.5Z" />
                      </svg>
                      <span>Fast QR code scanning</span>
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0" />
                      <span>Real-time attendance updates</span>
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-neutral-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-black mr-2 sm:mr-3 flex-shrink-0">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.586l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V2.75Z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                      </svg>
                      <span>Easy data export (CSV)</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="w-full md:w-3/5 relative mt-6 md:mt-0"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* QR Code check-in UI mockup - styled like EventCheckinQR with macOS window controls */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 text-center p-0 max-w-sm mx-auto">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    <div className="p-5 sm:p-8">
                      <h4 className="text-lg sm:text-xl font-bold text-black mb-1">Book Club Meeting</h4>
                      <p className="text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4">Book Club (Arts & Literature)</p>
                      <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-8">Scan the code below with your device to check in</p>
                      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-sm inline-flex items-center justify-center mb-5 sm:mb-8">
                        <QRCodeCanvas value="https://attendify.app/checkin/BOOK123" size={140} level="H" bgColor="#fff" fgColor="#000" className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px]" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Or go to:</p>
                      <div className="text-sm sm:text-lg font-mono break-all p-3 sm:p-4 bg-gray-50 rounded-lg text-black inline-block mb-2 border border-gray-200">
                        attendify.app/checkin/BOOK123
                      </div>
                      <div className="mb-4 sm:mb-6 mt-2">
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Open for check-ins
                        </span>
                      </div>
                      <button className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all duration-200" disabled>Back to Club Details</button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Step 4: View Club Details */}
            <motion.div className="mb-32" variants={welcomeVariants}>
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
                <div className="md:w-2/5 text-left bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-6 shadow-sm">
                  {/* Combined Step Number and Title */}
                  <h3 className="text-2xl sm:text-3xl mb-4 flex items-baseline gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 font-bold text-xl sm:text-2xl mr-2">4</span>
                    <span className="text-lg sm:text-xl font-bold">your club, fully managed</span>
                  </h3>
                  <p className="text-neutral-600 mb-6">One clean dashboard for events, members, and attendance. Everything you need, nothing you don't.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-neutral-700">
                      <CalendarDays className="w-5 h-5 text-black mr-3 flex-shrink-0" />
                      <span>At-a-glance event overview</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <Users className="w-5 h-5 text-black mr-3 flex-shrink-0" />
                      <span>Simple member management</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-black mr-3 flex-shrink-0">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.586l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V2.75Z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                      </svg>
                      <span>One-click CSV export</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="md:w-4/5 relative text-left"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Club Detail UI mockup - Updated to better reflect ClubDetail.tsx */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    
                    {/* Updated Header Section */}
                    <div className="px-6 py-4 text-left">
                      <a href="#" className="text-xs text-gray-500 hover:text-black mb-1 inline-block" tabIndex={-1} aria-disabled="true">
                        &larr; Back to My Clubs
                      </a>
                      <h3 className="text-xl font-semibold text-black mb-0.5">Book Club</h3>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span className="text-gray-500">Arts & Literature</span>
                        <span className="font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Code: BOOK123
                        </span>
                        <a href="#" className="text-xs text-black border-b border-gray-300 hover:border-black transition-colors flex items-center gap-1" tabIndex={-1} aria-disabled="true">
                          <QrCode className="w-3 h-3" />
                          Show Join QR Code
                        </a>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 max-w-3xl">Monthly meetings to discuss books and share recommendations</p>
                    </div>
                    
                    {/* Updated Tab Navigation with Delete button */}
                    <div className="flex space-x-1 pr-3 text-left">
                      <button className="px-4 pb-2 text-sm font-medium border-b-2 border-black text-black" disabled>
                        Events
                      </button>
                      <button className="px-4 pb-2 text-sm font-medium text-gray-500 hover:text-black" disabled>
                        Members
                      </button>
                      <button className="px-4 pb-2 text-sm font-medium text-gray-500 hover:text-black" disabled>
                        Attendance
                      </button>
                      <div className="flex-grow"></div>
                      <button className="px-3 pb-2 text-sm font-medium text-red-600 hover:text-red-800 hover:border-b-2 hover:border-red-600 transition-all flex items-center gap-1" disabled>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Club
                      </button>
                    </div>
                    
                    {/* Updated Event Tab Content */}
                    <div className="p-6 text-left">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-black flex items-center gap-1.5">
                          <CalendarDays className="w-5 h-5 text-gray-600" />
                          Manage Events
                        </h4>
                        <button className="px-3 py-1.5 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all flex items-center gap-1.5" disabled>
                          <Plus className="w-4 h-4" />
                          Create Event
                        </button>
                      </div>
                      
                      {/* Updated Event Card */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-20 p-4 bg-gray-50 flex flex-row sm:flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-gray-200">
                            <div className="text-xl font-bold text-gray-900">15</div>
                            <div className="text-xs text-gray-600 ml-2 sm:ml-0">Oct</div>
                          </div>
                          
                          <div className="flex-1 p-4 text-left">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-md font-semibold text-gray-900 truncate">Book Club Meeting</h5>
                                <p className="text-xs text-gray-600 mt-0.5 truncate">Sunday, October 15, 2023, 6:00 PM</p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <EventTypeBadge type="qr" label="QR" />
                                  <EventTypeBadge type="time" label="Time" />
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                <button className="text-gray-400 hover:text-blue-600 p-1" title="Edit Event" disabled>
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-purple-600 p-1" title="View Attendance" disabled>
                                  <BarChart3 className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-red-600 p-1" title="Delete Event" disabled>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="w-28 h-28 p-1 bg-white border border-gray-200 rounded-sm flex items-center justify-center">
                                  <QRCodeCanvas value="https://attendify.app/checkin/BOOK123" size={64} level="L" bgColor="#fff" fgColor="#000" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Final CTA Section */}
          <motion.div 
            className="text-center p-6 sm:p-12 rounded-3xl mt-16 sm:mt-24"
            variants={welcomeVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black">and yes, it's completely free</h2>
             <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8 max-w-xl mx-auto flex items-center justify-center">
               get started with attendify, the fastest club management app
               <Zap className="w-4 h-4 ml-1.5 text-black" fill="currentColor" />
             </p>
            <motion.button 
              className="px-6 sm:px-8 py-3 sm:py-4 bg-black text-white text-sm sm:text-base font-medium rounded-lg hover:bg-neutral-900 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (auth.user) {
                  navigate('/clubs');
                } else {
                  navigate('/login');
                }
              }}
              >
              attendify your club
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </motion.div>

          {/* Footer */}
          <motion.footer 
            className="mt-16 sm:mt-24 text-center text-xs sm:text-sm text-neutral-500 pb-6 sm:pb-0"
            variants={welcomeVariants}
          >
            <p>© {new Date().getFullYear()} attendify</p>
          </motion.footer>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;