import api from "./api";

// 获取学生的作业列表
export async function fetchHomeworkList() {
  const resp = await api.get("/student/homeworks");
  return resp.data;
}

// 获取作业题目详情
export async function fetchHomework(hwId) {
  const resp = await api.get(`/student/homeworks/${hwId}`);
  return resp.data;
}

// 提交作业答案
export async function submitHomework(hwId, answers) {
  const resp = await api.post(`/student/homeworks/${hwId}/submit`, { answers });
  return resp.data;
}

// 获取作业批改结果
export async function fetchHomeworkResult(hwId) {
  const resp = await api.get(`/student/homeworks/${hwId}/result`);
  return resp.data;
}
