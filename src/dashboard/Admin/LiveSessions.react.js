// Created: 2026-10-10
/*
 * Admin → Live: every live session running now — Creator live sermons
 * (preparing or on air), church feed livestreams, group prayer rooms, and any
 * LiveKit room with nothing behind it (stuck) — how long each has been on,
 * who is in it, whether it has been reported, and Shut down.
 *
 * cloud/admin/liveSessions.cjs: adminLiveSessions, adminEndLiveSession. Ending
 * stops the recording, closes the room for everyone in it and resets the
 * session; it is written to the audit log with the reason given here.
 * Refreshes itself every 15 seconds while the page is open.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when } from './adminApi';
import styles from './Admin.scss';

const REFRESH_MS = 15000;

const KIND = {
  sermon: 'Live sermon',
  feed: 'Feed livestream',
  group: 'Prayer room',
  room: 'Room only',
};

// "2h 14m" since a start time.
function running(start, now) {
  if (!start) {
    return '—';
  }
  const mins = Math.max(0, Math.round((new Date(now) - new Date(start)) / 60000));
  if (mins < 60) {
    return `${mins}m`;
  }
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ${mins % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

function statusPill(s) {
  if (s.status === 'live') {
    return styles.pillRed;
  }
  if (s.status === 'on break' || s.status === 'preparing') {
    return styles.pillAmber;
  }
  return styles.pillBlue;
}

class LiveSessions extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Live';
    this.state = { loading: true, error: null, sessions: [], now: null, livekit: true, busy: null, toast: null };
  }

  componentDidMount() {
    this.load();
    this.timer = setInterval(() => !document.hidden && this.load(true), REFRESH_MS);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    clearTimeout(this.toastTimer);
  }

  say(text, bad = false) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: { text, bad } });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), bad ? 8000 : 3500);
  }

  async load(quiet = false) {
    if (!quiet) {
      this.setState({ loading: true, error: null });
    }
    try {
      const r = await adminCall(this.context, 'adminLiveSessions');
      this.setState({ sessions: r.sessions || [], now: r.now, livekit: r.livekit !== false, loading: false, error: null });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  async end(s) {
    const what = `${KIND[s.kind] || 'Session'}: "${s.title}"${s.host ? ` (${s.host})` : ''}`;
    const reason = window.prompt(
      `Shut down ${what}?\n\nEveryone in it is disconnected at once and any recording stops. ` +
      'This cannot be undone.\n\nReason (kept in the audit log):', s.reports ? 'Reported' : '');
    if (reason === null) {
      return;
    }
    this.setState({ busy: s.id });
    try {
      await adminCall(this.context, 'adminEndLiveSession', { kind: s.kind, id: s.id, roomName: s.roomName, reason });
      this.say(`Shut down: ${s.title}`);
      await this.load(true);
    } catch (e) {
      this.say(e.message || String(e), true);
    } finally {
      this.setState({ busy: null });
    }
  }

  renderContent() {
    const { loading, error, sessions, now, livekit, busy, toast } = this.state;
    const toolbar = (
      <Toolbar section="Admin" subsection="Live">
        <div className={styles.barActions}>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Live sessions couldn't be loaded: {error}</div>;
    } else if (!loading) {
      body = (
        <>
          <p className={styles.hint}>
            Everything live or getting ready right now. Refreshes every 15 seconds.
            Shut down disconnects everyone in the session and stops its recording.
          </p>
          {!livekit && <div className={styles.notice}>The live server isn't configured here — viewer counts and stuck rooms can't be shown.</div>}
          {sessions.length === 0 ? (
            <div className={styles.empty}>Nothing is live right now.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Running</th>
                  <th>In it</th>
                  <th>Reports</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={`${s.kind}-${s.id}`}>
                    <td>
                      <strong>{s.title}</strong>
                      <div className={styles.meta}>
                        {KIND[s.kind] || s.kind}
                        {s.where && s.where !== s.title ? ` · ${s.where}` : ''}
                        {s.host ? ` · host ${s.host}` : ''}
                      </div>
                      <div className={`${styles.meta} ${styles.mono}`}>{s.roomName || s.id}</div>
                    </td>
                    <td>
                      <span className={`${styles.pill} ${statusPill(s)}`}>{s.status}</span>
                      {s.broadcasterGoneAt && <div className={styles.meta}>host left {when(s.broadcasterGoneAt)}</div>}
                    </td>
                    <td>
                      {running(s.startedAt, now)}
                      <div className={styles.meta}>since {when(s.startedAt) || '—'}</div>
                    </td>
                    <td>
                      {s.participants}
                      {s.waiting ? <div className={styles.meta}>{s.waiting} waiting</div> : null}
                    </td>
                    <td>{s.reports ? <span className={`${styles.pill} ${styles.pillRed}`}>{s.reports}</span> : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={`${styles.linkBtn} ${styles.danger}`} disabled={!!busy} onClick={() => this.end(s)}>
                        {busy === s.id ? 'Shutting down…' : 'Shut down'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      );
    }

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>{body}</div>
        </LoaderContainer>
        {toolbar}
        {toast && <div className={`${styles.toast} ${toast.bad ? styles.toastBad : ''}`}>{toast.text}</div>}
      </div>
    );
  }
}

export default LiveSessions;
