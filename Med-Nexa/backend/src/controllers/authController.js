const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } = require('../utils/tokenUtils');
const supabaseService = require('../services/supabaseService');

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, specialization, qualification, consultationFee, experience } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
      role: role || 'patient'
    });

    // If registering as doctor, create doctor profile
    if (role === 'doctor') {
      await DoctorProfile.create({
        userId: user._id,
        specialization: specialization || 'General Medicine',
        qualification: qualification || 'MBBS',
        consultationFee: consultationFee || 500,
        experience: experience || 0,
        workingHours: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', maxSlots: 20 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', maxSlots: 20 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', maxSlots: 20 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', maxSlots: 20 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', maxSlots: 20 },
        ]
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Active Database: Supabase PostgreSQL Real-Time Sync
    supabaseService.syncUser(user).catch(err => {
      console.warn('Supabase User sync notice:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password (supports mednexa.com and navihospital.com aliases)
    const aliasEmail = email.includes('@mednexa.com')
      ? email.replace('@mednexa.com', '@navihospital.com')
      : (email.includes('@navihospital.com') ? email.replace('@navihospital.com', '@mednexa.com') : null);

    const user = await User.findOne({
      $or: [
        { email },
        ...(aliasEmail ? [{ email: aliasEmail }] : [])
      ]
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Get doctor profile if doctor
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      doctorProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch (e) {
        // Token might be expired, still logout
      }
    }
    clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    let doctorProfile = null;
    if (req.user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    }

    res.json({
      success: true,
      user: req.user,
      doctorProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
};

module.exports = { register, login, refreshAccessToken, logout, getMe };
