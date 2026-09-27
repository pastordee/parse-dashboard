// Created: 2026-09-27
/*
 * Admin → Inbox: copies of the alert emails the server sends to admin@
 * (server starts, report notices, security events…). adminInboxList, the same
 * as the admin phone app. Read-only here: "read" is tracked per signed-in
 * admin, and the dashboard doesn't sign in as a user (adminInboxMarkRead
 * refuses a master-key call), so unread counts stay in the phone app.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when, ago } from './adminApi';
import styles from './Admin.scss';

const SEVERITY = { critical: 'pillRed', error: 'pillRed', warning: 'pillAmber', warn: 'pillAmber', info: 'pillBlue' };

class Inbox extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Inbox';
    this.state = { loading: true, error: null, messages: [], open: null, filter: '' };
  }

  componentDidMount() {
    this.load();
  }

  async load() {
    this.setState({ loading: true, error: null });
    try {
      const r = await adminCall(this.context, 'adminInboxList', { unreadOnly: false, limit: 100 });
      this.setState({ messages: r.messages || [], loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  renderContent() {
    const { loading, error, messages, open, filter } = this.state;
    const events = [...new Set(messages.map(m => m.event).filter(Boolean))].sort();
    const shown = filter ? messages.filter(m => m.event === filter) : messages;
    const toolbar = (
      <Toolbar section="Admin" subsection="Inbox">
        <div className={styles.barActions}>
          <select value={filter} onChange={e => this.setState({ filter: e.target.value })}>
            <option value="">All alerts</option>
            {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>The inbox couldn't be loaded: {error}</div>;
    } else if (!loading) {
      body = (
        <>
          <p className={styles.hint}>
            Copies of the alert emails sent to admin@ — the last 100. Click one to read it.
            Marking as read stays in the admin app, where it is kept per person.
          </p>
          {shown.length === 0 && <div className={styles.empty}>No alerts.</div>}
          {shown.map(m => (
            <div key={m.id} className={styles.card} style={{ cursor: 'pointer' }}
              onClick={() => this.setState({ open: open === m.id ? null : m.id })}>
              <div className={styles.cardHead} style={{ marginBottom: 0 }}>
                <span className={`${styles.pill} ${styles[SEVERITY[m.severity]] || ''}`}>{m.severity || 'info'}</span>
                <span className={styles.cardTitle}>{m.subject}</span>
                <span className={styles.meta}>{m.event} · {ago(m.sentAt)}</span>
                {!m.sent && <span className={`${styles.pill} ${styles.pillAmber}`} title={m.dropReason || ''}>not emailed</span>}
              </div>
              {open === m.id && (
                <>
                  <div className={styles.body}>{m.body}</div>
                  <div className={styles.meta} style={{ marginTop: 10 }}>
                    {when(m.sentAt)}{m.to ? ` · to ${m.to}` : ''}{m.via ? ` · via ${m.via}` : ''}
                    {m.dropReason ? ` · not emailed: ${m.dropReason}` : ''}
                  </div>
                </>
              )}
            </div>
          ))}
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

export default Inbox;
