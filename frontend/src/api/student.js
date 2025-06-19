import api from "./api";

export async function askAi(question) {
  const resp = await api.post("/student/ai/ask", { question });
  return resp.data;
}

export async function fetchChatHistory() {
  const resp = await api.get("/student/ai/history");
  return resp.data;
}

export async function generateSelfPractice(requirement) {
  const resp = await api.post("/student/self_practice/generate", { requirement });
  return resp.data;
}

export async function fetchSelfPracticeList() {
  const resp = await api.get("/student/self_practice/list");
  return resp.data;
}

export async function submitSelfPractice(id, answers) {
  const resp = await api.post(`/student/self_practice/${id}/submit`, { answers });
  return resp.data;
}
