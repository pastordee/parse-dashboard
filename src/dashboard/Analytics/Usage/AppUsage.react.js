// Created: 2026-09-28
/*
 * Analytics → App usage: what people do in the app, from the app's own
 * first-party usage log (server: cloud/analytics/appUsage.cjs →
 * adminAppUsage). Active people, visits and time in app, top screens and
 * actions, platforms, app versions, weekly return rates, and the people who
 * spend the most time (click through to their timeline on the People page).
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall } from 'dashboard/Admin/adminApi';
import styles from 'dashboard/Analytics/Website/WebsiteAnalytics.scss';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

export function duration(sec) {
  sec = Math.round(sec || 0);
  if (sec < 60) {
    return `${sec}s`;
  }
  const m = Math.floor(sec / 60);
  if (m < 60) {
    return `${m}m ${sec % 60}s`;
  }
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const fmt = n => (n || 0).toLocaleString();

class AppUsage extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Analytics';
    this.subsection = 'App usage';
    this.state = { days: 7, loading: true, error: null, data: null };
  }

  componentDidMount() {
    this.load();
  }

  async load(days = this.state.days) {
    this.setState({ loading: true, error: null, days });
    try {
      const data = await adminCall(this.context, 'adminAppUsage', { days });
      this.setState({ data, loading: false });
    } catch (e) {
      const msg = e.message || String(e);
      this.setState({
        error: /Invalid function/i.test(msg) ? 'The server has no usage data functions yet — they arrive with the next Parse restart.' : msg,
        loading: false,
      });
    }
  }

  stat(icon, label, value, sub, tone) {
    return (
      <div className={styles.stat}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statLabel}>{label}</div>
        <div className={`${styles.statValue} ${styles[tone]}`}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    );
  }

  list(title, rows, valueOf = r => fmt(r.value)) {
    const max = Math.max(1, ...rows.map(r => r.value));
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>{title} <span className={styles.count}>{rows.length || ''}</span></div>
        {rows.length === 0 && <div className={styles.empty}>Nothing yet</div>}
        {rows.map(r => (
          <div key={r.name} className={styles.row}>
            <div className={styles.rowBar} style={{ width: `${(r.value / max) * 100}%` }} />
            <span className={styles.rowName}>{r.name}</span>
            <span className={styles.rowCount}>{valueOf(r)}</span>
          </div>
        ))}
      </div>
    );
  }

  chart(series) {
    const max = Math.max(1, ...series.map(s => s.people));
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>People in the app, per day</div>
        <div className={styles.chart}>
          {series.map(s => (
            <div key={s.day} className={styles.chartCol}
              title={`${s.day}: ${s.people} people (${s.signedIn} signed in), ${s.sessions} visits, ${duration(s.seconds)}`}>
              <div className={styles.chartBars}>
                <div className={styles.barViews} style={{ height: `${(s.people / max) * 100}%` }} />
                <div className={styles.barVisitors} style={{ height: `${(s.signedIn / max) * 100}%` }} />
              </div>
              {series.length <= 31 && <div className={styles.chartDay}>{s.day.slice(8)}</div>}
            </div>
          ))}
        </div>
        <div className={styles.legend}>
          <span><i className={styles.legendViews} />Everyone</span>
          <span><i className={styles.legendVisitors} />Signed in</span>
        </div>
      </div>
    );
  }

  cohorts(rows) {
    if (!rows.length) {
      return null;
    }
    const widest = Math.max(...rows.map(r => r.returned.length));
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Coming back, week by week</div>
        <div className={styles.hint}>People grouped by the week they were first seen; each column is the share still using the app that many weeks later.</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>First seen</th>
              <th>People</th>
              {Array.from({ length: widest }, (_, i) => <th key={i}>+{i + 1}w</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.week}>
                <td>w/c {r.week}</td>
                <td>{r.people}</td>
                {Array.from({ length: widest }, (_, i) => {
                  const n = r.returned[i];
                  if (n === undefined) {
                    return <td key={i} />;
                  }
                  const pct = Math.round((n / r.people) * 100);
                  return (
                    <td key={i} title={`${n} of ${r.people}`}
                      style={{ background: `rgba(82,152,252,${0.08 + (pct / 100) * 0.6})` }}>
                      {pct}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderContent() {
    const { loading, error, data, days } = this.state;
    const toolbar = (
      <Toolbar section="Analytics" subsection="App usage">
        <div className={styles.barActions}>
          <select value={days} onChange={e => this.load(parseInt(e.target.value, 10))}>
            {RANGES.map(r => <option key={r.days} value={r.days}>{r.label}</option>)}
          </select>
          <Button value="Refresh" onClick={() => this.load()} primary={false} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>{error}</div>;
    } else if (data) {
      const t = data.totals;
      const people = data.topPeople || [];
      body = (
        <>
          {t.people === 0 && (
            <div className={styles.hint}>
              No usage recorded yet. It starts arriving as people update to the app version with usage statistics.
            </div>
          )}
          <div className={styles.stats}>
            {this.stat('👥', 'People', fmt(t.people), `${fmt(t.signedIn)} signed in`, 'purple')}
            {this.stat('📱', 'Visits', fmt(t.sessions), t.people ? `${(t.sessions / t.people).toFixed(1)} per person` : '—', 'blue')}
            {this.stat('⏱️', 'Avg. visit', duration(t.avgSessionSeconds), 'time in the app', 'green')}
            {this.stat('📅', 'Time per day', duration(t.avgSecondsPerPersonDay), 'per person, on days used', 'cyan')}
            {this.stat('⌛', 'Total time', duration(t.seconds), 'everyone together', 'amber')}
          </div>
          {this.chart(data.series)}
          <div className={styles.grid}>
            {this.list('📄 Screens by visits', data.screensByVisits)}
            {this.list('⏱️ Screens by time', data.screensByTime, r => duration(r.value))}
            {this.list('⚡ Actions', data.actions)}
            {this.list('📱 Platforms (people)', data.platforms)}
            {this.list('🏷️ App versions (people)', data.versions)}
          </div>
          {this.cohorts(data.cohorts || [])}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Most time in the app <span className={styles.count}>{people.length || ''}</span></div>
            {people.length === 0 && <div className={styles.empty}>Nobody yet</div>}
            {people.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr><th>Person</th><th>Time</th><th>Visits</th><th>Days</th><th>Device</th></tr>
                </thead>
                <tbody>
                  {people.map(p => (
                    <tr key={p.owner}>
                      <td>
                        {p.userId
                          ? <a href={`people?user=${p.userId}`}>{p.name || p.username || p.userId}</a>
                          : <span style={{ opacity: 0.7 }}>Signed-out device</span>}
                        {p.username && p.name ? <span style={{ opacity: 0.6 }}> · @{p.username}</span> : null}
                      </td>
                      <td>{duration(p.seconds)}</td>
                      <td>{fmt(p.sessions)}</td>
                      <td>{p.days}</td>
                      <td>{[p.platform, p.appVersion].filter(Boolean).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

export default AppUsage;
