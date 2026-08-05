import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Maximize2, Minimize2, Sun, Moon, Volume2, Heart } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001';

export default function App() {
  const [poems, setPoems] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('text-lg'); // text-base, text-lg, text-xl
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* Navigation Header (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <header className="border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-700" />
            <h1 className="text-xl font-serif font-bold tracking-tight">Verse & Canvas</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-600" />}
            </button>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Poem List (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <aside className="md:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Recent Poems</h2>
            <div className="space-y-2">
              {poems.map((poem) => (
                <button
                  key={poem.id}
                  onClick={() => setSelectedPoem(poem)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedPoem?.id === poem.id
                      ? 'bg-amber-100 dark:bg-amber-950/40 border-l-4 border-amber-600 font-medium'
                      : 'hover:bg-stone-200/50 dark:hover:bg-stone-900'
                  }`}
                >
                  <p className="font-serif">{poem.title}</p>
                  {poem.excerpt && <p className="text-xs text-stone-500 truncate mt-1">{poem.excerpt}</p>}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main Reading Canvas */}
        <section className={`${isFocusMode ? 'col-span-3 max-w-2xl mx-auto py-12' : 'md:col-span-2'}`}>
          {selectedPoem ? (
            <article className="space-y-8">
              
              {/* Controls Bar */}
              <div className="flex justify-between items-center border-b pb-4 border-stone-200 dark:border-stone-800">
                <div className="flex gap-2 text-xs">
                  <button 
                    onClick={() => setFontSize('text-base')} 
                    className={`px-2 py-1 rounded ${fontSize === 'text-base' ? 'bg-amber-600 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSize('text-lg')} 
                    className={`px-2 py-1 rounded ${fontSize === 'text-lg' ? 'bg-amber-600 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                  >
                    A+
                  </button>
                  <button 
                    onClick={() => setFontSize('text-xl')} 
                    className={`px-2 py-1 rounded ${fontSize === 'text-xl' ? 'bg-amber-600 text-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                  >
                    A++
                  </button>
                </div>

                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                >
                  {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
                </button>
              </div>

              {/* Poem Header */}
              <header className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{selectedPoem.title}</h1>
                <p className="text-xs text-stone-500">Views: {selectedPoem.views_count}</p>
              </header>

              {/* Stanza-Aware Poem Content */}
              <div className={`font-serif leading-relaxed whitespace-pre-wrap ${fontSize} ${isDarkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {selectedPoem.content}
              </div>

            </article>
          ) : (
            <p className="text-stone-500 italic">Select a poem to read...</p>
          )}
        </section>

      </main>
    </div>
  );
}