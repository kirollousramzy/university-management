import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const Assignments = () => {
  const { user, isStudent } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [assignmentsData, coursesData] = await Promise.all([
        api.getAssignments({}),
        api.getCourses()
      ]);
      setAssignments(assignmentsData);
      setCourses(coursesData);

      // Load submissions for each assignment if not a student
      if (!isStudent) {
        const submissionsData = {};
        for (const assignment of assignmentsData) {
          try {
            const subs = await api.getAssignmentSubmissions(assignment.id);
            submissionsData[assignment.id] = subs;
          } catch (err) {
            console.error('Error loading submissions', err);
          }
        }
        setSubmissions(submissionsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createAssignment({
        courseId: form.courseId,
        title: form.title,
        description: form.description,
        assignmentType: form.assignmentType || 'assignment',
        dueDate: form.dueDate,
        maxPoints: Number(form.maxPoints) || 100,
        createdBy: user.id
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    if (!form.submissionText) {
      setError('Please provide a submission.');
      return;
    }
    setError('');
    try {
      await api.submitAssignment(assignmentId, {
        studentId: user.studentId,
        submissionText: form.submissionText,
        submissionFileUrl: form.submissionFileUrl
      });
      setForm({});
      setSelectedAssignment(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGradeSubmission = async (submissionId, points) => {
    setError('');
    try {
      await api.gradeSubmission(submissionId, {
        pointsEarned: Number(points),
        feedback: form.feedback || ''
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const studentAssignments = isStudent
    ? assignments.filter(a => {
        // Filter assignments for student's enrolled courses
        // This would need enrollment data - simplified for now
        return true;
      })
    : [];

  return (
    <div className="stack gap-lg">
      {!isStudent && (
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Create Assignment</p>
              <h2>New Assignment</h2>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleCreateAssignment}>
            <label>
              <span>Course</span>
              <select
                value={form.courseId || ''}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                required
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Title</span>
              <input
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              <span>Type</span>
              <select
                value={form.assignmentType || 'assignment'}
                onChange={(e) => setForm({ ...form, assignmentType: e.target.value })}
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
              </select>
            </label>
            <label>
              <span>Due Date</span>
              <input
                type="datetime-local"
                value={form.dueDate || ''}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </label>
            <label>
              <span>Max Points</span>
              <input
                type="number"
                value={form.maxPoints || 100}
                onChange={(e) => setForm({ ...form, maxPoints: e.target.value })}
              />
            </label>
            <label className="span-2">
              <span>Description</span>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="4"
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn">Create Assignment</button>
              {error && <p className="error-text">{error}</p>}
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Assignments</p>
            <h2>{isStudent ? 'My Assignments' : 'All Assignments'}</h2>
          </div>
        </div>
        {loading ? (
          <p>Loading assignments...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Due Date</th>
                  <th>Max Points</th>
                  {isStudent && <th>Status</th>}
                  {!isStudent && <th>Submissions</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(isStudent ? studentAssignments : assignments).map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <strong>{assignment.course_code}</strong>
                    </td>
                    <td>{assignment.title}</td>
                    <td>{assignment.assignment_type}</td>
                    <td>{new Date(assignment.due_date).toLocaleString()}</td>
                    <td>{assignment.max_points}</td>
                    {isStudent && (
                      <td>
                        <button
                          className="btn btn--ghost"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          Submit
                        </button>
                      </td>
                    )}
                    {!isStudent && (
                      <td>
                        {submissions[assignment.id]?.length || 0} submissions
                      </td>
                    )}
                    {!isStudent && (
                      <td>
                        <button
                          className="btn btn--ghost"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          View Submissions
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedAssignment && (
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">{selectedAssignment.title}</p>
              <h3>
                {isStudent ? 'Submit Assignment' : 'Grade Submissions'}
              </h3>
            </div>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setSelectedAssignment(null);
                setForm({});
              }}
            >
              Close
            </button>
          </div>

          {isStudent ? (
            <form className="form-grid">
              <label className="span-2">
                <span>Submission</span>
                <textarea
                  value={form.submissionText || ''}
                  onChange={(e) => setForm({ ...form, submissionText: e.target.value })}
                  rows="6"
                  required
                />
              </label>
              <label>
                <span>File URL (optional)</span>
                <input
                  type="url"
                  value={form.submissionFileUrl || ''}
                  onChange={(e) => setForm({ ...form, submissionFileUrl: e.target.value })}
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleSubmitAssignment(selectedAssignment.id)}
                >
                  Submit
                </button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submission</th>
                    <th>Points</th>
                    <th>Feedback</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(submissions[selectedAssignment.id] || []).map((submission) => (
                    <tr key={submission.id}>
                      <td>{submission.student_name}</td>
                      <td>{submission.submission_text || 'No text submission'}</td>
                      <td>
                        {submission.points_earned !== null ? (
                          submission.points_earned
                        ) : (
                          <input
                            type="number"
                            max={selectedAssignment.max_points}
                            placeholder="Grade"
                            onChange={(e) => setForm({ ...form, gradePoints: e.target.value, submissionId: submission.id })}
                          />
                        )}
                        / {selectedAssignment.max_points}
                      </td>
                      <td>
                        <textarea
                          value={form.feedback || submission.feedback || ''}
                          onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                          rows="2"
                          placeholder="Add feedback"
                        />
                      </td>
                      <td>
                        {submission.points_earned === null && (
                          <button
                            className="btn btn--ghost"
                            onClick={() => handleGradeSubmission(submission.id, form.gradePoints || 0)}
                          >
                            Grade
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Assignments;

