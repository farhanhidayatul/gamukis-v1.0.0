import { request } from "./manualAuth";

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

export {
  createMembershipPlan,
  createRoom,
  deleteHistory,
  deleteRoom,
  deleteTeacher,
  getAccessUsers,
  getHistory,
  getMembershipPlans,
  getPendingTeachers,
  getRooms,
  grantMembership,
  listTeachers,
  updateMembershipPlan,
  updateRoom,
  updateTeacherApproval
};
