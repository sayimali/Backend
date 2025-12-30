import PDFDocument from 'pdfkit';
import dailyIncomeModel from '../../models/DailyIncome/dailyIncomeModel.js';
import dailyexpanseModel from '../../models/DailyExpanse/dailyexpanseModel.js'
import moment from 'moment';
import fs from 'fs';
import 
  {calculateIncomeSummary,calculateIncomeTotalsByCategory,calculateIncomeTotalsSaleperson,
    calculateTotalstechnician,generateSalespersonSummary,
} from '../utils/incomeUtils.js';

// Helper function to get the date range
export const getDateRangeForPeriod = (period, customStart, customEnd) => {
  const today = moment().startOf('day');
  let startDate, endDate;

  if (period === 'Today') {
    startDate = today;
    endDate = today.clone().endOf('day');
  } else if (period === 'Yesterday') {
    const yesterday = moment().subtract(1, 'days').startOf('day');
    startDate = yesterday;
    endDate = yesterday.clone().endOf('day');
  } else if (period === 'Custom' && customStart && customEnd) {
    startDate = moment(customStart).startOf('day');
    endDate = moment(customEnd).endOf('day');
    if (!startDate.isValid() || !endDate.isValid()) {
      startDate = today;
      endDate = today.clone().endOf('day');
    }
  }

  return { startDate, endDate };
};
//overall report 
export const exportAllIncomeReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd, view } = req.query;
    if (reportPeriod === 'Custom' && (!customStart || !customEnd)) {
      return res.status(400).json({ message: 'Custom start and end dates are required.' });
    }

    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);
    if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });
    if (incomeRecords.length === 0) {
      return res.status(200).json({ message: 'No income records found in selected period.' });
    }

    const summary = calculateIncomeSummary(incomeRecords);

    // PDF setup: A4 landscape, consistent margins
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      view === 'true'
        ? 'inline; filename="All_Income_Report_Summary.pdf"'
        : 'attachment; filename="All_Income_Report_Summary.pdf"'
    );

    doc.pipe(res);

    // Logo
    const logoPath = 'public/logo.jpg';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.margins.left, doc.page.margins.top, { width: 120 });
    }

    // Title and date range
    doc.fontSize(18).text('All Income Report Summary', {
      align: 'center',
      underline: true,
    });
    doc.moveDown(0.5).fontSize(14).text(
      `From: ${moment(startDate).format('YYYY-MM-DD')}   To: ${moment(endDate).format('YYYY-MM-DD')}`,
      { align: 'center' }
    );
    doc.moveDown(1);

    // Helper: page width minus margins
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Summary data table
    const summaryData = [
      ['Vehicles', summary.Total_Vehicle],
      ['Sale Persons', summary.Total_Sale_Person],
      ['Amount Received', summary.Total_Amount_Received],
      ['Fixed Price', summary.Total_Saleperson_FixedPrice],
      ['Pending Payment', summary.Total_Pending_Payment],
      ['Pending Recovery', summary.Total_Pending_Recovery],
      ['Excess Amount', summary.Total_Excess_Amount],
      ['Technicians', summary.Total_Technician_Person],
      ['Installation Cost', summary.Total_TechnicianCost],
      ['Travelling cost', summary.Total_TechnicianFuel],
      ['Technician Expense', summary.Total_Technician_Expanse],
    ];
    let cursorY = doc.y;
    const labelCol = usableWidth * 0.4;
    const valueCol = usableWidth * 0.6;

    summaryData.forEach(([label, value], i) => {
      const y = cursorY + i * 22;
      doc.fontSize(12).font('Helvetica').text(label, doc.page.margins.left, y, {
        width: labelCol,
        align: 'left',
      });
      doc.text(value.toString(), doc.page.margins.left + labelCol, y, {
        width: valueCol,
        align: 'left',
      });
      doc.moveTo(doc.page.margins.left, y + 17)
        .lineTo(doc.page.margins.left + usableWidth, y + 17)
        .strokeColor('#aaaaaa')
        .stroke();
    });
    cursorY += summaryData.length * 22 + 20;

    // Sub‑report function to render section tables
    const renderTable = (title, headers, rows) => {
      if (cursorY > doc.page.height - 200) {
        doc.addPage();
        cursorY = doc.page.margins.top;
      }
      doc.fontSize(14).font('Helvetica-Bold').text(title, doc.page.margins.left, cursorY, {
        underline: true,
      });
      cursorY += 20;

      const colWidth = usableWidth / headers.length;
      headers.forEach((h, i) => {
        doc.fontSize(11).font('Helvetica-Bold').text(h, doc.page.margins.left + i * colWidth, cursorY, {
          width: colWidth,
          align: 'center',
        });
      });
      cursorY += 18;
      doc.moveTo(doc.page.margins.left, cursorY).lineTo(doc.page.margins.left + usableWidth, cursorY).stroke();
      cursorY += 5;

      rows.forEach((r, idx) => {
        if (cursorY > doc.page.height - 100) {
          doc.addPage();
          cursorY = doc.page.margins.top;
        }
        const isHighlight = r._highlight;
        if (isHighlight) {
          const rowHeight = 20;
          doc.rect(doc.page.margins.left, cursorY - 2, usableWidth, rowHeight).fill('#FFFFE0');
        }
        headers.forEach((h, i) => {
          doc.fontSize(11).font('Helvetica').fillColor('black').text(r[i].toString(), doc.page.margins.left + i * colWidth, cursorY, {
            width: colWidth,
            align: i === 0 ? 'left' : 'center',
          });
        });
        cursorY += 20;
        doc.moveTo(doc.page.margins.left, cursorY).lineTo(doc.page.margins.left + usableWidth, cursorY).stroke();
        cursorY += 2;
      });
      cursorY += 15;
    };

    // Category‑wise
// SUMMARY SECTION
doc.fontSize(18).text('Summary', { underline: true });
doc.moveDown(1);
doc.fontSize(14);

// RECORD TABLE (Category-wise Summary)
doc.fontSize(18).text('Record', { underline: true });
doc.moveDown(1);

const headers = ['Category', 'Vehicles', 'Received', 'Fixed Amt'];
const rows = totals.CategorySummary.map(item => [
  item.Category.charAt(0).toUpperCase() + item.Category.slice(1),
  item.Vehicle,
  item.AmountReceived,
  item.FixedAmount,
]);

// Layout constants
const colWidths = [180, 100, 120, 120]; // adjust to fit landscape
const startX = doc.x;
let y = doc.y;

// Print header row
headers.forEach((header, i) => {
  doc.font('Helvetica-Bold')
    .fontSize(13)
    .text(header, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
      width: colWidths[i],
      align: 'left',
    });
});
y += 20;

