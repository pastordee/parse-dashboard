// Created: 2026-10-07
/*
 * Admin → Support: users' chats with Prayer Circle, from the main app and
 * Creator (prayer_circle/docs/support_chat_plan.md). The same cloud functions
 * the main app's staff screens use (cloud/support/supportChat.cjs), called
 * with the master key — so the same conversations, whoever answers where.
 *
 * Replies go out as "Prayer Circle". The dashboard doesn't sign in as a user,
 * so the server can't tell who wrote a reply: the page asks for a name once
 * (kept in this browser) and sends it as staffName, which the server records
 * staff-side only as "<name> (Dashboard)".
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when, ago } from './adminApi';
import styles from './Admin.scss';

const NAME_KEY = 'pc-support-staff-name';
const STATUS_PILL = { waiting: 'pillRed', answered: 'pillBlue', new: 'pillAmber', closed: '' };

function storedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

class Support extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Support';
    this.state = {
      loading: true,
      error: null,
      items: [],
      waiting: 0,
      showClosed: false,
      openId: null,
      thread: null,
      threadError: null,
      reply: '',
      sending: false,
      staffName: storedName(),
    };
    this.poll = null;
  }

  componentDidMount() {
    this.load();
    // New messages arrive while the page is open; there is no live query for
    // a master-key page, so look again every 30 s.
    this.poll = setInterval(() => {
      this.load(true);
      if (this.state.openId) {
        this.loadThread(this.state.openId, true);
      }
    }, 30000);
  }

  componentWillUnmount() {
    clearInterval(this.poll);
  }

  async load(quiet = false) {
    if (!quiet) {
      this.setState({ loading: true, error: null });
    }
    try {
      const r = await adminCall(this.context, 'supportInboxList', {
        status: this.state.showClosed ? 'closed' : 'open',
        limit: 200,
      });
      this.setState({ items: r.items || [], waiting: r.waiting || 0, loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  async loadThread(listId, quiet = false) {
    if (!quiet) {
      this.setState({ openId: listId, thread: null, threadError: null });
    }
    try {
      const t = await adminCall(this.context, 'supportThread', { listId });
      if (this.state.openId === listId) {
        this.setState({ thread: t });
      }
    } catch (e) {
      this.setState({ threadError: e.message || String(e) });
    }
  }

  async send() {
    const { openId, reply, staffName } = this.state;
    const text = reply.trim();
    if (!openId || !text || this.state.sending) {
      return;
    }
    if (!staffName.trim()) {
      this.setState({ threadError: 'Enter your name above first — it is kept with the reply (staff only).' });
      return;
    }
    this.setState({ sending: true, threadError: null });
    try {
      await adminCall(this.context, 'supportReply', { listId: openId, text, staffName: staffName.trim() });
      this.setState({ reply: '', sending: false });
      await this.loadThread(openId, true);
      this.load(true);
    } catch (e) {
      this.setState({ sending: false, threadError: e.message || String(e) });
    }
  }

  async toggleClosed() {
    const { openId, thread } = this.state;
    if (!openId || !thread) {
      return;
    }
    try {
      await adminCall(this.context, 'supportClose', { listId: openId, reopen: thread.status === 'closed' });
      await this.loadThread(openId, true);
      this.load(true);
    } catch (e) {
      this.setState({ threadError: e.message || String(e) });
    }
  }

  setStaffName(value) {
    this.setState({ staffName: value });
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // Private window: the name lasts for this visit only.
    }
  }

  renderThread() {
    const { thread, threadError, reply, sending, openId } = this.state;
    if (!openId) {
      return <div className={styles.empty}>Pick a conversation to read it and reply.</div>;
    }
    if (!thread) {
      return threadError
        ? <div className={styles.error}>The conversation could not be loaded: {threadError}</div>
        : <div className={styles.empty}>Loading…</div>;
    }
    const closed = thread.status === 'closed';
    return (
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>
            {thread.user && (thread.user.name || thread.user.username)}
            {thread.user && thread.user.username ? ` · @${thread.user.username}` : ''}
          </span>
          <span className={styles.meta}>{thread.app === 'creator' ? 'Creator' : 'Prayer Circle app'}</span>
          <span className={`${styles.pill} ${styles[STATUS_PILL[thread.status]] || ''}`}>{thread.status}</span>
          <Button value={closed ? 'Reopen' : 'Close'} primary={false} onClick={() => this.toggleClosed()} />
        </div>

        <div style={{ maxHeight: 480, overflowY: 'auto', padding: '4px 0' }}>
          {(thread.messages || []).map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.fromStaff ? 'flex-end' : 'flex-start', margin: '6px 0' }}>
              <div className={styles.card} style={{ maxWidth: '75%', margin: 0, padding: '8px 12px' }}>
                {m.type === 'Image' && m.files && m.files[0] && (
                  <a href={m.files[0]} target="_blank" rel="noreferrer">
                    <img src={m.files[0]} alt="" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, display: 'block', marginBottom: 6 }} />
                  </a>
                )}
                {m.text && <div className={styles.body} style={{ margin: 0 }}>{m.text}</div>}
                <div className={styles.meta} style={{ marginTop: 4, textAlign: m.fromStaff ? 'right' : 'left' }}>
                  {m.fromStaff ? `Prayer Circle${m.repliedBy ? ` — ${m.repliedBy}` : ''} · ` : ''}
                  {when(m.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {threadError && <div className={styles.error}>{threadError}</div>}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 10 }}>
          <textarea
            value={reply}
            rows={3}
            placeholder="Reply as Prayer Circle…"
            style={{ flex: 1, padding: 8, borderRadius: 6, font: 'inherit', resize: 'vertical' }}
            onChange={e => this.setState({ reply: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                this.send();
              }
            }}
          />
          <Button value={sending ? 'Sending…' : 'Send'} primary={true} disabled={sending || !reply.trim()} onClick={() => this.send()} />
        </div>
        <div className={styles.meta} style={{ marginTop: 4 }}>⌘/Ctrl + Enter sends. The user sees “Prayer Circle”, never your name.</div>
      </div>
    );
  }

  renderContent() {
    const { loading, error, items, waiting, showClosed, openId, staffName } = this.state;
    const toolbar = (
      <Toolbar section="Admin" subsection="Support">
        <div className={styles.barActions}>
          <select
            value={showClosed ? 'closed' : 'open'}
            onChange={e => this.setState({ showClosed: e.target.value === 'closed', openId: null, thread: null }, () => this.load())}
          >
            <option value="open">Open chats</option>
            <option value="closed">Closed chats</option>
          </select>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Support chats could not be loaded: {error}</div>;
    } else if (!loading) {
      body = (
        <>
          <p className={styles.hint}>
            {waiting > 0 ? `${waiting} waiting for a reply. ` : 'Everyone has had a reply. '}
            Signing replies as{' '}
            <input
              value={staffName}
              placeholder="your name"
              style={{ padding: '2px 6px', borderRadius: 4, font: 'inherit', width: 160 }}
              onChange={e => this.setStaffName(e.target.value)}
            />{' '}
            (staff only — users see “Prayer Circle”).
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 360px', maxWidth: 360 }}>
              {items.length === 0 && <div className={styles.empty}>No {showClosed ? 'closed' : 'open'} chats.</div>}
              {items.map(c => (
                <div
                  key={c.listId}
                  className={styles.card}
                  style={{ cursor: 'pointer', outline: openId === c.listId ? '2px solid #169cee' : 'none' }}
                  onClick={() => this.loadThread(c.listId)}
                >
                  <div className={styles.cardHead} style={{ marginBottom: 4 }}>
                    <span className={styles.cardTitle}>{c.name}</span>
                    <span className={`${styles.pill} ${styles[STATUS_PILL[c.status]] || ''}`}>{c.status}</span>
                  </div>
                  <div className={styles.meta} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.preview}
                  </div>
                  <div className={styles.meta}>
                    {c.app === 'creator' ? 'Creator' : 'Prayer Circle'} · {ago(c.status === 'waiting' ? c.lastUserAt : c.lastSent)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>{this.renderThread()}</div>
          </div>
        </>
      );
    }

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>{body}</div>
        </LoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default Support;
