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

export default function ContentOverview({ content = {} }) {
  const {
    prayers = 0,
    posts = 0,
    reels = 0,
    sermons = 0,
    groups = 0,
  } = content;

  const contentTypes = [
    {
      label: 'Prayers',
      value: prayers,
      icon: 'heart-outline',
      color: '#FF6B6B',
    },
    {
      label: 'Posts',
      value: posts,
      icon: 'document-text-outline',
      color: '#5298FC',
    },
    {
      label: 'Reels',
      value: reels,
      icon: 'play-circle-outline',
      color: '#FFB020',
    },
    {
      label: 'Sermons',
      value: sermons,
      icon: 'mic-outline',
      color: '#61C354',
    },
    {
      label: 'Groups',
      value: groups,
      icon: 'people-outline',
      color: '#A78BFA',
    },
  ];

  return (
    <div className={styles.contentGrid}>
      {contentTypes.map((item, index) => (
        <div key={index} className={styles.contentCard}>
          <div className={styles.contentCardIcon} style={{ color: item.color }}>
            <Icon name={item.icon} width={32} height={32} />
          </div>
          <div className={styles.contentCardValue}>
            {prettyNumber(item.value)}
          </div>
          <div className={styles.contentCardLabel}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
