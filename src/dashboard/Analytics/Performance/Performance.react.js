/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import Chart from 'components/Chart/Chart.react';
import { ChartColorSchemes } from 'lib/Constants';
import DashboardView from 'dashboard/DashboardView.react';
import DateRange from 'components/DateRange/DateRange.react';
import { Directions } from 'lib/Constants';
import ExplorerActiveChartButton from 'components/ExplorerActiveChartButton/ExplorerActiveChartButton.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import Parse from 'parse';
import React from 'react';
import styles from 'dashboard/Analytics/Performance/Performance.scss';
import Toolbar from 'components/Toolbar/Toolbar.react';
import baseStyles from 'stylesheets/base.scss';
import { buildAnalyticsUrl } from 'lib/AnalyticsConfig';

const PERFORMANCE_QUERIES = [
  {
    name: 'Total Requests',
    query: {
      endpoint: 'performance',
      performanceType: 'total_requests',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
  {
    name: 'Request Limit',
    query: {
      endpoint: 'performance',
      performanceType: 'request_limit',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
  {
    name: 'Dropped Requests',
    query: {
      endpoint: 'performance',
      performanceType: 'dropped_requests',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
  {
    name: 'Served Requests',
    query: {
      endpoint: 'performance',
      performanceType: 'served_requests',
      stride: 'day',
    },
    preset: true,
    nonComposable: true,
  },
];

export default class Performance extends DashboardView {
  constructor() {
    super();
    this.section = 'Analytics';
    this.subsection = 'Performance';

    this.displaySize = {
      width: 800,
      height: 400,
    };
    const date = new Date();
    this.state = {
      dateRange: {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
        end: date,
      },
      loading: true,
      performanceData: PERFORMANCE_QUERIES.map(() => ({})),
      activeQueries: PERFORMANCE_QUERIES.map(() => true),
      // If dateRange is modified, we should set mutated to true
      // and re-style "Run query" button
      mutated: false,
    };
    this.displayRef = React.createRef();
  }

  componentDidMount() {
    const display = this.displayRef.current;
    if (display) {
      this.displaySize = {
        width: display.offsetWidth || 800,
        height: display.offsetHeight || 400,
      };
    } else {
      // Fallback dimensions if ref is not ready
      this.displaySize = {
        width: 800,
        height: 400,
      };
    }
    // Force re-render with updated display size
    this.forceUpdate();
  }

  componentWillMount() {
    this.handleRunQuery();
  }

  componentWillUnmount() {
    // No cleanup needed for fetch calls
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      this.handleRunQuery();
    }
  }

  handleQueryToggle(index, active) {
    const activeQueries = this.state.activeQueries;
    activeQueries[index] = active;
    this.setState({ activeQueries: activeQueries });
  }

  async handleRunQuery() {
    this.setState({
      loading: true,
    });

    const promises = PERFORMANCE_QUERIES.map(async (query, index) => {
      try {
        const from = Math.floor(this.state.dateRange.start.getTime() / 1000);
        const to = Math.floor(this.state.dateRange.end.getTime() / 1000);
        
        const endpoint = `performance?` +
          `performanceType=${query.query.performanceType}&` +
          `stride=${query.query.stride}&` +
          `from=${from}&` +
          `to=${to}`;
          
        const url = buildAnalyticsUrl(this.context, endpoint);

        console.log(`🔄 Fetching performance data for ${query.name}:`, url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Performance data received for ${query.name}:`, result);
        
        // Update state with received data
        const performanceData = [...this.state.performanceData];
        performanceData[index] = result;
        this.setState({
          performanceData: performanceData,
        });
        
        return result;
      } catch (error) {
        console.error(`❌ Error fetching performance data for ${query.name}:`, error);
        
        // Set empty data on error
        const performanceData = [...this.state.performanceData];
        performanceData[index] = {};
        this.setState({
          performanceData: performanceData,
        });
        
        return {};
      }
    });

    try {
      await Promise.all(promises);
      this.setState({
        loading: false,
        mutated: false,
      });
    } catch (error) {
      console.error('❌ Error in performance data fetching:', error);
      this.setState({
        loading: false,
        mutated: false,
      });
    }
  }

  renderContent() {
    const toolbar = <Toolbar section="Analytics" subsection="Performance" />;

    const header = (
      <div className={styles.header}>
        {PERFORMANCE_QUERIES.map((query, i) => (
          <div className={styles.activeQueryWrap} key={`query${i}`}>
            <ExplorerActiveChartButton
              onToggle={this.handleQueryToggle.bind(this, i)}
              query={query}
              color={ChartColorSchemes[i]}
              queries={[]}
              disableDropdown={true}
            />
          </div>
        ))}
      </div>
    );

    const footer = (
      <div className={styles.footer}>
        <div className={[styles.right, baseStyles.verticalCenter].join(' ')}>
          <span style={{ marginRight: '10px' }}>
            <DateRange
              value={this.state.dateRange}
              onChange={newValue => this.setState({ dateRange: newValue, mutated: true })}
              align={Directions.RIGHT}
            />
          </span>
          <Button
            primary={true}
            disabled={!this.state.mutated}
            onClick={this.handleRunQuery.bind(this)}
            value="Run query"
          />
        </div>
      </div>
    );

    const chartData = {};
    this.state.performanceData.forEach((data, i) => {
      if (!this.state.activeQueries[i]) {
        return null;
      }

      if (Array.isArray(data)) {
        // Handle Request Limit
        const points = data.map(point => [Parse._decode('date', point[0]).getTime(), point[1]]);

        chartData[PERFORMANCE_QUERIES[i].name] = {
          color: ChartColorSchemes[i],
          points: points,
        };
      } else {
        let points = [];
        for (const key in data.cached) {
          const cachedPoints = data.cached[key];
          points = points.concat(
            cachedPoints.map(point => [Parse._decode('date', point[0]).getTime(), point[1]])
          );
        }

        if (points.length > 0) {
          chartData[PERFORMANCE_QUERIES[i].name] = {
            color: ChartColorSchemes[i],
            points: points,
          };
        }
      }
    });
    let chart = null;
    if (Object.keys(chartData).length > 0) {
      chart = (
        <Chart width={this.displaySize.width} height={this.displaySize.height} data={chartData} />
      );
    }

    const content = (
      <LoaderContainer loading={this.state.loading} solid={false}>
        <div className={styles.content}>
          <div ref={this.displayRef} className={styles.display}>
            {chart}
          </div>
          {header}
          {footer}
        </div>
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
