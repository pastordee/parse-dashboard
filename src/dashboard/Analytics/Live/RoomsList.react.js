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

export default function RoomsList({ rooms = [] }) {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon name='chatbubbles-outline' width={48} height={48} />
        <p>No active prayer rooms</p>
        <p className={styles.emptyStateSubtext}>
          Prayer rooms will appear here when users join
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {rooms.map((room, index) => (
        <div key={index} className={styles.listItem}>
          <div className={styles.itemHeader}>
            <div className={styles.itemTitle}>
              <div className={styles.liveIndicator}>●</div>
              <span>{room.name || 'Untitled Room'}</span>
            </div>
            <div className={styles.itemMeta}>
              <Icon name='people-outline' width={16} height={16} />
              <span>{prettyNumber(room.participantCount || 0)} participants</span>
            </div>
          </div>
          {room.description && (
            <div className={styles.itemSubtext}>
              {room.description}
            </div>
          )}
          {room.createdAt && (
            <div className={styles.itemTimestamp}>
              Created {formatTime(room.createdAt)}
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
