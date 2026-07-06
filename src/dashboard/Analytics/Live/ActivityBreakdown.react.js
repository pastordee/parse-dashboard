/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React, { useState } from 'react';
import prettyNumber from 'lib/prettyNumber';
import styles from './LiveDashboard.scss';

export default function ActivityBreakdown({ breakdown = {} }) {
  const [activeTab, setActiveTab] = useState('today');

  const { today = {}, thisWeek = {}, thisMonth = {} } = breakdown;

  const tabs = [
    { id: 'today', label: 'Today', data: today },
    { id: 'thisWeek', label: 'This Week', data: thisWeek },
    { id: 'thisMonth', label: 'This Month', data: thisMonth },
  ];

  const currentData = tabs.find(tab => tab.id === activeTab)?.data || {};

  const activityMetrics = [
    { label: 'Prayers Shared', key: 'prayersShared', icon: '🙏' },
    { label: 'Comments', key: 'comments', icon: '💬' },
    { label: 'Reactions', key: 'reactions', icon: '❤️' },
    { label: 'Shares', key: 'shares', icon: '📤' },
    { label: 'Messages Sent', key: 'messagesSent', icon: '✉️' },
    { label: 'Room Joins', key: 'roomJoins', icon: '🚪' },
  ];

  return (
    <div className={styles.activityBreakdownContainer}>
      <div className={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.activityMetricsGrid}>
        {activityMetrics.map((metric, index) => (
          <div key={index} className={styles.activityMetric}>
            <div className={styles.metricIcon}>{metric.icon}</div>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.metricValue}>
              {prettyNumber(currentData[metric.key] || 0)}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(currentData).length === 0 && (
        <div className={styles.emptyMessage}>
          No activity data available for this period
        </div>
      )}
    </div>
  );
}
