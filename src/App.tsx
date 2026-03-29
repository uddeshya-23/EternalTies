import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  ChevronDown,
  PieChart as PieChartIcon,
  List as ListIcon,
  Calendar as CalendarIcon,
  Gem,
  Shirt,
  Hotel,
  UtensilsCrossed,
  Camera,
  Palmtree,
  Music,
  Gift,
  MoreHorizontal,
  Download,
  Upload,
  Mic,
  Sparkles,
  Wand2,
  X,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";

import { Expense, Category, CategorySummary } from './types';
import { INITIAL_EXPENSES, CATEGORY_COLORS } from './constants';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_ICONS: Record<Category, any> = {
  'Gold & Jewelry': Gem,
  'Family Clothes': Shirt,
  'Engagement': Hotel,
  'Janeu Ceremony': UtensilsCrossed,
  'Marriage Clothes': Shirt,
  'Catering': UtensilsCrossed,
  'Venue': Palmtree,
  'Decor': Gift,
  'Photography': Camera,
  'Others': MoreHorizontal,
};

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('marriage_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [isMagicAssistantOpen, setIsMagicAssistantOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  // Magic Assistant State
  const [magicInput, setMagicInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [aiPreview, setAiPreview] = useState<Expense[] | null>(null);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: 'Others',
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    localStorage.setItem('marriage_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paid = expenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [expenses]);

  const categoryData = useMemo(() => {
    const data: CategorySummary[] = Object.keys(CATEGORY_COLORS).map(cat => {
      const catExpenses = expenses.filter(e => e.category === cat);
      const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      const paid = catExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
      return {
        name: cat as Category,
        total,
        paid,
        pending: total - paid,
        color: CATEGORY_COLORS[cat as Category]
      };
    }).filter(c => c.total > 0);
    return data;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterCategory, filterStatus, searchQuery]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      title: newExpense.title!,
      amount: Number(newExpense.amount),
      category: newExpense.category as Category,
      status: newExpense.status as 'Paid' | 'Pending',
      date: newExpense.date || new Date().toISOString().split('T')[0]
    };
    
    setExpenses([expense, ...expenses]);
    setIsAdding(false);
    setNewExpense({
      title: '',
      amount: 0,
      category: 'Others',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const toggleStatus = (id: string) => {
    setExpenses(expenses.map(e => 
      e.id === id ? { ...e, status: e.status === 'Paid' ? 'Pending' : 'Paid' } : e
    ));
  };

  const deleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `marriage_expenses_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          setExpenses(json);
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  // AI Logic
  const processWithAI = async (input: string | Blob) => {
    setIsProcessing(true);
    setAiPreview(null);
    try {
      const systemInstruction = `You are a wedding expense assistant. Your task is to extract structured expense data from user input (text or audio transcription). 
      Return ONLY a JSON array of objects. Each object MUST have:
      - title: string (descriptive name)
      - amount: number (total item cost in INR)
      - category: string (one of: 'Gold & Jewelry', 'Family Clothes', 'Engagement', 'Janeu Ceremony', 'Marriage Clothes', 'Catering', 'Venue', 'Decor', 'Photography', 'Others')
      - status: 'Paid' or 'Pending'
      - date: string (YYYY-MM-DD, use today's date if not specified: 2026-03-29)

      Special handling:
      - If a line says 'X - Y adv = Z pending', create an expense for X with amount Y (Paid) and another for X (Pending) with amount Z.
      - If a line lists multiple people with individual amounts like 'A (10k) + B (5k)', create separate expenses for A and B.
      - Convert 'lac' or 'lakh' to 100,000.
      - Convert 'k' to 1,000.
      - If an item has no price, ignore it.
      - If multiple items are listed in one line, split them if they have distinct prices.`;

      let result;
      if (typeof input === 'string') {
        result = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: input }] }],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  status: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["title", "amount", "category", "status", "date"]
              }
            }
          }
        });
      } else {
        // Handle audio
        const base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(input);
        });

        result = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ 
            role: 'user', 
            parts: [
              { text: "Extract expenses from this audio recording." },
              { inlineData: { mimeType: input.type, data: base64Audio } }
            ] 
          }],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  status: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["title", "amount", "category", "status", "date"]
              }
            }
          }
        });
      }

      const parsed = JSON.parse(result.text);
      setAiPreview(parsed.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9) })));
    } catch (error) {
      console.error("AI Processing Error:", error);
      alert("Failed to process with AI. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        processWithAI(blob);
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required for voice recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const confirmAiAdd = () => {
    if (aiPreview) {
      setExpenses([...aiPreview, ...expenses]);
      setAiPreview(null);
      setIsMagicAssistantOpen(false);
      setMagicInput('');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif text-wedding-slate">Eternal Ties</h1>
              <p className="text-gray-500 text-sm">Marriage Expense Planner & Tracker</p>
            </div>
            <button 
              onClick={() => setIsMagicAssistantOpen(true)}
              className="p-2 bg-wedding-gold/10 text-wedding-gold rounded-full hover:bg-wedding-gold/20 transition-colors flex items-center gap-2 px-4 text-sm font-semibold"
            >
              <Sparkles size={18} />
              <span className="hidden sm:inline">Magic Assistant</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="btn-secondary flex items-center gap-2 cursor-pointer py-2 px-4 text-sm">
              <Upload size={16} />
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button 
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
            >
              <Download size={16} />
              Export
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-wedding-gold/10 rounded-full flex items-center justify-center text-wedding-gold">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Budget</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.total)}</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-green-500"
          >
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Paid</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-orange-500"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Amount</p>
              <h3 className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending)}</h3>
            </div>
          </motion.div>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                viewMode === 'list' ? "bg-white shadow-sm text-wedding-slate" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <ListIcon size={18} />
              List View
            </button>
            <button 
              onClick={() => setViewMode('chart')}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                viewMode === 'chart' ? "bg-white shadow-sm text-wedding-slate" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <PieChartIcon size={18} />
              Analytics
            </button>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-wedding-gold/20 w-full"
              />
            </div>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
            >
              <option value="All">All Categories</option>
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <motion.div 
                    layout
                    key={expense.id}
                    className="glass-card p-4 flex items-center justify-between group hover:border-wedding-gold/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" 
                        style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}
                      >
                        {React.createElement(CATEGORY_ICONS[expense.category] || MoreHorizontal, { size: 24 })}
                      </div>
                      <div>
                        <h4 className="font-semibold text-wedding-slate">{expense.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-md text-gray-500">
                            {expense.category}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CalendarIcon size={12} />
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                        <button 
                          onClick={() => toggleStatus(expense.id)}
                          className={cn(
                            "text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full transition-colors",
                            expense.status === 'Paid' 
                              ? "bg-green-100 text-green-700" 
                              : "bg-orange-100 text-orange-700"
                          )}
                        >
                          {expense.status}
                        </button>
                      </div>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400">No expenses found matching your filters.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="chart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="glass-card p-8 h-[400px]">
                <h3 className="text-xl font-serif mb-6">Spending by Category</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="total"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-8 space-y-6 overflow-y-auto max-h-[400px]">
                <h3 className="text-xl font-serif">Category Breakdown</h3>
                {categoryData.sort((a, b) => b.total - a.total).map((cat) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="font-bold">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-green-500 transition-all duration-1000" 
                        style={{ width: `${(cat.paid / cat.total) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-orange-400 transition-all duration-1000" 
                        style={{ width: `${(cat.pending / cat.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-400">
                      <span>Paid: {formatCurrency(cat.paid)}</span>
                      <span>Pending: {formatCurrency(cat.pending)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Magic Assistant Modal */}
      <AnimatePresence>
        {isMagicAssistantOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessing) setIsMagicAssistantOpen(false);
              }}
              className="absolute inset-0 bg-wedding-slate/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-serif text-wedding-slate flex items-center gap-3">
                      <Sparkles className="text-wedding-gold" size={32} />
                      Magic Assistant
                    </h2>
                    <p className="text-gray-500 mt-2">Speak or paste your mother's notes to auto-extract expenses.</p>
                  </div>
                  <button 
                    onClick={() => setIsMagicAssistantOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {!aiPreview ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <textarea 
                        value={magicInput}
                        onChange={(e) => setMagicInput(e.target.value)}
                        placeholder="Paste notes here... e.g. 'Gold - ₹ 19.5 lac - 12lac adv = ₹ 7.5lac pending'"
                        className="w-full h-48 p-6 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-wedding-gold/20 resize-none text-lg"
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button 
                          onClick={isRecording ? stopRecording : startRecording}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                            isRecording ? "bg-red-500 text-white animate-pulse" : "bg-wedding-gold text-white hover:scale-105"
                          )}
                        >
                          <Mic size={24} />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => processWithAI(magicInput)}
                      disabled={!magicInput.trim() || isProcessing}
                      className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="animate-spin" size={24} />
                          Analyzing notes...
                        </>
                      ) : (
                        <>
                          <Wand2 size={24} />
                          Extract Expenses
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-wedding-gold/5 p-6 rounded-3xl border border-wedding-gold/10 max-h-[300px] overflow-y-auto space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-wedding-gold mb-4">Preview Extracted Items</h4>
                      {aiPreview.map((e, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                          <div>
                            <p className="font-semibold text-wedding-slate">{e.title}</p>
                            <p className="text-xs text-gray-400">{e.category} • {e.status}</p>
                          </div>
                          <p className="font-bold text-wedding-gold">{formatCurrency(e.amount)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setAiPreview(null)}
                        className="flex-1 btn-secondary py-4"
                      >
                        Try Again
                      </button>
                      <button 
                        onClick={confirmAiAdd}
                        className="flex-1 btn-primary py-4"
                      >
                        Add All to Tracker
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-wedding-slate/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-serif mb-6">Add New Expense</h2>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Item Name</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. Catering Advance"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-wedding-gold/20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-gray-400">Amount (₹)</label>
                      <input 
                        required
                        type="number" 
                        placeholder="0"
                        value={newExpense.amount || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-wedding-gold/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-gray-400">Status</label>
                      <select 
                        value={newExpense.status}
                        onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-wedding-gold/20"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-wedding-gold/20"
                    >
                      {Object.keys(CATEGORY_COLORS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Date</label>
                    <input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-wedding-gold/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 btn-primary"
                    >
                      Save Expense
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <button 
          onClick={() => setIsMagicAssistantOpen(true)}
          className="w-14 h-14 bg-wedding-slate text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Sparkles size={28} />
        </button>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-wedding-gold text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
