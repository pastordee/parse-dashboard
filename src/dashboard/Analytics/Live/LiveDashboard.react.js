/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import DashboardView from 'dashboard/DashboardView.react';
import Icon from 'components/Icon/Icon.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import styles from './LiveDashboard.scss';
import { buildAnalyticsUrl } from 'lib/AnalyticsConfig';

// Import sub-components
import LiveStats from './LiveStats.react';
import PlatformBreakdown from './PlatformBreakdown.react';
import StreamsList from './StreamsList.react';
import RoomsList from './RoomsList.react';
import ContentOverview from './ContentOverview.react';
import ActivityBreakdown from './ActivityBreakdown.react';
import RecentRegistrations from './RecentRegistrations.react';

export default class LiveDashboard extends DashboardView {
  constructor() {
    super();

    this.section = 'Analytics';
    this.subsection = 'Live';

    this.state = {
      loading: true,
      error: null,
      liveStats: {
        totalUsers: 0,
        downloads: 0,
        onlineNow: 0,
        activeToday: 0,
        activeThisWeek: 0,
        newToday: 0,
      },
      platformBreakdown: {
        ios: 0,
        android: 0,
        unknown: 0,
      },
      liveStreams: [],
      prayerRooms: [],
      contentOverview: {
        prayers: 0,
        posts: 0,
        reels: 0,
        sermons: 0,
        groups: 0,
      },
      activityBreakdown: {
        today: {},
        thisWeek: {},
        thisMonth: {},
      },
      recentRegistrations: [],
      lastUpdate: null,
      pollInterval: 5000, // 5 seconds
    };

    this.handleRefresh = this.handleRefresh.bind(this);
    this.loadLiveStats = this.loadLiveStats.bind(this);
  }

  componentDidMount() {
    this.loadLiveStats();

    // Set up polling interval
    this.pollInterval = setInterval(() => {
      this.loadLiveStats();
    }, this.state.pollInterval);
  }

  componentWillUnmount() {
    // Clear polling interval on unmount
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  handleRefresh() {
    this.setState({ loading: true });
    this.loadLiveStats();
  }

  async loadLiveStats() {
    try {
      const url = buildAnalyticsUrl(this.context, 'live-stats');
      console.log('📊 Loading live stats from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const data = json.data || json;

      console.log('Live stats data received:', data);

      // Map endpoint response to component state format
      const users = data.users || {};
      const live = data.live || {};
      const content = data.content || {};
      const activity = data.activity || {};
      const recent = data.recent || [];

      this.setState({
        loading: false,
        error: null,
        liveStats: {
          totalUsers: users.total || 0,
          downloads: users.downloads || 0,
          onlineNow: users.onlineNow || 0,
          activeToday: users.activeToday || 0,
          activeThisWeek: users.activeThisWeek || 0,
          newToday: users.newToday || 0,
        },
        platformBreakdown: {
          ios: users.ios || 0,
          android: users.android || 0,
          unknown: users.other || 0,
        },
        liveStreams: Array.isArray(live.streams) ? live.streams : [],
        prayerRooms: Array.isArray(live.groups) ? live.groups : [],
        contentOverview: {
          prayers: content.prayers || 0,
          posts: content.posts || 0,
          reels: content.reels || 0,
          sermons: content.sermons || 0,
          groups: content.groups || 0,
        },
        activityBreakdown: {
          today: activity.today || {},
          thisWeek: activity.week || {},
          thisMonth: activity.month || {},
        },
        recentRegistrations: Array.isArray(recent) ? recent : [],
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('Failed to load live stats:', error);

      this.setState({
        loading: false,
        error: error.message,
        liveStats: {
          totalUsers: 0,
          downloads: 0,
          onlineNow: 0,
          activeToday: 0,
          activeThisWeek: 0,
          newToday: 0,
        },
        platformBreakdown: {
          ios: 0,
          android: 0,
          unknown: 0,
        },
        liveStreams: [],
        prayerRooms: [],
        contentOverview: {
          prayers: 0,
          posts: 0,
          reels: 0,
          sermons: 0,
          groups: 0,
        },
        activityBreakdown: {
          today: {},
          thisWeek: {},
          thisMonth: {},
        },
        recentRegistrations: [],
      });
    }
  }

  renderLiveBadge() {
    return (
      <div className={styles.liveBadge}>
        <span className={styles.livePulse}></span>
        Live
      </div>
    );
  }

  renderContent() {
    const {
      loading,
      error,
      liveStats,
      platformBreakdown,
      liveStreams,
      prayerRooms,
      contentOverview,
      activityBreakdown,
      recentRegistrations,
      lastUpdate,
    } = this.state;

    if (loading) {
      return (
        <LoaderContainer loading={true}>
          <div className={styles.liveContainer}>
            Loading live stats...
          </div>
        </LoaderContainer>
      );
    }

    return (
      <div className={styles.liveContainer}>
        <Toolbar section="Analytics" subsection="Live">
          <div className={styles.barActions}>
            {this.renderLiveBadge()}
            {lastUpdate && (
              <div className={styles.lastUpdate}>
                Updated {this.formatUpdateTime(lastUpdate)}
              </div>
            )}
            <Button
              value="Refresh"
              onClick={this.handleRefresh}
              primary={false}
            />
          </div>
        </Toolbar>

        {error && (
          <div className={styles.errorBanner}>
            <Icon name='warning-outline' width={20} height={20} />
            <span>Error loading live stats: {error}</span>
          </div>
        )}

        {/* Live Stats Cards */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Live Statistics</h2>
          <LiveStats stats={liveStats} />
        </div>

        {/* Platform Breakdown */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Platform Breakdown</h2>
          <PlatformBreakdown breakdown={platformBreakdown} />
        </div>

        {/* Content Overview Grid */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Content Overview</h2>
          <ContentOverview content={contentOverview} />
        </div>

        {/* Live Streams and Prayer Rooms in two columns */}
        <div className={styles.twoColumnSection}>
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Live Streams</h2>
              <StreamsList streams={liveStreams} />
            </div>
          </div>
          <div className={styles.column}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Prayer Rooms</h2>
              <RoomsList rooms={prayerRooms} />
            </div>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Activity Breakdown</h2>
          <ActivityBreakdown breakdown={activityBreakdown} />
        </div>

        {/* Recent Registrations */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Registrations</h2>
          <RecentRegistrations registrations={recentRegistrations} />
        </div>
      </div>
    );
  }

  formatUpdateTime(date) {
    if (!date) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  }
}
