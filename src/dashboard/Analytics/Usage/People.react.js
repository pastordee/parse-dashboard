// Created: 2026-09-28
/*
 * Analytics → People: one person's use of the app — each visit, the screens
 * in order with time on each, and the actions taken. From the first-party
 * usage log (cloud/analytics/appUsage.cjs → adminAppPeople,
 * adminUserTimeline). Every timeline opened is recorded in the admin audit
 * log (owner, 2026-09-28). Only names of screens and actions are stored —
 * never what anyone wrote.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when, ago } from 'dashboard/Admin/adminApi';
import { duration } from './AppUsage.react';
import styles from 'dashboard/Admin/Admin.scss';

const RANGES = [7, 14, 30, 90];

const time = d => {
  const x = d instanceof Date ? d : new Date(d?.iso || d);
  return x.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

class People extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Analytics';
    this.subsection = 'People';
    this.state = { query: '', results: null, searching: false, userId: null, days: 14, timeline: null, loading: false, error: null, open: {} };
  }

  componentDidMount() {
    const userId = new URLSearchParams(window.location.search).get('user');
    if (userId) {
      this.openPerson(userId);
    }
  }

  async search(e) {
    e && e.preventDefault();
    const query = this.state.query.trim();
    if (query.length < 2) {
      return;
    }
    this.setState({ searching: true, error: null });
    try {
      const results = await adminCall(this.context, 'adminAppPeople', { query });
      this.setState({ results, searching: false });
    } catch (err) {
      this.setState({ error: err.message || String(err), searching: false });
    }
  }

  async openPerson(userId, days = this.state.days) {
    this.setState({ userId, days, loading: true, error: null, timeline: null, open: {} });
    try {
      const timeline = await adminCall(this.context, 'adminUserTimeline', { userId, days });
      // Newest visit open to begin with.
      const first = timeline.sessions[0];
      this.setState({ timeline, loading: false, open: first ? { [first.id]: true } : {} });
    } catch (err) {
      this.setState({ error: err.message || String(err), loading: false });
    }
  }

  renderSearch() {
    const { query, results, searching } = this.state;
    return (
      <>
        <form className={styles.search} onSubmit={e => this.search(e)}>
          <input value={query} placeholder="Search by username or name" onChange={e => this.setState({ query: e.target.value })} />
          <Button value={searching ? 'Searching…' : 'Search'} primary={true} onClick={() => this.search()} />
        </form>
        {results && results.length === 0 && <div className={styles.empty}>Nobody matches.</div>}
        {results && results.length > 0 && (
          <table className={styles.table}>
            <thead><tr><th>Person</th><th>Last seen</th><th>Days used (30d)</th><th>Time (30d)</th></tr></thead>
            <tbody>
              {results.map(r => (
                <tr key={r.userId} style={{ cursor: 'pointer' }} onClick={() => this.openPerson(r.userId)}>
                  <td><strong>{r.name || r.username}</strong> <span className={styles.meta}>@{r.username}</span></td>
                  <td className={styles.meta}>{r.lastseen ? ago(r.lastseen) : '—'}</td>
                  <td>{r.days30}</td>
                  <td>{duration(r.seconds30)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }

  renderTimeline() {
    const { timeline: t, open } = this.state;
    const total = t.daily.reduce((s, d) => s + (d.seconds || 0), 0);
    const visits = t.daily.reduce((s, d) => s + (d.sessions || 0), 0);
    const max = Math.max(1, ...t.daily.map(d => d.seconds || 0));
    return (
      <>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>{t.user.name || t.user.username}</span>
            <span className={styles.meta}>@{t.user.username} · last seen {t.user.lastseen ? ago(t.user.lastseen) : 'never'}</span>
            {!t.user.sharesUsage && <span className={`${styles.pill} ${styles.pillAmber}`}>Usage statistics switched off</span>}
          </div>
          <div className={styles.meta}>
            Last {t.days} days: {visits} visits, {duration(total)} in the app, on {t.daily.length} days.
          </div>
          {t.daily.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, marginTop: 12 }}>
              {t.daily.map(d => (
                <div key={d.day} title={`${d.day}: ${d.sessions} visits, ${duration(d.seconds)}`}
                  style={{ flex: 1, background: '#5298fc', borderRadius: '3px 3px 0 0', height: `${Math.max(4, (d.seconds / max) * 100)}%` }} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.sectionTitle}>Visits · {t.sessions.length}</div>
        {t.sessions.length === 0 && <div className={styles.empty}>No visits recorded in this period.</div>}
        {t.sessions.map(s => (
          <div key={s.id} className={styles.card}>
            <div className={styles.cardHead} style={{ cursor: 'pointer', marginBottom: open[s.id] ? 10 : 0 }}
              onClick={() => this.setState({ open: { ...open, [s.id]: !open[s.id] } })}>
              <span className={styles.cardTitle}>{when(s.start)}</span>
              <span className={styles.pill}>{s.seconds != null ? duration(s.seconds) : 'still open'}</span>
              <span className={styles.meta}>
                {s.steps.filter(x => x.type === 'screen').length} screens · {s.steps.filter(x => x.type === 'action').length} actions
                {s.platform ? ` · ${s.platform}` : ''}{s.appVersion ? ` ${s.appVersion}` : ''}
              </span>
            </div>
            {open[s.id] && (
              <table className={styles.table} style={{ boxShadow: 'none' }}>
                <tbody>
                  {s.steps.map((x, i) => (
                    <tr key={i}>
                      <td className={styles.meta} style={{ width: 90 }}>{time(x.at)}</td>
                      <td>
                        {x.type === 'screen'
                          ? <><span className={styles.pill}>screen</span> {x.name}</>
                          : <><span className={`${styles.pill} ${styles.pillGreen}`}>action</span> {x.name}
                            {x.props ? <span className={styles.meta}> {Object.entries(x.props).map(([k, v]) => `${k}: ${v}`).join(', ')}</span> : null}</>}
                      </td>
                      <td className={styles.meta} style={{ width: 90, textAlign: 'right' }}>{x.type === 'screen' && x.seconds != null ? duration(x.seconds) : ''}</td>
                    </tr>
                  ))}
                  {s.steps.length === 0 && <tr><td className={styles.meta}>Nothing recorded in this visit.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </>
    );
  }

  renderContent() {
    const { userId, days, timeline, loading, error } = this.state;
    const toolbar = (
      <Toolbar section="Analytics" subsection="People">
        <div className={styles.barActions}>
          {userId && (
            <select value={days} onChange={e => this.openPerson(userId, parseInt(e.target.value, 10))}>
              {RANGES.map(d => <option key={d} value={d}>Last {d} days</option>)}
            </select>
          )}
          {userId && <Button value="Search again" primary={false} onClick={() => this.setState({ userId: null, timeline: null })} />}
        </div>
      </Toolbar>
    );

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>
            <p className={styles.hint}>
              One person's use of the app: visits, screens in order with time on each, and actions. Opening a
              timeline is recorded in the audit log. Only names of screens and actions are stored — never what anyone wrote.
            </p>
            {error && <div className={styles.error}>{/Invalid function/i.test(error) ? 'The server has no usage data functions yet — they arrive with the next Parse restart.' : error}</div>}
            {!userId && this.renderSearch()}
            {userId && timeline && this.renderTimeline()}
          </div>
        </LoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default People;
