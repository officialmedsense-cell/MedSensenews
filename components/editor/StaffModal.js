'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './editor.module.css';

export default function StaffModal({ member, session, onClose, onSaved, onError }) {
  const isEditing = !!member;
  const isGlobalDirector = member?.email === 'officialmedsense@gmail.com';
  const isSelf = member?.email === session?.user?.email;
  const isOwner = session?.user?.email === 'officialmedsense@gmail.com';
  const canResetPasswords = isOwner; 

  const [form, setForm] = useState({
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || 'editor',
    password: '',
    confirmPassword: '',
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        // ── UPDATE: name and role ────────────
        const finalRole = isGlobalDirector ? 'superadmin' : form.role;

        const { error } = await supabase
          .from('staff')
          .update({ name: form.name, role: finalRole })
          .eq('id', member.id);

        if (error) { onError('Update failed: ' + error.message); setSaving(false); return; }

        // ── UPDATE: Password ──
        if (form.newPassword) {
           if (form.newPassword.length < 8) {
             onError('New password must be at least 8 characters.');
             setSaving(false);
             return;
           }

           if (isSelf) {
             const { error: authError } = await supabase.auth.updateUser({ password: form.newPassword });
             if (authError) { onError('Password update failed: ' + authError.message); setSaving(false); return; }
           } else if (canResetPasswords) {
             const res = await fetch('/api/mseditor242/update-staff-password', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 targetEmail: member.email,
                 newPassword: form.newPassword,
                 requestingUserToken: session.access_token
               })
             });
             const result = await res.json();
             if (!res.ok) { onError(result.error || 'Reset failed.'); setSaving(false); return; }
           }
        }

        onSaved();
        onClose();
      } else {
        // ── CREATE ──
        if (form.password.length < 8) {
          onError('Password must be at least 8 characters.');
          setSaving(false);
          return;
        }
        if (form.password !== form.confirmPassword) {
          onError('Passwords do not match.');
          setSaving(false);
          return;
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          onError('Session expired. Please log in again.');
          setSaving(false);
          return;
        }

        const response = await fetch('/api/mseditor242/create-staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            password: form.password,
            requestingUserToken: currentSession.access_token,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          onError(result.error || 'Failed to create staff member.');
          setSaving(false);
          return;
        }

        onSaved();
        onClose();
      }
    } catch (err) {
      console.error(err);
      onError('Unexpected error. Check console.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalBoxSmall}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>

        <h2 className={styles.modalTitle}>
          {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
        </h2>
        <p className={styles.modalSub}>
          {isEditing
            ? `Editing record for ${member.email}`
            : 'Creates a login account + staff record in one step'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', marginTop: '1.5rem' }}>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Jane Foster"
              required
            />
          </div>

          {!isEditing && (
            <div className={styles.formGroup}>
              <label>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="staff@medsensenews.com"
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Access Role *</label>
            <select 
              value={form.role} 
              onChange={e => setForm({ ...form, role: e.target.value })}
              disabled={!isOwner || isGlobalDirector}
            >
              <option value="editor">Editor — post &amp; edit own articles</option>
              <option value="admin">Admin — full article management</option>
              <option value="superadmin">Super Admin — full control</option>
            </select>
            {isGlobalDirector ? (
              <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                The Global Director's role is permanently locked to Super Admin.
              </small>
            ) : !isOwner && (
              <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                Only the Global Director can modify access roles.
              </small>
            )}
          </div>

          {isEditing && (isSelf || canResetPasswords) && (
            <div className={styles.formGroup} style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <label>{isSelf ? 'Update Your Password' : 'Reset Staff Password'} (Optional)</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Leave blank to keep current password"
                minLength={8}
              />
            </div>
          )}

          {!isEditing && (
            <>
              <div className={styles.formGroup}>
                <label>Initial Password * (min. 8 characters)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnOutline} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving
                ? <><i className="fas fa-spinner fa-spin" /> Working…</>
                : isEditing
                  ? <><i className="fas fa-save" /> Save Changes</>
                  : <><i className="fas fa-user-plus" /> Create Staff Account</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
