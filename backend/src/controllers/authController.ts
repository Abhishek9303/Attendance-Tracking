import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import env from '../config/env';

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All registration fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Role defaults to USER unless set and approved.
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: userRole,
    });

    await user.save();

    const tokens = generateTokens({ id: user._id.toString(), email: user.email, role: user.role });

    return res.status(201).json({
      message: 'Account registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await (user as any).comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is deactivated' });
    }

    const tokens = generateTokens({ id: user._id.toString(), email: user.email, role: user.role });

    return res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(403).json({ message: 'User is inactive or not found' });
      }

      const tokens = generateTokens({ id: user._id.toString(), email: user.email, role: user.role });

      return res.status(200).json(tokens);
    } catch (err) {
      return res.status(403).json({ message: 'Refresh token is invalid or expired' });
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
