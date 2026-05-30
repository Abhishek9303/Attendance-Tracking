import { Request, Response, NextFunction } from 'express';
import Attendance from '../models/Attendance';
import User from '../models/User';
import socketService from '../services/socket';
import NotificationService from '../services/notification';

export const getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await Attendance.find({ status: 'PENDING' })
      .populate('userId', 'name email phone')
      .sort({ timestamp: -1 });

    return res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

export const approveAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance request not found' });
    }

    attendance.status = 'APPROVED';
    attendance.approvedBy = adminId as any;
    attendance.approvedAt = new Date();
    await attendance.save();

    const employeeIdStr = attendance.userId.toString();

    // 1. Emit live status update to user client using Socket.IO
    socketService.emitToUser(employeeIdStr, 'attendanceStatusUpdate', {
      attendanceId: attendance._id,
      status: 'APPROVED',
      approvedAt: attendance.approvedAt,
    });

    // 2. Trigger FCM push notification mockup
    await NotificationService.sendPushNotification(
      employeeIdStr,
      'Attendance Request Approved',
      `Your check-in on ${attendance.date} has been approved.`
    );

    return res.status(200).json({
      message: 'Attendance approved successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance request not found' });
    }

    attendance.status = 'REJECTED';
    attendance.approvedBy = adminId as any;
    attendance.approvedAt = new Date();
    attendance.rejectionReason = reason;
    await attendance.save();

    const employeeIdStr = attendance.userId.toString();

    // 1. Emit live status update to user client using Socket.IO
    socketService.emitToUser(employeeIdStr, 'attendanceStatusUpdate', {
      attendanceId: attendance._id,
      status: 'REJECTED',
      rejectionReason: reason,
    });

    // 2. Trigger FCM push notification mockup
    await NotificationService.sendPushNotification(
      employeeIdStr,
      'Attendance Request Rejected',
      `Your check-in on ${attendance.date} was rejected. Reason: ${reason}`
    );

    return res.status(200).json({
      message: 'Attendance rejected successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Card counts
    const totalEmployees = await User.countDocuments({ role: 'USER' });
    const pendingRequests = await Attendance.countDocuments({ status: 'PENDING' });
    const approvedToday = await Attendance.countDocuments({ status: 'APPROVED', date: today });
    const rejectedToday = await Attendance.countDocuments({ status: 'REJECTED', date: today });

    // Build Analytics: simple daily distribution over past 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailyAttendanceChart = await Promise.all(
      last7Days.map(async (date) => {
        const approvedCount = await Attendance.countDocuments({ date, status: 'APPROVED' });
        const rejectedCount = await Attendance.countDocuments({ date, status: 'REJECTED' });
        return { date, approved: approvedCount, rejected: rejectedCount };
      })
    );

    return res.status(200).json({
      cards: {
        totalEmployees,
        pendingRequests,
        approvedToday,
        rejectedToday,
      },
      analytics: {
        dailyAttendanceChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    const query: any = { role: 'USER' };
    if (search) {
      query.name = new RegExp(String(search), 'i');
    }

    const employees = await User.find(query).select('-password').sort({ name: 1 });

    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const total = await Attendance.countDocuments({ userId: employee._id });
        const approved = await Attendance.countDocuments({ userId: employee._id, status: 'APPROVED' });
        const pending = await Attendance.countDocuments({ userId: employee._id, status: 'PENDING' });
        return {
          employee,
          attendanceRate: total > 0 ? Math.round((approved / total) * 100) : 0,
          stats: { total, approved, pending },
        };
      })
    );

    return res.status(200).json(employeesWithStats);
  } catch (error) {
    next(error);
  }
};
