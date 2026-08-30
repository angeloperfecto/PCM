'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { NewsArticle } from '@/lib/types';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Search,
  Eye,
  EyeOff,
  Star,
  Calendar,
  User,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminNewsTab: React.FC = () => {
  const {
    news,
    addNewsArticle,
    updateNewsArticle,
    deleteNewsArticle,
    addToast,
    canPerformAction,
    currentAdminUser,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Academic');
  const [formDate, setFormDate] = useState('Aug 29, 2026');
  const [formAuthor, setFormAuthor] = useState('Office of the President');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPublished, setFormPublished] = useState(true);

  const openNewModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormCategory('Academic');
    setFormDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setFormAuthor(currentAdminUser?.name || 'PCM Communications Office');
    setFormExcerpt('');
    setFormContent('');
    setFormImage('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop');
    setFormFeatured(false);
    setFormPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormCategory(article.category);
    setFormDate(article.date);
    setFormAuthor(article.author || 'PCM Communications');
    setFormExcerpt(article.excerpt);
    setFormContent(article.content || article.excerpt);
    setFormImage(article.image || article.imageUrl || '');
    setFormFeatured(article.featured || false);
    setFormPublished(article.published !== false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need at least Editor role to publish articles.',
        type: 'error',
      });
      return;
    }

    if (!formTitle.trim() || !formExcerpt.trim()) {
      addToast({ title: 'Missing Fields', message: 'Article title and excerpt are required.', type: 'error' });
      return;
    }

    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingArticle) {
      updateNewsArticle(editingArticle.id, {
        title: formTitle.trim(),
        slug: editingArticle.slug || slug,
        category: formCategory,
        date: formDate.trim(),
        author: formAuthor.trim(),
        excerpt: formExcerpt.trim(),
        content: formContent.trim() || formExcerpt.trim(),
        image: formImage.trim(),
        featured: formFeatured,
        published: formPublished,
      });
      addToast({ title: 'Article Updated', message: 'News publication updated successfully.', type: 'success' });
    } else {
      addNewsArticle({
        title: formTitle.trim(),
        slug,
        category: formCategory,
        date: formDate.trim(),
        author: formAuthor.trim(),
        excerpt: formExcerpt.trim(),
        content: formContent.trim() || formExcerpt.trim(),
        image: formImage.trim(),
        featured: formFeatured,
        published: formPublished,
      });
      addToast({ title: 'Article Published', message: 'New article has been published.', type: 'success' });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to delete articles.',
        type: 'error',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteNewsArticle(id);
      addToast({ title: 'Article Deleted', message: 'The article has been removed.', type: 'info' });
    }
  };

  const handleTogglePublish = (id: string) => {
    const art = news.find((n) => n.id === id);
    if (!art) return;
    updateNewsArticle(id, { published: art.published === false ? true : false });
  };

  const filteredNews = news.filter((n) => {
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      (n.author && n.author.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' || n.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#588B76]" />
            News, Articles & Publications CMS
          </h2>
          <p className="text-xs text-slate-500">
            Publish institutional press releases, theological articles, and campus updates.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search articles by title, author, or excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'Academic', 'Admissions', 'Ministry', 'Campus Life', 'Spiritual'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#18392B] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
        {filteredNews.map((art) => (
          <div
            key={art.id}
            className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:bg-slate-50 ${
              art.published === false ? 'opacity-50 bg-slate-50' : ''
            }`}
          >
            <div className="flex items-start gap-4 flex-1">
              <div
                className="w-24 h-16 rounded-lg bg-cover bg-center shrink-0 border border-slate-200"
                style={{ backgroundImage: `url(${art.image})` }}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                    {art.category}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {art.date}
                  </span>
                  {art.featured && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.2 rounded flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Featured
                    </span>
                  )}
                  {art.published === false && (
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.2 rounded">
                      Draft / Unpublished
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-sm font-bold text-[#18392B] line-clamp-1">
                  {art.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">{art.excerpt}</p>
                <div className="text-[10px] text-slate-400">
                  By {art.author || 'PCM Staff'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => handleTogglePublish(art.id)}
                className={`p-1.5 rounded text-xs font-medium cursor-pointer ${
                  art.published !== false
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={art.published !== false ? 'Published Live' : 'Unpublished (Draft)'}
              >
                {art.published !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => openEditModal(art)}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Edit Article"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(art.id, art.title)}
                className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                title="Delete Article"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              {editingArticle ? 'Edit News Article' : 'Write New Article'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PCM Celebrates 34th Founding Anniversary & Baccalaureate Convocation"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Ministry">Ministry & Practicum</option>
                    <option value="Campus Life">Campus Life</option>
                    <option value="Spiritual">Spiritual Formation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Date of Publication
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Author / Desk
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Office of the Registrar"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Feature Cover Image URL
                </label>
                <input
                  type="text"
                  required
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Short Excerpt / Lead Paragraph
                </label>
                <textarea
                  rows={2}
                  required
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="A concise 1-2 sentence lead summary displayed in news feeds and cards..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Article Body (Markdown or Plain Text)
                </label>
                <textarea
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Complete text of the press release, report, or announcement..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded text-[#588B76] focus:ring-[#588B76]"
                  />
                  <span>Feature on Homepage Headline</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="rounded text-[#588B76] focus:ring-[#588B76]"
                  />
                  <span>Published (Visible to the public immediately)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#588B76] hover:bg-[#46705F] text-white font-bold cursor-pointer shadow-sm"
                >
                  Save Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
