declare global {
  var io: any;
}

export function emitPresenceUpdate(userData: any) {
  if (global.io) {
    global.io.emit("presence:updated", { user: userData });
  }
}

export function emitUserCreated(userData: any) {
  if (global.io) {
    global.io.emit("user:created", { user: userData });
  }
}

export function emitUserUpdated(userData: any) {
  if (global.io) {
    global.io.emit("user:updated", { user: userData });
  }
}

export function emitUserDeleted(userId: string) {
  if (global.io) {
    global.io.emit("user:deleted", { userId });
  }
}

export function emitAttendanceSaved(attendanceData: any) {
  if (global.io) {
    global.io.emit("attendance:saved", { attendance: attendanceData });
  }
}

export function emitRegularizationNew(requestData: any) {
  if (global.io) {
    global.io.emit("regularization:new", requestData);
  }
}

export function emitRegularizationReviewed(requestData: any) {
  if (global.io) {
    global.io.emit("regularization:reviewed", requestData);
  }
}
