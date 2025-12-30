import express from 'express';
import {

  exportAllIncomeReport,
  exportAllIncomeRecordsReport,
  exportIncomeByCategoryReport,
  exportAllincomecategory,
  exportAllSalespersonSummary,
  exportSalespersonReport,
  exportSalespersonByNameAndCategoryReport,

  exportTechnicianReport,
  exportTechnicianByNameReport,

  exportAlldevicesReport,

	exportAllPendingReport,
	exportPendingrecordsReport,
	exportsalepersonPendingReport,

	exportAllExpanseReport,
  exportAllExpanseRecordReport,
  exportExpanseByCategoryReport,
} from '../../controllers/Report/exportController.js';

import { getDateRangeForPeriod } from '../../controllers/Report/dateHelper.js'
const router = express.Router();

// Define routes for the report API

router.get('/date-range-get', getDateRangeForPeriod);

router.get('/all-income-report', exportAllIncomeReport);
router.get('/all-income-Record-report', exportAllIncomeRecordsReport);
router.get('/income-category-report/:Category', exportIncomeByCategoryReport);
router.get('/all-Category-report', exportAllincomecategory);


router.get('/all-salesperson-Summary', exportAllSalespersonSummary);
router.get('/all-salesperson-report', exportSalespersonReport);
router.get('/salesperson', exportSalespersonByNameAndCategoryReport);

router.get('/all-technician-report', exportTechnicianReport);
router.get('/technician-name-report/:name', exportTechnicianByNameReport);

router.get('/All-pending-Report', exportAllPendingReport);
router.get('/pending-record-Report', exportPendingrecordsReport);
router.get('/salepersonname-pending-Report/:name', exportsalepersonPendingReport);

router.get('/All-Devices-Report', exportAlldevicesReport);

router.get('/all-expanse-report', exportAllExpanseReport);
router.get('/all-expanse-Record-report', exportAllExpanseRecordReport);
router.get('/expanse-category/:Category', exportExpanseByCategoryReport);

export default router;
