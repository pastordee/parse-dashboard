/*
 * Analytics → Dashboard.
 *
 * Rewritten 2026-09-27 to show only measured numbers (dashStats.js). The old
 * page's trend badges were constants (+12.5%, +8.2%…), its "API usage" chart
 * was Math.random(), and API requests / response time / error rate / top
 * events / activity had no data source at all — those cards are gone rather
 * than showing zeros that look like measurements.
 */
import Button from 'components/Button/Button.react';
import DashboardView from 'dashboard/DashboardView.react';
import DonutChart from 'components/DonutChart/DonutChart.react';
import Icon from 'components/Icon/Icon.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { CurrentApp } from 'context/currentApp';
import { loadDashStats } from './dashStats';
import styles from './AnalyticsDashboard.scss';
import chart from '../Website/WebsiteAnalytics.scss';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

const PERIOD_WORDS = { 1: 'Last 24 hours', 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' };
const BEFORE_WORDS = { 1: 'the day before', 7: 'the week before', 30: 'the 30 days before', 90: 'the 90 days before' };

class AnalyticsDashboard extends DashboardView {
  static contextType = CurrentApp;

  constructor() {
    super();
    this.section = 'Analytics';
    this.subsection = 'Dashboard';
    this.state = { days: 7, loading: true, error: null, data: null };
    this.refresh = this.refresh.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  async refresh(days = this.state.days) {
    this.setState({ loading: true, error: null, days });
    try {
      const data = await loadDashStats(this.context, days);
      this.setState({ data, loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  // trend: a percentage, or null to show no badge (nothing to compare with).
  renderMetricCard(title, value, subtitle, icon, trend = null, trendTitle = '') {
    let badge = null;
    if (trend !== null && trend !== undefined) {
      const trendClass = trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : styles.trendNeutral;
      const trendIcon = trend > 0 ? 'up-outline' : trend < 0 ? 'down-outline' : 'minus-outline';
      badge = (
        <div className={styles.metricTrend + ' ' + trendClass} title={trendTitle}>
          <Icon name={trendIcon} width={16} height={16} />
          {Math.abs(trend)}%
        </div>
      );
    }
    return (
      <div className={styles.metricCard}>
        <div className={styles.metricHeader}>
          <div className={styles.metricIcon}>
            <Icon name={icon} width={24} height={24} />
          </div>
          {badge}
        </div>
        <div className={styles.metricValue}>{prettyNumber(value)}</div>
        <div className={styles.metricTitle}>{title}</div>
        {subtitle && <div className={styles.metricSubtitle}>{subtitle}</div>}
      </div>
    );
  }

  // A count compared with the period before; no badge when that was zero.
  renderComparedCard(title, stat, icon) {
    const { days } = this.state;
    const sub = stat.change === null
      ? `${PERIOD_WORDS[days]} · none ${BEFORE_WORDS[days]}`
      : `${PERIOD_WORDS[days]} · ${prettyNumber(stat.before)} ${BEFORE_WORDS[days]}`;
    return this.renderMetricCard(title, stat.value, sub, icon, stat.change,
      `Compared with ${BEFORE_WORDS[days]}`);
  }

  renderChartSection(title, children) {
    return (
      <div className={styles.chartSection}>
        <div className={styles.chartTitle}>{title}</div>
        <div className={styles.chartContent}>{children}</div>
      </div>
    );
  }

  renderEngagement() {
    const { engagement } = this.state.data;
    const items = [
      { label: 'New users', value: engagement.newUsers, color: '#5298FC' },
      { label: 'Returning users', value: engagement.returning, color: '#61C354' },
    ];
    return this.renderChartSection(`Who was active · ${PERIOD_WORDS[this.state.days]}`, (
      <div className={styles.engagementGrid}>
        <DonutChart segments={items.map(i => i.value)} diameter={200} />
        <div className={styles.engagementStats}>
          {items.map(item => (
            <div key={item.label} className={styles.engagementStat}>
              <div className={styles.engagementColor} style={{ backgroundColor: item.color }} />
              <span className={styles.engagementLabel}>{item.label}</span>
              <span className={styles.engagementValue}>{prettyNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  renderDaily() {
    const { series } = this.state.data;
    const max = Math.max(1, ...series.map(s => Math.max(s.signups, s.prayers)));
    return this.renderChartSection('Sign-ups and prayers per day', (
      <div style={{ width: '100%' }}>
        <div className={chart.chart}>
          {series.map(s => (
            <div key={s.day} className={chart.chartCol} title={`${s.day}: ${s.signups} sign-ups, ${s.prayers} prayers`}>
              <div className={chart.chartBars}>
                <div className={chart.barViews} style={{ height: `${(s.prayers / max) * 100}%` }} />
                <div className={chart.barVisitors} style={{ height: `${(s.signups / max) * 100}%` }} />
              </div>
              {series.length <= 31 && <div className={chart.chartDay}>{s.day.slice(8)}</div>}
            </div>
          ))}
        </div>
        <div className={chart.legend}>
          <span><i className={chart.legendViews} />Prayers posted</span>
          <span><i className={chart.legendVisitors} />New sign-ups</span>
        </div>
      </div>
    ));
  }

  renderContent() {
    const { loading, error, data, days } = this.state;
    const toolbar = (
      <Toolbar section="Analytics" subsection="Dashboard">
        <div className={styles.barActions}>
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
      body = <div className={chart.error}>Analytics couldn't be loaded: {error}</div>;
    } else if (data) {
      body = (
        <>
          <div className={styles.metricsGrid}>
            {this.renderMetricCard('Total users', data.totalUsers, 'All time', 'users-outline')}
            {this.renderMetricCard('Active today', data.active.day, 'Opened the app · last 24 hours', 'phone-outline')}
            {this.renderMetricCard('Active this week', data.active.week, 'Opened the app · last 7 days', 'analytics-outline')}
            {this.renderMetricCard('Active this month', data.active.month, 'Opened the app · last 30 days', 'calendar-outline')}
            {this.renderComparedCard('New sign-ups', data.signups, 'plus-outline')}
            {this.renderComparedCard('Prayers posted', data.prayers, 'star-outline')}
            {this.renderComparedCard('Push notifications', data.pushes, 'push-outline')}
          </div>
          <div className={styles.chartsSection}>
            <div className={styles.chartsRow}>
              <div className={styles.chartColumn}>{this.renderEngagement()}</div>
              <div className={styles.chartColumn}>{this.renderDaily()}</div>
            </div>
          </div>
        </>
      );
    }

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.dashboardContainer}>{body}</div>
        </LoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default AnalyticsDashboard;