// Print data rows
rows.forEach(row => {
  row.forEach((cell, i) => {
    doc.font('Helvetica')
      .fontSize(12)
      .text((cell ?? '').toString(), startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: colWidths[i],
        align: 'left',
      });
  });
  y += 20;

  // Add new page if needed
  if (y > doc.page.height - 100) {
    doc.addPage();
    y = doc.y;
  }
});


    // City‑wise
    const citySummary = {};
    incomeRecords.forEach(r => {
      const ct = r.City || 'Unknown';
      const cat = (r.Category || 'Other').toLowerCase().replace(/\W/g, '');
      citySummary[ct] = citySummary[ct] || { city: ct, counts: { newinstallation: 0, amc: 0, redo: 0, recovery: 0, removal: 0, removaltransfer: 0, transfer: 0, ownershipchange: 0, other: 0 } };
      citySummary[ct].counts[cat] = (citySummary[ct].counts[cat] || 0) + 1;
    });
    const maxInstall = Math.max(...Object.values(citySummary).map(c => c.counts.newinstallation));
    const cityRows = Object.values(citySummary).map((c, i) => {
      const arr = [
        i + 1,
        c.city,
        c.counts.newinstallation,
        c.counts.amc,
        c.counts.redo,
        c.counts.recovery,
        c.counts.removal,
        c.counts.removaltransfer,
        c.counts.transfer,
        c.counts.ownershipchange,
      ];
      return { _highlight: c.counts.newinstallation === maxInstall, ...arr };
    });
    renderTable(
      'City-wise Category Summary',
      ['Sr', 'City', 'New', 'AMC', 'Redo', 'Recovery', 'Removal', 'Rem.Transfer', 'Transfer', 'Own.Change'],
      cityRows
    );

    // Device‑wise
    const devRows = summary.DeviceSummary.map(item => [item.Device_Model, item.Count]);
    renderTable('Device Summary', ['Device', 'Quantity'], devRows);

/*    // Detailed Income Records
    const detailHeaders = [
      'S.No', 'Date', 'Category', 'SalePerson', 'Vehicle', 'Party',
      'Package', 'City', 'Sub Amt', 'Amt Recvd', 'Fixed Price',
      'Excess Amt', 'Pending Pay', 'SaleTitle', 'Tech', 'Tech Exp'
    ];
    const detailRows = incomeRecords.map((r, i) => [
      i + 1,
      moment(r.indate).format('YYYY-MM-DD'),
      r.Category || '-',
      r.Sale_Person_name || '-',
      r.Vehicle || '-',
      r.PartyName || '-',
      r.Package || '-',
      r.City || '-',
      Math.round(r.Subscription_Amount || 0),
      Math.round(r.Amount_Received || 0),
      Math.round(r.Saleperson_FixedPrice || 0),
      Math.round(r.Excess_Amount || 0),
      Math.round(r.Pending_Payment || 0),
      r.Account_Title_SalePerson || '-',
      r.Technician_Person_name || '-',
      Math.round(r.Technician_Expanse || 0),
    ]);

    renderTable('Income Records', detailHeaders, detailRows);
*/
    doc.end();
    
  } catch (err) {
    console.error('PDF error', err);
    res.status(500).json({ message: 'Error generating PDF.' });
  }
};

export const exportAllincomecategory = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;

    if (reportPeriod === 'Custom' && (!customStart || !customEnd)) {
      return res.status(400).json({ message: 'Both startDate and endDate must be provided for Custom period.' });
    }

    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
      return res.status(400).json({ message: 'Invalid date range.' });
    }

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (incomeRecords.length === 0) {
      return res.status(200).json({ message: 'No income records found.' });
    }

    const totals = calculateIncomeSummary(incomeRecords);

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      layout: 'landscape', // Wider layout
    });

    const filename = `Income_Report_Category_${Date.now()}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(22).text('Income Report (Category-Wise)', { align: 'center' });
    doc.moveDown(1);

    // Summary
    doc.fontSize(18).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(14);
    doc.text(`Total Vehicles: ${totals.Total_Vehicle}`);
    doc.text(`Total Salespersons: ${totals.Total_Sale_Person}`);
    doc.text(`Total Technician Persons: ${totals.Total_Technician_Person}`);
    doc.text(`Total Technician Expenses: ${totals.Total_Technician_Expanse}`);
    doc.text(`Total Amount Received: ${totals.Total_Amount_Received}`);
    doc.text(`Total Pending Payments: ${totals.Total_Pending_Payment}`);
    doc.text(`Total Excess Amount: ${totals.Total_Excess_Amount}`);
    doc.moveDown(2);

    // Category Summary Table
    doc.fontSize(18).text('Category Summary', { underline: true });
    doc.moveDown(1);

    const catHeaders = ['Category', 'Vehicles', 'Amount Received', 'Fixed Price'];
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const catColWidth = pageWidth / catHeaders.length;
    const startX = doc.x;
    let y = doc.y;

    // Header row
    catHeaders.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(14).text(header, startX + i * catColWidth, y, {
        width: catColWidth,
        align: 'center',
      });
    });

    y += 25;

    totals.CategorySummary.forEach((row) => {
      const rowData = [
        row.Category,
        row.Vehicle,
        row.AmountReceived,
        row.FixedAmount,
      ];

      rowData.forEach((data, i) => {
        doc.font('Helvetica').fontSize(13).text((data ?? '').toString(), startX + i * catColWidth, y, {
          width: catColWidth,
          align: 'center',
        });
      });

      doc.moveTo(startX, y + 20).lineTo(startX + pageWidth, y + 20).stroke();
      y += 30;

      if (y > doc.page.height - 100) {
        doc.addPage();
        y = doc.y;
      }
    });

    // Detailed Records
    doc.addPage();
    doc.fontSize(18).text('Detailed Records', { underline: true });
    doc.moveDown();

    const detailHeaders = ['Date', 'Vehicle', 'Salesperson', 'Category', 'Amount', 'Pending', 'Excess'];
    const detailColWidth = pageWidth / detailHeaders.length;
    y = doc.y;

    detailHeaders.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(14).text(header, startX + i * detailColWidth, y, {
        width: detailColWidth,
        align: 'center',
      });
    });

    y += 25;

    incomeRecords.forEach((item) => {
      const row = [
        moment(item.indate).format('YYYY-MM-DD'),
        item.Vehicle || item.VehicleNumber || '',
        item.Sale_Person_name || item.SalesPersonName || '',
        item.Category || item.category || '',
        item.Amount_Received ?? 0,
        item.Pending_Payment ?? item.PendingAmount ?? 0,
        item.Excess_Amount ?? item.ExcessAmount ?? 0,
      ];

      if (Array.isArray(row)) {
        row.forEach((data, i) => {
          doc.font('Helvetica').fontSize(13).text((data ?? '').toString(), startX + i * detailColWidth, y, {
            width: detailColWidth,
            align: 'center',
          });
        });
      }

      doc.moveTo(startX, y + 20).lineTo(startX + pageWidth, y + 20).stroke();
      y += 30;

      if (y > doc.page.height - 100) {
        doc.addPage();
        y = doc.y;
      }
    });

    doc.end();
  } catch (err) {
    console.error('Error exporting income category:', err);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
};



export const exportAlldevicesReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd, view } = req.query;

    if (reportPeriod === 'Custom' && (!customStart || !customEnd)) {
      return res.status(400).json({ message: 'Both startDate and endDate must be provided for Custom period.' });
    }

    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
      return res.status(400).json({ message: 'Invalid date range.' });
    }

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (incomeRecords.length === 0) {
      return res.status(200).json({ message: 'No income records found.' });
    }

    // Generate DeviceSummary
    const deviceCounts = {};
    incomeRecords.forEach((record) => {
      const device = (record.Device || '').trim();
      if (device) {
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      }
    });

    const DeviceSummary = Object.entries(deviceCounts).map(([Device_Model, Count]) => ({
      Device_Model,
      Count,
    }));

    // Setup PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    if (view === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="DeviceSummaryReport.pdf"');
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="DeviceSummaryReport.pdf"');
    }

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Device Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`From: ${formattedStartDate} To: ${formattedEndDate}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    doc.fontSize(12).font('Helvetica-Bold');
    const srX = 50, deviceX = 120, countX = 400;
    doc.text('Sr.No', srX);
    doc.text('Device Model', deviceX);
    doc.text('Count', countX);
    doc.moveDown();
    doc.font('Helvetica');

    // Table content
    let y = doc.y;
    DeviceSummary.forEach((device, index) => {
      doc.text(index + 1, srX, y);
      doc.text(device.Device_Model, deviceX, y);
      doc.text(device.Count.toString(), countX, y);
      y += 20;

      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();

  } catch (error) {
    console.error('Error generating device summary PDF:', error);
    res.status(500).json({ message: 'Server error generating device summary report.' });
  }
};

