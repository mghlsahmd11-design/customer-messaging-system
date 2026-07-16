import React, { useEffect, useState } from 'react';
import { doc, getDocs, collection, setDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    senderName: '',
    senderEmail: '',
    replyToEmail: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: ''
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'settings'));
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          setSettingsId(docData.id);
          setSettings({ ...settings, ...docData.data() });
        }
      } catch (err) {
        console.error('Error fetching settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const dataToSave = {
        ...settings,
        ownerId: auth.currentUser?.uid,
        updatedAt: new Date().toISOString()
      };

      if (settingsId) {
        await setDoc(doc(db, 'settings', settingsId), dataToSave, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'settings'), dataToSave);
        setSettingsId(docRef.id);
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Email & SMTP Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure how emails are sent to customers when you reply to their messages.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} border`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Sender Information</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">Sender Name</label>
              <input type="text" name="senderName" id="senderName" value={settings.senderName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700">Sender Email</label>
              <input type="email" name="senderEmail" id="senderEmail" value={settings.senderEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="replyToEmail" className="block text-sm font-medium text-gray-700">Reply-To Email (Optional)</label>
              <input type="email" name="replyToEmail" id="replyToEmail" value={settings.replyToEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">SMTP Server</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">SMTP Host</label>
              <input type="text" name="smtpHost" id="smtpHost" required value={settings.smtpHost} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="smtp.gmail.com" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">Port</label>
              <input type="text" name="smtpPort" id="smtpPort" required value={settings.smtpPort} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="587" />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">SMTP Username</label>
              <input type="text" name="smtpUser" id="smtpUser" required value={settings.smtpUser} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="smtpPass" className="block text-sm font-medium text-gray-700">SMTP Password</label>
              <input type="password" name="smtpPass" id="smtpPass" required value={settings.smtpPass} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        </div>

        <div className="pt-5 flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
