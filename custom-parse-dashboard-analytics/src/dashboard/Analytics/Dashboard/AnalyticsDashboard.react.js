/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
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

export default class AnalyticsDashboard extends React.Component {
  constructor() {
    super();
    
    this.state = {
      loading: true,
      audienceData: {},
      eventData: {},
      performanceData: {},
      errorData: {},
      dateRange: 'last_7_days',
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
    // Simulate loading analytics data
    // In a real implementation, this would fetch from Parse Server analytics endpoints
    setTimeout(() => {
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
        },
        performanceData: {
          avgResponseTime: 245,
          errorRate: 0.23,
          successfulRequests: 45200,
          failedRequests: 423,
        },
        errorData: {
          '4xx': 234,
          '5xx': 189,
          timeouts: 45,
          other: 12,
        }
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
        <div className={styles.metricValue}>{prettyNumber(value)}</div>
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
    const { audienceData } = this.state;
    
    const engagementData = [
      { label: 'New Users', value: audienceData.newUsers, color: '#5298FC' },
      { label: 'Returning Users', value: audienceData.returningUsers, color: '#61C354' },
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
    const { errorData } = this.state;
    
    const errorChartData = [
      { label: '4xx Errors', value: errorData['4xx'], color: '#FF6B6B' },
      { label: '5xx Errors', value: errorData['5xx'], color: '#FF8E8E' },
      { label: 'Timeouts', value: errorData.timeouts, color: '#FFB3B3' },
      { label: 'Other', value: errorData.other, color: '#FFD6D6' },
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

  render() {
    const { loading, audienceData, eventData, performanceData } = this.state;

    const toolbar = (
      <Toolbar section="Analytics Dashboard">
        <div className={styles.toolbarControls}>
          <select 
            value={this.state.dateRange} 
            onChange={(e) => this.handleDateRangeChange(e.target.value)}
            className={styles.dateRangeSelect}
          >
            <option value="last_24_hours">Last 24 Hours</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
          </select>
          <Button 
            value="Refresh" 
            onClick={this.refreshData}
            primary={true}
          />
        </div>
      </Toolbar>
    );

    const content = (
      <div className={styles.analytics}>
        {loading ? (
          <LoaderContainer loading={true}>
            <div className={styles.loading}>Loading analytics data...</div>
          </LoaderContainer>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className={styles.metricsGrid}>
              {this.renderMetricCard(
                'Total Users', 
                audienceData.totalUsers, 
                'All registered users',
                'users-solid',
                5.2
              )}
              {this.renderMetricCard(
                'Daily Active Users', 
                audienceData.dailyActiveUsers, 
                'Users active today',
                'user-solid',
                12.3
              )}
              {this.renderMetricCard(
                'API Requests', 
                eventData.apiRequests, 
                'Total API calls',
                'cloud-outline',
                -2.1
              )}
              {this.renderMetricCard(
                'Avg Response Time', 
                `${performanceData.avgResponseTime}ms`, 
                'Average API response time',
                'time-solid',
                -8.5
              )}
              {this.renderMetricCard(
                'Success Rate', 
                `${(100 - parseFloat((performanceData.failedRequests / (performanceData.successfulRequests + performanceData.failedRequests) * 100).toFixed(2)))}%`, 
                'Successful requests',
                'checkmark-solid',
                1.2
              )}
              {this.renderMetricCard(
                'Push Notifications', 
                eventData.pushNotifications, 
                'Sent this period',
                'bell-solid',
                15.7
              )}
            </div>

            {/* Charts Row */}
            <div className={styles.chartsRow}>
              {this.renderUserEngagement()}
              {this.renderErrorDistribution()}
            </div>

            {/* Additional Metrics */}
            <div className={styles.additionalMetrics}>
              <div className={styles.metricGroup}>
                <h3>Activity Overview</h3>
                <div className={styles.metricList}>
                  <div className={styles.metricItem}>
                    <span>Weekly Active Users</span>
                    <span>{prettyNumber(audienceData.weeklyActiveUsers)}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Monthly Active Users</span>
                    <span>{prettyNumber(audienceData.monthlyActiveUsers)}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Cloud Code Executions</span>
                    <span>{prettyNumber(eventData.cloudCodeExecution)}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>File Uploads</span>
                    <span>{prettyNumber(eventData.fileUploads)}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.metricGroup}>
                <h3>Performance Metrics</h3>
                <div className={styles.metricList}>
                  <div className={styles.metricItem}>
                    <span>Successful Requests</span>
                    <span>{prettyNumber(performanceData.successfulRequests)}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Failed Requests</span>
                    <span>{prettyNumber(performanceData.failedRequests)}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Error Rate</span>
                    <span>{performanceData.errorRate}%</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Uptime</span>
                    <span>99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );

    return (
      <DashboardView>
        {toolbar}
        {content}
      </DashboardView>
    );
  }
}
