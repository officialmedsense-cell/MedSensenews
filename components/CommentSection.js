'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CommentSection({ articleId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ author: '', text: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyData, setReplyData] = useState({ author: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState({});

  useEffect(() => {
    if (articleId) {
      fetchComments();
    }
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err.message);
    }
  };

  const handleLike = async (id, currentLikes) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ likes: (currentLikes || 0) + 1 })
        .eq('id', id);
      
      if (error) {
        console.error('Like error:', error.message);
        alert(`Could not save like: ${error.message}. Have you run the RLS Policy SQL?`);
        return;
      }
      
      // Update local state only if DB update was successful
      setComments(prev => prev.map(c => c.id === id ? { ...c, likes: (c.likes || 0) + 1 } : c));
    } catch (err) {
      console.error('Like error:', err.message);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.author || !newComment.text) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert([{
        article_id: articleId,
        author: newComment.author,
        text: newComment.text,
        parent_id: null,
        likes: 0,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      setNewComment({ author: '', text: '' });
      await fetchComments();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyData.author || !replyData.text) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert([{
        article_id: articleId,
        author: replyData.author,
        text: replyData.text,
        parent_id: parentId,
        likes: 0,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      setReplyingTo(null);
      setReplyData({ author: '', text: '' });
      setExpandedThreads({ ...expandedThreads, [parentId]: true });
      await fetchComments();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (id) => {
    setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderReplies = (parentId, depth = 0) => {
    const allReplies = comments.filter(c => c.parent_id === parentId);
    const isExpanded = expandedThreads[parentId];
    
    if (allReplies.length === 0) return null;

    if (!isExpanded) {
      return (
        <button 
          onClick={() => toggleThread(parentId)}
          style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <i className="fas fa-chevron-down" style={{ fontSize: '0.5rem' }}></i> Show {allReplies.length} replies
        </button>
      );
    }

    const visibleReplies = allReplies.slice(0, 2);
    const hasMore = allReplies.length > 2;

    return (
      <div className="replies-list" style={{ marginTop: '0.5rem', marginLeft: depth === 0 ? '1rem' : '0.5rem' }}>
        {visibleReplies.map(reply => (
          <div key={reply.id} className="reply-item" style={{ padding: '0.4rem 0', borderLeft: '1px solid var(--border)', paddingLeft: '0.5rem', marginBottom: '0.2rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
              <div style={{ width: '18px', height: '18px', background: 'var(--text-light)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem' }}>
                {reply.author.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {reply.author} <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.6rem', marginLeft: '0.3rem' }}>{new Date(reply.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.3' }}>{reply.text}</div>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.1rem' }}>
                  <button onClick={() => handleLike(reply.id, reply.likes)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}>
                    <i className="far fa-thumbs-up"></i> {reply.likes || 0}
                  </button>
                  <button 
                    onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, padding: 0 }}
                  >
                    Reply
                  </button>
                </div>

                {replyingTo === reply.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, reply.id)} style={{ marginTop: '0.3rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <input 
                        type="text" placeholder="Name" maxLength={50} value={replyData.author}
                        onChange={(e) => setReplyData({...replyData, author: e.target.value})} required
                        style={{ padding: '0.2rem 0.4rem', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '0.7rem' }}
                      />
                      <textarea 
                        placeholder="Reply..." maxLength={300} value={replyData.text}
                        onChange={(e) => setReplyData({...replyData, text: e.target.value})} required
                        rows="2" style={{ padding: '0.2rem 0.4rem', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '0.7rem', resize: 'none' }}
                      ></textarea>
                      <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.65rem', cursor: 'pointer', alignSelf: 'flex-end' }}>
                        {loading ? '...' : 'Post'}
                      </button>
                    </div>
                  </form>
                )}
                {renderReplies(reply.id, depth + 1)}
              </div>
            </div>
          </div>
        ))}
        {hasMore && (
          <a 
            href={`/discussion/${parentId}`} 
            style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, marginLeft: '1.5rem', display: 'block', marginTop: '0.2rem', textDecoration: 'underline' }}
          >
             See all {allReplies.length} replies →
          </a>
        )}
        <button 
          onClick={() => toggleThread(parentId)}
          style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0' }}
        >
          Hide replies
        </button>
      </div>
    );
  };

  const parentComments = comments.filter(c => !c.parent_id);

  return (
    <div className="comments-section" id="comments" style={{ marginTop: '1rem' }}>
      <div className="section-header" style={{ borderBottom: '1px solid var(--border)', marginBottom: '1rem', paddingBottom: '0.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-light)' }}>
          DISCUSSION ({comments.length})
        </h4>
      </div>

      <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {parentComments.map(comment => (
          <div key={comment.id} className="comment-item" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--bg-secondary)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.1rem' }}>
                  {comment.author} <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.4' }}>{comment.text}</div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button onClick={() => handleLike(comment.id, comment.likes)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0' }}>
                    <i className="far fa-thumbs-up"></i> {comment.likes || 0}
                  </button>
                  <button 
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0' }}
                  >
                    Reply
                  </button>
                </div>

                {replyingTo === comment.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, comment.id)} style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input 
                        type="text" placeholder="Name" maxLength={50} value={replyData.author}
                        onChange={(e) => setReplyData({...replyData, author: e.target.value})} required
                        style={{ padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                      />
                      <textarea 
                        placeholder="Reply (max 300 chars)..." maxLength={300} value={replyData.text}
                        onChange={(e) => setReplyData({...replyData, text: e.target.value})} required
                        rows="2" style={{ padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '0.75rem', resize: 'none' }}
                      ></textarea>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                         <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer' }}>
                          {loading ? '...' : 'Post'}
                         </button>
                      </div>
                    </div>
                  </form>
                )}

                {renderReplies(comment.id)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
        <h5 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>POST A COMMENT</h5>
        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input 
            type="text" placeholder="Your Name" maxLength={50} value={newComment.author}
            onChange={(e) => setNewComment({...newComment, author: e.target.value})} required 
            style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem', width: '100%' }}
          />
          <textarea 
            rows="2" placeholder="Write here (max 300 characters)..." maxLength={300} value={newComment.text}
            onChange={(e) => setNewComment({...newComment, text: e.target.value})} required
            style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem', width: '100%', resize: 'none' }}
          ></textarea>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{newComment.text.length}/300 chars</span>
            <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '...' : 'SEND'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