// Function to export all income records as a PDF (without summary)
export const exportAllIncomeRecordsReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    // Fetch income records
    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (incomeRecords.length === 0) {
      return res.status(200).json({ message: 'No income records found.' });
    }

    // Create a new PDF document
    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Record.pdf"');

    // Define the path for the logo image
    const logoPath = 'public/logo.jpg';

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 20, 20, { width: 100 });
    } else {
      console.warn('Logo image not found at', logoPath);
    }

    // Add title and report period info
    doc.fontSize(16).text('All Income Records Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();

    // Table headers
    const columnHeaders = [
      'S.No','Date', 'Category', 'Sale Person Name', 'Vehicle', 'Party Name', 'Device', 'Package', 'City',
      'Subscription Amount', 'Amount Received', 'Fixed Price', 'Excess Amount',
      'Pending Payment', 'Title Transaction', 'Account Number', 'Technician Name',
      'Technician Expense', 'Remark',
    ];

    // Column widths to ensure correct alignment
    const columnWidths = [
     30, 80, 80, 100, 80, 80, 70, 80, 80,
      80, 80, 80, 80, 80, 90, 100, 100,
      80, 100,
    ];

    const startX = 50;
    let currentY = doc.y;

    // Print column headers
    doc.fontSize(10).fillColor('black').text('', startX, currentY); // Reset position

    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY, {
        width: columnWidths[index],
        align: 'left',
      });
    });

    currentY += 20;
    doc.moveTo(startX, currentY).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY).stroke();
    currentY += 10;

    // Print each income record
    incomeRecords.forEach((record, index) => {
      const recordData = [
        index + 1, // Serial number
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Category || '-',
        record.Sale_Person_name || '-',
        record.Vehicle || '-',
        record.PartyName || '-',
        record.Device || '-',
        record.Package || '-',
        record.City || '-',
        Math.round(record.Subscription_Amount || 0),
        Math.round(record.Amount_Received || 0),
        Math.round(record.Saleperson_FixedPrice || 0),
        Math.round(record.Excess_Amount || 0),
        Math.round(record.Pending_Payment || 0),
        record.Account_Title_SalePerson || '-',
        record.Account_Title_Number || '-',
        record.Technician_Person_name || '-',
        Math.round(record.Technician_Expanse || 0),
        record.Technician_Person_Remarks || '-',
      ];

      recordData.forEach((data, index) => {
        doc.text(data, startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY, {
          width: columnWidths[index],
          align: 'left',
        });
      });

      currentY += 20;
      if (currentY > 1100 - 50) {
        doc.addPage();
        currentY = 30;
      }
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};


// Function to export income by category report as a PDF
export const exportIncomeByCategoryReport = async (req, res) => {
  try {
    const { Category } = req.params;
    const { reportPeriod = 'Today', customStart, customEnd , view } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const filter = {
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    };

    if (Category) {
      filter.Category = new RegExp(`^${Category}$`, 'i');
    }

    const incomeRecords = await dailyIncomeModel.find(filter);

    if (incomeRecords.length === 0) {
      return res.status(404).json({ message: 'No records found for the specified category' });
    }

    const totals = calculateIncomeTotalsByCategory(incomeRecords);

    const doc = new PDFDocument({
      layout: 'landscape',
      size: [1100, 1800],
      margin: 20,
    });

    if (view === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="All_Income_Report_Summary.pdf"');
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="income_by_category_report.pdf"');
    }

    doc.pipe(res);
    const logoPath = 'public/logo.jpg';
    doc.image(logoPath, 20, 20, { width: 150 });
    doc.fontSize(16).text('Income by Category Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Category: ${Category || 'All Categories'}`);
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();

    const summaryItems = [
      {label: 'Vehicle', value: Math.floor(totals.Total_Vehicle)},
      {label: 'Sale Person', value: Math.floor(totals.Total_Sale_Person)},
      { label: 'Subscription Amount', value: Math.floor(totals.totalSubscriptionAmount) },
      { label: 'Amount Received', value: Math.floor(totals.totalAmountReceived) },
      { label: 'Saleperson Fixed Price', value: Math.floor(totals.totalSalepersonFixedPrice) },
      { label: 'Excess Amount', value: Math.floor(totals.totalExcessAmount) },
      { label: 'Pending Payment', value: Math.floor(totals.totalPendingPayment) },
      { label: 'Pending Recovery', value: Math.floor(totals.totalPendingRecovery) },
    /*  { label: 'Total Remaining Amount', value: Math.floor(totals.totalRemainingAmount) },  */
      { label: 'Technician Expense', value: Math.floor(totals.totalTechnicianExpanse) },
    
    ];



    const startX = 40;
    let startY = doc.y;
    summaryItems.forEach((row) => {
      doc.text(row.label, startX, startY, { width: 300, align: 'left' });
      doc.text(row.value.toString(), startX + 500, startY, { width: 200, align: 'right' });
      startY += 20;
    });

    doc.moveDown(2);
    doc.fontSize(14).text('Income Records', { underline: true });
    doc.moveDown();

    const columnHeaders = [
      'S.No',
      'Date', 'Category', 'Sale Person', 'Vehicle', 'PartyName', 'City', 'Subscription Amount', 'Amount Received',
      'Fixed Price', 'Excess Amount', 'Pending Payment', 'Pending Recovery', 
      'Technician Name', 'Technician Expense',
    ];

    const pageWidth = doc.page.width - 30;
    const columnWidth = pageWidth / columnHeaders.length;
    let currentY = doc.y;

    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + index * columnWidth, currentY, { width: columnWidth, align: 'left' });
    });

    currentY += 30;
    doc.moveTo(startX, currentY).lineTo(startX + pageWidth, currentY).stroke();
    currentY += 10;

    incomeRecords.forEach((record, index) => {
      const recordData = [
        index + 1, // Serial number
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Category || '-',
        record.Sale_Person_name || '-',
        record.Vehicle || '-',
        record.PartyName || '-',
        record.City || '-',
        record.Subscription_Amount ? Math.floor(record.Subscription_Amount) : '0',
        record.Amount_Received ? Math.floor(record.Amount_Received) : '0',
        record.Saleperson_FixedPrice ? Math.floor(record.Saleperson_FixedPrice) : '0',
        record.Excess_Amount ? Math.floor(record.Excess_Amount) : '0',
        record.Pending_Payment ? Math.floor(record.Pending_Payment) : '0',
        record.Pending_Recovery ? Math.floor(record.Pending_Recovery) : '0',
        record.Technician_Person_name || '-',        
        record.Technician_Expanse ? Math.floor(record.Technician_Expanse) : '0',
      ];

      recordData.forEach((data, index) => {
        doc.text(data, startX + index * columnWidth, currentY, { width: columnWidth, align: 'left' });
      });

      currentY += 20;
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 30;
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('An error occurred while generating the PDF');
  }
};

export const exportAllSalespersonSummary = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (incomeRecords.length === 0) {
      return res.status(404).json({ message: 'No records found for the salespersons' });
    }

    const summaryBySalesperson = generateSalespersonSummary(incomeRecords);

    // Calculate totals
    const totals = {
      Total_Sale_Person: Object.keys(summaryBySalesperson).length,
      Total_Saleperson_FixedPrice: 0,
      Total_Amount_Received: 0,
      Total_Excess_Amount: 0,
      Total_Pending_Payment: 0,
    };

    for (const s of Object.values(summaryBySalesperson)) {
      totals.Total_Saleperson_FixedPrice += s.FixedPrice;
      totals.Total_Amount_Received += s.Received;
      totals.Total_Excess_Amount += s.Excess;
      totals.Total_Pending_Payment += s.Pending;
    }

    // Round totals
    for (const key in totals) {
      if (typeof totals[key] === 'number') {
        totals[key] = parseFloat(totals[key].toFixed(2));
      }
    }

    // PDF generation
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Salesperson_Report_Summary.pdf"');
    doc.pipe(res);

    const logoPath = 'public/logo.jpg';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 20, 20, { width: 150 });
    }

    doc.fontSize(16).text('Salesperson Report Summary', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`, { align: 'center' });
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`, { align: 'center' }).moveDown();

    doc.fontSize(14).text('Overall Totals', { underline: true }).moveDown();
    doc.fontSize(12).list([
      `Salespersons: ${totals.Total_Sale_Person}`,
      `Vehicle: ${totals.Total_Vehicle}`,
      `Total Income: ${totals.Total_Saleperson_FixedPrice}`,
      `Amount Received Total: ${totals.Total_Amount_Received}`,
      `Excess Amount Total: ${totals.Total_Excess_Amount}`,
      `Pending Payment Total: ${totals.Total_Pending_Payment}`,
    ]).moveDown();

    // Table headers
    doc.fontSize(14).text('Detailed Breakdown', { underline: true }).moveDown();
    doc.fontSize(10);
    const headers = ['Sr.No', 'Salesperson Name', 'Installations', 'Received', 'Total Income', 'Excess Amount', 'Pending Payment'];
    const colWidths = [40, 200, 100, 100, 100, 100, 100];
    const startX = 50;
    let y = doc.y;

    headers.forEach((text, i) => {
      doc.text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i], align: 'left' });
    });

    y += 20;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
    y += 10;

    let index = 1;
    for (const [name, data] of Object.entries(summaryBySalesperson)) {
      const row = [
        index++,
        name,
        data.Installation,
        data.Received,
        data.FixedPrice,
        data.Excess,
        data.Pending,
      ];

      row.forEach((val, i) => {
        doc.text(val.toString(), startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: colWidths[i],
          align: 'left',
        });
      });

      y += 20;
      if (y > 500) { // Adjust based on A4 height
        doc.addPage();
        y = 50;
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
};


