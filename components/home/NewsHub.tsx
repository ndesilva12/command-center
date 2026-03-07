'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, MapPin, TrendingUp, Briefcase, Cpu, Trophy, Globe } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
}

interface NewsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

const SECTIONS = [
  { id: 'top', label: 'Top Stories', icon: <TrendingUp className="w-4 h-4" />, feed: 'top' },
  { id: 'business', label: 'Business', icon: <Briefcase className="w-4 h-4" />, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB' },
  { id: 'technology', label: 'Technology', icon: <Cpu className="w-4 h-4" />, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB' },
  { id: 'sports', label: 'Sports', icon: <Trophy className="w-4 h-4" />, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB' },
  { id: 'world', label: 'World', icon: <Globe className="w-4 h-4" />, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB' },
  { id: 'wellesley', label: 'Wellesley', icon: <MapPin className="w-4 h-4" />, feed: 'local', location: 'Wellesley Massachusetts' },
  { id: 'dartmouth', label: 'Dartmouth', icon: <MapPin className="w-4 h-4" />, feed: 'local', location: 'Dartmouth Massachusetts' },
];

export default function NewsHub() {
  const [sections, setSections] = useState<Record<string, NewsSection>>({});
  const [activeTab, setActiveTab] = useState('top');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSection = async (section: typeof SECTIONS[0]) => {
    setSections(prev => ({
      ...prev,
      [section.id]: {
        ...prev[section.id],
        id: section.id,
        label: section.label,
        icon: section.icon,
        items: prev[section.id]?.items || [],
        loading: true,
        error: null
      }
    }));

    try {
      let url = '/api/news?limit=8';
      if (section.feed === 'top') {
        url += '&feed=top';
      } else if (section.feed === 'topic' && section.topic) {
        url += `&feed=topic&topic=${section.topic}`;
      } else if (section.feed === 'local' && section.location) {
        url += `&feed=local&location=${encodeURIComponent(section.location)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      setSections(prev => ({
        ...prev,
        [section.id]: {
          ...prev[section.id],
          items: data.items || [],
          loading: false,
          error: data.error || null
        }
      }));
    } catch (err) {
      setSections(prev => ({
        ...prev,
        [section.id]: {
          ...prev[section.id],
          items: [],
          loading: false,
          error: 'Failed to load'
        }
      }));
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all(SECTIONS.map(s => fetchSection(s)));
    setRefreshing(false);
  };

  useEffect(() => {
    // Fetch all sections on mount
    SECTIONS.forEach(s => fetchSection(s));
    // Refresh every 10 minutes
    const interval = setInterval(refreshAll, 600000);
    return () => clearInterval(interval);
  }, []);

  const currentSection = sections[activeTab];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">News</h2>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs - Scrollable */}
      <div className="flex gap-1 p-2 overflow-x-auto border-b border-white/5 scrollbar-hide">
        {SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === section.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
            }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* News Items */}
      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
        {currentSection?.loading && !currentSection.items.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentSection?.error && !currentSection.items.length ? (
          <div className="text-center py-12 text-gray-500">
            {currentSection.error}
          </div>
        ) : !currentSection?.items.length ? (
          <div className="text-center py-12 text-gray-500">
            No recent news
          </div>
        ) : (
          currentSection?.items.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span className="truncate max-w-[150px]">{item.source}</span>
                    {item.relativeTime && (
                      <>
                        <span>•</span>
                        <span>{item.relativeTime}</span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
              </div>
            </a>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 pt-0 border-t border-white/5">
        <a
          href="https://news.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          Powered by Google News
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
