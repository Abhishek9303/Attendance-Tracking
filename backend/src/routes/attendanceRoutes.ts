import { Router } from 'express';
import { markAttendance, getMyAttendance, getHistoryStats } from '../controllers/attendanceController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/mark', markAttendance);
router.get('/my-attendance', getMyAttendance);
router.get('/history', getHistoryStats);

export default router;
