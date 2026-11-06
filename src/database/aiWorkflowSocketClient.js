import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.gamukis.site';
const AI_NAMESPACE = '/ai-workflow';

class AiWorkflowSocketClient {
  constructor() {
    this.socket = null;
    this.currentJobId = null;
    this.listeners = {
      progress: new Set(),
      candidateStreamed: new Set(),
      completed: new Set(),
      failed: new Set(),
      statusChange: new Set()
    };
  }

  connect(token = null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const effectiveToken =
      token ||
      (typeof window !== "undefined"
        ? window.localStorage?.getItem("gamukis_manual_token") ||
          window.sessionStorage?.getItem("gamukis_manual_token") ||
          window.localStorage?.getItem("token") ||
          window.sessionStorage?.getItem("token")
        : null);
    const socketUrl = `${BACKEND_URL}${AI_NAMESPACE}`;

    this.socket = io(socketUrl, {
      auth: { token: effectiveToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      this._notifyStatusChange('connected');
      if (this.currentJobId) {
        this.joinJob(this.currentJobId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this._notifyStatusChange('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      this._notifyStatusChange('error', error.message);
    });

    this.socket.on('ai:job_progress', (data) => {
      this.listeners.progress.forEach((cb) => {
        try { cb(data); } catch (e) { console.error('Error in ai:job_progress listener:', e); }
      });
    });

    this.socket.on('ai:candidate_streamed', (data) => {
      this.listeners.candidateStreamed.forEach((cb) => {
        try { cb(data); } catch (e) { console.error('Error in ai:candidate_streamed listener:', e); }
      });
    });

    this.socket.on('ai:job_completed', (data) => {
      this.listeners.completed.forEach((cb) => {
        try { cb(data); } catch (e) { console.error('Error in ai:job_completed listener:', e); }
      });
    });

    this.socket.on('ai:job_failed', (data) => {
      this.listeners.failed.forEach((cb) => {
        try { cb(data); } catch (e) { console.error('Error in ai:job_failed listener:', e); }
      });
    });

    return this.socket;
  }

  joinJob(jobId) {
    this.currentJobId = jobId;
    if (this.socket?.connected && jobId) {
      this.socket.emit('join_job', { jobId }, (response) => {
        if (!response?.ok) {
          console.warn('Failed to join AI job room:', response?.message);
        }
      });
    }
  }

  leaveJob(jobId) {
    if (this.socket?.connected && jobId) {
      this.socket.emit('leave_job', { jobId });
    }
    if (this.currentJobId === jobId) {
      this.currentJobId = null;
    }
  }

  onProgress(callback) {
    this.listeners.progress.add(callback);
    return () => this.listeners.progress.delete(callback);
  }

  onCandidateStreamed(callback) {
    this.listeners.candidateStreamed.add(callback);
    return () => this.listeners.candidateStreamed.delete(callback);
  }

  onCompleted(callback) {
    this.listeners.completed.add(callback);
    return () => this.listeners.completed.delete(callback);
  }

  onFailed(callback) {
    this.listeners.failed.add(callback);
    return () => this.listeners.failed.delete(callback);
  }

  onStatusChange(callback) {
    this.listeners.statusChange.add(callback);
    return () => this.listeners.statusChange.delete(callback);
  }

  _notifyStatusChange(status, detail = null) {
    this.listeners.statusChange.forEach((cb) => {
      try { cb({ status, detail }); } catch (e) { console.error('Error in statusChange listener:', e); }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentJobId = null;
  }
}

export const aiWorkflowSocketClient = new AiWorkflowSocketClient();
export default aiWorkflowSocketClient;
