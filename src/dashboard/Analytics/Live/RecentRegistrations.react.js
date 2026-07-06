/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Icon from 'components/Icon/Icon.react';
import React from 'react';
import styles from './LiveDashboard.scss';

export default function RecentRegistrations({ registrations = [] }) {
  if (!Array.isArray(registrations) || registrations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon name='person-add-outline' width={48} height={48} />
        <p>No recent registrations</p>
        <p className={styles.emptyStateSubtext}>
          New user registrations will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.registrationsTable}>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Device</th>
            <th>Platform</th>
            <th>Joined At</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration, index) => (
            <tr key={index}>
              <td className={styles.userName}>
                <div className={styles.userAvatar}>
                  {getInitials(registration.name || 'User')}
                </div>
                <span>{registration.name || 'Unknown User'}</span>
              </td>
              <td>{registration.device || 'Unknown'}</td>
              <td>
                <div className={styles.platformBadge}>
                  {getPlatformIcon(registration.platform)}
                  <span>{registration.platform || 'Unknown'}</span>
                </div>
              </td>
              <td className={styles.timestamp}>
                {formatJoinedDate(registration.joinedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(' ');
  return parts
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

function getPlatformIcon(platform) {
  const icons = {
    iOS: 'logo-apple',
    Android: 'logo-android',
    Web: 'globe-outline',
  };
  return icons[platform] || 'help-outline';
}

function formatJoinedDate(timestamp) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleString();
    }
  } catch (e) {
    return '';
  }
}