export const exportSalespersonReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (incomeRecords.length === 0) {
      return res.status(404).json({ message: 'No records found for the salespersons' });
    }

    const totals = calculateIncomeTotalsSaleperson(incomeRecords);

    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Salesperson_Report_Summary.pdf"');

    const logoPath = 'public/logo.jpg';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 20, 20, { width: 150 });
    }

    doc.fontSize(16).text('Salesperson Report', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`).moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`).moveDown();
    
    doc.fontSize(14).text('Summary', { underline: true }).moveDown();
    doc.fontSize(12).text(`Salespersons: ${totals.Total_Sale_Person}`).moveDown();
    doc.fontSize(12).text(`Fixed Price: ${totals.Total_Saleperson_FixedPrice}`).moveDown();
    doc.fontSize(12).text(`Amount Received: ${totals.Total_Amount_Received}`).moveDown();
    doc.fontSize(12).text(`Excess Amount: ${totals.Total_Excess_Amount}`).moveDown();
    doc.fontSize(12).text(`Pending Payment: ${totals.Total_Pending_Payment}`).moveDown();

    doc.fontSize(14).text('Salesperson Records', { underline: true }).moveDown();
    doc.fontSize(10);

    const columnHeaders = ['Sale Person Name', 'Pending Payment', 'Excess Amount'];
    const columnWidths = [250, 200, 200];
    const startX = 50;
    let currentY = doc.y;
    
    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY, {
        width: columnWidths[index],
        align: 'left',
      });
    });

    currentY += 20;
    doc.moveTo(startX, currentY).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY).stroke();
    currentY += 10;

    const groupedData = {};
    incomeRecords.forEach((record) => {
      const name = record.Sale_Person_name || 'Unknown';
      if (!groupedData[name]) {
        groupedData[name] = { fixedPrice: 0, amountReceived: 0, excessAmount: 0 };
      }
      groupedData[name].fixedPrice += record.Saleperson_FixedPrice || 0;
      groupedData[name].amountReceived += record.Amount_Received || 0;
      groupedData[name].excessAmount += record.Excess_Amount || 0;
    });

    Object.entries(groupedData).forEach(([name, data]) => {
      const remainingAmount = data.amountReceived - data.fixedPrice;
      const recordData = [name, Math.round(remainingAmount), Math.round(data.excessAmount)];
      
      recordData.forEach((entry, index) => {
        const positionX = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(entry.toString(), positionX, currentY, { width: columnWidths[index], align: 'left' });
      });
      
      currentY += 20;
      if (currentY > 1100 - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
};

// Function to export salesperson report by name and category as a PDF

export const exportSalespersonByNameAndCategoryReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd, view, name, category } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const filter = {
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    };

    if (name) filter.Sale_Person_name = name;
    if (category) filter.Category = new RegExp(`^${category}$`, 'i');

    const incomeRecords = await dailyIncomeModel.find(filter);
    if (incomeRecords.length === 0) {
      return res.status(404).json({ message: 'No records found for the specified salesperson or category' });
    }

    const totals = calculateIncomeTotalsSaleperson(incomeRecords);
    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      view === 'true' ? 'inline; filename="All_Income_Report_Summary.pdf"' : 'attachment; filename="All_Income_Report_Summary.pdf"'
    );

    doc.pipe(res);

    const logoPath = 'public/logo.jpg';
    doc.image(logoPath, 20, 20, { width: 150 });
    doc.fontSize(16).text('Salesperson Report', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`).moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`).moveDown();
    doc.fontSize(14).text(`Salesperson: ${name || 'All'}`, { underline: true }).moveDown();
    doc.fontSize(14).text(`Category: ${category || 'All Categories'}`, { underline: true }).moveDown();
    
