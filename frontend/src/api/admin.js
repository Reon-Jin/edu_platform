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

export async function downloadCourseware(cid) {
  const resp = await api.get(`/admin/courseware/${cid}/download`, { responseType: 'blob' });
  return resp.data;
}

export async function fetchCoursewarePreview(cid) {
  const resp = await api.get(`/admin/courseware/${cid}/preview`);
  return resp.data;
}

export async function updateCourseware(cid, markdown) {
  const resp = await api.post(`/admin/courseware/${cid}/update`, { markdown });
  return resp.data;
}

export async function fetchDashboard() {
  const resp = await api.get('/admin/dashboard');
  return resp.data;
}

// ----- Public document management -----
export async function uploadPublicDoc(file) {
  const form = new FormData();
  form.append('file', file);
  const resp = await api.post('/admin/public_docs', form);
  return resp.data;
}

export async function fetchPublicDocs() {
  const resp = await api.get('/admin/public_docs');
  return resp.data;
}

export async function deletePublicDoc(id) {
  await api.delete(`/admin/public_docs/${id}`);
}
