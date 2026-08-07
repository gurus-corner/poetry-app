import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Maximize2, Minimize2, Sun, Moon, Plus, X, Tag, Sparkles, User as UserIcon, LogOut, Lock, Heart, Eye, Pencil, Trash2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001';
const MOODS = ['All', 'Melancholic', 'Hopeful', 'Reflective', 'Nature', 'Romantic', 'Cosmic'];

export default function App() {
  const [poems, setPoems] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [selectedMood, setSelectedMood] = useState('All');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('text-lg');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('poetry_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('poetry_token') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth Form Fields
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Write/Edit Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingPoemId, setEditingPoemId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('Reflective');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPoems(selectedMood);
  }, [selectedMood]);

  const fetchPoems = async (mood) => {
    try {
      const url = mood && mood !== 'All' 
        ? `${API_BASE}/poems?mood=${encodeURIComponent(mood)}`
        : `${API_BASE}/poems`;
      
      const res = await axios.get(url);
      setPoems(res.data);
      if (res.data.length > 0 && !selectedPoem) {
        handleSelectPoem(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching poems:', err);
    }
  };

  const handleSelectPoem = async (poem) => {
    setSelectedPoem(poem);
    try {
      const res = await axios.post(`${API_BASE}/poems/${poem.id}/view`);
      setSelectedPoem(res.data);
      setPoems((prev) => prev.map((p) => (p.id === poem.id ? res.data : p)));
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLikePoem = async (poemId) => {
    try {
      const res = await axios.post(`${API_BASE}/poems/${poemId}/like`);
      setSelectedPoem(res.data);
      setPoems((prev) => prev.map((p) => (p.id === poemId ? res.data : p)));
    } catch (err) {
      console.error('Error liking poem:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPoemId(null);
    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');
    setNewMood('Reflective');
    setNewTags('');
    setIsWriteModalOpen(true);
  };

  const handleOpenEditModal = (poem) => {
    setEditingPoemId(poem.id);
    setNewTitle(poem.title || '');
    setNewExcerpt(poem.excerpt || '');
    setNewContent(poem.content || '');
    setNewMood(poem.mood || 'Reflective');
    setNewTags(poem.tags || '');
    setIsWriteModalOpen(true);
  };

  const handleSavePoem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        title: newTitle,
        excerpt: newExcerpt || null,
        content: newContent,
        mood: newMood,
        tags: newTags || null,
      };

      let res;
      if (editingPoemId) {
        res = await axios.put(`${API_BASE}/poems/${editingPoemId}`, payload, { headers });
      } else {
        res = await axios.post(`${API_BASE}/poems`, payload, { headers });
      }

      setIsWriteModalOpen(false);
      await fetchPoems(selectedMood);
      setSelectedPoem(res.data);
    } catch (err) {
      console.error('Error saving poem:', err);
      alert(err.response?.data?.detail || 'Failed to save poem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePoem = async (poemId) => {
    if (!window.confirm('Are you sure you want to delete this poem?')) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/poems/${poemId}`, { headers });
      
      setSelectedPoem(null);
      await fetchPoems(selectedMood);
    } catch (err) {
      console.error('Error deleting poem:', err);
      alert(err.response?.data?.detail || 'Failed to delete poem.');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login' 
        ? { username_or_email: authUsername, password: authPassword }
        : { username: authUsername, email: authEmail, password: authPassword };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      
      const authToken = res.data.access_token;
      const userData = res.data.user;

      setToken(authToken);
      setUser(userData);
      localStorage.setItem('poetry_token', authToken);
      localStorage.setItem('poetry_user', JSON.stringify(userData));

      setIsAuthModalOpen(false);
      setAuthUsername('');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setAuthError(detail);
      } else if (Array.isArray(detail)) {
        setAuthError(detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', '));
      } else {
        setAuthError('Authentication failed');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('poetry_token');
    localStorage.removeItem('poetry_user');
  };

  const isAuthor = user && selectedPoem && selectedPoem.author && selectedPoem.author.id === user.id;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* Header */}
      {!isFocusMode && (
        <header className="border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-700"/>
            <h1 className="text-xl font-serif font-bold tracking-tight">Verse & Canvas</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-amber-700"/> {user.username}
                </span>
                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium px-3 py-1.5 rounded-md transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5"/> Write
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4"/>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="flex items-center gap-1 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white text-xs font-medium px-3.5 py-1.5 rounded-md hover:bg-stone-800 transition cursor-pointer"
              >
                <Lock className="w-3 h-3"/> Sign In
              </button>
            )}

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400"/> : <Moon className="w-5 h-5 text-stone-600"/>}
            </button>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar */}
        {!isFocusMode && (
          <aside className="md:col-span-1 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600"/> Filter by Mood
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                      selectedMood === mood
                        ? 'bg-amber-700 text-white font-medium'
                        : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Verses</h2>
                <span className="text-xs text-stone-400">{poems.length} found</span>
              </div>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {poems.map((poem) => (
                  <button
                    key={poem.id}
                    onClick={() => handleSelectPoem(poem)}
                    className={`w-full text-left p-3 rounded-lg transition cursor-pointer ${
                      selectedPoem?.id === poem.id
                        ? 'bg-amber-100 dark:bg-amber-950/40 border-l-4 border-amber-600 font-medium'
                        : 'hover:bg-stone-200/50 dark:hover:bg-stone-900'
                    }`}
                  >
                    <p className="font-serif text-sm">{poem.title}</p>
                    <div className="flex items-center justify-between mt-1 text-xs text-stone-500">
                      {poem.author && <span className="italic">by {poem.author.username}</span>}
                      <span className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3"/> {poem.views_count}</span>
                        <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-500"/> {poem.likes_count}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Canvas */}
        <section className={`${isFocusMode ? 'col-span-3 max-w-2xl mx-auto py-8' : 'md:col-span-2'}`}>
          {selectedPoem ? (
            <article className="space-y-6 bg-stone-100/50 dark:bg-stone-900/30 p-8 rounded-xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
              <div className="flex justify-between items-center border-b pb-4 border-stone-200 dark:border-stone-800">
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setFontSize('text-base')} className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-base' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}>A</button>
                  <button onClick={() => setFontSize('text-lg')} className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-lg' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}>A+</button>
                  <button onClick={() => setFontSize('text-xl')} className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-xl' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}>A++</button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Author Edit & Delete Actions */}
                  {isAuthor && (
                    <div className="flex items-center gap-1.5 border-r pr-3 border-stone-300 dark:border-stone-700">
                      <button
                        onClick={() => handleOpenEditModal(selectedPoem)}
                        className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer"
                        title="Edit Poem"
                      >
                        <Pencil className="w-4 h-4"/>
                      </button>
                      <button
                        onClick={() => handleDeletePoem(selectedPoem.id)}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer"
                        title="Delete Poem"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => handleLikePoem(selectedPoem.id)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500"/>
                    <span>{selectedPoem.likes_count} Likes</span>
                  </button>

                  <button 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
                  >
                    {isFocusMode ? <Minimize2 className="w-3.5 h-3.5"/> : <Maximize2 className="w-3.5 h-3.5"/>}
                    {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
                  </button>
                </div>
              </div>

              <header className="space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{selectedPoem.title}</h1>
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <Eye className="w-4 h-4"/> {selectedPoem.views_count} views
                  </span>
                </div>

                {selectedPoem.author && (
                  <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">Written by {selectedPoem.author.username}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedPoem.mood && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                      {selectedPoem.mood}
                    </span>
                  )}
                  {selectedPoem.tags && selectedPoem.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="text-xs flex items-center gap-1 text-stone-500 bg-stone-200/60 dark:bg-stone-800 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3"/> {tag.trim()}
                    </span>
                  ))}
                </div>
              </header>

              <div className={`font-serif leading-relaxed whitespace-pre-wrap ${fontSize} ${isDarkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {selectedPoem.content}
              </div>
            </article>
          ) : (
            <div className="text-center py-20 text-stone-500">
              <p className="font-serif italic text-lg">No poem selected.</p>
            </div>
          )}
        </section>

      </main>

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-stone-200 dark:border-stone-800">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {authError && <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded border border-red-200 dark:border-red-900">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  {authMode === 'login' ? 'Username or Email' : 'Username'}
                </label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs rounded transition cursor-pointer mt-2"
              >
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                className="text-xs text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 cursor-pointer"
              >
                {authMode === 'login' ? "Don't have an account? Register" : 'Already registered? Sign In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WRITE / EDIT POEM MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-stone-200 dark:border-stone-800">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <BookOpen className="w-5 h-5 text-amber-700"/> 
                {editingPoemId ? 'Edit Verse' : 'Drafting Room'}
              </h3>
              <button onClick={() => setIsWriteModalOpen(false)} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSavePoem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Mood</label>
                  <select
                    value={newMood}
                    onChange={(e) => setNewMood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                  >
                    {MOODS.filter(m => m !== 'All').map(m => (
                      <option key={m} value={m} className="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. nature, solitude"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Content</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full font-serif px-3 py-2 border rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 leading-relaxed outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsWriteModalOpen(false)} className="px-4 py-2 text-xs font-medium rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-stone-700 dark:text-stone-300">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white rounded transition shadow-sm cursor-pointer disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingPoemId ? 'Update Poem' : 'Publish Poem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}