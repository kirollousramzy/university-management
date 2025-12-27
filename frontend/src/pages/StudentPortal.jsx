import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const CREDIT_MIN = 6;
const CREDIT_MAX = 18;
const COURSE_MAX = 6;
const ACTIVE_STATUSES = ["enrolled", "waitlisted"];

const StudentPortal = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseAction, setCourseAction] = useState({
    loading: false,
    message: "",
    error: "",
  });
  const [creditStatus, setCreditStatus] = useState("ok");

  useEffect(() => {
    const studentId = user?.studentId;
    if (!studentId) {
      setError("No student record linked to this account.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentData, enrollmentData, courseData] = await Promise.all([
          api.getStudent(studentId),
          api.getEnrollments(),
          api.getCourses(),
        ]);
        setProfile(studentData);
        setEnrollments(
          enrollmentData.filter((record) => record.studentId === studentId)
        );
        setCourses(courseData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.studentId]);

  const activeEnrollments = enrollments.filter((record) =>
    ACTIVE_STATUSES.includes(record.status)
  );
  const enrolledCourses = activeEnrollments.filter(
    (record) => record.status === "enrolled"
  );
  const waitlistedCourses = activeEnrollments.filter(
    (record) => record.status === "waitlisted"
  );
  const enrolledCourseIds = new Set(
    activeEnrollments
      .map((record) => record.courseId || record.course?.id)
      .filter(Boolean)
  );
  const totalCourses = activeEnrollments.length;
  const computeTotalCredits = (records) =>
    records.reduce((sum, record) => {
      const courseId = record.courseId || record.course?.id;
      const credits = getCourseCredits(courseId, record.course);
      return sum + credits;
    }, 0);
  const getCourseCredits = (courseId, fallbackCourse) => {
    const directCredits = fallbackCourse?.credits;
    if (directCredits !== undefined) {
      return Number(directCredits) || 0;
    }
    const match = courses.find((course) => course.id === courseId);
    return Number(match?.credits) || 0;
  };
  const computeGpa = (records) => {
    const totals = records.reduce(
      (acc, record) => {
        const published = record.gradePublished ?? true;
        if (
          !published ||
          record.gradePoints === null ||
          record.gradePoints === undefined
        )
          return acc;
        const credits = getCourseCredits(
          record.courseId || record.course?.id,
          record.course
        );
        acc.points += record.gradePoints * credits;
        acc.credits += credits;
        return acc;
      },
      { points: 0, credits: 0 }
    );
    if (totals.credits === 0) return null;
    return Number((totals.points / totals.credits).toFixed(2));
  };
  const totalCredits = computeTotalCredits(activeEnrollments);
  const computedGpa = computeGpa(activeEnrollments);
  const remainingToMax = Math.max(CREDIT_MAX - totalCredits, 0);
  const creditsBelowMin = Math.max(CREDIT_MIN - totalCredits, 0);
  const creditStatusText =
    totalCredits > CREDIT_MAX
      ? `Over by ${totalCredits - CREDIT_MAX} credits`
      : creditsBelowMin > 0
      ? `${creditsBelowMin} credits below minimum`
      : "Within limit";
  useEffect(() => {
    const nextStatus =
      totalCredits < CREDIT_MIN
        ? "under"
        : totalCredits > CREDIT_MAX
        ? "over"
        : "ok";
    if (nextStatus !== creditStatus && nextStatus !== "ok") {
      window.alert(
        `Credit load must stay between ${CREDIT_MIN} and ${CREDIT_MAX} credits. Current total: ${totalCredits}.`
      );
    }
    setCreditStatus(nextStatus);
  }, [totalCredits, creditStatus]);

  if (loading) {
    return <section className="panel">Loading your portal...</section>;
  }

  if (error) {
    return (
      <section className="panel panel--error">
        <p>{error}</p>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  const handleRequestEnrollment = async (courseId) => {
    if (!user?.studentId) {
      setError("No student record linked to this account.");
      return;
    }

    if (totalCourses >= COURSE_MAX) {
      const message = `You can register a maximum of ${COURSE_MAX} courses.`;
      setCourseAction({
        loading: false,
        message: "",
        error: message,
      });
      window.alert(message);
      return;
    }

    const course = courses.find((item) => item.id === courseId);
    if (!course) {
      setCourseAction({
        loading: false,
        message: "",
        error: "Course not found.",
      });
      return;
    }

    const courseCredits = getCourseCredits(courseId, course);
    const projectedCredits = totalCredits + courseCredits;
    if (projectedCredits > CREDIT_MAX) {
      const message = `Adding ${course.code} would exceed the ${CREDIT_MAX}-credit limit (total would be ${projectedCredits}).`;
      setCourseAction({
        loading: false,
        message: "",
        error: message,
      });
      window.alert(message);
      return;
    }

    setCourseAction({ loading: true, message: "", error: "" });
    try {
      await api.createEnrollment({ studentId: user.studentId, courseId });
      const enrollmentData = await api.getEnrollments();
      const studentEnrollments = enrollmentData.filter(
        (record) => record.studentId === user.studentId
      );
      setEnrollments(studentEnrollments);
      const updatedCredits = computeTotalCredits(studentEnrollments);
      if (updatedCredits < CREDIT_MIN || updatedCredits > CREDIT_MAX) {
        window.alert(
          `Credit load is outside the ${CREDIT_MIN}-${CREDIT_MAX} range. Current total: ${updatedCredits} credits.`
        );
      }
      setCourseAction({
        loading: false,
        message: "Enrollment request recorded.",
        error: "",
      });
    } catch (err) {
      setCourseAction({ loading: false, message: "", error: err.message });
    }
  };

  return (
    <div className="stack gap-lg">
      <div className="grid two-col">
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Student profile</p>
              <h2>{profile.name}</h2>
            </div>
            <span
              className={`badge badge--${
                profile.status === "active" ? "success" : "warn"
              }`}
            >
              {profile.status}
            </span>
          </div>
          <dl className="profile-grid">
            <div>
              <dt>Major</dt>
              <dd>{profile.major}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{profile.year || "N/A"}</dd>
            </div>

            <div>
              <dt>Advisor</dt>
              <dd>{profile.advisor}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>GPA</dt>
              <dd>{computedGpa ?? profile.gpa ?? "0"}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Academic progress</p>
              <h3>Current Term</h3>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-card__label">Active Courses</p>
              <p className="stat-card__value">{enrolledCourses.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Waitlisted</p>
              <p className="stat-card__value">{waitlistedCourses.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">
                Total Courses (max {COURSE_MAX})
              </p>
              <p className="stat-card__value">{totalCourses}</p>
              <p className="muted-text">
                {totalCourses >= COURSE_MAX
                  ? "Reached course limit"
                  : `${COURSE_MAX - totalCourses} slots left`}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Standing</p>
              <p className="stat-card__value">
                {profile.status === "active" ? "Good" : "On Hold"}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Credits (6 - 18)</p>
              <p className="stat-card__value">{totalCredits}</p>
              <p className="muted-text">{creditStatusText}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Courses</p>
            <h3>Available Courses</h3>
            <p className="muted-text">
              Limits: up to {COURSE_MAX} courses and {CREDIT_MIN}-{CREDIT_MAX}{" "}
              credits. Remaining credits before max: {remainingToMax}
            </p>
          </div>
          {courseAction.message && (
            <p className="muted-text">{courseAction.message}</p>
          )}
          {courseAction.error && (
            <p className="error-text">{courseAction.error}</p>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Credits</th>
                <th>Instructor</th>
                <th>Schedule</th>
                <th>Grade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const alreadyRegistered = enrolledCourseIds.has(course.id);
                const exceedsCreditLimit =
                  totalCredits + getCourseCredits(course.id, course) >
                  CREDIT_MAX;
                const exceedsCourseLimit = totalCourses >= COURSE_MAX;
                const buttonDisabled =
                  alreadyRegistered ||
                  courseAction.loading ||
                  exceedsCreditLimit ||
                  exceedsCourseLimit;
                return (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.code}</strong>
                      <p className="muted-text">{course.title}</p>
                    </td>
                    <td>{course.credits}</td>
                    <td>{course.instructor}</td>
                    <td>
                      {course.schedule?.day} <br />
                      <span className="muted-text">
                        {course.schedule?.time} · {course.schedule?.location}
                      </span>
                    </td>
                    <td>—</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={buttonDisabled}
                        onClick={() => handleRequestEnrollment(course.id)}
                      >
                        {alreadyRegistered
                          ? "Selected"
                          : exceedsCourseLimit
                          ? "Course limit"
                          : exceedsCreditLimit
                          ? "Over limit"
                          : courseAction.loading
                          ? "Requesting..."
                          : "Select"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {courses.length === 0 && (
                <tr>
                  <td colSpan="5">No courses available right now.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Enrollment</p>
            <h3>My Courses</h3>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Credits</th>
                <th>Instructor</th>
                <th>Schedule</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.course?.code}</strong>
                    <p className="muted-text">{record.course?.title}</p>
                  </td>
                  <td>{record.course?.credits ?? "-"}</td>
                  <td>{record.course?.instructor}</td>
                  <td>
                    {record.course?.schedule?.day} <br />
                    <span className="muted-text">
                      {record.course?.schedule?.time} ·{" "}
                      {record.course?.schedule?.location}
                    </span>
                  </td>
                  <td>
                    {record.gradePublished ?? true
                      ? record.grade ?? "—"
                      : record.grade
                      ? "Pending"
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`badge badge--${
                        record.status === "enrolled" ? "success" : "warn"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan="5">No courses registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Weekly plan</p>
            <h3>Class Schedule</h3>
          </div>
        </div>
        <div className="schedule-grid">
          {enrolledCourses.map((record) => (
            <article key={record.id} className="schedule-card">
              <p className="muted-text">{record.course?.schedule?.day}</p>
              <h4>{record.course?.code}</h4>
              <p>{record.course?.title}</p>
              <p className="muted-text">
                {record.course?.schedule?.time} ·{" "}
                {record.course?.schedule?.location}
              </p>
            </article>
          ))}
          {enrolledCourses.length === 0 && <p>No confirmed classes yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default StudentPortal;
