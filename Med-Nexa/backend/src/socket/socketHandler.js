const jwt = require('jsonwebtoken');

const setupSocket = (io) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      // Extract token from handshake cookies or auth header
      const cookieHeader = socket.handshake.headers.cookie;
      let token = null;

      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.accessToken;
      }

      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.userId = decoded.id;
      }

      next();
    } catch (error) {
      // Allow connection even without auth (for public queue viewing)
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId || 'anonymous'}`);

    // Join patient-specific room for direct notifications
    if (socket.userId) {
      socket.join(`patient_${socket.userId}`);
    }

    // Join a doctor's queue room
    socket.on('join_queue', ({ doctorId, date }) => {
      const room = `queue_${doctorId}_${date}`;
      socket.join(room);
      console.log(`📋 ${socket.id} joined queue room: ${room}`);
    });

    // Leave a queue room
    socket.on('leave_queue', ({ doctorId, date }) => {
      const room = `queue_${doctorId}_${date}`;
      socket.leave(room);
      console.log(`📋 ${socket.id} left queue room: ${room}`);
    });

    // Doctor broadcasts queue update
    socket.on('doctor_queue_update', (data) => {
      const room = `queue_${data.doctorId}_${data.date}`;
      io.to(room).emit('queue_updated', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  return io;
};

module.exports = setupSocket;
