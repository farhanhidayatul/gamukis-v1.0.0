import { request } from "./manualAuth";
import {
  downloadMembershipInvoice,
  sendMembershipInvoiceEmail
} from "./membershipApi";

const getPendingTeachers = async () => {
  const response = await request("/admin/teachers?status=pending");
  return response.teachers || response.data || response.items || (Array.isArray(response) ? response : []);
};

const updateTeacherApproval = (teacherId, status) => request(
  `/admin/teachers/${encodeURIComponent(teacherId)}/approval`,
  {
    method: "PATCH",
    body: JSON.stringify({ status })
  }
);

const getRooms = async () => {
  const response = await request('/admin/rooms');
  return response.rooms || [];
};

const getHistory = async () => {
  const response = await request('/admin/rooms/history');
  return response.history || [];
};

const createRoom = (room) => request('/admin/rooms', {
  method: 'POST',
  body: JSON.stringify(room)
});

const deleteRoom = (roomId, { force = false } = {}) => request(
  `/admin/rooms/${encodeURIComponent(roomId)}${force ? '?force=true' : ''}`,
  { method: 'DELETE' }
);

const updateRoom = (roomId, changes) => request(
  `/admin/rooms/${encodeURIComponent(roomId)}`,
  {
    method: 'PATCH',
    body: JSON.stringify(changes)
  }
);

const deleteHistory = (historyId) => request(
  `/admin/rooms/history/${encodeURIComponent(historyId)}`,
  { method: 'DELETE' }
);

const listTeachers = async ({ status = 'pending', q } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await request(`/admin/teachers${qs}`);
  return response.teachers || response.data || response.items || (Array.isArray(response) ? response : []);
};

const deleteTeacher = (teacherId, { revoke = false } = {}) => request(
  `/admin/teachers/${encodeURIComponent(teacherId)}${revoke ? '?revoke=true' : ''}`,
  { method: 'DELETE' }
);

const getMembershipPlans = async () => {
  const response = await request('/memberships/admin/plans');
  return response.plans || [];
};

const updateMembershipPlan = (planId, changes) => request(
  `/memberships/admin/plans/${encodeURIComponent(planId)}`,
  { method: 'PATCH', body: JSON.stringify(changes) }
);

const createMembershipPlan = (plan) => request('/memberships/admin/plans', {
  method: 'POST',
  body: JSON.stringify(plan)
});

const getAccessUsers = async () => {
  const response = await request('/access/users');
  return response.users || [];
};

const grantMembership = ({ authType, userId, planCode }) => request('/memberships/admin/grant', {
  method: 'POST',
  body: JSON.stringify({ authType, userId, planCode })
});

const getAdminMembershipTransactions = async ({ status = '', q = '' } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await request(`/memberships/admin/transactions${qs}`);
  return {
    transactions: response.transactions || [],
    summary: response.summary || {
      totalCount: 0,
      activeCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      totalRevenue: 0
    }
  };
};

const confirmAdminMembership = (membershipId, paymentRef) => request(
  `/memberships/admin/memberships/${encodeURIComponent(membershipId)}/confirm`,
  {
    method: 'POST',
    body: JSON.stringify(paymentRef ? { paymentRef } : {})
  }
);

const downloadAdminMembershipInvoice = (membershipId) => downloadMembershipInvoice(membershipId);

const sendAdminMembershipInvoiceEmail = (membershipId, email) => sendMembershipInvoiceEmail(
  membershipId,
  email ? { email } : {}
);

const getAdminClasses = async ({ status = '', subject = '', teacher = '', teacherUserId = '', q = '', page = 1, pageSize = 20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (subject) params.set('subject', subject);
  const resolvedTeacher = teacher || teacherUserId;
  if (resolvedTeacher) {
    params.set('teacher', resolvedTeacher);
    params.set('teacherUserId', resolvedTeacher);
  }
  if (q) params.set('q', q);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await request(`/admin/classes${qs}`);
  return {
    classes: response.classes || [],
    total: Number(response.total ?? response.pagination?.total ?? 0),
    page: Number(response.page ?? response.pagination?.page ?? 1),
    pageSize: Number(response.pageSize ?? response.pagination?.pageSize ?? 20),
    pagination: response.pagination || null
  };
};

const getAdminClassHistory = async (classId) => {
  const response = await request(`/admin/classes/${encodeURIComponent(classId)}/history`);
  const summary = response.attemptSummary || response.aggregates || {
    totalAttempts: 0,
    submittedCount: 0,
    inProgressCount: 0,
    averageScore: 0
  };
  return {
    class: response.class || null,
    auditEvents: response.auditEvents || [],
    attemptSummary: summary,
    aggregates: response.aggregates || summary,
    results: response.results || [],
    pagination: response.pagination || null
  };
};

export {
  confirmAdminMembership,
  createMembershipPlan,
  createRoom,
  deleteHistory,
  deleteRoom,
  deleteTeacher,
  downloadAdminMembershipInvoice,
  getAccessUsers,
  getAdminClasses,
  getAdminClassHistory,
  getAdminMembershipTransactions,
  getHistory,
  getMembershipPlans,
  getPendingTeachers,
  getRooms,
  grantMembership,
  listTeachers,
  sendAdminMembershipInvoiceEmail,
  updateMembershipPlan,
  updateRoom,
  updateTeacherApproval
};
