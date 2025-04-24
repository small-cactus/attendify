import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Users, Plus, X, ArrowRight, QrCode, Trash2, Pencil, BarChart3, CalendarDays } from "lucide-react";

// Animation config for staggered entrance with blur effect (from ClubDetail)
const TAB_TRANSITION = {
  opacity: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
  filter: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
};

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

// Animation for each word in the showcase headline
const showcaseWordVariants = {
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
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      filter: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
      y: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
      rotate: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
    },
  },
};

// Animation for the last word in the showcase headline (longer blur)
const showcaseLastWordVariants = {
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
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      filter: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      y: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 1.0, ease: [0.4, 0, 0.2, 1] },
      rotate: { duration: 1.0, ease: [0.4, 0, 0.2, 1] },
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

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex justify-center px-4">
      <motion.div
        className="w-full max-w-5xl mx-auto py-12"
        variants={welcomeVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={welcomeVariants}>
          {/* Logo */}
          <motion.div 
            className="mb-12"
            variants={welcomeVariants}
          >
            <Logo 
              imageClassName="w-12 h-12"
              textClassName="text-2xl"
              size={35}
            />
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6 text-black tracking-tight"
            variants={welcomeVariants}
          >
            club management that just works
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            className="text-xl text-neutral-600 mb-12"
            variants={welcomeVariants}
          >
            no complexity. no learning curve. just results.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 mb-24"
            variants={welcomeVariants}
          >
            <motion.button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-black text-white font-medium rounded-lg hover:bg-neutral-900 transition-all duration-200 flex items-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              create your club
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={() => navigate('/join-flow')}
              className="px-8 py-4 bg-white text-black font-medium rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200"
              whileTap={{ scale: 0.98 }}
            >
              join existing club
            </motion.button>
          </motion.div>

          {/* App Showcase Section */}
          <motion.div 
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              className="text-2xl font-medium mb-16 text-neutral-800"
              variants={showcaseHeadlineVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={showcaseWordVariants} style={{ display: 'inline-block', marginRight: 8 }}>create.</motion.span>
              <motion.span variants={showcaseWordVariants} style={{ display: 'inline-block', marginRight: 8 }}>manage.</motion.span>
              <motion.span variants={showcaseWordVariants} style={{ display: 'inline-block', marginRight: 8 }}>attend.</motion.span>
              <motion.span variants={showcaseLastWordVariants} style={{ display: 'inline-block' }} className="text-neutral-400">that's it.</motion.span>
            </motion.h2>
            
            {/* Step 1: Create a Club */}
            <motion.div className="mb-32" variants={stepVariantsWithDelay}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="md:w-2/5 text-left">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 text-white text-3xl font-extrabold">1</div>
                  <h3 className="text-2xl font-medium mb-4">create a club in seconds</h3>
                  <p className="text-neutral-600 mb-6">enter your club name and you're ready to go. no endless forms. none of it.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>simple name and description</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>club code generated automatically</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>instant setup - it's ready the second you hit create</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="md:w-3/5 relative"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Club creation UI mockup - styled like CreateEventModal */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    
                    <div className="p-6 relative">
                      {/* Close button */}
                      <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Modal Title - Use Lucide Users icon */}
                      <h4 className="text-lg font-semibold text-black mb-4 flex items-center gap-1.5">
                        <Users className="w-5 h-5" />
                        Create New Club
                      </h4>
                      
                      {/* Form - Adjusted spacing and input padding */}
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Club Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Book Club"
                            value="Book Club"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Category</label>
                           <div className="relative">
                            <select 
                              className="w-full appearance-none bg-white px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black pr-8"
                            >
                              <option>Arts & Literature</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Description</label>
                          <textarea
                            placeholder="Describe your club's purpose and activities"
                            value="Monthly meetings to discuss books and share recommendations"
                            rows={3}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white resize-y min-h-[70px]"
                            readOnly
                          />
                        </div>
                      </div>
                      {/* Footer Buttons - Adjusted padding and added Cancel button */}
                      <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 mt-6">
                         <button
                          type="button"
                          className="px-3.5 py-1.5 text-sm bg-white text-black border border-gray-300 font-medium rounded-md hover:bg-gray-50 transition-all flex items-center gap-1.5"
                         >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button 
                          className="px-3.5 py-1.5 text-sm bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors duration-150 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create Club
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Step 2: Create Events */}
            <motion.div className="mb-32" variants={welcomeVariants}>
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
                <div className="md:w-2/5 text-left">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 text-white text-3xl font-extrabold">2</div>
                  <h3 className="text-2xl font-medium mb-4">create events in one click</h3>
                  <p className="text-neutral-600 mb-6">schedule meetings, set check-in options, and customize everything without complexity.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>QR code check-ins</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>location and time restrictions</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>recurring schedules</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="md:w-3/5 relative"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Event creation modal mockup - styled like CreateEventModal with macOS window controls */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 max-w-lg mx-auto">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    
                    <div className="p-6 relative">
                      {/* Close button */}
                      <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Modal Title - Adjusted size and icon */}
                      <h4 className="text-md font-semibold text-black mb-4 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* addCircleOutline equivalent */}
                        </svg>
                        Create New Event
                      </h4>
                      
                      {/* Form content - Adjusted spacing */}
                      <form className="space-y-4">
                        {/* Event Name */}
                        <div>
                          <label htmlFor="modalEventName" className="block text-xs font-medium text-gray-600 mb-1 text-left">Event Name</label>
                          <input
                            id="modalEventName"
                            type="text"
                            placeholder="e.g., Weekly Meeting"
                            value="Book Club Meeting"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                            readOnly
                          />
                        </div>
                        
                        {/* Event Date - Improved styling to match CustomRadio */}
                        <div>
                          <label htmlFor="modalEventDate" className="block text-xs font-medium text-gray-600 mb-1 text-left">Event Date</label>
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-sm text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 mr-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span>October 15, 2023, 6:00 PM</span>
                          </button>
                        </div>

                        {/* Check-in Method - Improved styling to match CustomRadio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /> {/* qrCodeOutline equivalent */}
                            </svg>
                            Check-in Method
                          </label>
                          <div className="space-y-2">
                            {/* Selected Option Styling - Mimics CustomRadio selection */}
                            <label className="flex items-start p-3 border border-black rounded-md bg-white cursor-pointer shadow-sm relative ring-1 ring-black ring-opacity-5">
                              {/* Visual Radio Representation */}
                              <div className="flex items-center h-5">
                                <div className="w-4 h-4 rounded-full border-[5px] border-black bg-white" /> {/* Mimics selected state */}
                              </div>
                              {/* Actual hidden radio input */}
                              <input type="radio" name="checkinMethodMockup" className="absolute opacity-0 w-0 h-0" checked readOnly />
                              <div className="ml-3 flex-grow text-left">
                                <div className="text-sm font-medium text-gray-900">All Methods</div>
                                <div className="text-xs text-gray-500">QR code, event code, or direct link</div>
                              </div>
                              {/* Removed Checkmark SVG */}
                            </label>
                            {/* Unselected/Disabled Option Styling */}
                            <label className="flex items-start p-3 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed opacity-70">
                               {/* Visual Radio Representation */}
                              <div className="flex items-center h-5">
                                <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-200" /> {/* Mimics unselected/disabled state */}
                              </div>
                              {/* Actual hidden radio input */}
                              <input type="radio" name="checkinMethodMockup" className="absolute opacity-0 w-0 h-0" disabled readOnly />
                              <div className="ml-3 flex-grow text-left">
                                <div className="text-sm font-medium text-gray-700">Event Code Only</div>
                                <div className="text-xs text-gray-500">Members only use the code</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Recurrence - Styled select to match CustomSelect */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> {/* repeatOutline equivalent */}
                            </svg>
                            Recurrence
                          </label>
                           <div className="relative">
                            <select 
                              className="w-full appearance-none bg-white px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black pr-8"
                            >
                              <option>Does not repeat</option>
                              <option>Daily</option>
                              <option>Weekly</option>
                              <option>Monthly</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                           </div>
                        </div>

                        {/* Check-in Restrictions - Adjusted spacing, icons, styling */}
                        <div className="space-y-3 pt-3 border-t border-gray-100 mt-4">
                          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> {/* lockClosedOutline equivalent */}
                            </svg>
                            Check-in Restrictions (Optional)
                          </label>
                          
                          {/* Time Restriction - Styled like CustomCheckbox */}
                          <label className="flex items-start cursor-pointer group">
                            <div className="flex items-center h-5">
                              <input type="checkbox" checked readOnly className="accent-black w-4 h-4 rounded border-gray-300 focus:ring-black" />
                            </div>
                            <div className="ml-2.5">
                              <span className="flex items-center gap-1 text-sm font-medium text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* timeOutline equivalent */}
                                </svg>
                                Restrict to event time window
                              </span>
                              <p className="text-xs text-gray-500">Check-in between start and end times</p>
                            </div>
                          </label>

                          {/* Location Restriction - Styled like CustomCheckbox */}
                          <label className="flex items-start cursor-pointer group">
                            <div className="flex items-center h-5">
                              <input type="checkbox" checked readOnly className="accent-black w-4 h-4 rounded border-gray-300 focus:ring-black" />
                            </div>
                            <div className="ml-2.5">
                              <span className="flex items-center gap-1 text-sm font-medium text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /> {/* locationOutline equivalent */}
                                </svg>
                                Restrict to event location
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-gray-500">100m radius near <span className="font-medium text-gray-600">Library Rm 201</span></p>
                                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                  Set
                                </button>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Submit Button - Adjusted padding and added subtle transition */}
                        <div className="pt-4 border-t border-gray-100 mt-5 flex justify-end">
                          <button className="px-3.5 py-1.5 text-sm bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors duration-150 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
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
            <motion.div className="mb-32" variants={welcomeVariants}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="md:w-2/5 text-left">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 text-white text-3xl font-extrabold">3</div>
                  <h3 className="text-2xl font-medium mb-4">track attendance instantly</h3>
                  <p className="text-neutral-600 mb-6">create events, scan members in, and get detailed stats. all in a few taps.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>check-in via QR code</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>real-time attendance tracking</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>export attendance data anytime to CSV</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div 
                  className="md:w-3/5 relative"
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* QR Code check-in UI mockup - styled like EventCheckinQR with macOS window controls */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 text-center p-0 max-w-md mx-auto">
                    {/* macOS window controls */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                    </div>
                    <div className="p-8">
                      <h4 className="text-xl font-bold text-black mb-1">Book Club Meeting</h4>
                      <p className="text-sm text-neutral-600 mb-4">Book Club (Arts & Literature)</p>
                      <p className="text-gray-600 mb-8">Scan the code below with your device to check in</p>
                      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm inline-flex items-center justify-center mb-8">
                        <QRCodeCanvas value="https://attendify.app/checkin/BOOK123" size={192} level="H" bgColor="#fff" fgColor="#000" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Or go to:</p>
                      <div className="text-lg font-mono break-all p-4 bg-gray-50 rounded-lg text-black inline-block mb-2 border border-gray-200">
                        attendify.app/checkin/BOOK123
                      </div>
                      <div className="mb-6 mt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Open for check-ins
                        </span>
                      </div>
                      <button className="px-6 py-2.5 text-sm bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-all duration-200">Back to Club Details</button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Step 4: View Club Details */}
            <motion.div className="mb-32" variants={welcomeVariants}>
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
                <div className="md:w-2/5 text-left">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 text-white text-3xl font-extrabold">4</div>
                  <h3 className="text-2xl font-medium mb-4">manage everything in one place</h3>
                  <p className="text-neutral-600 mb-6">view club data, analyze attendance, and manage members all from a simple dashboard.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>all your events at a glance</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>member management</span>
                    </li>
                    <li className="flex items-center text-sm text-neutral-700">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>csv export for school records</span>
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
                      <a href="#" className="text-xs text-gray-500 hover:text-black mb-1 inline-block">
                        &larr; Back to My Clubs
                      </a>
                      <h3 className="text-xl font-semibold text-black mb-0.5">Book Club</h3>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span className="text-gray-500">Arts & Literature</span>
                        <span className="font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Code: BOOK123
                        </span>
                        <a href="#" className="text-xs text-black border-b border-gray-300 hover:border-black transition-colors flex items-center gap-1">
                          <QrCode className="w-3 h-3" />
                          Show Join QR Code
                        </a>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 max-w-3xl">Monthly meetings to discuss books and share recommendations</p>
                    </div>
                    
                    {/* Updated Tab Navigation with Delete button */}
                    <div className="flex space-x-1 pr-3 text-left">
                      <button className="px-4 pb-2 text-sm font-medium border-b-2 border-black text-black">
                        Events
                      </button>
                      <button className="px-4 pb-2 text-sm font-medium text-gray-500 hover:text-black">
                        Members
                      </button>
                      <button className="px-4 pb-2 text-sm font-medium text-gray-500 hover:text-black">
                        Attendance
                      </button>
                      <div className="flex-grow"></div>
                      <button className="px-3 pb-2 text-sm font-medium text-red-600 hover:text-red-800 hover:border-b-2 hover:border-red-600 transition-all flex items-center gap-1">
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
                        <button className="px-3 py-1.5 text-sm bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all flex items-center gap-1.5">
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
                                <button className="text-gray-400 hover:text-blue-600 p-1" title="Edit Event">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-purple-600 p-1" title="View Attendance">
                                  <BarChart3 className="w-4 h-4" />
                                </button>
                                <button className="text-gray-400 hover:text-red-600 p-1" title="Delete Event">
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
            className="text-center p-12 rounded-3xl mt-24"
            variants={welcomeVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6 text-black">and yes, it's completely free</h2>
            <p className="text-neutral-600 mb-8 max-w-xl mx-auto">get started with attendify, the best looking club management app</p>
            <motion.button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-black text-white font-medium rounded-lg hover:bg-neutral-900 transition-all duration-200 flex items-center gap-2 mx-auto"
              whileTap={{ scale: 0.98 }}
              >
              attendify your club
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Footer */}
          <motion.footer 
            className="mt-24 text-center text-sm text-neutral-500"
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