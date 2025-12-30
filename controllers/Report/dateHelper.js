import moment from 'moment';

// Helper function to get the date range
export const getDateRangeForPeriod = (period, customStart, customEnd) => {
  const today = moment().startOf('day');
  let startDate, endDate;

  if (period === 'Today') {
    startDate = today;
    endDate = today.clone().endOf('day');
  }

  if (period === 'Yesterday') {
    const yesterday = moment().subtract(1, 'days').startOf('day');
    startDate = yesterday;
    endDate = yesterday.clone().endOf('day');
  }

  if (period === 'Custom' && customStart && customEnd) {
    startDate = moment(customStart).startOf('day');
    endDate = moment(customEnd).endOf('day');
    if (!startDate.isValid() || !endDate.isValid()) {
      startDate = today;
      endDate = today.clone().endOf('day');
    }
  }

  return { startDate, endDate };
};
