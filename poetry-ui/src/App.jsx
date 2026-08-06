import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Maximize2, Minimize2, Sun, Moon, Plus, X } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001';

export default function App() {
  const [poems, setPoems] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('text-lg');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState('published');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPoems();
  }, []);

  const fetchPoems = async () => {
    try {
      const res = await axios.get(`${API_BASE}/poems`);
      setPoems(res.data);
      if (res.data.length > 0) {
        setSelectedPoem(res.data[0]);
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
        status: newStatus,
      };

      const res = await axios.post(`${API_BASE}/poems`, payload);

      setNewTitle('');
      setNewExcerpt('');
      setNewContent('');
      setIsModalOpen(false);

      await fetchPoems();
      setSelectedPoem(res.data);
    } catch (err) {
      console.error('Error creating poem:', err);
      alert('Failed to save poem. Check if API is reachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* Navigation Header */}
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
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-600" />}
            </button>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar */}
        {!isFocusMode && (
          <aside className="md:col-span-1 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Recent Verses</h2>
              <span className="text-xs text-stone-400">{poems.length} total</span>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
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
                  {poem.excerpt && <p className="text-xs text-stone-500 truncate mt-1">{poem.excerpt}</p>}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main Canvas */}
        <section className={`${isFocusMode ? 'col-span-3 max-w-2xl mx-auto py-8' : 'md:col-span-2'}`}>
          {selectedPoem ? (
            <article className="space-y-8 bg-stone-100/50 dark:bg-stone-900/30 p-8 rounded-xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
              <div className="flex justify-between items-center border-b pb-4 border-stone-200 dark:border-stone-800">
                <div className="flex gap-2 text-xs">
                  <button 
                    onClick={() => setFontSize('text-base')} 
                    className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-base' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSize('text-lg')} 
                    className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-lg' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                  >
                    A+
                  </button>
                  <button 
                    onClick={() => setFontSize('text-xl')} 
                    className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === 'text-xl' ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                  >
                    A++
                  </button>
                </div>

                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
                >
                  {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
                </button>
              </div>

              <header className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{selectedPoem.title}</h1>
                <p className="text-xs text-stone-500">Views: {selectedPoem.views_count}</p>
              </header>

              <div className={`font-serif leading-relaxed whitespace-pre-wrap ${fontSize} ${isDarkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {selectedPoem.content}
              </div>
            </article>
          ) : (
            <div className="text-center py-20 text-stone-500">
              <p className="font-serif italic text-lg">No poem selected.</p>
              <p className="text-xs mt-1">Click "Write Poem" above to compose your first piece!</p>
            </div>
          )}
        </section>

      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            
            <div className="flex justify-between items-center border-b pb-3 border-stone-200 dark:border-stone-800">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                Drafting Room
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePoem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whispers of the Horizon"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Excerpt (Optional)</label>
                <input
                  type="text"
                  placeholder="Short tagline or summary..."
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Content / Stanzas</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Type your poem here... Press enter for line breaks and stanzas."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full font-serif px-3 py-2 border rounded-md dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="text-xs bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded border border-stone-300 dark:border-stone-700"
                >
                  <option value="published">Publish Now</option>
                  <option value="draft">Save as Draft</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white rounded transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Publish Poem'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}