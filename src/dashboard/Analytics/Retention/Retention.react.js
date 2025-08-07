/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import ChromeDatePicker from 'components/ChromeDatePicker/ChromeDatePicker.react';
import DashboardView from 'dashboard/DashboardView.react';
import * as DateUtils from 'lib/DateUtils';
import EmptyState from 'components/EmptyState/EmptyState.react';
import englishOrdinalIndicator from 'lib/englishOrdinalIndicator';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import prettyNumber from 'lib/prettyNumber';
import React from 'react';
import styles from 'dashboard/Analytics/Retention/Retention.scss';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Tooltip from 'components/Tooltip/Tooltip.react';
import baseStyles from 'stylesheets/base.scss';
import { buildAnalyticsUrl } from 'lib/AnalyticsConfig';

// Define retention period options
const RETENTION_PERIODS = {
  '28_days': {
    label: '28 Days',
    days: [1, 2, 3, 4, 5, 6, 7, 8, 14, 21, 28],
    maxDays: 28
  },
  '3_months': {
    label: '3 Months',
    days: [1, 2, 3, 7, 14, 21, 28, 30, 45, 60, 90],
    maxDays: 90
  },
  '6_months': {
    label: '6 Months',
    days: [1, 7, 14, 30, 45, 60, 90, 120, 150, 180],
    maxDays: 180
  },
  '1_year': {
    label: '1 Year',
    days: [1, 7, 14, 30, 60, 90, 120, 180, 240, 300, 365],
    maxDays: 365
  },
  '2_years': {
    label: '2 Years',
    days: [1, 14, 30, 90, 180, 270, 365, 450, 540, 630, 730],
    maxDays: 730
  },
  '5_years': {
    label: '5 Years',
    days: [1, 30, 90, 180, 365, 540, 730, 1095, 1460, 1825],
    maxDays: 1825
  }
};

const DEFAULT_PERIOD = '28_days';
const RETENTION_DAYS = RETENTION_PERIODS[DEFAULT_PERIOD].days;
const REVERSED_RETENTION_DAYS = RETENTION_DAYS.slice().reverse();

const retentionChartColor = percent => {
  let red, blue, green;
  if (percent > 50) {
    red = 23 + ((percent - 50) * 2 * 11) / 100;
    green = 166 - ((percent - 50) * 2 * 166) / 100;
    blue = 255;
  } else {
    red = 228 - (percent * 2 * 205) / 100;
    green = 233 - (percent * 2 * 67) / 100;
    blue = 237 + (percent * 2 * 18) / 100;
  }
  //return without decimals since css doesn't allow them
  return 'rgb(' + red.toFixed(0) + ', ' + green.toFixed(0) + ', ' + blue.toFixed(0) + ')';
};

export default class Retention extends DashboardView {
  constructor() {
    super();
    this.section = 'Analytics';
    this.subsection = 'Retention';
    this.xhrHandles = [];

    this.state = {
      retentions: null,
      loading: true,
      mutated: false,
      date: new Date(),
      selectedPeriod: DEFAULT_PERIOD,
    };
  }

  componentWillMount() {
    this.fetchRetentionFromServer(this.context);
  }

  componentWillUnmount() {
    // Clean up any pending fetch requests if needed
    // The fetch API doesn't provide a direct abort mechanism like XMLHttpRequest
    // but modern browsers handle this automatically when the component unmounts
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      this.fetchRetentionFromServer(nextContext);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Automatically fetch new data when the period changes
    if (prevState.selectedPeriod !== this.state.selectedPeriod) {
      this.fetchRetentionFromServer(this.context);
    }
    // Also fetch when date changes
    if (prevState.date !== this.state.date) {
      this.fetchRetentionFromServer(this.context);
    }
  }

