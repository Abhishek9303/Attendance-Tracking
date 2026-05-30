import { Request, Response, NextFunction } from 'express';
import Attendance from '../models/Attendance';
import User from '../models/User';

// Helper to get number of weekdays (Mon-Fri) in a month
const getWorkingDaysInMonth = (year: number, month: number): number => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  let count = 0;
  
  const curDate = new Date(startDate);
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

// Helper to parse clock-in time to minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

// Helper to format minutes from midnight to HH:MM AM/PM
const minutesToFormattedTime = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes === 0) return '--:--';
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minStr = String(minutes).padStart(2, '0');
  return `${hours12}:${minStr} ${ampm}`;
};

export const getEmployeeListWithStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Query standard employees
    const query: any = { role: 'USER' };
    if (search) {
      query.name = new RegExp(String(search), 'i');
    }

    const employees = await User.find(query).select('-password').sort({ name: 1 });

    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        // Fetch all attendance for the current month
        const formattedMonth = String(currentMonth).padStart(2, '0');
        const monthRegex = new RegExp(`^${currentYear}-${formattedMonth}-`);
        const monthRecords = await Attendance.find({
          userId: employee._id,
          date: monthRegex,
        });

        // Statistics calculation
        const approvedAndPending = monthRecords.filter(r => r.status === 'APPROVED' || r.status === 'PENDING');
        
        // Count Leave logs (any entry where remarks contains LEAVE or marked as approved leave)
        const leaveDays = approvedAndPending.filter(r => 
          r.status === 'APPROVED' && 
          r.selfieUrl === 'LEAVE'
        ).length;

        // Present days (exclude leaves)
        const presentDays = approvedAndPending.filter(r => r.selfieUrl !== 'LEAVE').length;

        // Late days
        const lateDays = approvedAndPending.filter(r => r.isLate && r.selfieUrl !== 'LEAVE').length;

        const workingDays = getWorkingDaysInMonth(currentYear, currentMonth) || 22;
        const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

        return {
          employee,
          attendanceRate: Math.min(attendanceRate, 100),
          stats: {
            present: presentDays,
            late: lateDays,
            leave: leaveDays,
            workingDays,
          }
        };
      })
    );

    return res.status(200).json(employeesWithStats);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeAttendanceDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const employee = await User.findById(employeeId).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const formattedMonth = String(month).padStart(2, '0');
    const monthRegex = new RegExp(`^${year}-${formattedMonth}-`);
    const records = await Attendance.find({
      userId: employeeId,
      date: monthRegex,
    }).sort({ date: 1 });

    const workingDays = getWorkingDaysInMonth(year, month);
    const approvedAndPending = records.filter(r => r.status === 'APPROVED' || r.status === 'PENDING');

    const leaveCount = approvedAndPending.filter(r => r.selfieUrl === 'LEAVE').length;
    const presentCount = approvedAndPending.filter(r => r.selfieUrl !== 'LEAVE').length;
    const lateCount = approvedAndPending.filter(r => r.isLate && r.selfieUrl !== 'LEAVE').length;
    
    // Any weekdays in the month that are not in the approved/pending records are considered ABSENT
    // Calculate total absents based on working days minus active checkins/leaves
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

    // Dynamic Attendance %
    const attendancePercentage = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;

    // Build timeline logs
    // Pre-calculate status color indicators and fields
    const attendanceLogs = records.map(r => {
      const isLeave = r.selfieUrl === 'LEAVE';
      
      let status: 'ON_TIME' | 'LATE' | 'LEAVE' | 'PENDING' | 'REJECTED' = 'ON_TIME';
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

      // Convert date string to day name
      const dateObj = new Date(r.date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[dateObj.getDay()];

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
      employeeId,
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

export const getMonthlyCompanySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const formattedMonth = String(month).padStart(2, '0');
    const monthRegex = new RegExp(`^${year}-${formattedMonth}-`);

    const totalEmployees = await User.countDocuments({ role: 'USER' });
    const records = await Attendance.find({ date: monthRegex });

    const approvedAndPending = records.filter(r => r.status === 'APPROVED' || r.status === 'PENDING');
    
    const present = approvedAndPending.filter(r => r.selfieUrl !== 'LEAVE').length;
    const late = approvedAndPending.filter(r => r.isLate && r.selfieUrl !== 'LEAVE').length;
    const leave = approvedAndPending.filter(r => r.selfieUrl === 'LEAVE').length;

    const workingDays = getWorkingDaysInMonth(year, month);
    const totalPotentialManDays = totalEmployees * workingDays;
    const attendancePercentage = totalPotentialManDays > 0 
      ? Math.round((present / totalPotentialManDays) * 100) 
      : 0;

    return res.status(200).json({
      month,
      year,
      totalEmployees,
      present,
      late,
      leave,
      attendancePercentage: Math.min(attendancePercentage, 100),
    });
  } catch (error) {
    next(error);
  }
};
