/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import DonutChart from 'components/DonutChart/DonutChart.react';
import Icon from 'components/Icon/Icon.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import styles from './LiveDashboard.scss';

export default function PlatformBreakdown({ breakdown = {} }) {
  const { ios = 0, android = 0, unknown = 0 } = breakdown;
  const total = ios + android + unknown;

  const calculatePercentage = (value) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const platformData = [
    {
      label: 'iOS',
      value: ios,
      percentage: calculatePercentage(ios),
      color: '#5298FC',
      icon: 'logo-apple',
    },
    {
      label: 'Android',
      value: android,
      percentage: calculatePercentage(android),
      color: '#61C354',
      icon: 'logo-android',
    },
    {
      label: 'Unknown',
      value: unknown,
      percentage: calculatePercentage(unknown),
      color: '#9E9E9E',
      icon: 'help-outline',
    },
  ];

  // DonutChart expects segments (array of numbers)
  const segments = platformData.map(item => item.value);

  return (
    <div className={styles.platformBreakdownContainer}>
      <div className={styles.platformChart}>
        {total > 0 ? (
          <DonutChart segments={segments} diameter={200} />
        ) : (
          <div className={styles.noData}>No platform data available</div>
        )}
      </div>
      <div className={styles.platformStats}>
        {platformData.map((platform, index) => (
          <div key={index} className={styles.platformStat}>
            <div
              className={styles.platformColor}
              style={{ backgroundColor: platform.color }}
            />
            <div className={styles.platformInfo}>
              <div className={styles.platformLabel}>
                <Icon name={platform.icon} width={18} height={18} />
                {platform.label}
              </div>
              <div className={styles.platformValue}>
                {prettyNumber(platform.value)} ({platform.percentage}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
