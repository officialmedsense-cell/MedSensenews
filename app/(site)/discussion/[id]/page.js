'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DiscussionPage() {
  const params = useParams();
  const commentId = params.id;
  const [parentComment, setParentComment] = useState(null);
  const [allComments, setAllComments] = useState([]);
  const [replyData, setReplyData] = useState({ author: '', text: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (commentId) {
      fetchDiscussion();
    }
  }, [commentId]);

  const fetchDiscussion = async () => {
    // 1. Fetch the parent comment
    const { data: parent } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();
    
    if (parent) setParentComment(parent);

    // 2. Fetch all comments for this article to build the tree
    if (parent) {
      const { data: all } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', parent.article_id)
        .order('created_at', { ascending: true });
      
      if (all) setAllComments(all);
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

      setAllComments(prev => prev.map(c => c.id === id ? { ...c, likes: (c.likes || 0) + 1 } : c));
      if (parentComment?.id === id) {
        setParentComment(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      }
    } catch (err) {
      console.error('Like error:', err.message);
    }
  };

  const handleReplySubmit = async (e, targetId) => {
    e.preventDefault();
    if (!replyData.author || !replyData.text) return;
    if (replyData.text.length > 300) return alert('Max 300 characters');

    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert([{
        article_id: parentComment.article_id,
        author: replyData.author,
        text: replyData.text,
        parent_id: targetId,
        likes: 0,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      setReplyingTo(null);
      setReplyData({ author: '', text: '' });
      await fetchDiscussion();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderReplies = (parentId, level = 1) => {
    const children = allComments.filter(c => c.parent_id === parentId);
    if (children.length === 0) return null;

    return (
      <div className="replies-tree" style={{ marginLeft: `${Math.min(level * 1.5, 4)}rem`, marginTop: '0.5rem' }}>
        {children.map(child => (
          <div key={child.id} style={{ marginBottom: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {child.author} <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.7rem' }}>{new Date(child.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '0.2rem 0' }}>{child.text}</div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={() => handleLike(child.id, child.likes)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}>
                <i className="far fa-thumbs-up"></i> {child.likes || 0}
              </button>
              <button 
                onClick={() => setReplyingTo(replyingTo === child.id ? null : child.id)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
              >
                Reply
              </button>
            </div>

            {replyingTo === child.id && (
              <form onSubmit={(e) => handleReplySubmit(e, child.id)} style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                <input 
                  type="text" placeholder="Name" maxLength={50} value={replyData.author}
                  onChange={(e) => setReplyData({...replyData, author: e.target.value})} required
                  style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', marginBottom: '0.3rem', borderRadius: '3px', border: '1px solid var(--border)' }}
                />
                <textarea 
                  placeholder="Reply..." maxLength={300} value={replyData.text}
                  onChange={(e) => setReplyData({...replyData, text: e.target.value})} required
                  rows="2" style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', resize: 'none', borderRadius: '3px', border: '1px solid var(--border)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.7rem' }}>
                    {loading ? '...' : 'Post'}
                  </button>
                </div>
              </form>
            )}
            {renderReplies(child.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (!parentComment) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading discussion...</div>;

  return (
    <div className="discussion-container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <Link href={`/article/${parentComment.article_id}`} style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
        ← Back to Article
      </Link>
      
      <div className="main-thread" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Full Discussion</h2>
        
        <div className="parent-comment">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {parentComment.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{parentComment.author}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(parentComment.created_at).toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', color: 'var(--text)', lineHeight: '1.5', marginBottom: '1rem' }}>{parentComment.text}</div>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button onClick={() => handleLike(parentComment.id, parentComment.likes)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0 }}>
              <i className="far fa-thumbs-up"></i> {parentComment.likes || 0} Likes
            </button>
            <button 
              onClick={() => setReplyingTo(replyingTo === parentComment.id ? null : parentComment.id)}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}
            >
              Reply to Main Thread
            </button>
          </div>

          {replyingTo === parentComment.id && (
            <form onSubmit={(e) => handleReplySubmit(e, parentComment.id)} style={{ marginTop: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px' }}>
              <input 
                type="text" placeholder="Your Name" maxLength={50} value={replyData.author}
                onChange={(e) => setReplyData({...replyData, author: e.target.value})} required
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
              <textarea 
                placeholder="Write your response..." maxLength={300} value={replyData.text}
                onChange={(e) => setReplyData({...replyData, text: e.target.value})} required
                rows="3" style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid var(--border)', resize: 'none' }}
              />
              <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontSize: '0.9rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                {loading ? 'Publishing...' : 'Post Reply'}
              </button>
            </form>
          )}
        </div>

        <div className="replies-section" style={{ marginTop: '2rem', borderTop: '2px solid var(--bg-secondary)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Replies</h3>
          {renderReplies(parentComment.id)}
        </div>
      </div>
    </div>
  );
}
