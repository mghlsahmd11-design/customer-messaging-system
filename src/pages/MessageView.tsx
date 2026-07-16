import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ArrowLeft, Send } from 'lucide-react';

export default function MessageView() {
  const { id } = useParams<{ id: string }>();
  const [msg, setMsg] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    // Fetch Message
    const fetchMsg = async () => {
      const docRef = doc(db, 'messages', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMsg({ id: docSnap.id, ...data });
        
        // Mark as read if it is New
        if (data.status === 'New') {
          await updateDoc(docRef, { status: 'Read' });
          setMsg(prev => ({ ...prev, status: 'Read' }));
        }
      }
    };
    fetchMsg();

    // Listen to replies
    const q = query(collection(db, 'replies'), where('messageId', '==', id), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const r = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReplies(r);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !id || !msg) return;
    
    setSending(true);
    setError('');
    
    try {
      const token = await auth.currentUser?.getIdToken();

      // 1. Get Settings for SMTP
      const settingsSnap = await getDocs(query(collection(db, 'settings'), limit(1)));
      if (settingsSnap.empty) {
        throw new Error('SMTP settings not configured. Please configure in Settings first.');
      }
      const settings = settingsSnap.docs[0].data();

      // 2. Call backend to send email
      const res = await fetch(`/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          to: msg.email,
          subject: msg.subject,
          text: replyText,
          settings 
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }
      
      // 3. Save reply to DB and update message status
      await addDoc(collection(db, 'replies'), {
        messageId: id,
        from: 'Admin',
        text: replyText,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'messages', id), {
        status: 'Replied',
        updatedAt: serverTimestamp()
      });

      setReplyText('');
      setMsg(prev => ({ ...prev, status: 'Replied' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!msg) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 sm:px-6 flex items-center justify-between bg-gray-50">
        <div className="flex items-center">
          <Link to="/messages" className="mr-4 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{msg.subject}</h3>
            <p className="text-sm text-gray-500">{msg.name} &lt;{msg.email}&gt;</p>
          </div>
        </div>
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${msg.status === 'New' ? 'bg-blue-100 text-blue-800' : 
              msg.status === 'Replied' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {msg.status}
        </span>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {/* Original Message */}
        <div className="flex flex-col items-start">
          <div className="flex items-baseline mb-1">
            <span className="font-medium text-gray-900 mr-2">{msg.name}</span>
            <span className="text-xs text-gray-500">{new Date(msg.date).toLocaleString()}</span>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm text-gray-800 whitespace-pre-wrap border border-gray-100 max-w-2xl">
            {msg.message}
          </div>
        </div>

        {/* Replies */}
        {replies.map(r => (
          <div key={r.id} className={`flex flex-col ${r.from === 'Admin' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-baseline mb-1">
              <span className="font-medium text-gray-900 mr-2">{r.from === 'Admin' ? 'Support' : r.from}</span>
              <span className="text-xs text-gray-500">{new Date(r.date).toLocaleString()}</span>
            </div>
            <div className={`px-4 py-3 rounded-lg shadow-sm text-gray-800 whitespace-pre-wrap max-w-2xl
              ${r.from === 'Admin' ? 'bg-indigo-50 border border-indigo-100 rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
              {r.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleReply} className="flex flex-col">
          <label htmlFor="reply" className="sr-only">Reply</label>
          <textarea
            id="reply"
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
            placeholder="Type your reply here..."
            required
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
