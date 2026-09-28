// Created: 2026-09-28
/*
 * Analytics → Crashes & errors: errors reported by the app, grouped by where
 * they happen (cloud/analytics/appErrors.cjs → adminAppErrors). Includes
 * "app_ended_unexpectedly" — a visit still in the foreground at the next
 * launch, i.e. a native crash or memory kill that Dart itself can't catch.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, ago } from 'dashboard/Admin/adminApi';
import styles from 'dashboard/Admin/Admin.scss';

const RANGES = [1, 7, 30, 90];
const SOURCE = { flutter: 'Flutter', async: 'Async', caught: 'Caught', exit: 'App closed' };

class Crashes extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Analytics';
    this.subsection = 'Crashes & errors';
    this.state = { days: 7, loading: true, error: null, data: null, open: null };
  }

  componentDidMount() {
    this.load();
  }

  async load(days = this.state.days) {
    this.setState({ loading: true, error: null, days });
    try {
      const data = await adminCall(this.context, 'adminAppErrors', { days });
      this.setState({ data, loading: false });
    } catch (e) {
      const msg = e.message || String(e);
      this.setState({
        error: /Invalid function/i.test(msg) ? 'The server has no error reporting functions yet — they arrive with the next Parse restart.' : msg,
        loading: false,
      });
    }
  }

  renderContent() {
    const { loading, error, data, days, open } = this.state;
    const toolbar = (
      <Toolbar section="Analytics" subsection="Crashes & errors">
        <div className={styles.barActions}>
          <select value={days} onChange={e => this.load(parseInt(e.target.value, 10))}>
            {RANGES.map(d => <option key={d} value={d}>{d === 1 ? 'Last 24 hours' : `Last ${d} days`}</option>)}
          </select>
          <Button value="Refresh" onClick={() => this.load()} primary={false} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>{error}</div>;
    } else if (data) {
      const max = Math.max(1, ...data.series.map(s => s.count));
      body = (
        <>
          <p className={styles.hint}>
            {data.total.toLocaleString()} errors from {data.reports.toLocaleString()} reports in the last {days === 1 ? '24 hours' : `${days} days`},
            grouped by where they happen — the most people affected first. “App closed while in use” means a visit ended
            without the app going to the background: a crash or the phone closing it.
          </p>
          <div className={styles.card} style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 70 }}>
            {data.series.map(s => (
              <div key={s.day} title={`${s.day}: ${s.count}`}
                style={{ flex: 1, background: s.count ? '#e74c3c' : '#e5e7eb', opacity: s.count ? 0.8 : 0.5, borderRadius: '3px 3px 0 0', height: `${Math.max(3, (s.count / max) * 100)}%` }} />
            ))}
          </div>
          {data.groups.length === 0 && <div className={styles.empty}>No errors reported. 🎉</div>}
          {data.groups.map(g => (
            <div key={g.fingerprint} className={styles.card}>
              <div className={styles.cardHead} style={{ cursor: 'pointer', marginBottom: 6 }}
                onClick={() => this.setState({ open: open === g.fingerprint ? null : g.fingerprint })}>
                {g.fatal && <span className={`${styles.pill} ${styles.pillRed}`}>crash</span>}
                <span className={styles.pill}>{SOURCE[g.source] || g.source}</span>
                <span className={styles.cardTitle}>{g.type === 'app_ended_unexpectedly' ? 'App closed while in use' : g.type}</span>
                <span className={styles.meta}>
                  {g.count.toLocaleString()}× · {g.people} {g.people === 1 ? 'person' : 'people'} · last {ago(g.lastAt)}
                </span>
              </div>
              <div className={styles.body} style={{ marginTop: 0 }}>{g.message}</div>
              <div className={styles.meta} style={{ marginTop: 6 }}>
                {g.screens.length > 0 && <>On: {g.screens.map(s => `${s.name} (${s.value})`).join(', ')} · </>}
                Versions: {g.versions.map(v => `${v.name} (${v.value})`).join(', ') || '—'} ·
                {' '}{g.platforms.map(p => `${p.name} (${p.value})`).join(', ') || '—'}
              </div>
              {open === g.fingerprint && g.stack && (
                <pre style={{ marginTop: 10, maxHeight: 360, overflow: 'auto', background: '#1e2433', color: '#e6e9ef', borderRadius: 6, padding: '10px 12px', fontSize: 11.5, lineHeight: 1.5 }}>
                  {g.stack}
                </pre>
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

export default Crashes;
