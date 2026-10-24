import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (socket && socket.connected) return socket;
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) return connectSocket();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinQueue = (doctorId, date = new Date().toISOString().split('T')[0]) => {
  const s = getSocket();
  if (s) {
    if (s.connected) {
      s.emit('join_queue', { doctorId, date });
    } else {
      s.once('connect', () => {
        s.emit('join_queue', { doctorId, date });
      });
    }
  }
};

export const leaveQueue = (doctorId, date = new Date().toISOString().split('T')[0]) => {
  const s = getSocket();
  if (s?.connected) {
    s.emit('leave_queue', { doctorId, date });
  }
};

export const onQueueUpdate = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('queue_updated', callback);
    s.on('queue_update', callback);
  }
};

export const onPatientCalled = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('your_turn', callback);
    s.on('patient_called', callback);
  }
};

export const on = (event, callback) => {
  const s = getSocket();
  if (s) s.on(event, callback);
};

export const off = (event, callback) => {
  const s = getSocket();
  if (s) s.off(event, callback);
};

export const emit = (event, data) => {
  const s = getSocket();
  if (s?.connected) s.emit(event, data);
};

const socketService = {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinQueue,
  leaveQueue,
  onQueueUpdate,
  onPatientCalled,
  on,
  off,
  emit
};

export default socketService;
