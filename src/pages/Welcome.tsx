import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

// Add gradient animation keyframes
const gradientAnimation = `
  @keyframes gradient {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }
`;

const FeatureIcon = ({ children, style }: { children: React.ReactNode, style: React.CSSProperties }) => (
  <div className={`bg-gradient-to-br w-12 h-12 flex items-center justify-center rounded-xl shadow-lg`} style={style}>
    {children}
  </div>
);

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: gradientAnimation }} />
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="mb-2">
            <h1 className="mb-1 flex justify-center items-center">
              <Logo 
                imageClassName="w-8 h-8 md:w-12 md:h-12"
                textClassName="text-2xl md:text-3xl"
              />
            </h1>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold mt-24 mb-8 bg-clip-text text-transparent bg-gradient-to-b from-gray-500 to-black" style={{ lineHeight: 1.25 }}>
            the simplest way to manage your club
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Multiple ways to check in, powerful management tools, and completely free forever.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => navigate('/login')}
              className="group relative px-5 py-4 bg-black text-white font-medium rounded-2xl hover:shadow-xl hover:bg-gray-900 transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">Create Your Club</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
            <button
              onClick={() => navigate('/join-flow')}
              className="group relative px-8 py-4 bg-white text-gray-900 font-medium rounded-2xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-2 border-black hover:border-gray-900 overflow-hidden"
            >
              <span className="relative z-10">Join a Club</span>
              <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>

        {/* Check-in Methods Section */}
        <section className="mb-20 py-16 bg-gradient-to-b from-white to-blue-50 rounded-3xl border border-gray-200">
          <h3 className="text-3xl font-bold text-center mb-4">Multiple Ways to Check In</h3>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Choose from various check-in methods to best suit your organization's needs</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at top left, #6366f1, #38bdf8, #f472b6)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Geo-Fenced Check-in</h4>
              <p className="text-gray-600">Only allow check-ins when members are physically at your event location</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at top right, #fbbf24, #f472b6, #38bdf8)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Time-Based Check-in</h4>
              <p className="text-gray-600">Set specific time windows when check-ins are allowed</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at bottom left, #34d399, #fbbf24, #f472b6)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-2 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">QR Code Check-in</h4>
              <p className="text-gray-600">Quick and easy check-in by scanning a QR code</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at bottom right, #f472b6, #6366f1, #34d399)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Link Check-in</h4>
              <p className="text-gray-600">Share a simple link for instant check-ins</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at 60% 40%, #38bdf8, #fbbf24, #6366f1)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Code Check-in</h4>
              <p className="text-gray-600">Use simple codes for quick access to events</p>
            </div>
          </div>
        </section>

        {/* Club Joining Methods Section */}
        <section className="mb-20 py-16 bg-gradient-to-b from-white to-emerald-50 rounded-3xl border border-gray-200">
          <h3 className="text-3xl font-bold text-center mb-4">Easy Ways to Join Clubs</h3>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Simple and quick methods for members to join your organization</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at top left, #38bdf8, #fbbf24, #34d399)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-2 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">QR Code Join</h4>
              <p className="text-gray-600">Scan a QR code to instantly join a club</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at top right, #6366f1, #f472b6, #fbbf24)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Link Join</h4>
              <p className="text-gray-600">Click a link to join instantly</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at bottom, #fbbf24, #38bdf8, #f472b6)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Code Join</h4>
              <p className="text-gray-600">Enter a simple code to join</p>
            </div>
          </div>
        </section>

        {/* Management Features Section */}
        <section className="mb-20 py-16 bg-gradient-to-b from-white to-purple-50 rounded-3xl border border-gray-200">
          <h3 className="text-3xl font-bold text-center mb-4">Powerful Management Features</h3>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Everything you need to run your organization efficiently</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at top left, #a78bfa, #f472b6, #fbbf24)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Event Scheduling</h4>
              <p className="text-gray-600">Schedule events with location, time, and recurring options</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at top right, #f472b6, #34d399, #6366f1)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Pre-approval List</h4>
              <p className="text-gray-600">Pre-approve members for quick and accurate check-ins</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <FeatureIcon style={{ background: 'radial-gradient(circle at bottom, #10b981, #f59e42, #818cf8)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </FeatureIcon>
              <h4 className="text-xl font-semibold mt-4 mb-2">Export Data</h4>
              <p className="text-gray-600">Export attendance data to CSV for analysis</p>
            </div>
          </div>
        </section>

        {/* Free Forever Banner */}
        <section className="mb-20">
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-200">
            <h3 className="text-[clamp(2.5rem,8vw,4.5rem)] font-bold mb-4 bg-[radial-gradient(circle_at_top_left,#FF0080,#7928CA,#FF4D4D,#F4D03F,#52E5E7)] text-transparent bg-clip-text bg-[length:200%_200%] animate-[gradient_8s_ease-in-out_infinite]">
              Completely Free Forever
            </h3>
            <p className="text-xl text-gray-600 mb-8">No hidden charges. No locked features. Everything included.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">∞</div>
                <div className="text-gray-600">Clubs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">∞</div>
                <div className="text-gray-600">Events</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">∞</div>
                <div className="text-gray-600">Members</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">∞</div>
                <div className="text-gray-600">Features</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setIsFaqOpen(!isFaqOpen)}
              className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-150"
            >
              <span className="text-lg font-medium text-gray-800">How can it be free?</span>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  isFaqOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Animate the dropdown content */}
            <div
              className={`overflow-hidden transition-[max-height,padding] duration-300 ease-in-out ${
                isFaqOpen ? 'max-h-40 p-6 border-t border-gray-200 bg-gray-50' : 'max-h-0 py-0 px-6'
              }`}
            >
              <p className="text-gray-600">i make no money from this project, I am broke</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              About Us
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact Support
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            © {new Date().getFullYear()} Attendify. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome; 