// Add Summary Section with better formatting
doc.fontSize(14).text('Total Summary', { underline: true });
doc.moveDown();

// Define summary data with aligned labels and values
const summaryItems = [
  {label: 'Vehicle', value: Math.floor(totals.Total_Vehicle)},
  {label: 'Sale Person', value: Math.floor(totals.Total_Sale_Person)},
  { label: 'Amount Received', value: Math.floor(totals.Total_Amount_Received) },
  { label: 'Saleperson Fixed Price', value: Math.floor(totals.Total_Saleperson_FixedPrice) },
  { label: 'Excess Amount', value: Math.floor(totals.Total_Excess_Amount) },
  { label: 'Pending Payment', value: Math.floor(totals.Total_Pending_Payment) },
  { label: 'Pending Recovery', value: Math.floor(totals.Total_Pending_Recovery) },
  { label: 'Technician Expense', value: Math.floor(totals.Total_Technician_Expanse) },
 
];

// Set up positions for alignment
const startX = 40;
let startY = doc.y;
summaryItems.forEach((row) => {
  doc.text(row.label, startX, startY, { width: 300, align: 'left' });
  doc.text(row.value.toString(), startX + 500, startY, { width: 200, align: 'right' });
  startY += 20;
});

doc.moveDown(2);

    doc.fontSize(14).text('Income Records', { underline: true }).moveDown();
    const columnHeaders = ['S.No', 'Date', 'Category', 'Vehicle', 'Party Name', 'City', 'Package', 'Amount Received', 'Fixed Price', 'Excess Amount', 'Pending Payment'];
    
    const pageWidth = doc.page.width - 30;
    const columnWidth = pageWidth / columnHeaders.length;
    let currentY = doc.y;
    
    columnHeaders.forEach((header, index) => {
      doc.text(header, 40 + index * columnWidth, currentY, { width: columnWidth, align: 'left' });
    });
    
    currentY += 30;
    doc.moveTo(40, currentY).lineTo(40 + pageWidth, currentY).stroke();
    currentY += 10;
    
    doc.fontSize(10);
    incomeRecords.forEach((record, index) => {
      const recordData = [
        index + 1, // Serial number
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Category || '-',
        record.Vehicle || '-',
        record.PartyName || '-',
        record.City || '-',
        record.Package || '-',
        record.Amount_Received || 0,
        record.Saleperson_FixedPrice || 0,
        record.Excess_Amount || 0,
        record.Pending_Payment || 0,
      ];

      recordData.forEach((data, index) => {
        doc.text(data.toString(), 40 + index * columnWidth, currentY, { width: columnWidth, align: 'left' });
      });
      
      currentY += 60;
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 30;
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
};

// Function to export technician report as a PDF
export const exportTechnicianReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    // Use the date range with JS Date objects for MongoDB query
    const technicianRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() }, // Using `indate` for filtering
    });

    // If no records are found, return a 404 response
    if (technicianRecords.length === 0) {
      return res.status(404).json({ message: 'No records found for the technician records' });
    }

    // Group records by technician name and sum the Technician_Expanse
    const groupedData = {};
    technicianRecords.forEach((record) => {
      const name = record.Technician_Person_name || 'Unknown';
      if (!groupedData[name]) {
        groupedData[name] = 0;
      }
      groupedData[name] += record.Technician_Expanse || 0;
    });

   // Create a new PDF document with custom page size (32 inches width)
	 const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"');

	// Insert Company Name and Logo at the top of the page
	const logoPath = 'public/logo.jpg'; // Adjust path to your logo
	doc.image(logoPath, 20, 20, { width: 150 });

    // Add content to the PDF
    doc.fontSize(16).text('Technician Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();

    // Add Summary Section
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
/*    doc.fontSize(12).text(`Total Technician Names: ${Object.keys(groupedData).length}`);
    doc.moveDown();   */
    doc.fontSize(12).text(`Technician Expanse: ${Math.round(Object.values(groupedData).reduce((sum, value) => sum + value, 0))}`);
    doc.moveDown();

    // Add table headers for technician records
    doc.fontSize(14).text('Technician Records', { underline: true });
    doc.moveDown();
    doc.fontSize(10);

    // Column headers with defined widths
    const columnHeaders = ['Technician Person Name', 'Technician Expanse'];
    const columnWidths = [200, 100];
    const startX = 50;
    let currentY = doc.y;

    // Print column headers
    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    currentY += 20; // Move down for records
    doc.moveTo(startX, currentY - 10).lineTo(startX + 300, currentY - 10).stroke(); // Draw a line below headers
    doc.moveDown();

    // Print each unique technician record with the aggregated expanse
    Object.entries(groupedData).forEach(([name, totalTechnicianExpanse]) => {
      const recordData = [
        name,
        Math.round(totalTechnicianExpanse), // Use Math.round() to remove .00
      ];

      // Print each field in the record
      recordData.forEach((data, index) => {
        const positionX = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(data, positionX, currentY);
      });
      currentY += 20; // Move down after each record

      // Check if the currentY position needs a new page
      if (currentY > doc.page.height - 50) {
        doc.addPage(); // Add a new page if we're at the bottom
        currentY = 50; // Reset Y position
      }
    });

    // Finalize the PDF and send it
    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
};

