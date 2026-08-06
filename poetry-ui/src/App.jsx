import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Maximize2, Minimize2, Sun, Moon, Plus, X, Tag, Sparkles } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001';

const MOODS = ['All', 'Melancholic', 'Hopeful', 'Reflective', 'Nature', 'Romantic', 'Cosmic'];

export default function App() {
  const [poems, setPoems] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [selectedMood, setSelectedMood] = useState('All');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('text-lg');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('Reflective');
  const [newTags, setNewTags] = useState('');
  const [newStatus, setNewStatus] = useState('published');
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
      if (res.data.length > 0) {
        setSelectedPoem(res.data[0]);
      } else {
        setSelectedPoem(null);
      }
    } catch (err) {
      console.error('Error fetching poems:', err);
    }
  };

  const handleCreatePoem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: newTitle,
        excerpt: newExcerpt || null,
        content: newContent,
        mood: newMood,
        tags: newTags || null,
        status: newStatus,
      };

      const res = await axios.post(`${API_BASE}/poems`, payload);

      setNewTitle('');
      setNewExcerpt('');
      setNewContent('');
      setNewTags('');
      setIsModalOpen(false);

      await fetchPoems(selectedMood);
      setSelectedPoem(res.data);
    } catch (err) {
      console.error('Error creating poem:', err);
      alert('Failed to save poem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* Header */}
      {!isFocusMode && (
        <header className="border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-700" />
            <h1 className="text-xl font-serif font-bold tracking-tight">Verse & Canvas</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-3.5 py-1.5 rounded-md transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Write Poem
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-600" />}
            </button>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar with Mood Filters */}
        {!isFocusMode && (
          <aside className="md:col-span-1 space-y-6">
            
            {/* Mood Chips */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Filter by Mood
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

            {/* Poem List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Verses</h2>
                <span className="text-xs text-stone-400">{poems.length} found</span>
              </div>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {poems.map((poem) => (
                  <button
                    key={poem.id}
                    onClick={() => setSelectedPoem(poem)}
                    className={`w-full text-left p-3 rounded-lg transition cursor-pointer ${
                      selectedPoem?.id === poem.id
                        ? 'bg-amber-100 dark:bg-amber-950/40 border-l-4 border-amber-600 font-medium'
                        : 'hover:bg-stone-200/50 dark:hover:bg-stone-900'
                    }`}
                  >
                    <p className="font-serif text-sm">{poem.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      {poem.mood && (
                        <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500 tracking-wider">
                          {poem.mood}
                        </span>
                      )}
                      {poem.excerpt && <span className="text-xs text-stone-500 truncate max-w-[150px]">{poem.excerpt}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </aside>
        )}

        {/* Main Canvas */}
        <section className={`${isFocusMode ? 'col-span-3 max-w-2xl mx-auto py-8' : 'md:col-span-2'}`}>
          {selectedPoem ? (
            <article className="space-y-6 bg-stone-100/50 dark:bg-stone-900/30 p-8 rounded-xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
              <div className="flex justify-between items-center border-b pb-4 border-stone-200 dark:border-stone-800">
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setFontSize('text-base')} className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-base' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}>A</button>
                  <button onClick={() => setFontSize('text-lg')} className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-lg' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}>A+</button>
                  <button onClick={() => setFontSize('text-xl')} className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-xl' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}>A++</button>
                </div>

                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
                >
                  {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
                </button>
              </div>

              <header className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{selectedPoem.title}</h1>
                </div>
                
                {/* Mood & Tags Display */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedPoem.mood && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                      {selectedPoem.mood}
                    </span>
                  )}
                  {selectedPoem.tags && selectedPoem.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="text-xs flex items-center gap-1 text-stone-500 bg-stone-200/60 dark:bg-stone-800 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3" /> {tag.trim()}
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
              <p className="font-serif italic text-lg">No poems found for this mood filter.</p>
              <p className="text-xs mt-1">Select another filter or click "Write Poem" to create one!</p>
            </div>
          )}
        </section>

      </main>

      {/* Creation Modal with Mood & Tags */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            
            <div className="flex justify-between items-center border-b pb-3 border-stone-200 dark:border-stone-800">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                Drafting Room
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePoem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whispers of the Horizon"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Mood</label>
                  <select
                    value={newMood}
                    onChange={(e) => setNewMood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                  >
                    {MOODS.filter(m => m !== 'All').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. nature, solitude, autumn"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Content / Stanzas</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Type your poem here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full font-serif px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-amber-600 leading-relaxed outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white rounded transition shadow-sm cursor-pointer disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Publish Poem'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}