  async fetchRetentionFromServer(app) {
    try {
      console.log('🔄 Fetching retention data from analytics server...');
      
      // Set loading state
      this.setState({ loading: true, mutated: false });
      
      // Format date for API call
      const dateParam = this.state.date.toISOString().split('T')[0];
      const periodParam = this.state.selectedPeriod;
      const maxDaysParam = RETENTION_PERIODS[this.state.selectedPeriod].maxDays;
      
      // Fetch retention data from server using centralized URL config
      const retentionUrl = buildAnalyticsUrl(app, `analytics_retention?date=${dateParam}&period=${periodParam}&maxDays=${maxDaysParam}`);
      console.log('📊 Retention URL:', retentionUrl);
      
      const response = await fetch(retentionUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch retention data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Received retention data:', data);
      
      // Update state with received data
      this.setState({
        retentions: data.content,
        loading: false
      });
      
    } catch (error) {
      console.error('❌ Error fetching retention data:', error);
      
      this.setState({
        retentions: null,
        loading: false
      });
    }
  }

  // Helper method to check if current retention data matches the selected period
  isDataValidForCurrentPeriod() {
    if (!this.state.retentions) {
      return false;
    }
    
    const maxDaysForPeriod = RETENTION_PERIODS[this.state.selectedPeriod].maxDays;
    const expectedKey = `days_old_${maxDaysForPeriod}`;
    
    // Check if we have data for the maximum days of the current period
    return this.state.retentions.hasOwnProperty(expectedKey);
  }

  renderRetentionCell(daysAgo, day) {
    let total = 0;
    let active = 0;
    // Somehow it's possible to miss some data. Probably a backend issue, but it's
    // not easily reproducible locally.
    const dayData =
      this.state.retentions['days_old_' + daysAgo] &&
      this.state.retentions['days_old_' + daysAgo]['day_' + day];
    if (dayData) {
      total = dayData.total;
      active = dayData.active;
    }
    const percentage = ((active / (total || 1)) * 100).toFixed(1);
    const color = retentionChartColor(percentage);
    const style = {
      backgroundColor: color,
      borderColor: color,
    };
    const monthDayPretty = DateUtils.monthDayStringUTC(
      DateUtils.daysFrom(this.state.date, day - daysAgo)
    );

    return (
      <td key={'col_' + daysAgo + ' _' + day}>
        <Tooltip
          value={
            <div>
              <b>{active}</b> of <b>{total}</b> users who signed up on <b>{monthDayPretty}</b> were
              still active on their <b>{englishOrdinalIndicator(day)} day</b>
            </div>
          }
        >
          <div className={styles.retentionCell} style={style}>
            {percentage}%
          </div>
        </Tooltip>
      </td>
    );
  }

  renderRetentionAverage(day) {
    const currentPeriodDays = RETENTION_PERIODS[this.state.selectedPeriod].days;
    let total = 0;
    let active = 0;
    currentPeriodDays.forEach(daysAgo => {
      if (daysAgo < day) {
        return;
      }
      // Check if we have data for this daysAgo and day combination
      const daysAgoKey = 'days_old_' + daysAgo;
      const dayKey = 'day_' + day;
      const dayData =
        this.state.retentions[daysAgoKey] &&
        this.state.retentions[daysAgoKey][dayKey];
      // Only include data if it exists for the current period
      if (dayData) {
        total += dayData.total;
        active += dayData.active;
      }
    });
    const percentage = ((active / (total || 1)) * 100).toFixed(1);
    return (
      <td
        key={'average_' + day}
        className={[styles.average, styles.tableHeader].join(' ')}
        style={{ textAlign: 'center' }}
      >
        {percentage}%
      </td>
    );
  }

  renderDayAndTotalUser(daysAgo) {
    // Check if we have the required data before accessing it
    const daysAgoKey = 'days_old_' + daysAgo;
    const dayKey = 'day_' + daysAgo;
    const dayData = this.state.retentions[daysAgoKey] && this.state.retentions[daysAgoKey][dayKey];
    
    if (!dayData) {
      // Return empty cell if data is not available
      return (
        <td key={'header_' + daysAgo} className={styles.YaxisLabel}>
          <div className={styles.YaxisLabelDate}>
            <span className={styles.YaxisLabelNumber}>-</span>
          </div>
          <div className={styles.YaxisLabelUsers}>
            <span className={styles.YaxisLabelNumber}>-</span>
          </div>
        </td>
      );
    }
    
    const date = DateUtils.daysFrom(this.state.date, -daysAgo);
    const formattedDate = DateUtils.monthDayStringUTC(date);
    const formattedDateSplit = formattedDate.split(' ');
    const formattedDateMonth = formattedDateSplit[0];
    const formattedDateDay = formattedDateSplit[1];
    const maxDaysForPeriod = RETENTION_PERIODS[this.state.selectedPeriod].maxDays;

    return (
      <td key={'header_' + daysAgo} className={styles.YaxisLabel}>
        <div className={styles.YaxisLabelDate}>
          {daysAgo === maxDaysForPeriod || formattedDateDay === '1' ? formattedDateMonth : ''}
          <span className={styles.YaxisLabelNumber}> {formattedDateDay}</span>
        </div>
        <div className={styles.YaxisLabelUsers}>
          {daysAgo === maxDaysForPeriod || formattedDateDay === '1' ? 'Users ' : ''}
          <span className={styles.YaxisLabelNumber}>{prettyNumber(dayData.total)}</span>
        </div>
      </td>
    );
  }

  renderContent() {
    const toolbar = <Toolbar section="Analytics" subsection="Retention"></Toolbar>;

    let chart = null;
    let footer = null;

    if (!this.state.retentions || Object.keys(this.state.retentions).length === 0 || !this.isDataValidForCurrentPeriod()) {
      chart = (
        <EmptyState
          title={!this.isDataValidForCurrentPeriod() ? 'Loading retention data for selected period...' : 'You don\'t have any user retention data for this period.'}
          icon="analytics-outline"
          description={
            !this.isDataValidForCurrentPeriod() ? 'Please wait while we fetch the retention data for your selected time period.' : 'Once you start tracking user signups, we\'ll chart your user retention here.'
          }
          cta={!this.isDataValidForCurrentPeriod() ? null : "Get started with Users"}
          action={!this.isDataValidForCurrentPeriod() ? null : () => (window.location = 'https://parse.com/apps/quickstart')}
        />
      );
    } else {
      const currentPeriodDays = RETENTION_PERIODS[this.state.selectedPeriod].days;
      const reversedCurrentPeriodDays = currentPeriodDays.slice().reverse();
      const maxDaysForPeriod = RETENTION_PERIODS[this.state.selectedPeriod].maxDays;
      
      chart = (
        <table className={styles.table}>
          <tbody>
            <tr key="header_days_ago" className={styles.divider}>
              <td className={styles.tableHeader}>Still active after</td>
              <td></td>
              {currentPeriodDays.map(day => (
                <td
                  key={'header_' + day}
                  className={styles.tableHeader}
                  style={{ textAlign: 'center' }}
                >
                  {day >= 365 ? `${Math.round(day / 365 * 10) / 10}y` : day >= 30 ? `${Math.round(day / 30)}m` : `${day}d`}
                </td>
              ))}
            </tr>

            <tr key="header_average" className={styles.divider}>
              <td className={[styles.average, styles.tableHeader].join(' ')}>Average</td>
              <td></td>
              {currentPeriodDays.map(day => this.renderRetentionAverage(day))}
            </tr>

            {reversedCurrentPeriodDays.map(daysAgo => {
              return (
                <tr key={'row_' + daysAgo} className={styles.tableRow}>
                  <td className={styles.YaxisSignedUp}>{daysAgo === maxDaysForPeriod ? 'Signed up' : ''}</td>
                  {this.renderDayAndTotalUser(daysAgo)}
                  {currentPeriodDays.map(day => {
                    // Only render until daysAgo
                    if (day > daysAgo) {
                      return null;
                    }

                    return this.renderRetentionCell(daysAgo, day);
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      );

      footer = (
        <div className={styles.footer}>
          <div className={[styles.right, baseStyles.verticalCenter].join(' ')}>
            <span style={{ marginRight: '10px' }}>
              <label style={{ marginRight: '5px', fontWeight: 'bold' }}>Period:</label>
              <select
                value={this.state.selectedPeriod}
                onChange={(e) => {
                  this.setState({ selectedPeriod: e.target.value, mutated: false });
                }}
                style={{
                  padding: '5px 10px',
                  marginRight: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                {Object.entries(RETENTION_PERIODS).map(([key, period]) => (
                  <option key={key} value={key}>
                    {period.label}
                  </option>
                ))}
              </select>
            </span>
            <span style={{ marginRight: '10px' }}>
              <ChromeDatePicker
                value={this.state.date}
                onChange={newValue => this.setState({ date: newValue, mutated: false })}
              />
            </span>
            <Button
              primary={true}
              disabled={this.state.loading}
              onClick={() => this.fetchRetentionFromServer(this.context)}
              value={this.state.loading ? "Loading..." : "Refresh chart"}
            />
          </div>
        </div>
      );
    }

    const content = (
      <LoaderContainer loading={this.state.loading}>
        <div className={styles.content}>{chart}</div>
        {footer}
      </LoaderContainer>
    );

    return (
      <div>
        {content}
        {toolbar}
      </div>
    );
  }
}
