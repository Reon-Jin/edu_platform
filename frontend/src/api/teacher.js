// src/api/teacher.js
import api from "./api";

/**
 * 生成教案（Markdown）
 * @param {{ topic: string }} params
 * @returns {Promise<string>} Markdown 文本
 */
export async function prepareLessonMarkdown({ topic }) {
  const resp = await api.post("/teacher/lesson/prepare", {
    topic,
    export_pdf: false,
  });
  return resp.data.markdown;
}

/**
 * 保存教案
 * @param {{ topic: string }} params
 * @returns {Promise<{ id: number, topic: string }>} 返回保存的课件信息（包含课件 ID）
 */
export async function saveCourseware({ topic }) {
  const resp = await api.post("/teacher/lesson/save", { topic });
  return resp.data;  // 返回课件信息，包括 id
}


// src/api/teacher.js

/**
 * 获取并下载课件的 PDF
 * @param {number} cw_id - 课件 ID
 * @returns {Promise<Blob>} PDF 二进制内容
 */
export async function downloadCoursewarePdf(cw_id) {
  const resp = await api.get(`/teacher/lesson/export_pdf/${cw_id}`, {
    responseType: "blob", // 确保返回的是 PDF 二进制
  });
  return resp.data;
}


/**
 * 生成练习题（JSON）
 * @param {{ topic: string, num_mcq: number, num_fill_blank: number, num_short_answer: number, num_programming: number }} params
 * @returns {Promise<{ exercise_id: number, questions: any[], answers: any }>}
 */
export async function generateExerciseJson({
  topic,
  num_mcq,
  num_fill_blank,
  num_short_answer,
  num_programming,
}) {
  const resp = await api.post("/teacher/generate", {
    topic,
    num_mcq,
    num_fill_blank,
    num_short_answer,
    num_programming,
    export_pdf: false,
  });
  return resp.data;
}

/**
 * 下载练习题 PDF
 * @param {{ topic: string, num_mcq: number, num_fill_blank: number, num_short_answer: number, num_programming: number }} params
 * @returns {Promise<Blob>}
 */
export async function downloadExercisePdf({
  topic,
  num_mcq,
  num_fill_blank,
  num_short_answer,
  num_programming,
}) {
  const resp = await api.post(
    "/teacher/generate",
    {
      topic,
      num_mcq,
      num_fill_blank,
      num_short_answer,
      num_programming,
      export_pdf: true,
    },
    { responseType: "blob" }
  );
  return resp.data;
}

/**
 * 布置作业
 * POST /teacher/exercise/{ex_id}/assign
 * @param {number} exerciseId
 */
export async function assignExercise(exerciseId) {
  await api.post(`/teacher/exercise/${exerciseId}/assign`);
}

/**
 * 获取作业统计
 * GET /teacher/exercise/{ex_id}/stats
 * @param {number} exerciseId
 * @returns {Promise<any>}
 */
export async function fetchExerciseStats(exerciseId) {
  const resp = await api.get(`/teacher/exercise/${exerciseId}/stats`);
  return resp.data;
}

// src/api/teacher.js

/**
 * 获取教案列表
 * @returns {Promise<Array>} 课件列表
 */
export async function fetchLessonList() {
  const resp = await api.get("/teacher/lesson/list");
  return resp.data;  // 返回课程数据列表
}

/**
 * 获取教案预览
 * @param {number} cw_id - 课件 ID
 * @returns {Promise<Object>} 返回教案的详细信息
 */
export async function fetchLessonPreview(cw_id) {
  const resp = await api.get(`/teacher/lesson/preview/${cw_id}`);
  return resp.data;  // 返回课件详细信息
}

/**
 * 获取练习列表
 * @returns {Promise<Array>} 练习列表
 */
export async function fetchExerciseList() {
  const resp = await api.get("/teacher/exercise/list");
  return resp.data;
}

/**
 * 获取练习预览
 * @param {number} ex_id - 练习 ID
 * @returns {Promise<Object>} 练习详细信息
 */
export async function fetchExercisePreview(ex_id) {
  const resp = await api.get(`/teacher/exercise/preview/${ex_id}`);
  return resp.data;
}

/**
 * 下载已保存练习的题目 PDF
 * @param {number} ex_id - 练习 ID
 * @returns {Promise<Blob>} PDF 二进制
 */
export async function downloadExerciseQuestionsPdf(ex_id) {
  const resp = await api.get(`/teacher/exercise/${ex_id}/download/questions`, {
    responseType: "blob",
  });
  return resp.data;
}

/**
 * 下载已保存练习的答案 PDF
 * @param {number} ex_id - 练习 ID
 * @returns {Promise<Blob>} PDF 二进制
 */
export async function downloadExerciseAnswersPdf(ex_id) {
  const resp = await api.get(`/teacher/exercise/${ex_id}/download/answers`, {
    responseType: "blob",
  });
  return resp.data;
}
