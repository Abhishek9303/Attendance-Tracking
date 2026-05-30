import { Router } from 'express';
import { markAttendance, getMyAttendance, getHistoryStats, getMyDetailedHistory } from '../controllers/attendanceController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/mark', markAttendance);
router.get('/my-attendance', getMyAttendance);
router.get('/history', getHistoryStats);
router.get('/my-details', getMyDetailedHistory);

export default router;
