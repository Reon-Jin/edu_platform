import api from './api';

export async function fetchUsers(role) {
  const resp = await api.get('/admin/users', { params: { role } });
  return resp.data;
}

export async function fetchUser(uid) {
  const resp = await api.get(`/admin/users/${uid}`);
  return resp.data;
}

export async function deleteUser(uid) {
  const resp = await api.delete(`/admin/users/${uid}`);
  return resp.data;
}

export async function fetchCoursewares() {
  const resp = await api.get('/admin/coursewares');
  return resp.data;
}

export async function shareCourseware(cid) {
  const resp = await api.post(`/admin/courseware/${cid}/share`);
  return resp.data;
}

export async function fetchDashboard() {
  const resp = await api.get('/admin/dashboard');
  return resp.data;
}
