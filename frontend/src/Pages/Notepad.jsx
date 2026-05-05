import { useState, useMemo, useEffect, useCallback } from 'react';
import NavBar from '../components/NavBar';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import AiChat from '../components/AiChat';
import './Notepad.css';
import { apiFetch } from '../api/client';

const NOW = Date.now();

function mapServerNote(n) {
  return {
    id: n.id,
    title: n.title || 'Note',
    type: 'NOTE',
    definition: n.body || '',
    example: null,
    color: 'indigo',
    starred: false,
    tags: [],
    mastery: null,
    createdAt: new Date(n.updated_at || n.created_at).getTime(),
  };
}

export default function Notepad() {
  const [notes, setNotes] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('date');
  const [gfPinned, setGfPinned] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formWord, setFormWord] = useState('');
  const [formType, setFormType] = useState('');
  const [formDef, setFormDef] = useState('');

  const loadNotes = useCallback(async () => {
    try {
      const d = await apiFetch('/api/notes');
      setNotes((d.notes || []).map(mapServerNote));
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load notes');
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filtered = useMemo(() => {
    let n = notes;
    if (filter === 'Starred') n = n.filter((x) => x.starred);
    if (filter === 'Today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      n = n.filter((x) => x.createdAt >= start.getTime());
    }
    if (filter === 'Last Week') {
      const start = NOW - 7 * 24 * 60 * 60 * 1000;
      n = n.filter((x) => x.createdAt >= start);
    }
    if (filter === 'Mastered') n = n.filter((x) => x.mastery === 1);
    return n;
  }, [notes, filter, sort]);

  const toggleStar = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n)));
  };

  const addCard = () => {
    setFormWord('');
    setFormType('');
    setFormDef('');
    setShowModal(true);
  };

  const submitNewCard = async (e) => {
    e.preventDefault();
    if (!formWord.trim()) return;
    const body = [formType.trim(), formDef.trim()].filter(Boolean).join('\n');
    try {
      await apiFetch('/api/notes', {
        method: 'POST',
        body: { title: formWord.trim(), body },
      });
      await loadNotes();
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save note');
    }
  };

  return (
    <div className="notepad-root">
      <NavBar />
      <div className="notepad-body">
        <SideBar />
        <main className="notepad-main">
          <div className="notepad-header">
            <div>
              <div className="notepad-breadcrumb">Notepad / New Vocabulary</div>
              <h1 className="notepad-title">New Vocabulary</h1>
              {loadError ? (
                <p style={{ color: '#b91c1c', marginTop: 8 }}>{loadError}</p>
              ) : null}
            </div>
            <div className="notepad-sort">
              <label htmlFor="sort">Sort by:&nbsp;</label>
              <select
                id="sort"
                className="notepad-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          <div className="notepad-filters">
            {['All', 'Today', 'Last Week', 'Starred', 'Mastered'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`notepad-chip ${filter === f ? 'active' : ''}`}
              >
                {f === 'All' ? 'All Entries' : f}
              </button>
            ))}
          </div>

          <div className="notepad-grid">
            {filtered.flatMap((n, idx) => {
              const blocks = [];
              blocks.push(
                <article key={n.id} className={`note-card ${n.color} flex flex-col h-full`}>
                  <header className="note-card-head flex items-start justify-between">
                    <div>
                      <h3 className="note-title">{n.title}</h3>
                      <div className={`note-type ${String(n.type).toLowerCase()}`}>{n.type}</div>
                    </div>
                    <button
                      className={`star-btn ${n.starred ? 'on' : ''}`}
                      onClick={() => toggleStar(n.id)}
                      aria-label="Toggle star"
                    >
                      <span className="material-symbols-outlined">grade</span>
                    </button>
                  </header>

                  <section className="note-card-body flex-1">
                    <p className="note-def">{n.definition}</p>
                    {n.example && (
                      <div className="note-example">
                        <div className="note-example-label">Example</div>
                        <div className="note-example-text">{n.example}</div>
                      </div>
                    )}
                    {n.tags?.length ? (
                      <div className="note-tags">
                        {n.tags.map((t, i) => (
                          <span key={i} className="note-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <footer className="note-card-footer">
                    {n.mastery != null && (
                      <div className="note-mastery">
                        <span>Mastery:</span>
                        <span>{n.title === 'Ambivalent' ? '45%' : `${Math.round((n.mastery ?? 0) * 100)}%`}</span>
                        <div className="note-mastery-bar">
                          <div
                            className="note-mastery-fill"
                            style={{ width: n.title === 'Ambivalent' ? '45%' : `${n.mastery * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </footer>
                </article>
              );
              if (idx === 2) {
                blocks.push(
                  <aside key="gf" className={`grammar-focus ${gfPinned ? 'pinned' : ''}`}>
                    <div className="gf-header">
                      <div className="gf-title">Grammar Focus</div>
                      <button
                        className={`gf-pin ${gfPinned ? 'on' : ''}`}
                        onClick={() => setGfPinned((v) => !v)}
                        aria-label="Pin grammar focus"
                        title={gfPinned ? 'Unpin' : 'Pin'}
                      >
                        <span className="material-symbols-outlined">push_pin</span>
                      </button>
                    </div>
                    <div className="gf-topic">Present Perfect</div>
                    <ul className="gf-points">
                      <li>Unspecified time in the past</li>
                      <li>Action starting in past & continuing</li>
                      <li>Structure: Have/Has + V3</li>
                    </ul>
                    <button className="gf-button">Review Practice</button>
                  </aside>
                );
              }
              return blocks;
            })}
            <button key="add-end" className="note-add" onClick={addCard}>
              <div className="note-add-plus">+</div>
              <div>Add New Card</div>
            </button>
            {showModal && (
              <div className="note-modal">
                <div className="note-modal-backdrop" onClick={() => setShowModal(false)} />
                <div className="note-modal-content">
                  <form onSubmit={submitNewCard} className="note-modal-form">
                    <h3 className="note-modal-title">Add New Card</h3>
                    <label className="note-modal-label">Add a new word or phrase</label>
                    <input
                      className="note-modal-input"
                      type="text"
                      value={formWord}
                      onChange={(e) => setFormWord(e.target.value)}
                      required
                    />
                    <label className="note-modal-label">What type is it? (e.g. noun, adjective, idiom...)</label>
                    <input
                      className="note-modal-input"
                      type="text"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                    />
                    <label className="note-modal-label">Add a short definition (optional)</label>
                    <input
                      className="note-modal-input"
                      type="text"
                      value={formDef}
                      onChange={(e) => setFormDef(e.target.value)}
                    />
                    <div className="note-modal-actions">
                      <button type="button" className="gf-button" onClick={() => setShowModal(false)}>Cancel</button>
                      <button type="submit" className="gf-button">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <AiChat />
      <Footer />
    </div>
  );
}
