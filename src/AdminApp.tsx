import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Mail, Settings as SettingsIcon, LogOut, MessageSquare, Archive, Inbox, Clock, CheckCircle, Bell } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MessageList from './pages/MessageList';
import MessageView from './pages/MessageView';
import Settings from './pages/Settings';

export default function AdminApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <MessageSquare className="w-6 h-6 text-indigo-600 mr-2" />
          <h1 className="font-semibold text-lg">Messaging System</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NavLink to="/" icon={<Inbox />} label="Dashboard" />
          <NavLink to="/messages" icon={<Mail />} label="Inbox" />
          <NavLink to="/settings" icon={<SettingsIcon />} label="Settings" />
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="w-6 h-6" />
              {/* <span className="absolute top-1 right-1 block w-2.5 h-2.5 rounded-full bg-red-500"></span> */}
            </button>
            <div className="text-sm font-medium text-gray-700">{user.email}</div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/messages" element={<MessageList />} />
            <Route path="/messages/:id" element={<MessageView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
        isActive 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className={`mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      {label}
    </Link>
  );
}
