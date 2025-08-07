/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import DashboardView from 'dashboard/DashboardView.react';
import DonutChart from 'components/DonutChart/DonutChart.react';
import Icon from 'components/Icon/Icon.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import styles from 'dashboard/Analytics/Overview/Overview.scss';
import { yearMonthDayFormatter } from 'lib/DateUtils';
import { buildAnalyticsUrl } from 'lib/AnalyticsConfig';

const AUDIENCE_META = [
  // Users
  [
    {
      label: 'Daily active users',
      key: 'dailyActiveUsers',
    },
    {
      label: 'Weekly active users',
      key: 'weeklyActiveUsers',
    },
    {
      label: 'Monthly active users',
      key: 'monthlyActiveUsers',
    },
    {
      label: 'Total users',
      key: 'totalUsers',
      hideArrow: true,
    },
  ],
  // Installations
  [
    {
      label: 'Daily active installs',
      key: 'dailyActiveInstallations',
    },
    {
      label: 'Weekly active installs',
      key: 'weeklyActiveInstallations',
    },
    {
      label: 'Monthly active installs',
      key: 'monthlyActiveInstallations',
    },
    {
      label: 'Total installs',
      key: 'totalInstallations',
      hideArrow: true,
    },
  ],
];

const BILLING_META = [
  {
    label: 'File storage',
    key: 'billingFileStorage',
    units: 'GB',
  },
  {
    label: 'Data storage',
    key: 'billingDatabasetorage',
    units: 'GB',
  },
  {
    label: 'Data transfer',
    key: 'billingDataTransfer',
    units: 'TB',
  },
];

export default class Overview extends DashboardView {
  constructor() {
    super();
    this.section = 'Analytics';
    this.subsection = 'Overview';

    this.state = {
      error: undefined,
      dailyActiveUsers: {},
      weeklyActiveUsers: {},
      monthlyActiveUsers: {},
      totalUsers: {},
      dailyActiveInstallations: {},
      weeklyActiveInstallations: {},
      monthlyActiveInstallations: {},
      totalInstallations: {},
      billingFileStorage: {},
      billingDatabasetorage: {},
      billingDataTransfer: {},
    };
  }

