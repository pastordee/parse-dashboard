/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import CategoryList from 'components/CategoryList/CategoryList.react';
import Chart from 'components/Chart/Chart.react';
import DashboardView from 'dashboard/DashboardView.react';
import DonutChart from 'components/DonutChart/DonutChart.react';
import Icon from 'components/Icon/Icon.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import styles from './AnalyticsDashboard.scss';
import { yearMonthDayFormatter } from 'lib/DateUtils';

export default class AnalyticsDashboard extends DashboardView {
  constructor() {
    super();
    
    this.section = 'Analytics';
    this.subsection = 'Dashboard';
    
    this.state = {
      loading: true,
      audienceData: {},
      eventData: {},
      performanceData: {},
      errorData: {},
      dateRange: 'last_7_days',
      apiUsageData: [],
      topEvents: [],
      recentActivity: [],
    };
    
    this.handleDateRangeChange = this.handleDateRangeChange.bind(this);
    this.refreshData = this.refreshData.bind(this);
  }

  componentDidMount() {
    this.loadAnalytics();
  }

  handleDateRangeChange(range) {
    this.setState({ 
      dateRange: range,
      loading: true 
    }, () => {
      this.loadAnalytics();
    });
  }

  refreshData() {
    this.setState({ loading: true });
    this.loadAnalytics();
  }

  loadAnalytics() {
    // Simulate loading analytics data with more comprehensive mock data
    setTimeout(() => {
      const currentDate = new Date();
      const pastDays = 30;
      const apiUsageData = [];
      
      // Generate mock API usage data for the chart
      for (let i = pastDays - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        apiUsageData.push({
          date: yearMonthDayFormatter(date),
          requests: Math.floor(Math.random() * 5000) + 1000,
          errors: Math.floor(Math.random() * 100) + 10,
        });
      }

      this.setState({
        loading: false,
        audienceData: {
          totalUsers: 12453,
          dailyActiveUsers: 2341,
          weeklyActiveUsers: 8934,
          monthlyActiveUsers: 11234,
          newUsers: 234,
          returningUsers: 2107,
        },
        eventData: {
          apiRequests: 45623,
          pushNotifications: 1234,
          cloudCodeExecution: 567,
          fileUploads: 123,
          customEvents: 2345,
        },
        performanceData: {
          avgResponseTime: 245,
          errorRate: 0.23,
          successfulRequests: 45200,
          failedRequests: 423,
          p95ResponseTime: 450,
          p99ResponseTime: 780,
        },
        errorData: {
          '4xx': 234,
          '5xx': 189,
          timeouts: 45,
          other: 12,
        },
        apiUsageData,
        topEvents: [
          { name: 'user_login', count: 3421, trend: 12.5 },
          { name: 'item_purchase', count: 2187, trend: -3.2 },
          { name: 'page_view', count: 8934, trend: 23.1 },
          { name: 'user_signup', count: 456, trend: 45.6 },
          { name: 'share_content', count: 1234, trend: 8.9 },
        ],
        recentActivity: [
          { time: '2 minutes ago', event: 'New user registered', type: 'user', severity: 'info' },
          { time: '5 minutes ago', event: 'API rate limit exceeded', type: 'error', severity: 'warning' },
          { time: '8 minutes ago', event: 'Push notification sent to 1,245 devices', type: 'push', severity: 'success' },
          { time: '12 minutes ago', event: 'Cloud function execution completed', type: 'function', severity: 'info' },
          { time: '15 minutes ago', event: 'Database query slow (>500ms)', type: 'performance', severity: 'warning' },
        ]
      });
    }, 1000);
  }

  renderMetricCard(title, value, subtitle, icon, trend) {
    const trendClass = trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : styles.trendNeutral;
    const trendIcon = trend > 0 ? 'up-outline' : trend < 0 ? 'down-outline' : 'minus-outline';
    
    return (
      <div className={styles.metricCard}>
        <div className={styles.metricHeader}>
          <div className={styles.metricIcon}>
            <Icon name={icon} width={24} height={24} />
          </div>
          <div className={styles.metricTrend + ' ' + trendClass}>
            <Icon name={trendIcon} width={16} height={16} />
            {Math.abs(trend)}%
          </div>
        </div>
        <div className={styles.metricValue}>
          {typeof value === 'string' && (value.includes('%') || value.includes('ms')) 
            ? value 
            : prettyNumber(value)
          }
        </div>
        <div className={styles.metricTitle}>{title}</div>
        {subtitle && <div className={styles.metricSubtitle}>{subtitle}</div>}
      </div>
    );
  }

  renderChartSection(title, children) {
    return (
      <div className={styles.chartSection}>
        <div className={styles.chartTitle}>{title}</div>
        <div className={styles.chartContent}>
          {children}
        </div>
      </div>
    );
  }

