'use client';

import React, { useState } from 'react';
import { usePCM } from '@/lib/store';
import { PCMEvent } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Search,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';

export const AdminEventsTab: React.FC = () => {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    addToast,
    canPerformAction,
  } = usePCM();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PCMEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Academic');
  const [formDate, setFormDate] = useState('Sept 15, 2026');
  const [formTime, setFormTime] = useState('8:00 AM – 5:00 PM');
  const [formLocation, setFormLocation] = useState('Main Chapel & Lecture Hall, Lamtang Campus');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1000&auto=format&fit=crop');
  const [formRegOpen, setFormRegOpen] = useState(true);
  const [formCapacity, setFormCapacity] = useState(150);

  const openNewModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory('Academic');
    setFormDate('Sept 15, 2026');
    setFormTime('8:00 AM – 5:00 PM');
    setFormLocation('Main Chapel & Lecture Hall, Lamtang Campus');
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1000&auto=format&fit=crop');
    setFormRegOpen(true);
    setFormCapacity(150);
    setIsModalOpen(true);
  };

  const openEditModal = (event: PCMEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormCategory(event.category);
    setFormDate(event.date);
    setFormTime(event.time);
    setFormLocation(event.location);
    setFormDescription(event.description);
    setFormImage(event.image || event.imageUrl || '');
    setFormRegOpen(event.registrationOpen !== false);
    setFormCapacity(event.capacity || event.maxAttendees || 100);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('Editor')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need at least Editor role to manage calendar events.',
        type: 'error',
      });
      return;
    }

    if (!formTitle.trim() || !formDate.trim()) {
      addToast({ title: 'Missing Information', message: 'Title and Date are required.', type: 'error' });
      return;
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        title: formTitle.trim(),
        category: formCategory,
        date: formDate.trim(),
        time: formTime.trim(),
        location: formLocation.trim(),
        description: formDescription.trim(),
        image: formImage.trim(),
        registrationOpen: formRegOpen,
        capacity: Number(formCapacity),
      });
      addToast({ title: 'Event Updated', message: `${formTitle} updated successfully.`, type: 'success' });
    } else {
      addEvent({
        title: formTitle.trim(),
        category: formCategory,
        date: formDate.trim(),
        time: formTime.trim(),
        location: formLocation.trim(),
        description: formDescription.trim(),
        image: formImage.trim(),
        registrationOpen: formRegOpen,
        capacity: Number(formCapacity),
        registeredCount: 0,
      });
      addToast({ title: 'Event Created', message: `${formTitle} added to the calendar.`, type: 'success' });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (!canPerformAction('Content Admin')) {
      addToast({
        title: 'Permission Denied',
        message: 'You need Content Admin privileges to delete events.',
        type: 'error',
      });
      return;
    }

    setDeleteTarget({ id, title });
  };

  const confirmDeleteEvent = () => {
    if (!deleteTarget) return;
    deleteEvent(deleteTarget.id);
    addToast({ title: 'Event Deleted', message: `"${deleteTarget.title}" has been removed.`, type: 'info' });
    setDeleteTarget(null);
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      !search ||
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.location.toLowerCase().includes(search.toLowerCase()) ||
      ev.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || ev.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18392B] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#588B76]" />
            Calendar Events & Conference Manager
          </h2>
          <p className="text-xs text-slate-500">
            Schedule convocations, theology symposia, campus chapel series, and community outreach.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#588B76] hover:bg-[#46705F] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Calendar Event</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search events by title, venue, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#588B76] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['all', 'Academic', 'Spiritual', 'Conference', 'Community', 'Outreach'].map((cat) => (
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

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#588B76]/60 transition space-y-3 bg-white flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#588B76] bg-[#588B76]/10 px-2 py-0.5 rounded">
                    {ev.category}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#18392B] mt-1 line-clamp-1">
                    {ev.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(ev)}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id, ev.title)}
                    className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                <span>
                  <strong>{ev.date}</strong> ({ev.time})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
                <span className="truncate">{ev.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add/Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-base font-bold text-[#18392B]">
              {editingEvent ? 'Edit Calendar Event' : 'Add New Event'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Annual Cordillera Pastors Theological Symposium"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Event Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Spiritual">Spiritual / Chapel</option>
                    <option value="Conference">Conference & Symposium</option>
                    <option value="Community">Community Service</option>
                    <option value="Outreach">Outreach & Missions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. Sept 15, 2026"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Time / Duration
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="8:00 AM – 5:00 PM"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Target Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Main Chapel, Lamtang Campus, La Trinidad"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Cover Photo Image URL
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Description & Itinerary
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#588B76] text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="event-reg-checkbox"
                  checked={formRegOpen}
                  onChange={(e) => setFormRegOpen(e.target.checked)}
                  className="rounded text-[#588B76] focus:ring-[#588B76]"
                />
                <label htmlFor="event-reg-checkbox" className="text-slate-700 font-medium">
                  Registration open for public attendees
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Calendar Event"
        itemName={deleteTarget?.title}
        message="Are you sure you want to cancel and delete this event from the college calendar?"
        confirmLabel="Delete Event"
        onConfirm={confirmDeleteEvent}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
