const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  });
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  // Check if we are running in production or cross-site (Vercel frontend + Render backend)
  const isProduction = process.env.NODE_ENV === 'production' ||
    (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'));

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  };

  res.cookie('accessToken', accessToken, cookieOptions);

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production' ||
    (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'));

  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };

  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', { ...clearOptions, path: '/' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies
};
