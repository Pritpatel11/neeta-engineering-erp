import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Printer, 
  Key, 
  RefreshCw, 
  ShieldCheck, 
  Database 
} from 'lucide-react';
import { chatWithAi, saveGroqApiKey } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AiChatDrawer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste ${user?.name || 'User'}! Main Neeta Engineering ERP ka AI Accounting Assistant hoon. Aap mujhse transactions, inventory stock, challan ya statement ke baare me pooch sakte hain.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpenAi = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenAi);
    return () => window.removeEventListener('open-ai-chat', handleOpenAi);
  }, []);

  // Check if user is authenticated
  if (!user) {
    return null;
  }

  const handleSendMessage = async (textToSend, confirmedAction = null) => {
    const text = textToSend || (confirmedAction ? 'Confirming and generating document...' : inputValue);
    if ((!text.trim() && !confirmedAction) || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await chatWithAi(updatedMessages, confirmedAction);
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        toolsUsed: data.toolsUsed,
        interactiveCard: data.interactiveCard,
        engine: data.engine,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat failed:', error);
      const errText = error.response?.data?.message || 'AI service error. Please verify backend connection.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errText}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    try {
      await saveGroqApiKey(apiKeyInput.trim());
      toast.success('Groq API Key saved successfully!');
      setShowKeyModal(false);
      setApiKeyInput('');
    } catch (error) {
      toast.error('Failed to save API key: ' + error.message);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button 
          className="fixed bottom-6 right-7 z-40 flex items-center gap-2.5 bg-[#0059bb] hover:bg-[#004799] text-white border-none rounded-full px-5 py-3 text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer" 
          onClick={() => setIsOpen(true)}
          title="Open AI Accounting Assistant (Groq Llama 3.3)"
        >
          <Bot size={20} />
          <span>AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Drawer Modal Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0059bb] flex items-center justify-center">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">ERP AI Assistant</h3>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Database size={11} className="text-[#0059bb]" />
                    <span>Groq Llama 3.3 • RBAC Governed</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-500">
                {user.role === 'admin' && (
                  <button
                    className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    onClick={() => setShowKeyModal(true)}
                    title="Configure Groq API Key (Admin)"
                  >
                    <Key size={17} />
                  </button>
                )}
                <button
                  className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setMessages([messages[0]])}
                  title="Clear Chat History"
                >
                  <RefreshCw size={17} />
                </button>
                <button 
                  className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
                  onClick={() => setIsOpen(false)} 
                  title="Close Drawer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={index} 
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isUser ? 'bg-[#0059bb] text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isUser ? (user?.name?.charAt(0).toUpperCase() || 'U') : <Bot size={16} />}
                    </div>

                    <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Tool execution badge if tools were executed */}
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {msg.toolsUsed.map((t, ti) => (
                            <span key={ti} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={12} />
                              <span>Verified Tool: {t.name}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-[#0059bb] text-white rounded-tr-xs shadow-xs whitespace-pre-wrap' 
                          : msg.isError 
                            ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-xs whitespace-pre-wrap' 
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                      }`}>
                        <FormattedMessage content={msg.content} isUser={isUser} />

                        {/* Interactive Card: Missing Fields Checklist */}
                        {msg.interactiveCard?.type === 'missing_fields_checklist' && (
                          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                            <div className="flex items-center gap-1.5 font-bold mb-2 text-rose-700">
                              <AlertCircle size={15} />
                              <span>Missing Required Challan Fields</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 mb-2 font-medium">
                              {msg.interactiveCard.missingFields?.map((f, fi) => (
                                <li key={fi}>{f}</li>
                              ))}
                            </ul>
                            <p className="text-[11px] text-slate-500">
                              Tip: Reply directly with the missing information to proceed.
                            </p>
                          </div>
                        )}

                        {/* Interactive Card: Confirm Challan Creation */}
                        {msg.interactiveCard?.type === 'confirm_challan_creation' && (
                          <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-slate-800">
                            <div className="flex items-center gap-1.5 font-bold mb-2 text-[#0059bb]">
                              <FileText size={15} />
                              <span>Confirm Delivery Challan Details</span>
                            </div>
                            <div className="space-y-1 mb-3">
                              <div>• <strong>Party:</strong> {msg.interactiveCard.data?.contractorName}</div>
                              <div>• <strong>Date:</strong> {msg.interactiveCard.data?.date}</div>
                              <div>• <strong>Division:</strong> {msg.interactiveCard.data?.divisionName}</div>
                              <div>• <strong>Vehicle:</strong> {msg.interactiveCard.data?.vehicleNumber}</div>
                              <div>• <strong>Materials:</strong> {msg.interactiveCard.data?.materials?.map(m => `${m.description} (${m.quantity} ${m.unit || 'Kg'})`).join(', ')}</div>
                            </div>
                            <button
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                              onClick={() => {
                                handleSendMessage('', {
                                  action: 'confirm_create_challan',
                                  data: msg.interactiveCard.data
                                });
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Confirm & Create Record</span>
                            </button>
                          </div>
                        )}

                        {/* Interactive Card: Generated Challan Success */}
                        {msg.interactiveCard?.type === 'challan_created' && (
                          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-slate-800">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                              <CheckCircle2 size={16} />
                              <span>Challan Saved: {msg.interactiveCard.data?.challanNo}</span>
                            </div>
                            <p className="text-slate-600 mb-2.5">
                              Contractor: <strong>{msg.interactiveCard.data?.contractorName}</strong> • Date: {msg.interactiveCard.data?.date}
                            </p>
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/challan-preview', {
                                  state: { challanData: msg.interactiveCard.data?.previewState?.challanData || msg.interactiveCard.data },
                                });
                              }}
                            >
                              <Printer size={14} />
                              <span>View & Print Challan</span>
                            </button>
                          </div>
                        )}

                        {/* Interactive Card: Statement Document */}
                        {msg.interactiveCard?.type === 'statement_document' && (
                          <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-slate-800">
                            <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1">
                              <FileText size={16} />
                              <span>Verified Statement Ready</span>
                            </div>
                            <p className="text-slate-600 mb-2.5">
                              Party: <strong>{msg.interactiveCard.data?.contractorName || 'Client Party'}</strong> • Date: {msg.interactiveCard.data?.date}
                            </p>
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0059bb] hover:bg-[#004799] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/statement-preview', {
                                  state: { statementData: msg.interactiveCard.data },
                                });
                              }}
                            >
                              <Printer size={14} />
                              <span>View & Download Statement</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-xs text-sm text-slate-500 flex items-center gap-2">
                    <Sparkles size={16} className="animate-spin text-[#0059bb]" />
                    <span>Analyzing database & checking permissions...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  type="text"
                  className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb] transition-all"
                  placeholder="Ask in Hindi, English, or Hinglish..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="p-2.5 bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer" 
                  disabled={isLoading || !inputValue.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Authorized personnel only. Queries are audited with employee credentials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Groq API Key Configuration Modal */}
      {showKeyModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" 
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Groq API Key Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Enter your Groq API Key (starts with <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">gsk_...</code>). It will be saved securely to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">.env</code>.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <input
                type="password"
                placeholder="gsk_..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0059bb]/20 focus:border-[#0059bb]"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" 
                  onClick={() => setShowKeyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-semibold bg-[#0059bb] hover:bg-[#004899] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Dynamic Markdown & Inventory Table Formatter
function FormattedMessage({ content, isUser }) {
  if (isUser || !content) {
    return <span>{content}</span>;
  }

  // Parse inline formatting like **bold**
  const parseInline = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements = [];
  let tableLines = [];
  let inTable = false;

  const flushTable = (key) => {
    if (tableLines.length >= 2) {
      const headerLine = tableLines[0];
      const dataLines = tableLines.slice(2); // Skip separator row

      const headers = headerLine
        .split('|')
        .map(h => h.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      const rows = dataLines.map(line =>
        line
          .split('|')
          .map(cell => cell.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );

      elements.push(
        <div key={`table-${key}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                {headers.map((h, hi) => {
                  const isNumHeader = /balance|qty|adjustment|quantity|amount|total/i.test(h);
                  return (
                    <th key={hi} className={`px-3 py-2 ${isNumHeader ? 'text-right' : 'text-left'}`}>
                      {parseInline(h)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/70 transition-colors">
                  {row.map((cell, ci) => {
                    const isNum = /^-?\d+(\.\d+)?$/.test(cell.replace(/,/g, ''));
                    const isNeg = cell.trim().startsWith('-');
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-2 ${
                          isNum ? 'text-right font-mono font-semibold' : 'text-slate-800'
                        } ${isNeg ? 'text-rose-600 font-bold' : ''}`}
                      >
                        {parseInline(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableLines = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is part of a Markdown Table (starts and ends with |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableLines.push(trimmed);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    // Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      const qText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-1.5 border-l-3 border-[#0059bb] bg-blue-50/50 px-3 py-1.5 rounded-r-lg text-xs text-slate-700 font-medium"
        >
          {parseInline(qText)}
        </blockquote>
      );
      continue;
    }

    // Standard line with inline formatting
    elements.push(
      <p key={`p-${i}`} className="my-0.5">
        {parseInline(line)}
      </p>
    );
  }

  if (inTable) {
    flushTable('end');
  }

  return <div className="space-y-0.5">{elements}</div>;
}
