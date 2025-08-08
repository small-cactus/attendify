import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { ClipboardCheck, Users, BarChart } from 'lucide-react';

const features = [
  {
    title: 'Easy Tracking',
    description: 'Record attendance with just a few clicks. No more paper sheets or Excel files.',
    icon: ClipboardCheck,
  },
  {
    title: 'Club Management',
    description: 'Organize and manage multiple clubs from one central dashboard.',
    icon: Users,
  },
  {
    title: 'Instant Reports',
    description: 'Generate attendance reports instantly for better insights and planning.',
    icon: BarChart,
  },
];

const Home: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-[#f5f5f7] to-white" />
          <div className="max-w-6xl mx-auto px-6 pt-32 pb-40 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hero-text mb-8"
              role="heading"
            >
              Attendance tracking,
              <br />
              reimagined.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hero-subtitle max-w-3xl mx-auto mb-12"
            >
              The smart way to track attendance for school clubs and organizations. Simple, efficient, and beautifully designed.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/clubs" className="primary-button w-full sm:w-auto">
                Get Started
              </Link>
              <Link to="/about" className="secondary-button w-full sm:w-auto">
                Learn More
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-32 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card feature-card h-full"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-6 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[#1d1d1f]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#424245]">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-32">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#1d1d1f] mb-8"
            >
              Why Choose Attendify?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-[#424245] max-w-2xl mx-auto mb-12"
            >
              Join thousands of organizations already using Attendify to streamline their attendance tracking process.
            </motion.p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Real-time Analytics</h3>
                <p className="text-[#424245]">
                  Get instant insights into attendance patterns and member engagement with our comprehensive analytics dashboard.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-xl font-semibold mb-4">Mobile Friendly</h3>
                <p className="text-[#424245]">
                  Access your attendance data anywhere, anytime with our responsive design that works perfectly on all devices.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#1d1d1f] mb-8"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-[#424245] max-w-2xl mx-auto mb-12"
            >
              Transform your attendance tracking experience today with Attendify's powerful yet simple platform.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/clubs" className="primary-button">
                Start Your Free Trial
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
