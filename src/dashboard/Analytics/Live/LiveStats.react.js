/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Icon from 'components/Icon/Icon.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import styles from './LiveDashboard.scss';

export default function LiveStats({ stats = {} }) {
  const {
    totalUsers = 0,
    downloads = 0,
    onlineNow = 0,
    activeToday = 0,
    activeThisWeek = 0,
    newToday = 0,
  } = stats;

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: 'users-outline',
      subtitle: 'All time',
    },
    {
      title: 'Downloads',
      value: downloads,
      icon: 'download-outline',
      subtitle: 'All platforms',
    },
    {
      title: 'Online Now',
      value: onlineNow,
      icon: 'radio-button-on-outline',
      subtitle: 'Active sessions',
      highlight: true,
    },
    {
      title: 'Active Today',
      value: activeToday,
      icon: 'pulse-outline',
      subtitle: 'Last 24 hours',
    },
    {
      title: 'Active This Week',
      value: activeThisWeek,
      icon: 'calendar-outline',
      subtitle: 'Last 7 days',
    },
    {
      title: 'New Today',
      value: newToday,
      icon: 'star-outline',
      subtitle: 'New registrations',
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`${styles.statCard} ${card.highlight ? styles.highlightCard : ''}`}
        >
          <div className={styles.statCardHeader}>
            <div className={styles.statCardIcon}>
              <Icon name={card.icon} width={24} height={24} />
            </div>
            {card.highlight && <div className={styles.liveIndicator}>●</div>}
          </div>
          <div className={styles.statCardValue}>{prettyNumber(card.value)}</div>
          <div className={styles.statCardTitle}>{card.title}</div>
          {card.subtitle && <div className={styles.statCardSubtitle}>{card.subtitle}</div>}
        </div>
      ))}
    </div>
  );
}
