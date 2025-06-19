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