// Function to export technician report by name as a PDF
export const exportTechnicianByNameReport = async (req, res) => {
  try {
    const { name } = req.params;
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const filter = {
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    };

    if (name) {
      filter.Technician_Person_name = name;
    }

    const technicianRecords = await dailyIncomeModel.find(filter);

    if (!technicianRecords || technicianRecords.length === 0) {
      return res.status(404).json({ message: 'No records found for the specified technician' });
    }

    const totals = calculateTotalstechnician(technicianRecords);

    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"');

    const logoPath = 'public/logo.jpg';
    doc.image(logoPath, 20, 20, { width: 150 });

    doc.fontSize(16).text('Technician Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();
    doc.fontSize(14).text(`Technician: ${name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(10);

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Vehicles: ${totals.Total_Vehicle}`);
    doc.moveDown();
    ['Technician Cost', totals.Total_TechnicianCost],
    ['Technician Fuel', totals.Total_TechnicianFuel],
    doc.fontSize(12).text(`Technician Expense: ${totals.Total_Technician_Expanse}`);
    doc.moveDown();

    doc.fontSize(8);
    const columnHeaders = [
'S.No', 'Date','Vehicle',  'Category',  'Package','City',
      'Technician Price', 'Travelling Expense',
      'Technician Expanse',
    ];
    const columnWidths = [30,50, 50, 60, 60, 50, 50, 90, 80,90];
    const startX = 50;
    let currentY = doc.y;

    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    currentY += 20;
    doc.moveTo(startX, currentY - 10).lineTo(startX + 700, currentY - 10).stroke();
    doc.moveDown();

    technicianRecords.forEach((record) => {
      const recordData = [
        index + 1, // Serial number
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Vehicle || '-',
        record.Category || '-',
        record.Package || '-',
        record.City || '-',
        record.Technicianperson_Price || 0,
        record.Travelling_Expense_Technician || 0,
        Math.round(record.Technician_Expanse) || 0,
        
      ];

      recordData.forEach((data, index) => {
        const positionX = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(data, positionX, currentY);
      });
      currentY += 20;

      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
};

export const exportAllPendingReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd, view } = req.query;

    if (reportPeriod === 'Custom' && (!customStart || !customEnd)) {
      return res.status(400).json({ message: 'Both startDate and endDate must be provided for Custom period.' });
    }

    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
      return res.status(400).json({ message: 'Invalid date range.' });
    }

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      Pending_Payment: { $gt: 0 }, // Only records with Pending_Payment greater than 0
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });
    
    if (incomeRecords.length === 0) {
      return res.status(200).json({ message: 'No income records found.' });
    }

    // Calculate totals using imported function
    const totals = calculateIncomeSummary(incomeRecords);

    // Create PDF document
    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

    // Set headers based on view or download
    if (view === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="All_Income_Report_Summary.pdf"'); // View in browser
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"'); // Force download
    }

    doc.pipe(res);

    // Add Logo (Ensure the path is correct)
    const logoPath = 'public/logo.jpg';
    doc.image(logoPath, 20, 20, { width: 150 });
    doc.fontSize(16).text('All Pending Report Summary', { align: 'center', underline: true });
    doc.moveDown();

    doc.moveDown();
    doc.fontSize(12).text(`From: ${formattedStartDate} To: ${formattedEndDate}`);
    doc.moveDown();

    // Summary Data
const summaryData = [
  ['Vehicles', totals.Total_Vehicle],
  ['Sale Persons', totals.Total_Sale_Person],
  ['Amount Received', totals.Total_Amount_Received],
  ['Pending Payment', totals.Total_Pending_Payment],
  ['Pending Recovery', totals.Total_Pending_Recovery],
];

    const startX = 40;
    let startY = doc.y;
    summaryData.forEach((row, rowIndex) => {
      doc.text(row[0], startX, startY + rowIndex * 20);
      doc.text(row[1], startX + 500, startY + rowIndex * 20);
    });

    doc.moveDown(2);
    doc.fontSize(14).text('Income Records', { underline: true });
    doc.moveDown();

    // Table Headers
    const headers = [
      'S.No',
      'Date', 'Category', 'Sale Person', 'Vehicle', 'Party Name',  'Package', 'City',
      'Subscription Amount', 'Amount Received', 
      'Pending Payment', 
    ];

    const pageWidth = doc.page.width - 30;
    const columnWidth = pageWidth / headers.length;
    let currentY = doc.y;

    headers.forEach((header, index) => {
      doc.text(header, startX + index * columnWidth, currentY, { width: columnWidth, align: 'left' });
    });

    currentY += 30;
    doc.moveTo(startX, currentY).lineTo(startX + pageWidth, currentY).stroke();
    currentY += 10;

    // Draw Income Records
    incomeRecords.forEach((record) => {
      const recordData = [
        
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Category || '-',
        record.Sale_Person_name || '-',
        record.Vehicle || '-',
        record.PartyName || '-',
        record.Package || '-',
        record.City || '-',
        Math.round(record.Subscription_Amount || 0),
        Math.round(record.Amount_Received || 0),
        Math.round(record.Pending_Payment || 0),

   
      ];

      recordData.forEach((data, index) => {
        doc.text(data, startX + index * columnWidth, currentY, { width: columnWidth, align: 'left' });
      });

      currentY += 60;
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 30;
      }
    });

    doc.end();
   
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report.' });
  }
};

