// Created: 2026-09-27
/*
 * Analytics → Website: visitors to prayercircle.co.uk and app downloads per
 * advert tag. Same numbers as the website's /web-analytics page, read with
 * the dashboard's own access (webStats.js), so no second login.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { loadWebStats } from './webStats';
import styles from './WebsiteAnalytics.scss';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

// ?src= tags on prayercircle.co.uk/download — keep in step with web-analytics.html.
const ADVERT_LABELS = {
  car: '🚗 Car sign',
  share: '📱 Phone image',
  invite: '💌 App invites',
  'web-qr': '🖥️ QR on the download page',
  email: '✉️ Email signature',
  fb: 'Facebook',
  ig: 'Instagram',
  x: 'X',
  untagged: '⌨️ Typed link / old QR',
};

const fmt = n => (n || 0).toLocaleString();

function fmtTime(sec) {
  sec = sec || 0;
  if (sec < 60) {
    return sec + 's';
  }
  return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
}

class WebsiteAnalytics extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Analytics';
    this.subsection = 'Website';
    this.state = { days: 7, loading: true, error: null, data: null };
    this.refresh = this.refresh.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  async refresh(days = this.state.days) {
    this.setState({ loading: true, error: null, days });
    try {
      const data = await loadWebStats(this.context, days);
      this.setState({ data, loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  renderStat(icon, label, value, sub, tone) {
    return (
      <div className={styles.stat}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statLabel}>{label}</div>
        <div className={`${styles.statValue} ${styles[tone]}`}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    );
  }

  renderList(title, rows, labelOf = r => r.name) {
    const max = Math.max(1, ...rows.map(r => r.count));
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          {title} <span className={styles.count}>{rows.length || ''}</span>
        </div>
        {rows.length === 0 && <div className={styles.empty}>Nothing yet</div>}
        {rows.map(r => (
          <div key={r.name} className={styles.row}>
            <div className={styles.rowBar} style={{ width: `${(r.count / max) * 100}%` }} />
            <span className={styles.rowName}>{labelOf(r)}</span>
            <span className={styles.rowCount}>{fmt(r.count)}</span>
          </div>
        ))}
      </div>
    );
  }

  renderChart(series) {
    const max = Math.max(1, ...series.map(s => s.views));
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Daily traffic</div>
        <div className={styles.chart}>
          {series.map(s => (
            <div key={s.day} className={styles.chartCol} title={`${s.day}: ${s.views} views, ${s.visitors} visitors`}>
              <div className={styles.chartBars}>
                <div className={styles.barViews} style={{ height: `${(s.views / max) * 100}%` }} />
                <div className={styles.barVisitors} style={{ height: `${(s.visitors / max) * 100}%` }} />
              </div>
              {series.length <= 31 && <div className={styles.chartDay}>{s.day.slice(8)}</div>}
            </div>
          ))}
        </div>
        <div className={styles.legend}>
          <span><i className={styles.legendViews} />Page views</span>
          <span><i className={styles.legendVisitors} />Visitors</span>
        </div>
      </div>
    );
  }

  renderAdverts(adverts) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          📣 Downloads by advert <span className={styles.count}>{adverts.length || ''}</span>
        </div>
        <div className={styles.hint}>
          Visits to prayercircle.co.uk/download, by the <code>?src=</code> tag on the link, and where they went next.
        </div>
        {adverts.length === 0 && <div className={styles.empty}>No tagged visits yet</div>}
        {adverts.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Advert</th>
                <th>🍎 App Store</th>
                <th>▶️ Google Play</th>
                <th>🖥 Page only</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {adverts.map(a => (
                <tr key={a.src}>
                  <td>{ADVERT_LABELS[a.src] || `🏷️ ${a.src}`}</td>
                  <td>{fmt(a.app_store)}</td>
                  <td>{fmt(a.google_play)}</td>
                  <td>{fmt(a.page)}</td>
                  <td><strong>{fmt(a.count)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  renderContent() {
    const { loading, error, data, days } = this.state;
    const toolbar = (
      <Toolbar section="Analytics" subsection="Website">
        <div className={styles.barActions}>
          {data && <span className={styles.online}><i />{fmt(data.totals.online)} on the site now</span>}
          <select value={days} onChange={e => this.refresh(parseInt(e.target.value, 10))}>
            {RANGES.map(r => (
              <option key={r.days} value={r.days}>{r.label}</option>
            ))}
          </select>
          <Button value="Refresh" onClick={() => this.refresh()} primary={false} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Website analytics couldn't be loaded: {error}</div>;
    } else if (data) {
      const t = data.totals;
      const perDay = days > 1 ? `${fmt(Math.round(t.pageviews / days))} a day` : 'so far today';
      const perVisit = t.sessions ? (t.pageviews / t.sessions).toFixed(1) : '0.0';
      body = (
        <>
          <div className={styles.stats}>
            {this.renderStat('👥', 'Visitors', fmt(t.visitors), 'unique, per day', 'purple')}
            {this.renderStat('📄', 'Page views', fmt(t.pageviews), perDay, 'blue')}
            {this.renderStat('🧭', 'Visits', fmt(t.sessions), `${perVisit} pages a visit`, 'cyan')}
            {this.renderStat('⏱️', 'Avg. time', fmtTime(t.avgSeconds), 'on a page', 'green')}
            {this.renderStat('↩️', 'Bounce rate', `${t.bounceRate}%`, 'left after one page', 'amber')}
            {this.renderStat('📲', 'App downloads', fmt(t.downloads), 'store link taps', 'red')}
          </div>
          {this.renderChart(data.series)}
          {this.renderAdverts(data.adverts)}
          <div className={styles.grid}>
            {this.renderList('📄 Most visited', data.pages)}
            {this.renderList('🔗 Referrers', data.referrers)}
            {this.renderList('🌍 Countries', data.countries)}
            {this.renderList('⚡ Events', data.events)}
            {this.renderList('📱 Devices', data.devices)}
            {this.renderList('💻 Operating systems', data.os)}
            {this.renderList('🧭 Browsers', data.browsers)}
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

export default WebsiteAnalytics;
