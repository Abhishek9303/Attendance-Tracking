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