/*
// Function to export all pending reports as a PDF
export const exportAllPendingReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    // Format the start and end date for the report
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    // Fetch pending income records within the date range
    const allpendingRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (allpendingRecords.length === 0) {
      return res.status(200).json({ message: 'No income records found.' });
    }

    // Initialize totals
    let totalPendingPayment = 0;
    let totalAmountReceived = 0;
    const pendingPaymentsBySalesperson = {};

    allpendingRecords.forEach(record => {
      if (record.Pending_Payment && record.Pending_Payment !== 0) {
        totalPendingPayment += record.Pending_Payment;
        totalAmountReceived += record.Amount_Received || 0;

        const salespersonName = record.Sale_Person_name || 'Unknown';
        if (!pendingPaymentsBySalesperson[salespersonName]) {
          pendingPaymentsBySalesperson[salespersonName] = 0;
        }
        pendingPaymentsBySalesperson[salespersonName] += record.Pending_Payment;
      }
    });

    // Create a new PDF document with custom page size (32 inches width)
    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"');

    // Insert Company Name and Logo at the top of the page
		const logoPath = 'public/logo.jpg'; // Adjust path to your logo
    doc.image(logoPath, 20, 20, { width: 150 });

    // Add content to the PDF
    doc.fontSize(16).text('All Pending Report Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.fontSize(12).text(`From: ${formattedStartDate} To: ${formattedEndDate}`);
    doc.moveDown();

    // Add summary data
    doc.fontSize(12).text('Summary', { underline: true });
    doc.moveDown();

    // Row format for summary
    const summaryData = [

      ['Total Pending Payment', Math.round(totalPendingPayment)],
    ];

    const startX = 50;
    let startY = doc.y;

    summaryData.forEach((row, rowIndex) => {
      doc.text(row[0], startX, startY + rowIndex * 20);
      doc.text(row[1], startX + 300, startY + rowIndex * 20);
    });

    doc.moveDown();

    // Add table headers for the income records section
    doc.fontSize(14).text('Records (Salesperson and Pending Payment)', { underline: true });
    doc.moveDown();
    doc.fontSize(9); // Decreased font size for records

    // Column headers with defined widths
    const columnHeaders = ['Sale Person Name', 'Pending Payment'];
    const columnWidths = [200, 100];
    let currentY = doc.y;

    // Print column headers
    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    doc.moveDown();

    // Print aggregated income records
    Object.entries(pendingPaymentsBySalesperson).forEach(([name, pendingPayment]) => {
      const recordData = [name, Math.round(pendingPayment)];
      recordData.forEach((data, i) => {
        const positionX = startX + columnWidths.slice(0, i).reduce((sum, width) => sum + width, 0);
        doc.text(data, positionX, doc.y);
      });
      doc.moveDown();
    });

    // Finalize and send the PDF
    doc.end();
    doc.pipe(res);

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};

*/
// Function to export income records with pending payments as a PDF
export const exportPendingrecordsReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const incomeRecords = await dailyIncomeModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      Pending_Payment: { $gt: 0 },
    });

    if (incomeRecords.length === 0) {
      return res.status(200).json({ message: 'No income records with pending payments found.' });
    }

    const totalSalePersons = incomeRecords.length;
    const totalPendingAmount = incomeRecords.reduce((total, record) => total + (record.Pending_Payment || 0), 0);

   // Create a new PDF document with custom page size (32 inches width)
	 const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"');

	// Insert Company Name and Logo at the top of the page
  const logoPath = 'public/logo.jpg'; // Replace with the actual path to your logo image

	// Add the logo (make sure the logo file is in your server or public folder)
	doc.image(logoPath, 20, 20, { width: 100 }); // Adjust size and position as needed

	// Add company name
	doc.fontSize(18).text('Mux Tech (PVT) Ltd.', { align: 'right' });
	doc.moveDown(0.5); // Adjust spacing


    // Add content to the PDF
    doc.fontSize(16).text('Pending Income Records Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Sale Persons: ${totalSalePersons}`);
    doc.text(`Pending Amount: ${Math.round(totalPendingAmount)}`);
    doc.moveDown();
    doc.fontSize(9); // Decreased font size for records

    // Column headers
    const columnHeaders = [
      'Sale Person Name', 'Vehicle', 'Party Name', 'Device', 'City',
      'Amount Received', 'Pending Amount','Date'
    ];
    const columnWidths = [90, 70, 100, 60, 100, 90, 80,80];
    const startX = 50;
    let currentY = doc.y;

    // Print column headers
    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    currentY += 20;
    doc.moveTo(startX, currentY - 10).lineTo(startX + 700, currentY - 10).stroke();
    doc.moveDown();

    // Print each record
    incomeRecords.forEach((record) => {
      const recordData = [
        record.Sale_Person_name || '-',
        record.Vehicle || '-',
        record.PartyName || '-',
        record.Device || '-',
        record.City || '-',
        record.Amount_Received || 0,
        record.Pending_Payment || 0,
				moment(record.indate).format('YYYY-MM-DD') || '-',
      ];

      recordData.forEach((data, index) => {
        const positionX = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(data, positionX, currentY);
      });
      currentY += 20;

      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();
    doc.pipe(res);

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};

// Function to export a salesperson's pending report as a PDF
export const exportsalepersonPendingReport = async (req, res) => {
  try {
    const { name } = req.params;
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const filter = {
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      Pending_Payment: { $gt: 0 },
    };

    if (name) {
      filter.Sale_Person_name = name;
    }

    const incomeRecords = await dailyIncomeModel.find(filter);

    if (incomeRecords.length === 0) {
      return res.status(404).json({ message: 'No income records found for this salesperson.' });
    }

    // Calculate totals using the imported function
    const totals = calculateIncomeTotalsSaleperson(incomeRecords);

    // Create a new PDF document with custom page size
    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Salesperson_Pending_Report.pdf"');

    const logoPath = 'public/logo.jpg'; // Adjust path to your logo
    doc.image(logoPath, 20, 20, { width: 150 });

    // **Title**
    doc.fontSize(16).text(`Pending Report for Salesperson: ${name}`, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`: ${reportPeriod}`);
    doc.fontSize(12).text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();

    // **Total Summary Section**
    doc.fontSize(18).text('Total Summary', { underline: true });
    doc.moveDown(0.5);

    const summaryData = [
      [' Vehicles:', totals.Total_Vehicle || 0],
/*      ['Total Subscription Amount', totals.Total_Subscription_Amount || 0 ], */
/*      ['Total Amount Received:', totals.Total_Amount_Received || 0],  */
      ['Pending Amount:', totals.Total_Pending_Payment || 0],
/*      ['Total Pending Recovery:', totals.Total_Pending_Recovery || 0],  */
    ];

    const startX = 50;
    let currentY = doc.y;

    summaryData.forEach(([label, value]) => {
      doc.text(label, startX, currentY);
      doc.text(value.toLocaleString(), startX + 250, currentY); // Format numbers
      currentY += 20;
    });

    doc.moveDown(1.5);
    doc.fontSize(19).text('Income Records', { underline: true });
    doc.moveDown();

    // **Column headers**
    doc.fontSize(15);
    const columnHeaders = [
    'S.No',  'Date', 'Category', 'Vehicle', 'Party Name', 'City','Subscription Amount',
      'Amount Received', 'Pending Amount'
    ];
    const columnWidths = [60,130, 150, 130, 200, 200,150, 150, 130];
    let headerX = startX;
    currentY = doc.y;

    columnHeaders.forEach((header, index) => {
      doc.text(header, headerX, currentY);
      headerX += columnWidths[index];
    });

   currentY += 30;
doc.lineWidth(3); // Increase underline thickness
doc.moveTo(startX, currentY - 10).lineTo(startX + 1250, currentY - 10).stroke();
doc.moveDown();


    // **Print each record**
    incomeRecords.forEach((record,index) => {
      const recordData = [
        index + 1, // Serial number
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Category || '-',
        record.Vehicle || '-',
        record.PartyName || '-',
        record.City || '-',
        Math.round(record.Subscription_Amount || 0),
        Math.round(record.Amount_Received || 0),
        Math.round(record.Pending_Payment || 0),
      ];

      let recordX = startX;
      recordData.forEach((data, ColIndex) => {
        doc.text(data.toString(), recordX, currentY);
        recordX += columnWidths[ColIndex];
      });

      currentY += 50;

      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 100;
      }
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};

// Function to export all expense reports as a PDF
export const exportAllExpanseReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    const expanseRecords = await dailyexpanseModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (expanseRecords.length === 0) {
      return res.status(200).json({ message: 'No expense records found.' });
    }

    const expenseSummary = {};
    let totalExpenseAmount = 0;

    expanseRecords.forEach((record) => {
      const expanseName = record.Expanse_name || 'Unnamed Expense';
      const amount = record.Amount || 0;

      if (!expenseSummary[expanseName]) {
        expenseSummary[expanseName] = 0;
      }
      expenseSummary[expanseName] += amount;
      totalExpenseAmount += amount;
    });

    const formatAmount = (amount) => (Number(amount) % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2));

   // Create a new PDF document with custom page size (32 inches width)
	 const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"');

	// Insert Company Name and Logo at the top of the page
  const logoPath = 'public/logo.jpg'; // Replace with the actual path to your logo image

	// Add the logo (make sure the logo file is in your server or public folder)
	doc.image(logoPath, 20, 20, { width: 100 }); // Adjust size and position as needed

    doc.fontSize(14).text('Expense Report Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.text(`From: ${formattedStartDate} To: ${formattedEndDate}`);
    doc.moveDown();

    doc.text('Summary', { underline: true });
    doc.moveDown();
    doc.text(`Expenses: ${expanseRecords.length}`);
    doc.text(`Expense Amount: ${formatAmount(totalExpenseAmount)}`);
    doc.moveDown();

    doc.text('Expense Records', { underline: true });
    doc.moveDown();
    doc.fontSize(8); // Decrease font size for records

    const columnHeaders = ['Expense Name', 'Total Amount'  ];
    const columnWidths = [350, 100];
    const startX = 50;
    let currentY = doc.y;

    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    currentY += 20;
    doc.moveDown();

    Object.keys(expenseSummary).forEach((expanseName) => {
      const totalAmount = expenseSummary[expanseName];
      doc.text(expanseName, startX, currentY);
      doc.text(formatAmount(totalAmount), startX + columnWidths[0], currentY);
      currentY += 15;

      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};

// Function to export all expense records as a PDF
export const exportAllExpanseRecordReport = async (req, res) => {
  try {
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const allexpanseRecords = await dailyexpanseModel.find({
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    if (allexpanseRecords.length === 0) {
      return res.status(200).json({ message: 'No expense records found.' });
    }

    const totalExpenseAmount = allexpanseRecords.reduce((total, record) => total + (record.Amount || 0), 0);
    const totalExpenseCount = allexpanseRecords.length;

   // Create a new PDF document with custom page size (32 inches width)
   const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });

	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename="All_Income_Report_Summary.pdf"');

	// Insert Company Name and Logo at the top of the page
  const logoPath = 'public/logo.jpg'; // Replace with the actual path to your logo image

	// Add the logo (make sure the logo file is in your server or public folder)
	doc.image(logoPath, 20, 20, { width: 100 }); // Adjust size and position as needed

    doc.fontSize(14).text('All Expense Records Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();

    doc.text('Summary', { underline: true });
    doc.moveDown();
    doc.text(`Expanse: ${totalExpenseCount}`);
    doc.text(`Total Expanse Amount: ${Math.round(totalExpenseAmount)}`);
    doc.moveDown();

    doc.text('Expense Records', { underline: true });
    doc.moveDown();
    doc.fontSize(8);

    const columnHeaders = ['Expanse Name', 'Category', 'Amount', 'Remarks', 'Debit', 'Account Title', ];
    const columnWidths = [80,80,50,70,40,70];
    const startX = 50;
    let currentY = doc.y;

    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    currentY += 20;
    doc.moveTo(startX, currentY - 10).lineTo(startX + 700, currentY - 10).stroke();
    doc.moveDown();

    allexpanseRecords.forEach((record) => {
      const recordData = [
        record.Expanse_name || '-',
        record.Category || '-',
        Math.round(record.Amount || 0),
        record.Remarks || '-',
        Math.round(record.Debit || 0),
        record.Account_Title || '-'
      ];

      recordData.forEach((data, index) => {
        const positionX = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(data, positionX, currentY);
      });
      currentY += 15;

      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};


// Function to export expense by category report as a PDF
export const exportExpanseByCategoryReport = async (req, res) => {
  try {
    const { Category } = req.params;
    const { reportPeriod = 'Today', customStart, customEnd } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(reportPeriod, customStart, customEnd);

    const filter = {
      status: 0,
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    };

    if (Category) {
      filter.Category = new RegExp(`^${Category}$`, 'i');
    }

    const expansecategoryRecords = await dailyexpanseModel.find(filter);

    // Calculate total expense amount and total records count
    const totalExpenseAmount = expansecategoryRecords.reduce((total, record) => total + (record.Amount || 0), 0);
    const totalExpenseCount = expansecategoryRecords.length;

    // Create the PDF document with A4 landscape orientation
    const doc = new PDFDocument({ layout: 'landscape', size: [1100, 1800], margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="expanse_by_category_report.pdf"');


		const logoPath = 'public/logo.jpg'; // Adjust path to your logo
    doc.image(logoPath, 20, 20, { width: 150 });


    doc.fontSize(14).text('Expanse by Category Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Category: ${Category || 'All Categories'}`);
    doc.moveDown();
    doc.text(`Report Period: ${reportPeriod}`);
    doc.moveDown();
    doc.text(`From: ${moment(startDate).format('YYYY-MM-DD')} To: ${moment(endDate).format('YYYY-MM-DD')}`);
    doc.moveDown();

    doc.text('Summary', { underline: true });
    doc.moveDown();
    doc.text(`Expanse: ${totalExpenseCount}`);
    doc.text(`Expanse Amount: ${Math.round(totalExpenseAmount)}`);
    doc.moveDown();

    doc.text('Expense Records', { underline: true });
    doc.moveDown();
    doc.fontSize(8); // Reduce font size for records

    // Define column headers and their widths
    const columnHeaders = ['S.No','Date','Expanse Name', 'Category', 'Amount',  'Debit',];
    const columnWidths = [30, 100, 100, 80, 150, 150,];
    const startX = 50;
    let currentY = doc.y;

    // Add column headers to the document
    columnHeaders.forEach((header, index) => {
      doc.text(header, startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0), currentY);
    });
    currentY += 20;
    doc.moveTo(startX, currentY - 10).lineTo(startX + 700, currentY - 10).stroke();
    doc.moveDown();

    // Loop through records and add them to the PDF
    expansecategoryRecords.forEach((record) => {
      const recordData = [
        moment(record.indate).format('YYYY-MM-DD') || '-',
        record.Expanse_name || '-',
        record.Category || '-',
        Math.round(record.Amount || 0),
        Math.round(record.Debit || 0),

      ];

      // Add record data to the PDF
      recordData.forEach((data, index) => {
        const positionX = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(data, positionX, currentY);
      });
      currentY += 15;

      // Check if page is full and add a new page if needed
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    // End the PDF document stream and pipe the result
    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Server error generating PDF report' });
  }
};



