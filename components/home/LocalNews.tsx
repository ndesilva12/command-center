'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, MapPin } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
}

interface LocationNews {
  location: string;
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

const LOCATIONS = [
  { name: 'Wellesley', query: 'Wellesley Massachusetts' },
  { name: 'Dartmouth', query: 'Dartmouth Massachusetts' }
];

export default function LocalNews() {
  const [newsData, setNewsData] = useState<Record<string, LocationNews>>({});
  const [activeTab, setActiveTab] = useState(LOCATIONS[0].name);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (location: typeof LOCATIONS[0]) => {
    setNewsData(prev => ({
      ...prev,
      [location.name]: {
        location: location.name,
        items: prev[location.name]?.items || [],
        loading: true,
        error: null
      }
    }));

    try {
      const response = await fetch(`/api/news?location=${encodeURIComponent(location.query)}&limit=6`);
      const data = await response.json();

      setNewsData(prev => ({
        ...prev,
        [location.name]: {
          location: location.name,
          items: data.items || [],
          loading: false,
          error: data.error || null
        }
      }));
    } catch (err) {
      setNewsData(prev => ({
        ...prev,
        [location.name]: {
          location: location.name,
          items: [],
          loading: false,
          error: 'Failed to load news'
        }
      }));
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all(LOCATIONS.map(loc => fetchNews(loc)));
    setRefreshing(false);
  };

  useEffect(() => {
    LOCATIONS.forEach(loc => fetchNews(loc));
    // Refresh every 10 minutes
    const interval = setInterval(refreshAll, 600000);
    return () => clearInterval(interval);
  }, []);

  const currentNews = newsData[activeTab];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Local News</h2>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-2 mb-4">
        {LOCATIONS.map(loc => (
          <button
            key={loc.name}
            onClick={() => setActiveTab(loc.name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === loc.name
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {loc.name}
          </button>
        ))}
      </div>

      {/* News Items */}
      <div className="space-y-3">
        {currentNews?.loading && !currentNews.items.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentNews?.error && !currentNews.items.length ? (
          <div className="text-center py-8 text-gray-500">
            {currentNews.error}
          </div>
        ) : currentNews?.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent news
          </div>
        ) : (
          currentNews?.items.map((item, idx) => (
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
                    <span className="truncate">{item.source}</span>
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
      <div className="mt-4 pt-3 border-t border-white/5">
        <a
          href={`https://news.google.com/search?q=${encodeURIComponent(LOCATIONS.find(l => l.name === activeTab)?.query || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          View more on Google News
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
