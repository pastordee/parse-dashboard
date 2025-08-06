/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import ContextMenu from 'components/ContextMenu/ContextMenu.react';
import copy from 'copy-to-clipboard';
import BrowserTable from 'dashboard/Data/Browser/BrowserTable.react';
import BrowserToolbar from 'dashboard/Data/Browser/BrowserToolbar.react';
import * as ColumnPreferences from 'lib/ColumnPreferences';
import { dateStringUTC } from 'lib/DateUtils';
import getFileName from 'lib/getFileName';
import Parse from 'parse';
import React from 'react';
import { ResizableBox } from 'react-resizable';
import styles from './Databrowser.scss';

import AggregationPanel from '../../../components/AggregationPanel/AggregationPanel';

const BROWSER_SHOW_ROW_NUMBER = 'browserShowRowNumber';
const AGGREGATION_PANEL_VISIBLE = 'aggregationPanelVisible';
const BROWSER_SCROLL_TO_TOP = 'browserScrollToTop';

function formatValueForCopy(value, type) {
  if (value === undefined) {
    return '';
  }
  if (value === null) {
    return '(null)';
  }
  switch (type) {
    case 'GeoPoint':
      if (value && value.latitude !== undefined && value.longitude !== undefined) {
        return `(${value.latitude}, ${value.longitude})`;
      }
      break;
    case 'Date':
      if (value && value.iso) {
        value = new Date(value.iso);
      } else if (typeof value === 'string') {
        value = new Date(value);
      }
      if (value instanceof Date && !isNaN(value)) {
        return dateStringUTC(value);
      }
      break;
    case 'File':
      if (value && typeof value.url === 'function') {
        return getFileName(value);
      }
      break;
    case 'Boolean':
      return value ? 'True' : 'False';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * DataBrowser renders the browser toolbar and data table
 * It also manages the fetching / updating of column size prefs,
 * and the keyboard interactions for the data table.
 */
export default class DataBrowser extends React.Component {
  constructor(props) {
    super(props);

    const columnPreferences = props.app.columnPreference || {};
    const order = ColumnPreferences.getOrder(
      props.columns,
      props.app.applicationId,
      props.className,
      columnPreferences[props.className]
    );
    const storedRowNumber =
      window.localStorage?.getItem(BROWSER_SHOW_ROW_NUMBER) === 'true';
    const storedPanelVisible =
      window.localStorage?.getItem(AGGREGATION_PANEL_VISIBLE) === 'true';
    const storedScrollToTop =
      window.localStorage?.getItem(BROWSER_SCROLL_TO_TOP) !== 'false';
    const hasAggregation =
      props.classwiseCloudFunctions?.[
        `${props.app.applicationId}${props.appName}`
      ]?.[props.className];

    this.state = {
      order: order,
      current: null,
      editing: false,
      copyableValue: undefined,
      selectedObjectId: undefined,
      simplifiedSchema: this.getSimplifiedSchema(props.schema, props.className),
      allClassesSchema: this.getAllClassesSchema(props.schema, props.classes),
      isPanelVisible: storedPanelVisible && !!hasAggregation,
      selectedCells: { list: new Set(), rowStart: -1, rowEnd: -1, colStart: -1, colEnd: -1 },
      firstSelectedCell: null,
      selectedData: [],
      prevClassName: props.className,
      panelWidth: 300,
      isResizing: false,
      maxWidth: window.innerWidth - 300,
      showAggregatedData: true,
      frozenColumnIndex: -1,
      showRowNumber: storedRowNumber,
      scrollToTop: storedScrollToTop,
      prefetchCache: {},
      selectionHistory: [],
    };

    this.handleResizeDiv = this.handleResizeDiv.bind(this);
    this.handleResizeStart = this.handleResizeStart.bind(this);
    this.handleResizeStop = this.handleResizeStop.bind(this);
    this.updateMaxWidth = this.updateMaxWidth.bind(this);
    this.handleKey = this.handleKey.bind(this);
    this.handleHeaderDragDrop = this.handleHeaderDragDrop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.togglePanelVisibility = this.togglePanelVisibility.bind(this);
    this.setCurrent = this.setCurrent.bind(this);
    this.setEditing = this.setEditing.bind(this);
    this.handleColumnsOrder = this.handleColumnsOrder.bind(this);
    this.setShowAggregatedData = this.setShowAggregatedData.bind(this);
    this.setCopyableValue = this.setCopyableValue.bind(this);
    this.setSelectedObjectId = this.setSelectedObjectId.bind(this);
    this.handleCallCloudFunction = this.handleCallCloudFunction.bind(this);
    this.setContextMenu = this.setContextMenu.bind(this);
    this.freezeColumns = this.freezeColumns.bind(this);
    this.unfreezeColumns = this.unfreezeColumns.bind(this);
    this.setShowRowNumber = this.setShowRowNumber.bind(this);
    this.toggleScrollToTop = this.toggleScrollToTop.bind(this);
    this.handleCellClick = this.handleCellClick.bind(this);
    this.saveOrderTimeout = null;
    this.aggregationPanelRef = React.createRef();
  }

  componentWillReceiveProps(props) {
    if (props.className !== this.props.className) {
      const columnPreferences = props.app.columnPreference || {};
      const order = ColumnPreferences.getOrder(
        props.columns,
        props.app.applicationId,
        props.className,
        columnPreferences[props.className]
      );
      this.setState({
        order: order,
        current: null,
        editing: false,
        simplifiedSchema: this.getSimplifiedSchema(props.schema, props.className),
        allClassesSchema: this.getAllClassesSchema(props.schema, props.classes),
        selectedCells: { list: new Set(), rowStart: -1, rowEnd: -1, colStart: -1, colEnd: -1 },
        firstSelectedCell: null,
        selectedData: [],
        frozenColumnIndex: -1,
        prefetchCache: {},
        selectionHistory: [],
      });
    } else if (
      Object.keys(props.columns).length !== Object.keys(this.props.columns).length ||
      (props.isUnique && props.uniqueField !== this.props.uniqueField)
    ) {
      const columnPreferences = props.app.columnPreference || {};
      const order = ColumnPreferences.getOrder(
        props.columns,
        props.app.applicationId,
        props.className,
        columnPreferences[props.className]
      );
      this.setState({ order, frozenColumnIndex: -1 });
    }
    if (props && props.className) {
      const storedPanelVisible =
        window.localStorage?.getItem(AGGREGATION_PANEL_VISIBLE) === 'true';
      const hasAggregation =
        props.classwiseCloudFunctions?.[
          `${props.app.applicationId}${props.appName}`
        ]?.[props.className];
      if (!hasAggregation) {
        this.setState({ isPanelVisible: false });
        this.setState({ selectedObjectId: undefined });
      } else {
        this.setState({ isPanelVisible: storedPanelVisible });
      }
    } else {
      this.setState({ isPanelVisible: false });
      this.setState({ selectedObjectId: undefined });
    }

    this.checkClassNameChange(this.state.prevClassName, props.className);
  }

  componentDidMount() {
    document.body.addEventListener('keydown', this.handleKey);
    window.addEventListener('resize', this.updateMaxWidth);
  }

  componentWillUnmount() {
    document.body.removeEventListener('keydown', this.handleKey);
    window.removeEventListener('resize', this.updateMaxWidth);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.current === null &&
      this.state.selectedObjectId !== undefined &&
      prevState.selectedObjectId !== undefined
    ) {
      this.setState({
        selectedObjectId: undefined,
        showAggregatedData: false,
      });
      this.props.setAggregationPanelData({});
      if (this.props.errorAggregatedData != {}) {
        this.props.setErrorAggregatedData({});
      }
    }

    if (
      (this.props.AggregationPanelData !== prevProps.AggregationPanelData ||
        this.state.selectedObjectId !== prevState.selectedObjectId) &&
      this.state.isPanelVisible &&
      this.aggregationPanelRef?.current
    ) {
      if (this.state.scrollToTop) {
        this.aggregationPanelRef.current.scrollTop = 0;
      }
    }
  }

  handleResizeStart() {
    this.setState({ isResizing: true });
  }

  handleResizeStop(event, { size }) {
    this.setState({
      isResizing: false,
      panelWidth: size.width,
    });
  }

  handleResizeDiv(event, { size }) {
    this.setState({ panelWidth: size.width });
  }

  setShowAggregatedData(bool) {
    this.setState({
      showAggregatedData: bool,
    });
  }

  updateMaxWidth = () => {
    const SidePanelWidth = 300;
    this.setState({ maxWidth: window.innerWidth - SidePanelWidth });
    if (this.state.panelWidth > window.innerWidth - SidePanelWidth) {
      this.setState({ panelWidth: window.innerWidth - SidePanelWidth });
    }
  };

  updatePreferences(order, shouldReload) {
    if (this.saveOrderTimeout) {
      clearTimeout(this.saveOrderTimeout);
    }
    const appId = this.props.app.applicationId;
    const className = this.props.className;
    this.saveOrderTimeout = setTimeout(() => {
      ColumnPreferences.updatePreferences(order, appId, className);
      shouldReload && this.props.onRefresh();
    }, 1000);
  }

  togglePanelVisibility() {
    const newVisibility = !this.state.isPanelVisible;
    this.setState({ isPanelVisible: newVisibility });
    window.localStorage?.setItem(AGGREGATION_PANEL_VISIBLE, newVisibility);

    if (!newVisibility) {
      this.props.setAggregationPanelData({});
      this.props.setLoadingInfoPanel(false);
      if (this.props.errorAggregatedData != {}) {
        this.props.setErrorAggregatedData({});
      }
    }

    if (!newVisibility && this.state.selectedObjectId) {
      if (this.props.errorAggregatedData != {}) {
        this.props.setErrorAggregatedData({});
      }
      this.handleCallCloudFunction(
        this.state.selectedObjectId,
        this.props.className,
        this.props.app.applicationId
      );
    }
  }

  getAllClassesSchema(schema) {
    const allClasses = Object.keys(schema.data.get('classes').toObject());
    const schemaSimplifiedData = {};
    allClasses.forEach(className => {
      const classSchema = schema.data.get('classes').get(className);
      if (classSchema) {
        schemaSimplifiedData[className] = {};
        classSchema.forEach(({ type, targetClass }, col) => {
          schemaSimplifiedData[className][col] = {
            type,
            targetClass,
          };
        });
      }
      return schemaSimplifiedData;
    });
    return schemaSimplifiedData;
  }

  checkClassNameChange(prevClassName, className) {
    if (prevClassName !== className) {
      const storedPanelVisible =
        window.localStorage?.getItem(AGGREGATION_PANEL_VISIBLE) === 'true';
      const hasAggregation =
        this.props.classwiseCloudFunctions?.[
          `${this.props.app.applicationId}${this.props.appName}`
        ]?.[className];
      this.setState({
        prevClassName: className,
        isPanelVisible: storedPanelVisible && !!hasAggregation,
        selectedObjectId: undefined,
      });
      this.props.setAggregationPanelData({});
      if (this.props.errorAggregatedData != {}) {
        this.props.setErrorAggregatedData({});
      }
    }
  }

  getSimplifiedSchema(schema, classNameForEditors) {
    const schemaSimplifiedData = {};
    const classSchema = schema.data.get('classes').get(classNameForEditors);
    if (classSchema) {
      classSchema.forEach(({ type, targetClass }, col) => {
        schemaSimplifiedData[col] = {
          type,
          targetClass,
        };
      });
    }
    return schemaSimplifiedData;
  }
  handleResize(index, delta) {
    this.setState(({ order }) => {
      order[index].width = Math.max(60, order[index].width + delta);
      this.updatePreferences(order);
      return { order };
    });
  }

  /**
   * drag and drop callback when header is dropped into valid location
   * @param  {Number} dragIndex  - index of  headerbar moved from
   * @param  {Number} hoverIndex - index of headerbar moved to left of
   */
  handleHeaderDragDrop(dragIndex, hoverIndex) {
    const newOrder = [...this.state.order];
    const movedIndex = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, movedIndex[0]);
    this.setState({ order: newOrder }, () => {
      this.updatePreferences(newOrder);
    });
  }

  handleKey(e) {
    if (this.props.disableKeyControls) {
      return;
    }
    if (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) {
      // Check for text selection FIRST
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString() : '';

      // If there's text selected, check if we're in the aggregation panel
      if (selectedText.length > 0) {
        const target = e.target;
        const isWithinPanel = this.aggregationPanelRef?.current && this.aggregationPanelRef.current.contains(target);

        if (isWithinPanel) {
          // Let the browser handle the copy operation for selected text
          return;
        }
      }

      // check if there is multiple selected cells
      const { rowStart, rowEnd, colStart, colEnd } = this.state.selectedCells;
      if (rowStart !== -1 && rowEnd !== -1 && colStart !== -1 && colEnd !== -1) {
        let copyableValue = '';

        for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex++) {
          const rowData = [];

          for (let colIndex = colStart; colIndex <= colEnd; colIndex++) {
            const field = this.state.order[colIndex].name;
            const type = field === 'objectId' ? 'String' : this.props.columns[field].type;
            const value =
              field === 'objectId'
                ? this.props.data[rowIndex].id
                : this.props.data[rowIndex].attributes[field];

            if (typeof value === 'number' && !isNaN(value)) {
              rowData.push(String(value));
            } else {
              rowData.push(formatValueForCopy(value, type));
            }
          }

          copyableValue += rowData.join('\t');
          if (rowIndex < rowEnd) {
            copyableValue += '\r\n';
          }
        }
        this.setCopyableValue(copyableValue);
        copy(copyableValue);

        if (this.props.showNote) {
          this.props.showNote('Value copied to clipboard', false);
        }
        e.preventDefault();
      }
    }
    if (
      this.state.editing &&
      this.state.current &&
      this.state.current.row === -1 &&
      this.props.newObject
    ) {
      // if user is editing new row and want to cancel editing cell
      if (e.keyCode === 27) {
        this.setState({
          editing: false,
        });
        e.preventDefault();
      }
      return;
    }
    if (!this.state.editing && this.props.newObject) {
      // if user is not editing any row but there's new row
      if (e.keyCode === 27) {
        this.props.onAbortAddRow();
        e.preventDefault();
      }
    }
    if (this.state.editing) {
      switch (e.keyCode) {
        case 27: // ESC
          this.setState({
            editing: false,
          });
          e.preventDefault();
          break;
        default:
          return;
      }
    }
    if (!this.state.current) {
      return;
    }

    const visibleColumnIndexes = [];
    this.state.order.forEach((column, index) => {
      column.visible && visibleColumnIndexes.push(index);
    });
    const firstVisibleColumnIndex = Math.min(...visibleColumnIndexes);
    const lastVisibleColumnIndex = Math.max(...visibleColumnIndexes);

    switch (e.keyCode) {
      case 8:
      case 46: {
        // Backspace or Delete
        const colName = this.state.order[this.state.current.col].name;
        const col = this.props.columns[colName];
        if (col.type !== 'Relation') {
          this.props.updateRow(this.state.current.row, colName, undefined);
        }
        e.preventDefault();
        break;
      }
      case 37: {
        // Left - standalone (move to the next visible column on the left)
        // or with ctrl/meta (excel style - move to the first visible column)

        this.setState({
          current: {
            row: this.state.current.row,
            col:
              e.ctrlKey || e.metaKey
                ? firstVisibleColumnIndex
                : this.getNextVisibleColumnIndex(
                  -1,
                  firstVisibleColumnIndex,
                  lastVisibleColumnIndex
                ),
          },
        });
        e.preventDefault();
        break;
      }
      case 38: {
        // Up - standalone (move to the previous row)
        // or with ctrl/meta (excel style - move to the first row)
        const prevObjectID = this.state.selectedObjectId;
        const newRow = e.ctrlKey || e.metaKey ? 0 : Math.max(this.state.current.row - 1, 0);
        this.setState({
          current: {
            row: newRow,
            col: this.state.current.col,
          },
        });
        const newObjectId = this.props.data[newRow].id;
        this.setSelectedObjectId(newObjectId);
        this.setState({ showAggregatedData: true });
        if (prevObjectID !== newObjectId && this.state.isPanelVisible) {
          this.handleCallCloudFunction(
            newObjectId,
            this.props.className,
            this.props.app.applicationId
          );
        }
        e.preventDefault();
        break;
      }
      case 39: {
        // Right - standalone (move to the next visible column on the right)
        // or with ctrl/meta (excel style - move to the last visible column)
        this.setState({
          current: {
            row: this.state.current.row,
            col:
              e.ctrlKey || e.metaKey
                ? lastVisibleColumnIndex
                : this.getNextVisibleColumnIndex(
                  1,
                  firstVisibleColumnIndex,
                  lastVisibleColumnIndex
                ),
          },
        });
        e.preventDefault();
        break;
      }
      case 40: {
        // Down - standalone (move to the next row)
        // or with ctrl/meta (excel style - move to the last row)
        const prevObjectID = this.state.selectedObjectId;
        const newRow =
          e.ctrlKey || e.metaKey
            ? this.props.data.length - 1
            : Math.min(this.state.current.row + 1, this.props.data.length - 1);
        this.setState({
          current: {
            row: newRow,
            col: this.state.current.col,
          },
        });

        const newObjectIdDown = this.props.data[newRow].id;
        this.setSelectedObjectId(newObjectIdDown);
        this.setState({ showAggregatedData: true });
        if (prevObjectID !== newObjectIdDown && this.state.isPanelVisible) {
          this.handleCallCloudFunction(
            newObjectIdDown,
            this.props.className,
            this.props.app.applicationId
          );
        }

        e.preventDefault();
        break;
      }
      case 67: { // C
        if ((e.ctrlKey || e.metaKey) && this.state.copyableValue !== undefined) {
          copy(this.state.copyableValue); // Copies current cell value to clipboard
          if (this.props.showNote) {
            this.props.showNote('Value copied to clipboard', false);
          }
          e.preventDefault();
        }
        break;
      }
      case 32: { // Space
        // Only handle space if not editing and there's a current row selected
        if (!this.state.editing && this.state.current?.row >= 0) {
          const rowId = this.props.data[this.state.current.row].id;
          const isSelected = this.props.selection[rowId];
          this.props.selectRow(rowId, !isSelected);
          e.preventDefault();
        }
        break;
      }
      case 13: { // Enter (enable editing)
        if (!this.state.editing && this.state.current) {
          this.setEditing(true);
          e.preventDefault();
        }
        break;
      }
    }
  }

  getNextVisibleColumnIndex(distance = 1, min = 0, max = 0) {
    if (distance === 0) {
      return this.state.current.col;
    }
    let newIndex = this.state.current.col + distance;

    while (true) {
      if (this.state.order[newIndex]?.visible) {
        return newIndex;
      }
      if (newIndex <= min) {
        return min;
      }
      if (newIndex >= max) {
        return max;
      }
      newIndex += distance;
    }
  }

  setEditing(editing) {
    if (this.props.updateRow) {
      if (this.state.editing !== editing) {
        this.setState({ editing: editing });
      }
    }
  }

  setCurrent(current) {
    if (JSON.stringify(this.state.current) !== JSON.stringify(current)) {
      this.setState({ current });
    }
  }

  setCopyableValue(copyableValue) {
    if (this.state.copyableValue !== copyableValue) {
      this.setState({ copyableValue });
    }
  }

  setSelectedObjectId(selectedObjectId) {
    if (this.state.selectedObjectId !== selectedObjectId) {
      const index = this.props.data?.findIndex(obj => obj.id === selectedObjectId);
      this.setState(
        prevState => {
          const history = [...prevState.selectionHistory];
          if (index !== undefined && index > -1) {
            history.push(index);
          }
          if (history.length > 3) {
            history.shift();
          }
          return { selectedObjectId, selectionHistory: history };
        },
        () => this.handlePrefetch()
      );
    }
  }

  setContextMenu(contextMenuX, contextMenuY, contextMenuItems) {
    this.setState({ contextMenuX, contextMenuY, contextMenuItems });
  }

  freezeColumns(index) {
    this.setState({ frozenColumnIndex: index });
  }

  unfreezeColumns() {
    this.setState({ frozenColumnIndex: -1 });
  }

  setShowRowNumber(show) {
    this.setState({ showRowNumber: show });
    window.localStorage?.setItem(BROWSER_SHOW_ROW_NUMBER, show);
  }

  toggleScrollToTop() {
    this.setState(prevState => {
      const newScrollToTop = !prevState.scrollToTop;
      window.localStorage?.setItem(BROWSER_SCROLL_TO_TOP, newScrollToTop);
      return { scrollToTop: newScrollToTop };
    });
  }

  getPrefetchSettings() {
    const config =
      this.props.classwiseCloudFunctions?.[
        `${this.props.app.applicationId}${this.props.appName}`
      ]?.[this.props.className]?.[0];
    return {
      prefetchObjects: config?.prefetchObjects || 0,
      prefetchStale: config?.prefetchStale || 0,
    };
  }

  handlePrefetch() {
    const { prefetchObjects, prefetchStale } = this.getPrefetchSettings();
    if (!prefetchObjects) {
      return;
    }

    const cache = { ...this.state.prefetchCache };
    if (prefetchStale) {
      const now = Date.now();
      Object.keys(cache).forEach(key => {
        if ((now - cache[key].timestamp) / 1000 >= prefetchStale) {
          delete cache[key];
        }
      });
    }
    if (Object.keys(cache).length !== Object.keys(this.state.prefetchCache).length) {
      this.setState({ prefetchCache: cache });
    }

    const history = this.state.selectionHistory;
    if (history.length < 3) {
      return;
    }
    const [a, b, c] = history.slice(-3);
    if (a + 1 === b && b + 1 === c) {
      for (
        let i = 1;
        i <= prefetchObjects && c + i < this.props.data.length;
        i++
      ) {
        const objId = this.props.data[c + i].id;
        if (!cache[objId]) {
          this.prefetchObject(objId);
        }
      }
    }
  }

  prefetchObject(objectId) {
    const { className, app } = this.props;
    const cloudCodeFunction =
      this.props.classwiseCloudFunctions?.[
        `${app.applicationId}${this.props.appName}`
      ]?.[className]?.[0]?.cloudCodeFunction;
    if (!cloudCodeFunction) {
      return;
    }
    const params = {
      object: Parse.Object.extend(className)
        .createWithoutData(objectId)
        .toPointer(),
    };
    const options = { useMasterKey: true };
    Parse.Cloud.run(cloudCodeFunction, params, options).then(result => {
      this.setState(prev => ({
        prefetchCache: {
          ...prev.prefetchCache,
          [objectId]: { data: result, timestamp: Date.now() },
        },
      }));
    }).catch(error => {
      console.error(`Failed to prefetch object ${objectId}:`, error);
    });
  }

  handleCallCloudFunction(objectId, className, appId) {
    const { prefetchCache } = this.state;
    const { prefetchStale } = this.getPrefetchSettings();
    const cached = prefetchCache[objectId];
    if (
      cached &&
      (!prefetchStale || (Date.now() - cached.timestamp) / 1000 < prefetchStale)
    ) {
      this.props.setAggregationPanelData(cached.data);
      this.props.setLoadingInfoPanel(false);
    } else {
      if (cached) {
        this.setState(prev => {
          const n = { ...prev.prefetchCache };
          delete n[objectId];
          return { prefetchCache: n };
        });
      }
      this.props.callCloudFunction(objectId, className, appId);
    }
  }

  handleColumnsOrder(order, shouldReload) {
    this.setState({ order: [...order] }, () => {
      this.updatePreferences(order, shouldReload);
    });
  }

  handleCellClick(event, row, col, objectId) {
    const { firstSelectedCell } = this.state;
    const clickedCellKey = `${row}-${col}`;

    if (this.state.selectedObjectId !== objectId) {
      this.setShowAggregatedData(true);
      this.setSelectedObjectId(objectId);
      if (
        objectId &&
        this.state.isPanelVisible &&
        ((event.shiftKey && !firstSelectedCell) || !event.shiftKey)
      ) {
        this.handleCallCloudFunction(
          objectId,
          this.props.className,
          this.props.app.applicationId
        );
      }
    }

    if (event.shiftKey && firstSelectedCell) {
      const [firstRow, firstCol] = firstSelectedCell.split('-').map(Number);
      const [lastRow, lastCol] = clickedCellKey.split('-').map(Number);

      const rowStart = Math.min(firstRow, lastRow);
      const rowEnd = Math.max(firstRow, lastRow);
      const colStart = Math.min(firstCol, lastCol);
      const colEnd = Math.max(firstCol, lastCol);

      let validColumns = true;
      for (let i = colStart; i <= colEnd; i++) {
        const name = this.state.order[i].name;
        if (this.props.columns[name].type !== 'Number') {
          validColumns = false;
          break;
        }
      }

      const newSelection = new Set();
      const selectedData = [];
      for (let x = rowStart; x <= rowEnd; x++) {
        let rowData = null;
        if (validColumns) {
          rowData = this.props.data[x];
        }
        for (let y = colStart; y <= colEnd; y++) {
          if (rowData) {
            const value = rowData.attributes[this.state.order[y].name];
            if (typeof value === 'number' && !isNaN(value)) {
              selectedData.push(rowData.attributes[this.state.order[y].name]);
            }
          }
          newSelection.add(`${x}-${y}`);
        }
      }

      if (newSelection.size > 1) {
        this.setCurrent(null);
        this.props.setLoadingInfoPanel(false);
        this.setState({
          selectedCells: {
            list: newSelection,
            rowStart,
            rowEnd,
            colStart,
            colEnd,
          },
          selectedObjectId: undefined,
          selectedData,
        });
      } else {
        this.setCurrent({ row, col });
      }
    } else {
      this.setState({
        selectedCells: { list: new Set(), rowStart: -1, rowEnd: -1, colStart: -1, colEnd: -1 },
        selectedData: [],
        current: { row, col },
        firstSelectedCell: clickedCellKey,
      });
    }
  }

  render() {
    const {
      className,
      count,
      disableSecurityDialog,
      onCancelPendingEditRows,
      editCloneRows,
      app,
      ...other
    } = this.props;
    const { preventSchemaEdits, applicationId } = app;
    return (
      <div>
        <div>
          <BrowserTable
            appId={applicationId}
            order={this.state.order}
            current={this.state.current}
            editing={this.state.editing}
            simplifiedSchema={this.state.simplifiedSchema}
            className={className}
            editCloneRows={editCloneRows}
            handleHeaderDragDrop={this.handleHeaderDragDrop}
            handleResize={this.handleResize}
            setEditing={this.setEditing}
            setCurrent={this.setCurrent}
            setCopyableValue={this.setCopyableValue}
            selectedObjectId={this.state.selectedObjectId}
            setSelectedObjectId={this.setSelectedObjectId}
            callCloudFunction={this.handleCallCloudFunction}
            setContextMenu={this.setContextMenu}
            freezeIndex={this.state.frozenColumnIndex}
            freezeColumns={this.freezeColumns}
            unfreezeColumns={this.unfreezeColumns}
            onFilterChange={this.props.onFilterChange}
            onFilterSave={this.props.onFilterSave}
            selectedCells={this.state.selectedCells}
            handleCellClick={this.handleCellClick}
            isPanelVisible={this.state.isPanelVisible}
            panelWidth={this.state.panelWidth}
            isResizing={this.state.isResizing}
            setShowAggregatedData={this.setShowAggregatedData}
            showRowNumber={this.state.showRowNumber}
            setShowRowNumber={this.setShowRowNumber}
            skip={this.props.skip}
            limit={this.props.limit}
            firstSelectedCell={this.state.firstSelectedCell}
            {...other}
          />
          {this.state.isPanelVisible && (
            <ResizableBox
              width={this.state.panelWidth}
              height={Infinity}
              minConstraints={[100, Infinity]}
              maxConstraints={[this.state.maxWidth, Infinity]}
              onResizeStart={this.handleResizeStart} // Handle start of resizing
              onResizeStop={this.handleResizeStop} // Handle end of resizing
              onResize={this.handleResizeDiv}
              resizeHandles={['w']}
              className={styles.resizablePanel}
            >
              <div
                className={styles.aggregationPanelContainer}
                ref={this.aggregationPanelRef}
              >
                <AggregationPanel
                  data={this.props.AggregationPanelData}
                  isLoadingCloudFunction={this.props.isLoadingCloudFunction}
                  showAggregatedData={this.state.showAggregatedData}
                  errorAggregatedData={this.props.errorAggregatedData}
                  showNote={this.props.showNote}
                  setErrorAggregatedData={this.props.setErrorAggregatedData}
                  setSelectedObjectId={this.setSelectedObjectId}
                  selectedObjectId={this.state.selectedObjectId}
                  appName={this.props.appName}
                  className={this.props.className}
                />
              </div>
            </ResizableBox>
          )}
        </div>

        <BrowserToolbar
          count={count}
          hidePerms={className === '_Installation'}
          className={className}
          classNameForEditors={className}
          setCurrent={this.setCurrent}
          enableDeleteAllRows={
            app.serverInfo.features.schemas.clearAllDataFromClass && !preventSchemaEdits
          }
          enableExportClass={app.serverInfo.features.schemas.exportClass && !preventSchemaEdits}
          enableSecurityDialog={
            app.serverInfo.features.schemas.editClassLevelPermissions &&
            !disableSecurityDialog &&
            !preventSchemaEdits
          }
          enableColumnManipulation={!preventSchemaEdits}
          enableClassManipulation={!preventSchemaEdits}
          handleColumnDragDrop={this.handleHeaderDragDrop}
          handleColumnsOrder={this.handleColumnsOrder}
          editCloneRows={editCloneRows}
          onCancelPendingEditRows={onCancelPendingEditRows}
          order={this.state.order}
          selectedData={this.state.selectedData}
          allClasses={Object.keys(this.props.schema.data.get('classes').toObject())}
          allClassesSchema={this.state.allClassesSchema}
          togglePanel={this.togglePanelVisibility}
          isPanelVisible={this.state.isPanelVisible}
          appId={this.props.app.applicationId}
          appName={this.props.appName}
          scrollToTop={this.state.scrollToTop}
          toggleScrollToTop={this.toggleScrollToTop}
          {...other}
        />

        {this.state.contextMenuX && (
          <ContextMenu
            x={this.state.contextMenuX}
            y={this.state.contextMenuY}
            items={this.state.contextMenuItems}
          />
        )}
      </div>
    );
  }
}
