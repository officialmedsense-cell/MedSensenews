'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './editor.module.css';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufiirgbphacmlcgszqdx.supabase.co';

export default function ArticleModal({ article, session, onClose, onSaved, onError, categories, userName }) {
  const isEditing = !!article;

  const [form, setForm] = useState({
    title: article?.title || '',
    category: article?.category || categories[0],
    author: article?.author || userName || session?.user?.email || '',
    excerpt: article?.excerpt || '',
    status: article?.status || 'published',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(article?.image || null);
  const [saving, setSaving] = useState(false);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // ── Initialize Quill ──────────────────────────────────
  useEffect(() => {
    if (quillRef.current) return;

    const initQuill = () => {
      if (!window.Quill) {
        // If the pre-loaded script is still finishing, wait 50ms and try again
        setTimeout(initQuill, 50);
        return;
      }

      quillRef.current = new window.Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Write your full medical report here…',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        },
      });

      // Pre-fill content when editing
      if (article?.content) {
        quillRef.current.clipboard.dangerouslyPasteHTML(article.content);
      }
    };

    initQuill();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const getPublicationDate = () => {
    return new Date().toISOString();
  };

  const handleSubmit = async (e, statusOverride) => {
    e.preventDefault();
    const finalStatus = statusOverride || form.status;

    const content = quillRef.current ? quillRef.current.root.innerHTML : (article?.content || '');
    if (!content || quillRef.current?.getText().trim().length < 10) {
      onError('Article content is too short.');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = article?.image || '';

      // Upload new image if one was selected
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          onError('Image upload failed: ' + uploadError.message);
          setSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('article-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      if (!imageUrl && finalStatus === 'published') {
        onError('A hero image is required to publish.');
        setSaving(false);
        return;
      }

      const payload = {
        title: form.title,
        category: form.category,
        author: form.author,
        excerpt: form.excerpt,
        content,
        image: imageUrl,
        status: finalStatus,
      };

      let dbError;
      if (isEditing) {
        ({ error: dbError } = await supabase
          .from('articles')
          .update(payload)
          .eq('id', article.id));
      } else {
        ({ error: dbError } = await supabase
          .from('articles')
          .insert([{ ...payload, date: getPublicationDate(), views: 0, trending: false }]));
      }

      if (dbError) {
        onError('Save failed: ' + dbError.message);
        setSaving(false);
        return;
      }

      // ── Auto-send newsletter when a NEW article is published ──────────────
      // (Not on edits, and not for drafts)
      if (finalStatus === 'published') {
        try {
          // Fetch the ID of the article we just inserted
          const { data: newArticle } = await supabase
            .from('articles')
            .select('id')
            .eq('title', payload.title)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          if (newArticle?.id) {
            await fetch('/api/newsletter/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articleId: newArticle.id,
                title:     payload.title,
                excerpt:   payload.excerpt,
                category:  payload.category,
                author:    payload.author,
                image:     payload.image,
              }),
            });
          }
        } catch (emailErr) {
          // Email failure should never block the article save
          console.warn('[Newsletter]', emailErr);
        }
      }

      onSaved();
      onClose();

    } catch (err) {
      console.error(err);
      onError('Unexpected error. Check console.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalBox}>

        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>

        <h2 className={styles.modalTitle}>
          {isEditing ? 'Edit Article' : 'New Article'}
        </h2>
        <p className={styles.modalSub}>
          {isEditing ? `Editing: ${article.title.slice(0, 50)}…` : 'Publish a new medical report to MedSense News readers'}
        </p>

        <form onSubmit={e => handleSubmit(e, null)} className={styles.articleForm}>

          {/* Title */}
          <div className={`${styles.formGroup} ${styles.spanFull}`}>
            <label>Main Headline *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Enter article headline"
              required
            />
          </div>

          {/* Category + Author */}
          <div className={styles.formGroup}>
            <label>Category *</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Lead Author *</label>
            <input
              type="text"
              value={form.author}
              onChange={e => setForm({ ...form, author: e.target.value })}
              placeholder="Dr. Jane Doe"
              required
            />
          </div>

          {/* Hero Image */}
          <div className={`${styles.formGroup} ${styles.spanFull}`}>
            <label>Hero Image {!isEditing ? '*' : '(leave blank to keep existing)'}</label>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
          </div>

          {/* Excerpt */}
          <div className={`${styles.formGroup} ${styles.spanFull}`}>
            <label>Summary Excerpt *</label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              placeholder="A brief summary for the homepage…"
              rows={3}
              required
            />
          </div>

          {/* Quill Editor */}
          <div className={`${styles.formGroup} ${styles.spanFull}`}>
            <label>Full Article Content *</label>
            <div ref={editorRef} className={styles.quillContainer} />
          </div>

          {/* Actions */}
          <div className={`${styles.modalActions} ${styles.spanFull}`}>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={saving}
              onClick={e => handleSubmit(e, 'draft')}
            >
              {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />}
              {' '}Save as Draft
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={saving}
            >
              {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-globe" />}
              {' '}{isEditing ? 'Update Article' : 'Publish Now'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
