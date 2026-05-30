import { Router } from 'express';
import {
  getPendingRequests,
  approveAttendance,
  rejectAttendance,
  getAdminDashboard,
} from '../controllers/adminController';
import {
  getEmployeeListWithStats,
  getEmployeeAttendanceDetails,
  getMonthlyCompanySummary,
} from '../controllers/adminAttendanceController';
import { authenticateJWT, requireRole } from '../middlewares/auth';

const router = Router();

// Secure all admin routes with JWT and Admin RBAC
router.use(authenticateJWT, requireRole('ADMIN'));

router.get('/attendance/pending', getPendingRequests);
router.patch('/attendance/:id/approve', approveAttendance);
router.patch('/attendance/:id/reject', rejectAttendance);
router.get('/dashboard', getAdminDashboard);

// Enterprise-Grade Individual Attendance Tracking
router.get('/employees', getEmployeeListWithStats);
router.get('/attendance/:employeeId', getEmployeeAttendanceDetails);
router.get('/attendance-summary', getMonthlyCompanySummary);

export default router;
