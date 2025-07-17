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
 * @param {{ topic: string, num_single_choice: number, num_multiple_choice: number, num_fill_blank: number, num_short_answer: number, num_programming: number }} params
 * @returns {Promise<{ topic: string, questions: any[], answers: any }>}
 */
export async function generateExerciseJson({
  topic,
  num_single_choice,
  num_multiple_choice,
  num_fill_blank,
  num_short_answer,
  num_programming,
}) {
  const resp = await api.post("/teacher/exercise/generate", {
    topic,
    num_single_choice,
    num_multiple_choice,
    num_fill_blank,
    num_short_answer,
    num_programming,
    export_pdf: false,
  });
  return resp.data;
}

/**
 * 下载练习题 PDF
 * @param {{ topic: string, num_single_choice: number, num_multiple_choice: number, num_fill_blank: number, num_short_answer: number, num_programming: number }} params
 * @returns {Promise<Blob>}
 */
export async function downloadExercisePdf({
  topic,
  num_single_choice,
  num_multiple_choice,
  num_fill_blank,
  num_short_answer,
  num_programming,
}) {
  const resp = await api.post(
    "/teacher/exercise/generate",
    {
      topic,
      num_single_choice,
      num_multiple_choice,
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

export async function assignExerciseToClass(exerciseId, classId) {
  await api.post(`/teacher/exercise/${exerciseId}/assign`, { class_id: classId });
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

/**
 * 保存练习（不布置）
 * @param {{topic: string, questions: any[], answers: any}} data
 * @returns {Promise<{id: number}>}
 */
export async function saveExercise({ topic, questions, answers, points }) {
  const resp = await api.post("/teacher/exercise/save", {
    topic,
    questions,
    answers,
    points,
  });
  return resp.data;
}

/**
 * 保存练习并布置作业
 * @param {{topic: string, questions: any[], answers: any}} data
 * @returns {Promise<any>} 作业信息
 */
export async function saveAndAssignExercise({ topic, questions, answers, points, classId }) {
  const resp = await api.post("/teacher/exercise/save_and_assign", {
    topic,
    questions,
    answers,
    points,
    class_id: classId,
  });
  return resp.data;
}

/**
 * 获取练习列表
 * @returns {Promise<Array>}
 */
export async function fetchExerciseList() {
  const resp = await api.get("/teacher/exercise/list");
  return resp.data;
}

/**
 * 获取练习预览详情
 * @param {number} exId
 * @returns {Promise<any>}
 */
export async function fetchExercisePreview(exId) {
  const resp = await api.get(`/teacher/exercise/preview/${exId}`);
  return resp.data;
}

/**
 * 下载练习题目 PDF
 * @param {number} exId
 * @returns {Promise<Blob>}
 */
export async function downloadQuestionsPdf(exId) {
  const resp = await api.get(
    `/teacher/exercise/${exId}/download/questions`,
    { responseType: "blob" }
  );
  return resp.data;
}

/**
 * 下载练习答案 PDF
 * @param {number} exId
 * @returns {Promise<Blob>}
 */
export async function downloadAnswersPdf(exId) {
  const resp = await api.get(
    `/teacher/exercise/${exId}/download/answers`,
    { responseType: "blob" }
  );
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
 * 更新课件内容
 * @param {number} cw_id
 * @param {string} markdown
 * @returns {Promise<Object>}
 */
export async function updateCourseware(cw_id, markdown) {
  const resp = await api.post(`/teacher/lesson/update/${cw_id}`, { markdown });
  return resp.data;
}

/** 列出所有学生 */
export async function fetchStudentList() {
  const resp = await api.get('/teacher/students');
  return resp.data;
}

/** 获取学生学情分析 */
export async function fetchStudentAnalysis(sid, classId) {
  const url = classId
    ? `/teacher/students/${sid}/analysis?class_id=${classId}`
    : `/teacher/students/${sid}/analysis`;
  const resp = await api.get(url);
  return resp.data;
}

/** 获取学生已完成练习列表 */
export async function fetchStudentHomeworks(sid, classId) {
  const url = classId
    ? `/teacher/students/${sid}/homeworks?class_id=${classId}`
    : `/teacher/students/${sid}/homeworks`;
  const resp = await api.get(url);
  return resp.data;
}

/** 获取某次作业详情 */
export async function fetchStudentHomeworkDetail(sid, hwId) {
  const resp = await api.get(`/teacher/students/${sid}/homework/${hwId}`);
  return resp.data;
}

// ----- Class management -----

/** 创建班级 */
export async function createClass(data) {
  const resp = await api.post('/classes/teacher', data);
  return resp.data;
}

/** 列出教师班级 */
export async function fetchTeacherClasses() {
  const resp = await api.get('/classes/teacher');
  return resp.data;
}

/** 获取班级详情 */
export async function fetchTeacherClass(cid) {
  const resp = await api.get(`/classes/teacher/${cid}`);
  return resp.data;
}

/** 删除班级中的学生 */
export async function removeStudent(cid, sid) {
  await api.delete(`/classes/teacher/${cid}/student/${sid}`);
}

/** 解散班级 */
export async function deleteClass(cid) {
  await api.delete(`/classes/teacher/${cid}`);
}

// ----- Document management -----
export async function uploadDocument(file, isPublic = false, onProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('is_public', isPublic);
  const resp = await api.post('/docs/', form, {
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      const percent = Math.round((e.loaded * 100) / e.total);
      onProgress(percent);
    },
  });
  return resp.data;
}

export async function fetchMyDocuments() {
  const resp = await api.get('/docs/', { params: { scope: 'my' } });
  return resp.data;
}

export async function fetchPublicDocuments() {
  const resp = await api.get('/docs/', { params: { scope: 'public' } });
  return resp.data;
}

export async function setDocumentActive(id, isActive) {
  const resp = await api.patch(`/docs/${id}/activate`, { is_active: isActive });
  return resp.data;
}

export async function deleteDocument(id) {
  await api.delete(`/docs/${id}`);
}