  componentWillMount() {
    this.fetchOverviewFromServer(this.context);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      this.fetchOverviewFromServer(nextContext);
    }
  }

  async fetchOverviewFromServer(app) {
    try {
      console.log('🔄 Fetching overview data from analytics server...');
      
      // Set loading state for all metrics
      const loadingState = {};
      [...AUDIENCE_META.flat(), ...BILLING_META].forEach(meta => {
        loadingState[meta.key] = { loading: true };
      });
      this.setState(loadingState);
      
      // Fetch overview data from server using centralized URL config
      const overviewUrl = buildAnalyticsUrl(app, 'overview');
      console.log('📊 Overview URL:', overviewUrl);
      
      const response = await fetch(overviewUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch overview: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Received overview data:', data);
      
      // Update state with received data
      this.setState({
        error: data.healthy ? undefined : 'Server reported unhealthy status',
        
        // User metrics - using trend data format [current, 1 week ago, 2 weeks ago]
        dailyActiveUsers: { 
          value: data.dailyActiveUsers,
          promise: Promise.resolve(data.dailyActiveUsers)
        },
        weeklyActiveUsers: { 
          value: data.weeklyActiveUsers,
          promise: Promise.resolve(data.weeklyActiveUsers)
        },
        monthlyActiveUsers: { 
          value: data.monthlyActiveUsers,
          promise: Promise.resolve(data.monthlyActiveUsers)
        },
        totalUsers: { 
          value: data.totalUsers,
          promise: Promise.resolve(data.totalUsers)
        },
        
        // Installation metrics
        dailyActiveInstallations: { 
          value: data.dailyActiveInstallations,
          promise: Promise.resolve(data.dailyActiveInstallations)
        },
        weeklyActiveInstallations: { 
          value: data.weeklyActiveInstallations,
          promise: Promise.resolve(data.weeklyActiveInstallations)
        },
        monthlyActiveInstallations: { 
          value: data.monthlyActiveInstallations,
          promise: Promise.resolve(data.monthlyActiveInstallations)
        },
        totalInstallations: { 
          value: data.totalInstallations,
          promise: Promise.resolve(data.totalInstallations)
        },
        
        // Billing metrics
        billingFileStorage: { 
          value: data.billingFileStorage,
          promise: Promise.resolve(data.billingFileStorage)
        },
        billingDatabasetorage: { 
          value: data.billingDatabasetorage,
          promise: Promise.resolve(data.billingDatabasetorage)
        },
        billingDataTransfer: { 
          value: data.billingDataTransfer,
          promise: Promise.resolve(data.billingDataTransfer)
        },
      });
      
    } catch (error) {
      console.error('❌ Error fetching overview data:', error);
      
      // Set error state for all metrics
      const errorState = {
        error: error.message || 'Failed to fetch analytics data from server'
      };
      
      [...AUDIENCE_META.flat(), ...BILLING_META].forEach(meta => {
        errorState[meta.key] = { 
          error: error,
          promise: Promise.reject(error)
        };
      });
      
      this.setState(errorState);
    }
  }

  componentWillUnmount() {
    AUDIENCE_META.forEach(metaGroup => {
      metaGroup.forEach(meta => {
        if (this.state[meta.key].xhr) {
          this.state[meta.key].xhr.abort();
        }
      });
    });

    BILLING_META.forEach(meta => {
      if (this.state[meta.key].xhr) {
        this.state[meta.key].xhr.abort();
      }
    });
  }

  // Legacy method - replaced with fetchOverviewFromServer
  // fetchOverview(app) {
  //   const overview = app.getAnalyticsOverview(new Date());
  //   this.setState(overview);
  //
  //   for (const key in overview) {
  //     const item = overview[key];
  //     item.promise.then(
  //       value => {
  //         this.setState({
  //           [key]: {
  //             promise: item.promise,
  //             value: value,
  //           },
  //         });
  //       },
  //       error => {
  //         this.setState({
  //           [key]: {
  //             promise: item.promise,
  //             error: error,
  //           },
  //         });
  //       }
  //     );
  //   }
  // }

  renderContent() {
    const toolbar = <Toolbar section="Analytics" subsection="Overview" />;
    const infoContainerStyle = { padding: '12px 16px' };

    const audienceViews = AUDIENCE_META.map(metaGroup =>
      metaGroup.map(meta => {
        const obj = this.state[meta.key];
        let number = 0;
        let increasing = true;
        const loading = obj.value === undefined && obj.error === undefined;

        if (obj.value !== undefined) {
          // If it's an array, means it's in [current, 1 week ago, 2 weeks ago] format.
          if (Array.isArray(obj.value)) {
            number = obj.value[0];
            increasing = number >= obj.value[1];
          } else {
            number = obj.value;
          }
        }

        let content = null;
        if (obj.error !== undefined) {
          content = <div>Cannot fetch data</div>;
        } else {
          content = (
            <div>
              <span className={styles.infoNumber}>{prettyNumber(number, 3)}</span>
              {meta.hideArrow ? null : (
                <span className={increasing ? styles.upArrow : styles.downArrow} />
              )}
            </div>
          );
        }

        return (
          <div className={styles.activityInfo} key={meta.key}>
            <LoaderContainer loading={loading} hideAnimation={true} solid={false}>
              <div style={infoContainerStyle}>
                {content}
                <div className={styles.infoLabel}>{meta.label}</div>
              </div>
            </LoaderContainer>
          </div>
        );
      })
    );

    const billingViews = BILLING_META.map(meta => {
      const obj = this.state[meta.key];
      let total = 0;
      let limit = 1;
      const loading = obj.value === undefined && obj.error === undefined;

      if (obj.value !== undefined) {
        total = obj.value.total;
        limit = obj.value.limit;
      }

      if (obj.error !== undefined) {
        content = <div>Cannot fetch data</div>;
      } else {
        content = (
          <DonutChart
            segments={[total, limit - total]}
            label={`${prettyNumber(total)}/${limit}${meta.units}`}
            diameter={120}
            printPercentage={true}
            isMonochrome={true}
          />
        );
      }

      return (
        <div className={styles.billingInfo} key={meta.key}>
          <LoaderContainer loading={loading} hideAnimation={true} solid={false}>
            <div style={infoContainerStyle}>
              {content}
              <div className={styles.infoLabel}>{meta.label}</div>
            </div>
          </LoaderContainer>
        </div>
      );
    });

    let content = (
      <div className={styles.content}>
        <div className={styles.healthInfoContainer}>
          <div className={styles.healthInfo}>
            {this.state.error !== undefined ? (
              <div>
                <Icon name="cloud-sad" fill="#ff395e" width={88} height={64} />
                <h2 style={{ color: '#ff395e' }}>There is an issue with your app!</h2>
                <div>{this.state.error}</div>
                <Button
                  onClick={() => {
                    /* TODO (hallucinogen): where should I direct everyone to? */
                  }}
                  primary={true}
                  color="red"
                  value="How do I fix it?"
                />
              </div>
            ) : (
              <div>
                <Icon name="cloud-happy" fill="#00db7c" width={88} height={64} />
                <h2>Your app is healthy!</h2>
              </div>
            )}
          </div>
        </div>

        <div className={styles.overviewHeader}>
          <h4>Active users</h4>
        </div>

        <div className={styles.overviewRow}>
          <div className={styles.infoContainer}>{audienceViews[0]}</div>
        </div>

        <div className={styles.overviewHeader}>
          <h4>Active installs</h4>
        </div>

        <div className={styles.overviewRow}>
          <div className={styles.infoContainer}>{audienceViews[1]}</div>
        </div>

        <div className={styles.overviewHeader}>
          <h4>Billing data as of {yearMonthDayFormatter(new Date())}</h4>
        </div>

        <div className={styles.overviewRow}>
          <div className={styles.infoContainer}>{billingViews}</div>
        </div>
      </div>
    );

    return (
      <div>
        {content}
        {toolbar}
      </div>
    );
  }
}
