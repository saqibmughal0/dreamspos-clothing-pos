import React, { useState } from 'react';
import { DateRangePicker } from 'react-bootstrap-daterangepicker';
import moment from 'moment';
import 'bootstrap-daterangepicker/daterangepicker.css';
import ErrorBoundary from '../errorBoundary/ErrorBoundary';

const PredefinedDateRangesInner = ({ onDateRangeChange, initialStart, initialEnd }) => {
  const [state, setState] = useState({
    start: initialStart ? moment(initialStart) : moment().subtract(29, 'days'),
    end: initialEnd ? moment(initialEnd) : moment(),
  });

  const { start, end } = state;

  const handleCallback = (newStart, newEnd) => {
    setState({ start: newStart, end: newEnd });
    if (typeof onDateRangeChange === 'function') {
      onDateRangeChange(newStart, newEnd);
    }
  };

  // Format to "MM/DD/YYYY"
  const label = `${start.format('MM/DD/YYYY')} - ${end.format('MM/DD/YYYY')}`;

  return (
    <DateRangePicker
      initialSettings={{
        startDate: start.toDate(),
        endDate: end.toDate(),
        ranges: {
          Today: [moment().toDate(), moment().toDate()],
          Yesterday: [moment().subtract(1, 'days').toDate(), moment().subtract(1, 'days').toDate()],
          'Last 7 Days': [moment().subtract(6, 'days').toDate(), moment().toDate()],
          'Last 30 Days': [moment().subtract(29, 'days').toDate(), moment().toDate()],
          'This Month': [moment().startOf('month').toDate(), moment().endOf('month').toDate()],
          'Last Month': [
            moment().subtract(1, 'month').startOf('month').toDate(),
            moment().subtract(1, 'month').endOf('month').toDate(),
          ],
        },
      }}
      onCallback={handleCallback}
    >
      <div
        id="reportrange"
        className="col-4"
        style={{
          background: '#fff',
          cursor: 'pointer',
          padding: '0.5rem 0.625rem',
          border: '1px solid #E9EDF4',
          width: '100%',
          borderRadius: '5px',
          fontSize: '14px',
          color: '#202C4B',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>{label}</span>
      </div>
    </DateRangePicker>
  );
};

const PredefinedDateRanges = (props) => (
  <ErrorBoundary
    compact
    widgetName="Date Range Filter"
    fallback={
      <div
        id="reportrange"
        style={{
          background: '#fff',
          padding: '0.5rem 0.625rem',
          border: '1px solid #E9EDF4',
          borderRadius: '5px',
          fontSize: '14px',
          color: '#202C4B',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span>All Time</span>
      </div>
    }
  >
    <PredefinedDateRangesInner {...props} />
  </ErrorBoundary>
);

export default PredefinedDateRanges;
