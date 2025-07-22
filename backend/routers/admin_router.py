from datetime import datetime, timedelta
from typing import List, Optional
import io
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from sqlalchemy import func,case
from pydantic import BaseModel
from backend.utils.scoring import compute_total_points

from backend.auth import get_current_user
from backend.config import engine
from backend.routers.lesson_router import _generate_and_store_pdf
from backend.models import (
    User, Role, Courseware, Exercise, Homework, Submission,
    ChatHistory,
    ChatSession,
    ChatMessage,
    Practice,
    LoginEvent,
    Document,
    RequestMetric,
    Class,
    ClassStudent,
)
from backend.services.document_service import (
    save_public_document,
    list_public_documents,
    delete_public_document,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class UserInfo(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class CoursewareMeta(BaseModel):
    id: int
    topic: str
    teacher_id: int
    teacher_username: str
    created_at: datetime

    class Config:
        from_attributes = True


class CoursewarePreview(BaseModel):
    id: int
    topic: str
    teacher_id: int
    teacher_username: str
    markdown: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentInfo(BaseModel):
    id: int
    filename: str
    filepath: str
    is_active: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


@router.get("/users", response_model=List[UserInfo])
def list_users(role: Optional[str] = None, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        stmt = select(User, Role).join(Role, User.role_id == Role.id)
        if role:
            stmt = stmt.where(Role.name == role)
        rows = sess.exec(stmt).all()
        return [UserInfo(id=u.id, username=u.username, role=r.name) for u, r in rows]


@router.get("/users/{uid}", response_model=UserInfo)
def get_user(uid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        user = sess.get(User, uid)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        role = sess.get(Role, user.role_id)
        rname = role.name if role else ""
        return UserInfo(id=user.id, username=user.username, role=rname)


@router.delete("/users/{uid}")
def delete_user(uid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        user = sess.get(User, uid)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        # 删除与用户相关的记录
        for cw in sess.exec(select(Courseware).where(Courseware.teacher_id == uid)):
            sess.delete(cw)
        for ex in sess.exec(select(Exercise).where(Exercise.teacher_id == uid)):
            # 删除作业及提交
            for hw in sess.exec(select(Homework).where(Homework.exercise_id == ex.id)):
                for sub in sess.exec(select(Submission).where(Submission.homework_id == hw.id)):
                    sess.delete(sub)
                sess.delete(hw)
            sess.delete(ex)
        for sub in sess.exec(select(Submission).where(Submission.student_id == uid)):
            sess.delete(sub)
        for ch in sess.exec(select(ChatHistory).where(ChatHistory.student_id == uid)):
            sess.delete(ch)
        for s in sess.exec(select(ChatSession).where(ChatSession.student_id == uid)):
            for m in sess.exec(select(ChatMessage).where(ChatMessage.session_id == s.id)):
                sess.delete(m)
            sess.delete(s)
        for p in sess.exec(select(Practice).where(Practice.student_id == uid)):
            sess.delete(p)
        sess.delete(user)
        sess.commit()
        return {"status": "ok"}


@router.get("/coursewares", response_model=List[CoursewareMeta])
def list_coursewares(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        stmt = select(Courseware, User).join(User, Courseware.teacher_id == User.id)
        rows = sess.exec(stmt).all()
        return [
            CoursewareMeta(
                id=c.id,
                topic=c.topic,
                teacher_id=c.teacher_id,
                teacher_username=u.username,
                created_at=c.created_at,
            )
            for c, u in rows
        ]


@router.post("/courseware/{cid}/share")
def share_courseware(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        teachers = sess.exec(select(User).join(Role).where(Role.name == "teacher")).all()
        for t in teachers:
            topic = f"{cw.topic}-public"
            new_cw = Courseware(
                teacher_id=t.id,
                topic=topic,
                markdown=cw.markdown,
                pdf=cw.pdf
            )
            sess.add(new_cw)
        sess.commit()
        return {"status": "shared"}


@router.get("/courseware/{cid}/preview", response_model=CoursewarePreview)
def preview_courseware(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        teacher = sess.get(User, cw.teacher_id)
        return CoursewarePreview(
            id=cw.id,
            topic=cw.topic,
            teacher_id=cw.teacher_id,
            teacher_username=teacher.username if teacher else "",
            markdown=cw.markdown,
            created_at=cw.created_at,
        )


@router.get("/courseware/{cid}/download")
def download_courseware(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        if not cw.pdf:
            _generate_and_store_pdf(cw.id, cw.markdown)
            sess.refresh(cw)
        raw_name = f"lesson_{cw.topic}.pdf"
        fallback = "lesson.pdf"
        quoted = quote(raw_name, safe="")
        headers = {"Content-Disposition": f"attachment; filename={fallback}; filename*=UTF-8''{quoted}"}
        return StreamingResponse(io.BytesIO(cw.pdf), media_type="application/pdf", headers=headers)


class CoursewareUpdate(BaseModel):
    markdown: str


@router.post("/courseware/{cid}/update", response_model=CoursewareMeta)
def update_courseware(cid: int, data: CoursewareUpdate, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        cw.markdown = data.markdown
        cw.prep_start = cw.prep_start or datetime.utcnow()
        cw.prep_end = datetime.utcnow()
        sess.add(cw)
        sess.commit()
        _generate_and_store_pdf(cw.id, cw.markdown)
        teacher = sess.get(User, cw.teacher_id)
        return CoursewareMeta(
            id=cw.id,
            topic=cw.topic,
            teacher_id=cw.teacher_id,
            teacher_username=teacher.username if teacher else "",
            created_at=cw.created_at,
        )


@router.get("/public_docs", response_model=List[DocumentInfo])
def list_public_docs(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    docs = list_public_documents(current.id)
    return [
        DocumentInfo(
            id=d.id,
            filename=d.filename,
            filepath=d.filepath,
            is_active=d.is_active,
            uploaded_at=d.uploaded_at,
        )
        for d in docs
    ]


@router.post("/public_docs")
async def upload_public_doc(
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员上传")
    data = await file.read()
    try:
        doc = save_public_document(current.id, file.filename, data)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return DocumentInfo(
        id=doc.id,
        filename=doc.filename,
        filepath=doc.filepath,
        is_active=doc.is_active,
        uploaded_at=doc.uploaded_at,
    )


@router.delete("/public_docs/{doc_id}")
def delete_public_doc(doc_id: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    ok = delete_public_document(doc_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在")
    return {"status": "ok"}

@router.get("/dashboard")
def dashboard(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")

    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    with Session(engine) as sess:
        teacher_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "teacher")
        ).one()
        student_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "student")
        ).one()
        cw_count = sess.exec(select(func.count()).select_from(Courseware)).one()
        ex_count = sess.exec(select(func.count()).select_from(Exercise)).one()

        # --- User activity metrics ---
        daily_rows = sess.exec(
            select(
                func.date(LoginEvent.created_at),
                Role.name,
                func.count(func.distinct(LoginEvent.user_id)),
            )
            .join(User, User.id == LoginEvent.user_id)
            .join(Role, User.role_id == Role.id)
            .where(LoginEvent.created_at >= month_ago)
            .group_by(func.date(LoginEvent.created_at), Role.name)
            .order_by(func.date(LoginEvent.created_at))
        ).all()
        trend = {}
        for d, r, c in daily_rows:
            key = str(d)
            trend.setdefault(key, {"teacher": 0, "student": 0})
            if r == "teacher":
                trend[key]["teacher"] = c
            else:
                trend[key]["student"] = c

        dau = sess.exec(
            select(func.count(func.distinct(LoginEvent.user_id))).where(
                LoginEvent.created_at >= today
            )
        ).one()
        wau = sess.exec(
            select(func.count(func.distinct(LoginEvent.user_id))).where(
                LoginEvent.created_at >= week_ago
            )
        ).one()
        mau = sess.exec(
            select(func.count(func.distinct(LoginEvent.user_id))).where(
                LoginEvent.created_at >= month_ago
            )
        ).one()

        ratio_rows = sess.exec(
            select(Role.name, func.count(func.distinct(LoginEvent.user_id)))
            .join(User, User.id == LoginEvent.user_id)
            .join(Role, User.role_id == Role.id)
            .where(LoginEvent.created_at >= today)
            .group_by(Role.name)
        ).all()
        t_active = 0
        s_active = 0
        for r, c in ratio_rows:
            if r == "teacher":
                t_active = c
            elif r == "student":
                s_active = c
        ratio = {"teacher": t_active, "student": s_active}

        # --- Learning efficiency ---
        sub_rows = sess.exec(
            select(Homework.assigned_at, Submission.submitted_at)
            .join(Submission, Submission.homework_id == Homework.id)
            .where(Submission.status == "completed")
        ).all()
        times = [
            (sub - assign).total_seconds() / 3600
            for assign, sub in sub_rows
            if sub >= assign
        ]
        avg_completion = sum(times) / len(times) if times else 0.0

        # --- Homework completion rate ---
        hw_total = sess.exec(select(func.count()).select_from(Homework)).one()
        sub_total = sess.exec(
            select(func.count())
            .select_from(Submission)
            .where(Submission.status == "completed")
        ).one()
        completion_rate = sub_total / hw_total if hw_total else 0

        # --- Score distribution ---
        score_rows = sess.exec(
            select(Submission.score, Exercise)
            .join(Homework, Submission.homework_id == Homework.id)
            .join(Exercise, Homework.exercise_id == Exercise.id)
            .where(Submission.status == "completed")
        ).all()
        dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
        for score, ex in score_rows:
            total = compute_total_points(ex)
            ratio = score / total if total else 0
            if ratio >= 0.9:
                dist["A"] += 1
            elif ratio >= 0.8:
                dist["B"] += 1
            elif ratio >= 0.7:
                dist["C"] += 1
            elif ratio >= 0.6:
                dist["D"] += 1
            else:
                dist["F"] += 1

        # --- Subject mastery ---
        rows = sess.exec(
            select(Submission, Exercise)
            .join(Homework, Submission.homework_id == Homework.id)
            .join(Exercise, Homework.exercise_id == Exercise.id)
            .where(Submission.status == "completed")
        ).all()
        subj_map = {}
        for sub, ex in rows:
            total = compute_total_points(ex)
            entry = subj_map.setdefault(ex.subject or "未知", {"score": 0.0, "total": 0.0})
            entry["score"] += sub.score
            entry["total"] += total
        mastery = {
            k: (v["score"] / v["total"] if v["total"] else 0.0)
            for k, v in subj_map.items()
        }

        # --- Courseware production ---
        cw_rows = sess.exec(select(Courseware.created_at)).all()
        cw_week = {}
        cw_day = {}
        for row in cw_rows:
            dt = row[0] if isinstance(row, tuple) else row
            wk = dt.strftime("%Y-%W")
            day = dt.strftime("%Y-%m-%d")
            cw_week[wk] = cw_week.get(wk, 0) + 1
            cw_day[day] = cw_day.get(day, 0) + 1

        # --- Question type distribution ---
        qtype_counts = {}
        ex_rows = sess.exec(select(Exercise.prompt)).all()
        for row in ex_rows:
            prompt = row[0] if isinstance(row, tuple) else row
            for block in prompt or []:
                t = block.get("type")
                items = block.get("items", [])
                qtype_counts[t] = qtype_counts.get(t, 0) + len(items)

        # --- System performance ---
        perf_rows = sess.exec(
            select(
                func.avg(RequestMetric.duration_ms),
                func.sum(case((RequestMetric.status_code >= 500, 1), else_=0)),
                func.count(),
            )
            .where(RequestMetric.created_at >= week_ago)
        ).one()
        avg_response = perf_rows[0] or 0.0
        errors = perf_rows[1] or 0
        total_req = perf_rows[2] or 1
        error_rate = errors / total_req if total_req else 0

    trend_list = [
        {"date": d, "teacher": v["teacher"], "student": v["student"]}
        for d, v in sorted(trend.items())
    ]

    return {
        "counts": {
            "teacher": teacher_count,
            "student": student_count,
            "courseware": cw_count,
            "exercise": ex_count,
        },
        "activity": {
            "trend": trend_list,
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "ratio": ratio,
        },
        "learning": {"avg_completion_hours": avg_completion},
        "homework": {
            "completion_rate": completion_rate,
            "score_dist": dist,
            "mastery": mastery,
        },
        "courseware_prod": {"week": cw_week, "day": cw_day, "qtype": qtype_counts},
        "system": {"avg_response_ms": avg_response, "error_rate": error_rate},
    }


@router.get("/real_time_online")
def real_time_online(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")

    today = datetime.utcnow().date()
    with Session(engine) as sess:
        rows = (
            sess.exec(
                select(Role.name, func.count(func.distinct(LoginEvent.user_id)))
                .join(User, User.id == LoginEvent.user_id)
                .join(Role, User.role_id == Role.id)
                .where(LoginEvent.created_at >= today)
                .group_by(Role.name)
            ).all()
        )
        teachers = 0
        students = 0
        for r, c in rows:
            if r == "teacher":
                teachers = c
            elif r == "student":
                students = c
    return {"teachers": teachers, "students": students}


@router.get("/participation_rates")
def participation_rates(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")

    with Session(engine) as sess:
        hw_total = sess.exec(select(func.count()).select_from(Homework)).one()
        sub_total = sess.exec(
            select(func.count())
            .select_from(Submission)
            .where(Submission.status == "completed")
        ).one()
        assignment_rate = sub_total / hw_total if hw_total else 0

        student_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "student")
        ).one()
        practice_students = sess.exec(
            select(func.count(func.distinct(Practice.student_id)))
        ).one()
        exercise_rate = practice_students / student_count if student_count else 0

    return {
        "assignmentParticipationRate": assignment_rate,
        "exerciseParticipationRate": exercise_rate,
    }


@router.get("/performance_metrics")
def performance_metrics(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")

    week_ago = datetime.utcnow() - timedelta(days=7)
    with Session(engine) as sess:
        avg_dur, err_cnt, total = (
            sess.exec(
                select(
                    func.avg(RequestMetric.duration_ms),
                    func.sum(case((RequestMetric.status_code >= 400, 1), else_=0)),
                    func.count(),
                ).where(RequestMetric.created_at >= week_ago)
            ).one()
        )
    avg_load = avg_dur or 0.0
    total = total or 1
    error_rate = (err_cnt or 0) / total
    return {"averageLoadTime": avg_load, "averageErrorRate": error_rate}


@router.get("/teacher_stats")
def teacher_stats(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")

    with Session(engine) as sess:
        teacher_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "teacher")
        ).one()
        student_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "student")
        ).one()
        cw_count = sess.exec(select(func.count()).select_from(Courseware)).one()
        ex_count = sess.exec(select(func.count()).select_from(Exercise)).one()
        class_count = sess.exec(select(func.count()).select_from(Class)).one()

        dist_rows = (
            sess.exec(
                select(Class.name, func.count(ClassStudent.student_id))
                .join(ClassStudent, ClassStudent.class_id == Class.id, isouter=True)
                .group_by(Class.id)
            ).all()
        )
        distribution = {name: count for name, count in dist_rows}

    return {
        "teacherCount": teacher_count,
        "studentCount": student_count,
        "coursewareCount": cw_count,
        "exerciseCount": ex_count,
        "classCount": class_count,
        "classDistribution": distribution,
    }


@router.get("/new_course_trend")
def new_course_trend(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")

    today = datetime.utcnow().date()
    start = today - timedelta(days=13)
    with Session(engine) as sess:
        cw_rows = (
            sess.exec(
                select(func.date(Courseware.created_at), func.count())
                .where(Courseware.created_at >= start)
                .group_by(func.date(Courseware.created_at))
            ).all()
        )
        ex_rows = (
            sess.exec(
                select(func.date(Exercise.created_at), func.count())
                .where(Exercise.created_at >= start)
                .group_by(func.date(Exercise.created_at))
            ).all()
        )

    cw_map = {str(d): c for d, c in cw_rows}
    ex_map = {str(d): c for d, c in ex_rows}
    labels = []
    cw_list = []
    ex_list = []
    for i in range(14):
        day = start + timedelta(days=i)
        key = str(day)
        labels.append(key)
        cw_list.append(cw_map.get(key, 0))
        ex_list.append(ex_map.get(key, 0))
    return {"labels": labels, "course": cw_list, "exercise": ex_list}

