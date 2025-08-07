/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source co  async fetchDropdownDataFromServer() {
    console.log('📱 Fetching app versions from server...');
    
    try {
      // Get app versions URL using centralized config
      const url = buildAnalyticsUrl(this.context, 'analytics_app_versions');
      
      console.log('📡 Fetching app versions from:', url);
      
      const response = await fetch(url);d under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as AnalyticsQueryStore from 'lib/stores/AnalyticsQueryStore';
import * as SchemaStore from 'lib/stores/SchemaStore';
import Button from 'components/Button/Button.react';
import DateRange from 'components/DateRange/DateRange.react';
import EmptyState from 'components/EmptyState/EmptyState.react';
import FlowFooter from 'components/FlowFooter/FlowFooter.react';
import Icon from 'components/Icon/Icon.react';
import React from 'react';
import SlowQueriesFilter from 'components/SlowQueriesFilter/SlowQueriesFilter.react';
import styles from 'dashboard/Analytics/SlowQueries/SlowQueries.scss';
import subscribeTo from 'lib/subscribeTo';
import TableHeader from 'components/Table/TableHeader.react';
import TableView from 'dashboard/TableView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { Directions } from 'lib/Constants';
import { buildAnalyticsUrl } from 'lib/AnalyticsConfig';

const SLOW_QUERIES_HEADERS = [
  'Class',
  'Normalized Query',
  'Count',
  'Slow%',
  'Timeouts',
  'Scanned (Avg)',
  'Median (ms)',
  'P90 (ms)',
];
const TABLE_WIDTH = [15, 25, 7, 8, 10, 15, 11, 9];

const APP_VERSIONS_EXPLORER_QUERY = {
  type: 'json',
  limit: 1000,
  source: 'API Event',
  groups: ['OS', 'App Display Version'],
  localId: 'slow_query_app_version_query',
};

const formatQuery = query => {
  return query;
};

export default
@subscribeTo('Schema', 'schema')
@subscribeTo('AnalyticsQuery', 'customQueries')
class SlowQueries extends TableView {
  constructor() {
    super();
    this.section = 'Analytics';
    this.subsection = 'Slow Queries';

    const date = new Date();
    this.state = {
      slowQueries: [],
      loading: true,
      mutated: false,
      dateRange: {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
        end: date,
      },
      className: undefined,
      os: undefined,
      version: undefined,
      schemaClasses: [], // Store schema classes from server
      schemaFetchAttempted: false, // Track if we've tried to fetch schema
    };
    this.xhrHandles = [];
  }

  componentWillMount() {
    this.fetchDropdownDataFromServer(this.context);
    this.fetchSlowQueriesFromServer(this.context);
  }

  componentWillUnmount() {
    // Clean up any pending fetch requests
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      this.fetchDropdownDataFromServer(nextContext);
      this.fetchSlowQueriesFromServer(nextContext);
    }
  }

  async fetchSchemaFromServer() {
    console.log('🔄 Fetching schema from server...');
    
    try {
      const url = buildAnalyticsUrl(this.context, 'analytics_schema');
      console.log('📡 Fetching schema from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Schema data received:', data);
      
      // Update state with received schema classes
      if (data.content && data.content.classes) {
        this.setState({
          schemaClasses: Object.keys(data.content.classes)
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching schema:', error);
      // Keep using default classes if schema fetch fails
    }
  }

  async fetchDropdownDataFromServer() {
    console.log('� Fetching app versions from server...');
    
    try {
      // Get app info from context
      const { slug } = this.context || {};
      const appSlug = slug || 'demo';
      
      const url = `http://localhost:1339/apps/${appSlug}/analytics_app_versions`;
      
      console.log('📡 Fetching app versions from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ App versions data received:', data);
      
      // Update state with received data
      this.setState({
        appVersionsData: data.content || []
      });
      
    } catch (error) {
      console.error('❌ Error fetching app versions:', error);
      
      this.setState({
        appVersionsData: []
      });
    }
  }

  async fetchSlowQueriesFromServer() {
    console.log('� Fetching slow queries from server...');
    
    this.setState({ loading: true });
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (this.state.className && this.state.className !== 'Class') {
        params.append('className', this.state.className);
      }
      if (this.state.os && this.state.os !== 'OS') {
        params.append('os', this.state.os);
      }
      if (this.state.version && this.state.version !== 'Version') {
        params.append('version', this.state.version);
      }
      if (this.state.dateRange && this.state.dateRange.start) {
        params.append('from', this.state.dateRange.start.toISOString());
      }
      if (this.state.dateRange && this.state.dateRange.end) {
        params.append('to', this.state.dateRange.end.toISOString());
      }
      
      const queryString = params.toString();
      const endpoint = `analytics_slow_queries${queryString ? '?' + queryString : ''}`;
      const url = buildAnalyticsUrl(this.context, endpoint);
      
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Slow queries data received:', data);
      
      // Update state with received data
      this.setState({
        slowQueriesData: data.content || [],
        loading: false,
        mutated: false
      });
      
    } catch (error) {
      console.error('❌ Error fetching slow queries:', error);
      
      this.setState({
        slowQueriesData: [],
        loading: false
      });
    }
  }

  handleDownload() {
    const queries = this.state.slowQueriesData || [];
    const separator = ',';
    let csvContent = '';

    // CSV Header
    csvContent += [
      'Class',
      'Query', 
      'Count',
      '% Slow',
      'Timeouts',
      'Avg (ms)',
      'Avg Scanned',
      'Avg Returned'
    ].join(separator) + '\n';

    // CSV Rows - queries are already in array format
    queries.forEach(queryRow => {
      const row = queryRow.map(value => {
        // Escape values that contain commas or quotes
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += row.join(separator) + '\n';
    });

    // Create and trigger download
    const csvDeclaration = 'data:text/csv;charset=utf-8,';
    window.open(encodeURI(csvDeclaration + csvContent));
  }

  renderToolbar() {
    // Get app versions from server data
    const appVersionsData = this.state.appVersionsData || [];
    const appVersions = {};
    
    appVersionsData.forEach(item => {
      const os = item['OS'];
      const version = item['App Display Version'];
      if (os && version) {
        if (Object.prototype.hasOwnProperty.call(appVersions, os)) {
          if (!appVersions[os].includes(version)) {
            appVersions[os].push(version);
          }
        } else {
          appVersions[os] = [version];
        }
      }
    });

    let osOptions = ['OS'];
    if (Object.keys(appVersions) && Object.keys(appVersions).length > 0) {
      osOptions = ['OS', ...Object.keys(appVersions)];
    }

    // Get class names from schema store or fetch from server
    let classOptions = ['Class'];
    
    // Primary: Get from schema store if available
    const classList = this.props.schema && this.props.schema.data.get('classes');
    if (classList && !classList.isEmpty()) {
      const schemaClasses = Object.keys(classList.toObject());
      classOptions = ['Class', ...schemaClasses];
    } else if (this.state.schemaClasses && this.state.schemaClasses.length > 0) {
      // Secondary: Use classes fetched from server
      classOptions = ['Class', ...this.state.schemaClasses];
    } else {
      // Tertiary: Use common defaults and try to fetch schema
      const commonClasses = ['User', 'Post', 'Comment', 'Product', 'Order', 'Review', 'Category', 'Media', '_User', '_Role', '_Session', '_Installation'];
      classOptions = ['Class', ...commonClasses];
      
      // Attempt to fetch schema from server if not already attempted
      if (!this.state.schemaFetchAttempted) {
        this.fetchSchemaFromServer();
        this.setState({ schemaFetchAttempted: true });
      }
    }

    let actions = null;
    if (!this.state.loading) {
      actions = (
        <div>
          <SlowQueriesFilter
            className={this.state.className}
            os={this.state.os}
            version={this.state.version}
            classNameOptions={classOptions}
            osOptions={osOptions}
            versionOptions={['Version', ...(appVersions[this.state.os] || [])]}
            onChange={newValue =>
              this.setState({
                ...newValue,
                mutated: true,
              })
            }
          />
          <button
            type="button"
            onClick={this.handleDownload.bind(this)}
            className={styles.toolbarAction}
          >
            <Icon name="download" width={14} height={14} fill="#66637a" />
            Download
          </button>
        </div>
      );
    }

    return (
      <Toolbar section="Analytics" subsection="Slow Queries">
        {actions}
      </Toolbar>
    );
  }

  renderHeaders() {
    return SLOW_QUERIES_HEADERS.map((header, index) => (
      <TableHeader key={header} width={TABLE_WIDTH[index]}>
        {header}
      </TableHeader>
    ));
  }

  tableData() {
    // Server returns data in array format, which is exactly what TableView expects
    return this.state.slowQueriesData || [];
  }

  renderRow(query) {
    return (
      <tr key={query[1]}>
        {TABLE_WIDTH.map((width, index) => (
          <td key={'column_' + index} width={width + '%'}>
            {index === 1 ? formatQuery(query[index]) : query[index]}
          </td>
        ))}
      </tr>
    );
  }

  renderEmpty() {
    return (
      <EmptyState
        title="Slow Queries"
        description={'You haven\'t executed any queries.'}
        icon="gears"
        cta="Get started with Query"
        action={() => (window.location = 'http://docs.parseplatform.org/rest/guide/#queries')}
      />
    );
  }

  renderExtras() {
    return (
      <FlowFooter
        borderTop="1px solid rgba(151, 151, 151, 0.27)"
        secondary={
          <span style={{ marginRight: '10px' }}>
            <DateRange
              value={this.state.dateRange}
              onChange={newValue => this.setState({ dateRange: newValue, mutated: true })}
              align={Directions.RIGHT}
            />
          </span>
        }
        primary={
          <Button
            primary={true}
            disabled={!this.state.mutated}
            onClick={this.fetchSlowQueriesFromServer.bind(this)}
            value="Run query"
          />
        }
      />
    );
  }
}
