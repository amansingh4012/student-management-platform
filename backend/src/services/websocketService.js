import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }
  
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.cors.origin,
        credentials: true
      }
    });
    
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        socket.userId = decoded.studentId || decoded.adminId;
        socket.userRole = decoded.role;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
    
    this.io.on('connection', this.handleConnection.bind(this));
  }
  
  handleConnection(socket) {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);
    
    // Store connection
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      role: socket.userRole,
      connectedAt: new Date()
    });
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    if (socket.userRole === 'student') {
      socket.join(`student:${socket.userId}`);
    }
    
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      this.connectedUsers.delete(socket.userId);
    });
  }
  
  // Send real-time updates to specific student
  notifyStudent(studentId, eventType, data) {
    this.io.to(`student:${studentId}`).emit(eventType, {
      type: eventType,
      data,
      timestamp: new Date()
    });
  }
  
  // Broadcast to all admins
  notifyAdmins(eventType, data) {
    this.io.to('role:admin').emit(eventType, {
      type: eventType,
      data,
      timestamp: new Date()
    });
  }
  
  // Broadcast to all students of an institute
  notifyInstituteStudents(instituteId, eventType, data) {
    this.io.to(`institute:${instituteId}`).emit(eventType, {
      type: eventType,
      data,
      timestamp: new Date()
    });
  }
}

export const websocketService = new WebSocketService();
