import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const features = [
    {
      title: 'Easy Attendance Tracking',
      description: 'Take attendance with just a few clicks. Our intuitive interface makes it simple to track who\'s present and who\'s absent.',
    },
    {
      title: 'Club Management',
      description: 'Create and manage multiple clubs, each with their own member list and attendance records.',
    },
    {
      title: 'Detailed Reports',
      description: 'Generate comprehensive attendance reports to track participation trends and identify attendance patterns.',
    },
    {
      title: 'User-Friendly Interface',
      description: 'Modern, clean design that\'s easy to navigate and use, whether you\'re a student or faculty member.',
    },
  ];

  return (
    <div className="page-container">
      <section className="text-center space-y-4">
        <h1>About Attendify</h1>
        <p className="max-w-3xl mx-auto text-xl">
          Attendify is a modern attendance tracking platform designed specifically for school clubs
          and organizations. We make it easy to manage attendance, so you can focus on what matters most
          - running your club.
        </p>
      </section>

      <section className="feature-grid">
        {features.map((feature, index) => (
          <div key={index} className="card border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-slate-600">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      <section className="card bg-blue-50 border border-blue-100">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900">
            Ready to get started?
          </h2>
          <p className="text-blue-700">
            Join the many clubs already using Attendify to streamline their attendance tracking.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/clubs" className="btn btn-primary">
              Create Your Club
            </Link>
            <Link to="/attendance" className="btn btn-secondary">
              Try It Out
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 