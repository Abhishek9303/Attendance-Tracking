import { Router } from 'express';
import {
  getPendingRequests,
  approveAttendance,
  rejectAttendance,
  getAdminDashboard,
  getEmployeeList,
} from '../controllers/adminController';
import { authenticateJWT, requireRole } from '../middlewares/auth';

const router = Router();

// Secure all admin routes with JWT and Admin RBAC
router.use(authenticateJWT, requireRole('ADMIN'));

router.get('/attendance/pending', getPendingRequests);
router.patch('/attendance/:id/approve', approveAttendance);
router.patch('/attendance/:id/reject', rejectAttendance);
router.get('/dashboard', getAdminDashboard);
router.get('/employees', getEmployeeList);

export default router;
