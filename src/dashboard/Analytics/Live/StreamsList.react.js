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

export default function StreamsList({ streams = [] }) {
  if (!Array.isArray(streams) || streams.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon name='videocam-outline' width={48} height={48} />
        <p>No active live streams</p>
        <p className={styles.emptyStateSubtext}>
          Live streams will appear here when users start streaming
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {streams.map((stream, index) => (
        <div key={index} className={styles.listItem}>
          <div className={styles.itemHeader}>
            <div className={styles.itemTitle}>
              <div className={styles.liveIndicator}>●</div>
              <span>{stream.title || 'Untitled Stream'}</span>
            </div>
            <div className={styles.itemMeta}>
              <Icon name='eye-outline' width={16} height={16} />
              <span>{prettyNumber(stream.viewerCount || 0)} viewers</span>
            </div>
          </div>
          {stream.host && (
            <div className={styles.itemSubtext}>
              Hosted by {stream.host}
            </div>
          )}
          {stream.startedAt && (
            <div className={styles.itemTimestamp}>
              Started {formatTime(stream.startedAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleString();
    }
  } catch (e) {
    return '';
  }
}