  renderUserEngagement() {
    const { audienceData = {} } = this.state;
    
    const engagementData = [
      { label: 'New Users', value: audienceData.newUsers || 0, color: '#5298FC' },
      { label: 'Returning Users', value: audienceData.returningUsers || 0, color: '#61C354' },
    ];

    return this.renderChartSection('User Engagement', (
      <div className={styles.engagementGrid}>
        <DonutChart 
          data={engagementData}
          width={200}
          height={200}
        />
        <div className={styles.engagementStats}>
          {engagementData.map((item, index) => (
            <div key={index} className={styles.engagementStat}>
              <div 
                className={styles.engagementColor} 
                style={{ backgroundColor: item.color }}
              />
              <span className={styles.engagementLabel}>{item.label}</span>
              <span className={styles.engagementValue}>{prettyNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  renderErrorDistribution() {
    const { errorData = {} } = this.state;
    
    const errorChartData = [
      { label: '4xx Errors', value: errorData['4xx'] || 0, color: '#FF6B6B' },
      { label: '5xx Errors', value: errorData['5xx'] || 0, color: '#FF8E8E' },
      { label: 'Timeouts', value: errorData.timeouts || 0, color: '#FFB3B3' },
      { label: 'Other', value: errorData.other || 0, color: '#FFD6D6' },
    ];

    return this.renderChartSection('Error Distribution', (
      <div className={styles.errorGrid}>
        <DonutChart 
          data={errorChartData}
          width={200}
          height={200}
        />
        <div className={styles.errorStats}>
          {errorChartData.map((item, index) => (
            <div key={index} className={styles.errorStat}>
              <div 
                className={styles.errorColor} 
                style={{ backgroundColor: item.color }}
              />
              <span className={styles.errorLabel}>{item.label}</span>
              <span className={styles.errorValue}>{prettyNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  renderApiUsageChart() {
    const { apiUsageData } = this.state;
    const safeApiUsageData = Array.isArray(apiUsageData) ? apiUsageData : [];
    
    if (!safeApiUsageData.length) return null;

    const chartData = {
      datasets: [
        {
          label: 'API Requests',
          data: safeApiUsageData.map(d => ({ x: d.date, y: d.requests })),
          borderColor: '#5298FC',
          backgroundColor: 'rgba(82, 152, 252, 0.1)',
          fill: true,
        },
        {
          label: 'Errors',
          data: safeApiUsageData.map(d => ({ x: d.date, y: d.errors })),
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          fill: true,
        }
      ]
    };

    return this.renderChartSection('API Usage Over Time', (
      <Chart
        data={chartData}
        width={800}
        height={300}
        formatter={(value) => prettyNumber(value)}
      />
    ));
  }

  renderTopEvents() {
    const { topEvents } = this.state;
    const safeTopEvents = Array.isArray(topEvents) ? topEvents : [];
    
    if (!safeTopEvents.length) {
      return this.renderChartSection('Top Events', (
        <div className={styles.topEventsList}>
          <div>No events data available</div>
        </div>
      ));
    }
    
    return this.renderChartSection('Top Events', (
      <div className={styles.topEventsList}>
        {safeTopEvents.map((event, index) => (
          <div key={index} className={styles.eventItem}>
            <div className={styles.eventRank}>#{index + 1}</div>
            <div className={styles.eventDetails}>
              <div className={styles.eventName}>{event.name || 'Unknown Event'}</div>
              <div className={styles.eventCount}>{prettyNumber(event.count || 0)} events</div>
            </div>
            <div className={styles.eventTrend}>
              <span className={(event.trend || 0) > 0 ? styles.trendUp : styles.trendDown}>
                {(event.trend || 0) > 0 ? '+' : ''}{event.trend || 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    ));
  }

  renderPerformanceMetrics() {
    const { performanceData = {} } = this.state;
    
    const performanceChartData = [
      { label: 'Average', value: performanceData.avgResponseTime || 0, color: '#5298FC' },
      { label: '95th Percentile', value: performanceData.p95ResponseTime || 0, color: '#FFB020' },
      { label: '99th Percentile', value: performanceData.p99ResponseTime || 0, color: '#FF6B6B' },
    ];

    return this.renderChartSection('Response Time Distribution', (
      <div className={styles.performanceGrid}>
        <div className={styles.performanceChart}>
          <DonutChart 
            data={performanceChartData.map(item => ({ ...item, value: item.value }))}
            width={180}
            height={180}
            formatter={(value) => value + 'ms'}
          />
        </div>
        <div className={styles.performanceStats}>
          {performanceChartData.map((item, index) => (
            <div key={index} className={styles.performanceStat}>
              <div 
                className={styles.performanceColor} 
                style={{ backgroundColor: item.color }}
              />
              <span className={styles.performanceLabel}>{item.label}</span>
              <span className={styles.performanceValue}>{item.value}ms</span>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  renderActivityFeed() {
    const { recentActivity } = this.state;
    const safeRecentActivity = Array.isArray(recentActivity) ? recentActivity : [];
    
    if (!safeRecentActivity.length) {
      return this.renderChartSection('Real-time Activity', (
        <div className={styles.activityFeed}>
          <div>No activity data available</div>
        </div>
      ));
    }
    
    return this.renderChartSection('Real-time Activity', (
      <div className={styles.activityFeed}>
        {safeRecentActivity.map((activity, index) => (
          <div key={index} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <Icon 
                name={this.getActivityIcon(activity.type || 'default')} 
                width={16} 
                height={16} 
              />
            </div>
            <div className={styles.activityDetails}>
              <div className={styles.activityEvent}>{activity.event || 'Unknown Activity'}</div>
              <div className={styles.activityTime}>{activity.time || 'Unknown Time'}</div>
            </div>
            <div className={`${styles.activitySeverity} ${styles[activity.severity || 'info']}`}>
              {activity.severity || 'info'}
            </div>
          </div>
        ))}
      </div>
    ));
  }

  getActivityIcon(type) {
    const icons = {
      user: 'person-outline',
      error: 'warning-outline',
      push: 'notifications-outline',
      function: 'code-outline',
      performance: 'speedometer-outline',
    };
    return icons[type] || 'information-outline';
  }

  renderContent() {
    const { loading, audienceData = {}, eventData = {}, performanceData = {} } = this.state;
    
    if (loading) {
      return (
        <LoaderContainer loading={true}>
          <div className={styles.dashboardContainer}>
            Loading analytics data...
          </div>
        </LoaderContainer>
      );
    }

    return (
      <div className={styles.dashboardContainer}>
        <Toolbar>
          <div className={styles.toolbar}>
            <div className={styles.toolbarTitle}>
              <Icon name='analytics-outline' width={24} height={24} />
              Analytics Dashboard
            </div>
            <div className={styles.toolbarActions}>
              <select 
                className={styles.dateRangePicker}
                value={this.state.dateRange}
                onChange={(e) => this.handleDateRangeChange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
              </select>
              <Button 
                value="Refresh" 
                onClick={this.refreshData}
                primary={false}
              />
            </div>
          </div>
        </Toolbar>

        {/* Key Metrics Grid */}
        <div className={styles.metricsGrid}>
          {this.renderMetricCard('Total Users', audienceData.totalUsers || 0, 'All time', 'users-outline', 12.5)}
          {this.renderMetricCard('Daily Active', audienceData.dailyActiveUsers || 0, 'Last 24 hours', 'pulse-outline', 8.2)}
          {this.renderMetricCard('Weekly Active', audienceData.weeklyActiveUsers || 0, 'Last 7 days', 'trending-up-outline', 15.3)}
          {this.renderMetricCard('Monthly Active', audienceData.monthlyActiveUsers || 0, 'Last 30 days', 'calendar-outline', 6.7)}
          {this.renderMetricCard('API Requests', eventData.apiRequests || 0, 'Today', 'flash-outline', -2.1)}
          {this.renderMetricCard('Avg Response', (performanceData.avgResponseTime || 0) + 'ms', 'Last hour', 'speedometer-outline', -5.4)}
          {this.renderMetricCard('Error Rate', (performanceData.errorRate || 0) + '%', 'Today', 'warning-outline', 12.3)}
          {this.renderMetricCard('Push Sent', eventData.pushNotifications || 0, 'Today', 'notifications-outline', 45.2)}
        </div>

        {/* Charts Section */}
        <div className={styles.chartsSection}>
          <div className={styles.chartsRow}>
            <div className={styles.chartColumn}>
              {this.renderUserEngagement()}
            </div>
            <div className={styles.chartColumn}>
              {this.renderErrorDistribution()}
            </div>
          </div>
          
          <div className={styles.chartsRow}>
            <div className={styles.fullWidthChart}>
              {this.renderApiUsageChart()}
            </div>
          </div>
          
          <div className={styles.chartsRow}>
            <div className={styles.chartColumn}>
              {this.renderTopEvents()}
            </div>
            <div className={styles.chartColumn}>
              {this.renderPerformanceMetrics()}
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className={styles.activitySection}>
          {this.renderActivityFeed()}
        </div>
      </div>
    );
  }

  renderSidebar() {
    const current = this.subsection;
    return (
      <CategoryList current={current} linkPrefix={'analytics/'} categories={[
        { name: 'Dashboard', id: 'dashboard' },
        { name: 'Overview', id: 'overview' },
        { name: 'Explorer', id: 'explorer' },
        { name: 'Performance', id: 'performance' },
        { name: 'Retention', id: 'retention' },
        { name: 'Slow Queries', id: 'slow_queries' }
      ]} />
    );
  }
}
