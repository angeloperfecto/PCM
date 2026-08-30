'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { Calendar, User, Clock, ArrowRight, Sparkles } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const { news, setSelectedArticle, navigateTo } = usePCM();

  const featuredNews = news.slice(0, 3);

  return (
    <section className="w-full bg-white py-12 lg:py-16 border-b border-[#D0DED8] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#D0DED8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-6 bg-[#588B76]" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#18392B]">
                LATEST NEWS
              </h2>
            </div>
            <p className="text-xs text-[#588B76] font-semibold uppercase tracking-wider pl-4">
              Campus Dispatches & Theological Insights
            </p>
          </div>

          <button
            id="btn-view-all-news"
            onClick={() => navigateTo('news-events', 'news')}
            className="self-start md:self-auto text-xs font-bold text-[#18392B] hover:text-[#588B76] flex items-center gap-1.5 uppercase tracking-wider transition cursor-pointer"
          >
            <span>VIEW ALL NEWS</span>
            <ArrowRight className="w-4 h-4 text-[#85AA9B]" />
          </button>
        </div>

        {/* News Grid (High Density University Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredNews.map((article) => (
            <article
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="group bg-[#D0DED8]/15 rounded-sm border border-[#D0DED8] overflow-hidden shadow-xs hover:shadow-md hover:border-[#588B76] transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Article Image */}
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={article.imageUrl || article.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#18392B] text-[#D0DED8] text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow">
                    {article.category}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-[#18392B]/60 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#588B76]" />
                      {article.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#85AA9B]" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#18392B] group-hover:text-[#588B76] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-[#18392B]/75 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Read More Footer */}
              <div className="px-4 pb-4 pt-2 flex items-center justify-between text-xs font-bold text-[#18392B] group-hover:text-[#588B76] border-t border-[#D0DED8]/60 mt-auto">
                <span>Read Full Article</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-[#588B76]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
