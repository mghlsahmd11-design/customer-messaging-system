import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, CheckCircle, Archive, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, newMsg: 0, replied: 0, archived: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let total = msgs.length;
        let newMsg = 0;
        let replied = 0;
        let archived = 0;

        msgs.forEach((m: any) => {
          if (m.status === 'New') newMsg++;
          else if (m.status === 'Replied') replied++;
          else if (m.status === 'Archived') archived++;
        });

        setStats({ total, newMsg, replied, archived });
        setRecent(msgs.slice(0, 5));
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Messages" value={stats.total} icon={<Mail className="w-6 h-6 text-gray-400" />} />
        <StatCard title="New Messages" value={stats.newMsg} icon={<MessageCircle className="w-6 h-6 text-blue-500" />} />
        <StatCard title="Replied" value={stats.replied} icon={<CheckCircle className="w-6 h-6 text-green-500" />} />
        <StatCard title="Archived" value={stats.archived} icon={<Archive className="w-6 h-6 text-yellow-500" />} />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Messages</h3>
          <Link to="/messages" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
        </div>
        <ul className="divide-y divide-gray-200">
          {recent.length === 0 ? (
            <li className="px-6 py-4 text-gray-500">No messages yet.</li>
          ) : (
            recent.map((msg) => (
              <li key={msg.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-indigo-600 truncate">{msg.name}</p>
                  <p className="text-sm text-gray-500 truncate">{msg.subject}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${msg.status === 'New' ? 'bg-blue-100 text-blue-800' : 
                      msg.status === 'Replied' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.status}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{new Date(msg.date).toLocaleDateString()}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
