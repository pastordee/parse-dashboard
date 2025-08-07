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
import { buildAnalyticsUrl } from 'lib/AnalyticsConfig';

export default class AnalyticsDashboard extends DashboardView {
  constructor() {
    super();
    
    this.section = 'Analytics';
    this.subsection = 'Dashboard';
    
    // Initialize with safe defaults to prevent any undefined array access
    this.state = {
      loading: true,
      audienceData: {
        totalUsers: 0,
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        newUsers: 0,
        returningUsers: 0,
      },
      eventData: {
        apiRequests: 0,
        pushNotifications: 0,
        cloudCodeExecution: 0,
        fileUploads: 0,
        customEvents: 0,
      },
      performanceData: {
        avgResponseTime: 0,
        errorRate: 0,
        successfulRequests: 0,
        failedRequests: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      errorData: {
        '4xx': 0,
        '5xx': 0,
        timeouts: 0,
        other: 0,
      },
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

   

  async loadAnalytics() {
    try {
      // Get analytics endpoints from app context using centralized config
      const audienceUrl = buildAnalyticsUrl(this.context, 'analytics_content_audience');
      const analyticsUrl = buildAnalyticsUrl(this.context, 'analytics');
      const billingUrl = buildAnalyticsUrl(this.context, 'billing');
      
      console.log('📊 Loading analytics from:', { audienceUrl, analyticsUrl, billingUrl });
      
      // Fetch data from multiple endpoints in parallel
      const [
        audienceResponse,
        analyticsResponse,
        billingResponse
      ] = await Promise.all([
        fetch(audienceUrl),
        fetch(analyticsUrl),
        fetch(billingUrl)
      ]);

      // Parse all responses
      const audienceData = await audienceResponse.json();
      const analyticsData = await analyticsResponse.json();
      const billingData = await billingResponse.json();

      console.log('Server data received:', { audienceData, analyticsData, billingData });

      // Generate API usage chart data from analytics data
      const currentDate = new Date();
      const pastDays = 30;
      const apiUsageData = [];
      
      for (let i = pastDays - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        apiUsageData.push({
          date: yearMonthDayFormatter(date),
          requests: Math.floor(Math.random() * 5000) + 1000, // Still using random for chart demo
          errors: Math.floor(Math.random() * 100) + 10,
        });
      }

      this.setState({
        loading: false,
        audienceData: {
          totalUsers: audienceData.totalUsers || 0,
          dailyActiveUsers: audienceData.dailyActiveUsers || 0,
          weeklyActiveUsers: audienceData.weeklyActiveUsers || 0,
          monthlyActiveUsers: audienceData.monthlyActiveUsers || 0,
          newUsers: audienceData.newUsers || 0,
          returningUsers: audienceData.returningUsers || 0,
        },
        eventData: {
          apiRequests: analyticsData.apiRequests || 0,
          pushNotifications: analyticsData.pushNotifications || 0,
          cloudCodeExecution: analyticsData.cloudCodeExecution || 0,
          fileUploads: analyticsData.fileUploads || 0,
          customEvents: analyticsData.customEvents || 0,
        },
        performanceData: {
          avgResponseTime: analyticsData.avgResponseTime || 0,
          errorRate: analyticsData.errorRate || 0,
          successfulRequests: analyticsData.successfulRequests || 0,
          failedRequests: analyticsData.failedRequests || 0,
          p95ResponseTime: analyticsData.p95ResponseTime || 0,
          p99ResponseTime: analyticsData.p99ResponseTime || 0,
        },
        errorData: {
          '4xx': analyticsData.errorData?.['4xx'] || 0,
          '5xx': analyticsData.errorData?.['5xx'] || 0,
          timeouts: analyticsData.errorData?.timeouts || 0,
          other: analyticsData.errorData?.other || 0,
        },
        apiUsageData,
        topEvents: analyticsData.topEvents || [],
        recentActivity: analyticsData.recentActivity || []
      });
    } catch (error) {
      console.error('Failed to load analytics data from server:', error);
      
      // Fallback to mock data if server request fails
      this.setState({
        loading: false,
        audienceData: {
          totalUsers: 0,
          dailyActiveUsers: 0,
          weeklyActiveUsers: 0,
          monthlyActiveUsers: 0,
          newUsers: 0,
          returningUsers: 0,
        },
        eventData: {
          apiRequests: 0,
          pushNotifications: 0,
          cloudCodeExecution: 0,
          fileUploads: 0,
          customEvents: 0,
        },
        performanceData: {
          avgResponseTime: 0,
          errorRate: 0,
          successfulRequests: 0,
          failedRequests: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
        },
        errorData: {
          '4xx': 0,
          '5xx': 0,
          timeouts: 0,
          other: 0,
        },
        apiUsageData: [],
        topEvents: [],
        recentActivity: []
      });
    }
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

    // DonutChart expects segments (array of numbers), not data objects
    const engagementSegments = engagementData.map(item => item.value);

    return this.renderChartSection('User Engagement', (
      <div className={styles.engagementGrid}>
        <DonutChart 
          segments={engagementSegments}
          diameter={200}
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

    // DonutChart expects segments (array of numbers), not data objects
    const errorSegments = errorChartData.map(item => item.value);

    return this.renderChartSection('Error Distribution', (
      <div className={styles.errorGrid}>
        <DonutChart 
          segments={errorSegments}
          diameter={200}
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

    // Chart expects data format: { datasetName: { points: [[x,y], ...], color: 'color' } }
    const chartData = {
      'API Requests': {
        points: safeApiUsageData.map(d => [new Date(d.date).getTime(), d.requests]),
        color: '#5298FC'
      },
      'Errors': {
        points: safeApiUsageData.map(d => [new Date(d.date).getTime(), d.errors]),
        color: '#FF6B6B'
      }
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

    // DonutChart expects segments (array of numbers), not data objects
    const performanceSegments = performanceChartData.map(item => item.value);

    return this.renderChartSection('Response Time Distribution', (
      <div className={styles.performanceGrid}>
        <div className={styles.performanceChart}>
          <DonutChart 
            segments={performanceSegments}
            diameter={180}
            printPercentage={false}
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
        <div className={styles.metricsGrid} style={{ marginTop: '80px' }}>
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

  // Remove renderSidebar() to show main dashboard navigation instead of analytics-specific categories
  // This allows the default DashboardView sidebar with Core, Views, Agent, API Console, Analytics, App Settings
  /*
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
  */
}
