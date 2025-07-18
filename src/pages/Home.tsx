import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Home: React.FC = () => {
  console.log('Home component rendering');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    console.log('useEffect running - this should appear in console');
    const startAutoScroll = () => {
      console.log('startAutoScroll called');
      isScrollingRef.current = true;
      const scrollStep = 3;
      const scrollInterval = 50;

      const scrollDown = () => {
        if (isScrollingRef.current) {
          console.log('Scrolling by', scrollStep, 'pixels');
          window.scrollBy(0, scrollStep);
          setTimeout(scrollDown, scrollInterval);
        } else {
          console.log('Auto-scroll stopped');
        }
      };

      scrollDown();
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isScrollingRef.current = false;
      
      timeoutRef.current = setTimeout(() => {
        console.log('Timer fired, starting auto-scroll');
        if (!isScrollingRef.current) {
          startAutoScroll();
        }
      }, 1000);
    };

    const handleUserActivity = (event: Event) => {
      console.log('User activity detected:', event.type);
      if (isScrollingRef.current) {
        console.log('Stopping auto-scroll due to user activity');
        isScrollingRef.current = false;
      }
      resetTimer();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    console.log('Effect initialized, setting up timer');
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[1000px] h-[1000px] -right-[200px] -top-[400px] rounded-full bg-gradient-to-br from-purple-50 to-blue-50"></div>
            <div className="absolute w-[1000px] h-[1000px] -left-[300px] top-[200px] rounded-full bg-gradient-to-br from-blue-50 to-purple-50"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-6 text-center">
            <h1 className="hero-text mb-8" role="heading">
              Attendance tracking,
              <br />
              reimagined.
            </h1>
            <p className="hero-subtitle max-w-3xl mx-auto mb-12">
              The smart way to track attendance for school clubs and organizations.
              Simple, efficient, and beautifully designed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/clubs" className="primary-button w-full sm:w-auto">
                Get Started
              </Link>
              <Link to="/about" className="secondary-button w-full sm:w-auto">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card feature-card">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">Easy Tracking</h3>
                <p className="text-[#424245]">
                  Record attendance with just a few clicks. No more paper sheets or Excel files.
                </p>
              </div>

              <div className="glass-card feature-card">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">Club Management</h3>
                <p className="text-[#424245]">
                  Organize and manage multiple clubs from one central dashboard.
                </p>
              </div>

              <div className="glass-card feature-card">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">Instant Reports</h3>
                <p className="text-[#424245]">
                  Generate attendance reports instantly for better insights and planning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional content for scrolling */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-8">Why Choose Attendify?</h2>
            <p className="text-lg text-[#424245] max-w-2xl mx-auto mb-12">
              Join thousands of organizations already using Attendify to streamline their attendance tracking process.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-4">Real-time Analytics</h3>
                <p className="text-[#424245]">Get instant insights into attendance patterns and member engagement with our comprehensive analytics dashboard.</p>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-4">Mobile Friendly</h3>
                <p className="text-[#424245]">Access your attendance data anywhere, anytime with our responsive design that works perfectly on all devices.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-8">Ready to Get Started?</h2>
            <p className="text-lg text-[#424245] max-w-2xl mx-auto mb-12">
              Transform your attendance tracking experience today with Attendify's powerful yet simple platform.
            </p>
            <Link to="/clubs" className="primary-button">
              Start Your Free Trial
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home; 