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

const deleteRoom = (roomId) => request(`/admin/rooms/${encodeURIComponent(roomId)}`, {
  method: 'DELETE'
});

const getMembershipPlans = async () => {
  const response = await request('/memberships/admin/plans');
  return response.plans || [];
};

const updateMembershipPlan = (planId, changes) => request(
  `/memberships/admin/plans/${encodeURIComponent(planId)}`,
  { method: 'PATCH', body: JSON.stringify(changes) }
);

const getAccessUsers = async () => {
  const response = await request('/access/users');
  return response.users || [];
};

const grantMembership = ({ authType, userId, planCode }) => request('/memberships/admin/grant', {
  method: 'POST',
  body: JSON.stringify({ authType, userId, planCode })
});

export {
  createRoom,
  deleteRoom,
  getAccessUsers,
  getHistory,
  getMembershipPlans,
  getPendingTeachers,
  getRooms,
  grantMembership,
  updateMembershipPlan,
  updateTeacherApproval
};
