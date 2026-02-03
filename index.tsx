import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Send, Paperclip, X, Bot, User, Loader2, 
  Plus, MessageSquare, Menu, History, Trash2 
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const App = () => {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('kal_sessions');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'New Chat', messages: [{ role: 'bot', content: 'ආයුබෝවන්! මම KAL AI. මට ඔබට අද උදව් කළ හැක්කේ කෙසේද?' }] }];
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
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  const createNewChat = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{ role: 'bot', content: 'ආයුබෝවන්! අලුත් චැට් එකක් පටන් ගමු.' }]
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    if (newSessions.length === 0) {
      createNewChat();
    } else {
      setSessions(newSessions);
      if (currentSessionId === id) setCurrentSessionId(newSessions[0].id);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMsg = { role: 'user', content: input };
    const updatedMessages = [...currentSession.messages, userMsg];
    
    setSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages, title: input.slice(0, 20) || 'Image Chat' } : s));
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent(input);
      const response = await result.response;
      
      const botMsg = { role: 'bot', content: response.text() };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, botMsg] } : s));
    } catch (error) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, { role: 'bot', content: 'සමාවෙන්න, API දෝෂයක්. පසුව උත්සාහ කරන්න.' }] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900">
          <button onClick={createNewChat} className="m-4 flex items-center gap-2 p-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all font-medium">
            <Plus size={18} /> New Chat
          </button>
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {sessions.map(s => (
              <div key={s.id} onClick={() => setCurrentSessionId(s.id)} className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                <MessageSquare size={18} />
                <span className="flex-1 truncate text-sm">{s.title}</span>
                <Trash2 size={14} onClick={(e) => deleteChat(s.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-red-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu size={20} />
          </button>
          <h1 className="font-bold">KAL AI Assistant</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="max-w-3xl mx-auto">
            {currentSession.messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 mb-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600 text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-3xl mx-auto flex gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message KAL..." 
              className="flex-1 bg-transparent border-none focus:ring-0 px-2"
            />
            <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 text-white p-2 rounded-xl">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);