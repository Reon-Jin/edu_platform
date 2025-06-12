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
 * 下载教案 PDF
 * @param {{ topic: string }} params
 * @returns {Promise<Blob>} PDF 二进制
 */
export async function downloadLessonPdf({ topic }) {
  const resp = await api.post(
    "/teacher/lesson/prepare",
    { topic, export_pdf: true },
    { responseType: "blob" }
  );
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
