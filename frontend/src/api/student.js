import api from "./api";

export async function askAi(question) {
  const resp = await api.post("/student/ai/ask", { question });
  return resp.data;
}

export async function fetchChatHistory() {
  const resp = await api.get("/student/ai/history");
  return resp.data;
}

export async function generatePractice(requirement) {
  const resp = await api.post("/student/practice/generate", { requirement });
  return resp.data;
}

export async function fetchPracticeList() {
  const resp = await api.get("/student/practice/list");
  return resp.data;
}

export async function submitPractice(id, answers) {
  const resp = await api.post(`/student/practice/${id}/submit`, { answers });
  return resp.data;
}
