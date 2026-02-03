import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Send, Paperclip, X, Bot, User, Loader2, 
  Plus, MessageSquare, Menu, Trash2, FileText
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key එක Vercel settings වල නමට අනුවම සකසා ඇත
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(apiKey);

const App = () => {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('kal_sessions');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'New Chat', messages: [{ role: 'bot', content: 'ආයුබෝවන්! මම KAL AI. මට ගොනු (Files) පරීක්ෂා කිරීමට හෝ ඕනෑම දෙයකට උදව් කළ හැකියි.' }] }];
  });
  const [currentSessionId, setCurrentSessionId] = useState(sessions[0].id);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachments, setAttachments] = useState([]);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('kal_sessions', JSON.stringify(sessions));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          file,
          preview: file.type.startsWith('image/') ? reader.result : null,
          name: file.name,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (!apiKey) {
      alert("API Key එක සොයාගත නොහැක. කරුණාකර Vercel Settings පරීක්ෂා කරන්න.");
      return;
    }

    const userMsg = { 
      role: 'user', 
      content: input,
      files: attachments.map(a => ({ name: a.name, type: a.type, preview: a.preview }))
    };
    
    const updatedMessages = [...currentSession.messages, userMsg];
    setSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages, title: input.slice(0, 25) || 'File Analysis' } : s));
    
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      let promptParts = [input || "Analyze this file"];
      
      for (const att of currentAttachments) {
        if (att.preview) {
          const base64Data = att.preview.split(',')[1];
          promptParts.push({ inlineData: { data: base64Data, mimeType: att.type } });
        }
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const botMsg = { role: 'bot', content: response.text() };
      
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, botMsg] } : s));
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, { role: 'bot', content: 'සමාවෙන්න, API දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.' }] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {isSidebarOpen && (
        <div className="w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-850 z-20">
          <button onClick={() => {
            const newS = { id: Date.now().toString(), title: 'New Chat', messages: [{ role: 'bot', content: 'ආයුබෝවන්!' }] };
            setSessions([newS, ...sessions]);
            setCurrentSessionId(newS.id);
          }} className="m-4 flex items-center gap-2 p-3 border border-indigo-200 rounded-xl hover:bg-indigo-50 text-indigo-600 font-medium transition-all">
            <Plus size={18} /> New Chat
          </button>
          <div className="flex-1 overflow-y-auto px-2">
            {sessions.map(s => (
              <div 
                key={s.id} 
                onClick={() => setCurrentSessionId(s.id)} 
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-1 relative transition-colors ${
                  currentSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 font-semibold' : 'hover:bg-slate-100