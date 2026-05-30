import { Request, Response, NextFunction } from 'express';
import Attendance from '../models/Attendance';
import User from '../models/User';
import env from '../config/env';
import socketService from '../services/socket';
import NotificationService from '../services/notification';

// Helper to calculate distance in meters using Haversine formula
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude, selfieUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (latitude === undefined || longitude === undefined || !selfieUrl) {
      return res.status(400).json({ message: 'GPS coordinates and selfie are required' });
    }

    // Determine current local dates and times
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const checkInTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

    // 1. Duplicate Prevention
    const existing = await Attendance.findOne({ userId, date: dateStr });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already submitted for today' });
    }

    // 2. Geofence distance calculation
    const distance = getDistanceInMeters(
      Number(latitude),
      Number(longitude),
      env.OFFICE_LATITUDE,
      env.OFFICE_LONGITUDE
    );

    // Flag geofence mismatch or log warning (we can allow but record or block based on rule. 
    // Let's allow and log/indicate, or enforce a strict check, say 500km boundary or whatever is set in config).
    if (distance > env.ALLOWED_GPS_RADIUS_METERS) {
      return res.status(400).json({
        message: `Geofence check failed. You are ${Math.round(distance)}m away from the office. Allowed limit is ${env.ALLOWED_GPS_RADIUS_METERS}m.`,
      });
    }

    // 3. Late Check-In Detection
    const [officeHours, officeMins] = env.OFFICE_START_TIME.split(':').map(Number);
    const checkInHours = now.getHours();
    const checkInMins = now.getMinutes();

    let isLate = false;
    if (checkInHours > officeHours || (checkInHours === officeHours && checkInMins > officeMins)) {
      isLate = true;
    }

    const userRecord = await User.findById(userId);
    const employeeName = userRecord ? userRecord.name : 'Unknown Employee';

    const attendance = new Attendance({
      userId,
      date: dateStr,
      checkInTime: checkInTimeStr,
      timestamp: now,
      latitude,
      longitude,
      selfieUrl,
      status: 'PENDING',
      isLate,
    });

    await attendance.save();

    // Notify Socket Clients (Admins) in real-time
    socketService.emitToAdmins('newAttendanceRequest', {
      attendanceId: attendance._id,
      userId,
      employeeName,
      date: dateStr,
      checkInTime: checkInTimeStr,
      isLate,
    });

    // Mock Send FCM Push notification to active admin accounts
    await NotificationService.notifyAdmins(
      'New Attendance Submission',
      `${employeeName} checked in at ${checkInTimeStr} (${isLate ? 'LATE' : 'ON TIME'}). Requires approval.`,
      { attendanceId: attendance._id.toString() }
    );

    return res.status(201).json({
      message: 'Attendance submitted successfully. Pending Admin approval.',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { date, month, year, status } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query: any = { userId };

    if (date) {
      query.date = date;
    } else if (month && year) {
      // Find matching month prefix "YYYY-MM"
      const formattedMonth = String(month).padStart(2, '0');
      query.date = new RegExp(`^${year}-${formattedMonth}-`);
    } else if (year) {
      // Find matching year prefix "YYYY-"
      query.date = new RegExp(`^${year}-`);
    }

    if (status) {
      query.status = status;
    }

    const records = await Attendance.find(query).sort({ timestamp: -1 });

    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
};

export const getHistoryStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const records = await Attendance.find({ userId });

    const totalDays = records.length;
    const approvedDays = records.filter((r) => r.status === 'APPROVED').length;
    const rejectedDays = records.filter((r) => r.status === 'REJECTED').length;
    const pendingDays = records.filter((r) => r.status === 'PENDING').length;
    const lateDays = records.filter((r) => r.status === 'APPROVED' && r.isLate).length;

    return res.status(200).json({
      totalDays,
      approvedDays,
      rejectedDays,
      pendingDays,
      lateDays,
      attendancePercentage: totalDays > 0 ? Math.round((approvedDays / totalDays) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
};

// Helper for detailed history calculations
const getWorkingDaysInMonth = (year: number, month: number): number => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let count = 0;
  const curDate = new Date(startDate);
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

const timeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const minutesToFormattedTime = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes === 0) return '--:--';
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export const getMyDetailedHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const employee = await User.findById(userId).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const formattedMonth = String(month).padStart(2, '0');
    const monthRegex = new RegExp(`^${year}-${formattedMonth}-`);
    const records = await Attendance.find({
      userId,
      date: monthRegex,
    }).sort({ date: 1 });

    const workingDays = getWorkingDaysInMonth(year, month);
    const approvedAndPending = records.filter(r => r.status === 'APPROVED' || r.status === 'PENDING');

    const leaveCount = approvedAndPending.filter(r => r.selfieUrl === 'LEAVE').length;
    const presentCount = approvedAndPending.filter(r => r.selfieUrl !== 'LEAVE').length;
    const lateCount = approvedAndPending.filter(r => r.isLate && r.selfieUrl !== 'LEAVE').length;
    const absentCount = Math.max(0, workingDays - (presentCount + leaveCount));

    // Calculate Average Clock In Time
    let totalClockInMinutes = 0;
    let clockInCount = 0;
    approvedAndPending.forEach(r => {
      if (r.selfieUrl !== 'LEAVE' && r.checkInTime) {
        totalClockInMinutes += timeToMinutes(r.checkInTime);
        clockInCount++;
      }
    });
    const avgClockInMinutes = clockInCount > 0 ? totalClockInMinutes / clockInCount : 0;
    const averageCheckInTime = minutesToFormattedTime(avgClockInMinutes);

    const attendancePercentage = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;

    // Timeline format matching admin details exactly
    const attendanceLogs = records.map(r => {
      const isLeave = r.selfieUrl === 'LEAVE';
      let status = 'ON_TIME';
      let color = 'green';
      if (isLeave) {
        status = 'LEAVE';
        color = 'red';
      } else if (r.status === 'REJECTED') {
        status = 'REJECTED';
        color = 'gray';
      } else if (r.isLate) {
        status = 'LATE';
        color = 'yellow';
      } else if (r.status === 'PENDING') {
        status = 'PENDING';
        color = 'blue';
      }

      const dateObj = new Date(r.date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];

      return {
        _id: r._id,
        date: r.date,
        day: dayName,
        clockInTime: isLeave ? 'LEAVE' : minutesToFormattedTime(timeToMinutes(r.checkInTime)),
        status,
        color,
        latitude: r.latitude,
        longitude: r.longitude,
        selfieUrl: r.selfieUrl,
        remarks: r.rejectionReason || (isLeave ? 'Approved Leave' : 'N/A'),
        approvalStatus: r.status,
      };
    });

    return res.status(200).json({
      employeeId: userId,
      employee,
      month,
      year,
      summary: {
        presentDays: presentCount,
        lateDays: lateCount,
        leaveDays: leaveCount,
        absentDays: absentCount,
        attendancePercentage: Math.min(attendancePercentage, 100),
        workingDays,
        averageCheckInTime,
      },
      attendance: attendanceLogs,
    });
  } catch (error) {
    next(error);
  }
};
