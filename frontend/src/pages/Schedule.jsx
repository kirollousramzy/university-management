import { useEffect, useState } from 'react';
import { api } from '../api/client';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enrollment, setEnrollment] = useState({ studentId: '', courseId: '' });
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [scheduleData, studentData, courseData] = await Promise.all([
          api.getSchedule(),
          api.getStudents(),
          api.getCourses()
        ]);
        setSchedule(scheduleData);
        setStudents(studentData);
        setCourses(courseData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleEnroll = async (event) => {
    event.preventDefault();
    setActionMessage('');
    if (!enrollment.studentId || !enrollment.courseId) {
      setActionMessage('Please select both a student and a course.');
      return;
    }
    try {
      await api.createEnrollment({ ...enrollment });
      setActionMessage('Enrollment recorded successfully.');
      setEnrollment({ studentId: '', courseId: '' });
    } catch (err) {
      setActionMessage(err.message);
    }
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="stack gap-lg">
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Class logistics</p>
            <h2>Weekly Schedule</h2>
          </div>
        </div>

        {loading ? (
          <p>Loading schedule...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchedule.map((item) => (
                  <tr key={item.courseId}>
                    <td>
                      <strong>{item.code}</strong>
                      <p className="muted-text">{item.title}</p>
                    </td>
                    <td>{item.instructor}</td>
                    <td>{item.day}</td>
                    <td>{item.time}</td>
                    <td>{item.location}</td>
                    <td>{item.enrolled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Enrollment actions</p>
            <h2>Assign Student to Course</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleEnroll}>
          <label>
            <span>Student</span>
            <select
              value={enrollment.studentId}
              onChange={(event) => setEnrollment((prev) => ({ ...prev, studentId: event.target.value }))}
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Course</span>
            <select
              value={enrollment.courseId}
              onChange={(event) => setEnrollment((prev) => ({ ...prev, courseId: event.target.value }))}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.title}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn">
              Record Enrollment
            </button>
            {actionMessage && <p className="muted-text">{actionMessage}</p>}
          </div>
        </form>
      </section>
    </div>
  );
};

export default Schedule;
