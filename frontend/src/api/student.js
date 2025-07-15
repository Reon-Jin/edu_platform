import api from "./api";

export async function askAi(question) {
  const resp = await api.post("/student/ai/ask", { question });
  return resp.data;
}

export async function fetchChatHistory() {
  const resp = await api.get("/student/ai/history");
  return resp.data;
}

export async function generateSelfPractice(params) {
  const resp = await api.post("/student/self_practice/generate", params);
  return resp.data;
}

export async function fetchSelfPracticeList() {
  const resp = await api.get("/student/self_practice/list");
  return resp.data;
}

export async function getSelfPractice(id) {
  const resp = await api.get(`/student/self_practice/${id}`);
  return resp.data;
}

export async function downloadSelfPracticePdf(id) {
  const resp = await api.get(`/student/self_practice/${id}/download`, {
    responseType: "blob",
  });
  return resp.data;
}

export async function fetchStudentAnalysis() {
  const resp = await api.get("/student/analysis");
  return resp.data;
}

// ------ Class APIs ------

export async function fetchMyClasses() {
  const resp = await api.get('/classes/student');
  return resp.data;
}

export async function joinClass(classId) {
  await api.post('/classes/student/join', { class_id: classId });
}

export async function fetchStudentClass(cid) {
  const resp = await api.get(`/classes/student/${cid}`);
  return resp.data;
}

export async function leaveClass(cid) {
  await api.delete(`/classes/student/${cid}`);
}
