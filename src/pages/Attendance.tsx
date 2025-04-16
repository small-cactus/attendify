import React, { useState } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

const Attendance: React.FC = () => {
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [members] = useState<Array<any>>([]);
  const [records] = useState<Array<any>>([]);

  return (
    <Layout>
      <motion.div 
        className="min-h-screen py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="hero-text mb-6">Attendance</h1>
            <p className="hero-subtitle max-w-2xl mx-auto">
              Track and manage attendance for your clubs and events.
            </p>
          </motion.div>

          {members.length === 0 && records.length === 0 ? (
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="glass-card py-12">
                <p className="text-xl text-[#1d1d1f] mb-4">No attendance records yet</p>
                <p className="text-[#424245] mb-8">
                  Join or create a club to start tracking attendance.
                </p>
                <motion.button
                  onClick={() => window.location.href = '/clubs'}
                  className="primary-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Browse Clubs
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Take Attendance</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="club" className="block text-sm font-medium text-slate-700 mb-1">
                        Select Club
                      </label>
                      <select
                        id="club"
                        value={selectedClub}
                        onChange={(e) => setSelectedClub(e.target.value)}
                      >
                        <option value="">Select a club...</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Members</h2>
                  {members.length > 0 ? (
                    <div className="space-y-2">
                      {members.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
                        >
                          <span className="text-slate-900">{member.name}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={member.present}
                              onChange={() => {}}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                      <div className="mt-6">
                        <button className="btn btn-primary w-full">
                          Save Attendance
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                      <p className="text-slate-600">Select a club to view members</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Recent Attendance Records</h2>
                {records.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Club</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(record => (
                          <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>{record.clubName}</td>
                            <td>{record.presentCount}</td>
                            <td>{record.absentCount}</td>
                            <td>
                              <button className="btn btn-secondary text-sm">
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-600">No attendance records yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Attendance; 