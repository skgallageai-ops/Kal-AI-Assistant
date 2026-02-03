import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Send, 
  Paperclip, 
  X, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  Image as ImageIcon,
  FileText,
  MessageSquare
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. API Key එක සහ AI Setup එක
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'ආයුබෝවන්! මම KAL AI සහායකයා. මට ඔබට අද උදව් කළ හැක්කේ කෙසේද?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    const userMessage = { 
      role: 'user', 
      content: input,
      attachments: attachments.map(a => ({ name: a.name, preview: a.preview }))
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsLoading(true);

    try {
      // 2. මොඩල් එක තෝරාගැනීම (Gemini 3 Flash)
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      let promptParts = [input || "මෙම ගොනු පරීක්ෂා කරන්න."];
      
      for (const att of currentAttachments) {
        if (att.preview) {
          const base64Data = att.preview.split(',')[1];
          promptParts.push({
            inlineData: { data: base64Data, mimeType: att.type }
          });
        }
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      
      setMessages(prev => [...prev, { role: 'bot', content: response.text() }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'සමාවෙන්න, දෝෂයක් සිදු වුණා. කරුණාකර ඔබගේ API Key එක Vercel හි නිවැරදිව ඇතුළත් කර ඇත්දැයි පරීක්ෂා කරන්න.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">KAL Assistant</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500 font-medium">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-indigo-50 dark:bg-indigo-900/30'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} className="text-indigo-600" />}
              </div>
              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`px-5 py-3.5 rounded-[1.5rem] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 dark:bg-slate-800 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.content}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.attachments.map((att, i) => (
                        <img key={i} src={att.preview} className="w-24 h-24 object-cover rounded-lg border border-white/20" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={20} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 rounded-[1.5rem] rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto relative">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4 p-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  <img src={att.preview} className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200" />
                  <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-3xl p-2 pl-4 border border-slate-200 dark:border-slate-700">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
              <Paperclip size={20} />
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Message KAL Assistant..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-2 resize-none"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="bg-indigo-600 text-white p-2 rounded-full disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}