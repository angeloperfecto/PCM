'use client';

import React from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import { getSafeImageSrc } from '@/lib/utils';
import { ArrowRight, ArrowUpRight, Calendar, Clock, Newspaper } from 'lucide-react';
import { Reveal, Stagger } from './fx/motion';

const Thumb: React.FC<{ src?: string; alt: string; sizes: string; className?: string }> = ({ src, alt, sizes, className = '' }) => {
  const validSrc = getSafeImageSrc(src);
  return (
    <Image
      src={validSrc}
      alt={alt}
      fill
      className={`object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110 ${className}`}
      sizes={sizes}
      referrerPolicy="no-referrer"
      unoptimized={Boolean(validSrc.startsWith('data:') || validSrc.startsWith('blob:'))}
    />
  );
};

const Meta: React.FC<{ date?: string; readTime?: string; light?: boolean }> = ({ date, readTime, light }) => (
  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${light ? 'text-white/70' : 'text-[#18392b]/55'}`}>
    {date && (
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" /> {date}
      </span>
    )}
    {readTime && (
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" /> {readTime}
      </span>
    )}
  </div>
);

// Latest news from Admin → News & Articles, laid out like a magazine spread.
export const NewsSection: React.FC = () => {
  const { news, setSelectedArticle, navigateTo } = usePCM();
  const [lead, ...rest] = news.slice(0, 3);
  if (!lead) return null;

  return (
    <section className="font-text w-full bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-[#f7f5ef] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
              <Newspaper className="h-3.5 w-3.5" /> Campus Dispatches
            </span>
            <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] text-[#10261d] sm:text-5xl lg:text-6xl">
              Latest <em className="italic text-[#588b76]">news</em>
            </h2>
          </div>
          <button
            id="btn-view-all-news"
            onClick={() => navigateTo('news-events', 'news')}
            className="group inline-flex items-center gap-2 self-start rounded-full border border-[#18392b]/15 px-5 py-2.5 text-sm font-semibold text-[#10261d] transition hover:border-[#18392b] hover:bg-[#18392b] hover:text-white md:self-auto"
          >
            View all news <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Lead story */}
          <Reveal className="lg:col-span-7">
            <article onClick={() => setSelectedArticle(lead)} className="group relative h-full min-h-[420px] cursor-pointer overflow-hidden rounded-[2rem] bg-[#10261d] sm:min-h-[520px]">
              <Thumb src={lead.image || lead.imageUrl} alt={lead.title} sizes="(max-width: 1024px) 100vw, 60vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1d16] via-[#0b1d16]/45 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-[#e8c77a] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#10261d]">{lead.category}</span>
              <span className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-[#10261d]">
                <ArrowUpRight className="h-5 w-5" />
              </span>
              <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
                <Meta date={lead.date} readTime={lead.readTime} light />
                <h3 className="font-display mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  <span className="bg-gradient-to-r from-[#e8c77a] to-[#e8c77a] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 group-hover:bg-[length:100%_2px]">
                    {lead.title}
                  </span>
                </h3>
                <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-white/75 sm:text-base">{lead.excerpt}</p>
              </div>
            </article>
          </Reveal>

          {/* Next stories */}
          <Stagger className="flex flex-col gap-6 lg:col-span-5">
            {rest.map((article) => (
              <Stagger.Item key={article.id} className="flex-1">
                <article onClick={() => setSelectedArticle(article)} className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-[#18392b]/10 bg-[#f7f5ef] transition duration-500 hover:shadow-[0_30px_60px_-35px_rgba(16,38,29,0.5)] sm:flex-row">
                  <div className="relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-48">
                    <Thumb src={article.image || article.imageUrl} alt={article.title} sizes="(max-width: 640px) 100vw, 200px" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#588b76]">{article.category}</span>
                    <h3 className="font-display mt-2 line-clamp-3 text-xl font-semibold leading-snug text-[#10261d] transition-colors group-hover:text-[#588b76]">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-[#18392b]/65">{article.excerpt}</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <Meta date={article.date} readTime={article.readTime} />
                      <ArrowRight className="h-4 w-4 text-[#588b76] transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              </Stagger.Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
};
