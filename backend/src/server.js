const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const { query, ping } = require('./db');
const eav = require('./eav');

const PORT = process.env.PORT || 4000;
const COURSE_LIMIT = 6;
const CREDIT_LIMIT = 18;
const GRADE_POINTS = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  D: 1.0,
  F: 0
};
const DEFAULT_FIRST_YEAR_COURSE_CODES = (process.env.DEFAULT_FIRST_YEAR_COURSE_CODES || '')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);
const DEFAULT_FIRST_YEAR_FALLBACK_COUNT = Number(process.env.DEFAULT_FIRST_YEAR_COURSE_COUNT) || 3;

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const STUDENT_COLUMNS = 'id, name, email, major, year, status, gpa, advisor';
const COURSE_COLUMNS = 'id, code, title, instructor, credits, capacity, schedule_day, schedule_time, schedule_location, course_type, department';
const ENROLLMENT_DETAIL_SELECT = `
  SELECT
    e.id,
    e.student_id,
    e.course_id,
    e.status,
    e.grade_letter,
    e.grade_points,
    e.grade_released,
    s.id AS s_id,
    s.name AS s_name,
    s.email AS s_email,
    s.major AS s_major,
    s.year AS s_year,
    s.status AS s_status,
    s.gpa AS s_gpa,
    s.advisor AS s_advisor,
    c.id AS c_id,
    c.code AS c_code,
    c.title AS c_title,
    c.instructor AS c_instructor,
    c.credits AS c_credits,
    c.capacity AS c_capacity,
    c.schedule_day AS c_schedule_day,
    c.schedule_time AS c_schedule_time,
    c.schedule_location AS c_schedule_location
  FROM enrollments e
  LEFT JOIN students s ON s.id = e.student_id
  LEFT JOIN courses c ON c.id = e.course_id`;

const cleanStudent = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  major: row.major,
  year: row.year,
  status: row.status,
  gpa: row.gpa === null ? null : Number(row.gpa),
  advisor: row.advisor
});

const cleanCourse = (row) => ({
  id: row.id,
  code: row.code,
  title: row.title,
  instructor: row.instructor,
  credits: Number(row.credits),
  capacity: Number(row.capacity),
  courseType: row.course_type || 'core',
  department: row.department || null,
  schedule: {
    day: row.schedule_day,
    time: row.schedule_time,
    location: row.schedule_location
  }
});

const cleanDoctor = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const validateRequiredFields = (payload, required) => required.every((key) => Boolean(payload[key]));

const mapEnrollmentDetail = (row) => ({
  id: row.id,
  studentId: row.student_id,
  courseId: row.course_id,
  status: row.status,
  grade: row.grade_letter || null,
  gradePoints: row.grade_points !== null ? Number(row.grade_points) : null,
  gradePublished: Boolean(row.grade_released),
  student: row.s_id
    ? cleanStudent({
        id: row.s_id,
        name: row.s_name,
        email: row.s_email,
        major: row.s_major,
        year: row.s_year,
        status: row.s_status,
        gpa: row.s_gpa,
        advisor: row.s_advisor
      })
    : {},
  course: row.c_id
    ? cleanCourse({
        id: row.c_id,
        code: row.c_code,
        title: row.c_title,
        instructor: row.c_instructor,
        credits: row.c_credits,
        capacity: row.c_capacity,
        schedule_day: row.c_schedule_day,
        schedule_time: row.c_schedule_time,
        schedule_location: row.c_schedule_location
      })
    : {}
});

const gradeLetterToPoints = (letter) => {
  if (!letter) return null;
  const normalized = letter.toUpperCase();
  return GRADE_POINTS[normalized] ?? null;
};

const recalcStudentGpa = async (studentId) => {
  const [row] = await query(
    `SELECT
      SUM(CASE WHEN e.grade_points IS NOT NULL AND e.grade_released = 1 THEN e.grade_points * c.credits ELSE 0 END) AS totalPoints,
      SUM(CASE WHEN e.grade_points IS NOT NULL AND e.grade_released = 1 THEN c.credits ELSE 0 END) AS totalCredits
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id = ?;`,
    [studentId]
  );

  const totalPoints = Number(row.totalPoints) || 0;
  const totalCredits = Number(row.totalCredits) || 0;
  const gpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : null;

  await query('UPDATE students SET gpa = ? WHERE id = ?;', [gpa, studentId]);
  return gpa;
};

const getStudentById = async (id) => {
  const rows = await query(`SELECT ${STUDENT_COLUMNS} FROM students WHERE id = ?`, [id]);
  return rows[0] || null;
};

const getCourseById = async (id) => {
  const rows = await query(`SELECT ${COURSE_COLUMNS} FROM courses WHERE id = ?`, [id]);
  return rows[0] || null;
};

const createStudentLogin = async (student, password) => {
  const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [student.email]);
  if (existing.length) {
    await query(
      'UPDATE users SET name = ?, password = ?, role = ?, student_id = ? WHERE email = ?',
      [student.name, password, 'student', student.id, student.email]
    );
    return { email: student.email, password };
  }

  const loginUser = {
    id: `user-${student.id}`,
    name: student.name,
    email: student.email,
    role: 'student',
    password,
    studentId: student.id
  };

  await query(
    'INSERT INTO users (id, name, email, role, password, student_id) VALUES (?, ?, ?, ?, ?, ?)',
    [loginUser.id, loginUser.name, loginUser.email, loginUser.role, loginUser.password, loginUser.studentId]
  );

  return { email: loginUser.email, password };
};

const getStudentLoad = async (studentId) => {
  const [row] = await query(
    `SELECT
      COUNT(*) AS courseCount,
      COALESCE(SUM(c.credits), 0) AS totalCredits
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id = ?
      AND e.status IN ('enrolled', 'waitlisted');`,
    [studentId]
  );

  return {
    courseCount: Number(row.courseCount) || 0,
    totalCredits: Number(row.totalCredits) || 0
  };
};

const fetchDefaultCourses = async () => {
  if (DEFAULT_FIRST_YEAR_COURSE_CODES.length) {
    const placeholders = DEFAULT_FIRST_YEAR_COURSE_CODES.map(() => '?').join(', ');
    return query(
      `SELECT ${COURSE_COLUMNS} FROM courses WHERE code IN (${placeholders});`,
      DEFAULT_FIRST_YEAR_COURSE_CODES
    );
  }

  return query(
    `SELECT ${COURSE_COLUMNS} FROM courses ORDER BY code LIMIT ${DEFAULT_FIRST_YEAR_FALLBACK_COUNT};`
  );
};

const autoEnrollDefaultCourses = async (studentId) => {
  const defaults = await fetchDefaultCourses();
  if (!defaults.length) {
    return { created: [], skipped: ['No default courses configured or found.'] };
  }

  const existing = await query('SELECT course_id FROM enrollments WHERE student_id = ?;', [studentId]);
  const existingCourseIds = new Set(existing.map((row) => row.course_id));
  const load = await getStudentLoad(studentId);

  let courseCount = load.courseCount;
  let totalCredits = load.totalCredits;

  const created = [];
  const skipped = [];

  for (const course of defaults) {
    if (existingCourseIds.has(course.id)) {
      skipped.push({ courseId: course.id, reason: 'already-enrolled' });
      continue;
    }

    const projectedCount = courseCount + 1;
    const projectedCredits = totalCredits + Number(course.credits || 0);

    if (projectedCount > COURSE_LIMIT || projectedCredits > CREDIT_LIMIT) {
      skipped.push({ courseId: course.id, reason: 'limits-exceeded' });
      continue;
    }

    const enrollmentId = uuid();

    await query(
      'INSERT INTO enrollments (id, student_id, course_id, status, grade_letter, grade_points) VALUES (?, ?, ?, ?, ?, ?);',
      [enrollmentId, studentId, course.id, 'enrolled', null, null]
    );

    created.push({
      id: enrollmentId,
      studentId,
      courseId: course.id,
      status: 'enrolled',
      grade: null,
      gradePoints: null,
      course: cleanCourse(course)
    });

    courseCount = projectedCount;
    totalCredits = projectedCredits;
  }

  return { created, skipped };
};

const getStudentEnrollments = async (studentId) => {
  const rows = await query(`${ENROLLMENT_DETAIL_SELECT} WHERE e.student_id = ?;`, [studentId]);
  return rows.map(mapEnrollmentDetail);
};

const recalcAllStudentGpas = async () => {
  const students = await query('SELECT id FROM students;');
  const results = [];

  for (const student of students) {
    const gpa = await recalcStudentGpa(student.id);
    results.push({ studentId: student.id, gpa });
  }

  return results;
};

// --- Routes ----------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'University Management API' });
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const users = await query(
      'SELECT id, name, email, role, password, student_id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = users[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.student_id || null
      }
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Unable to log in right now.' });
  }
});

// Dashboard summary
app.get('/api/dashboard/summary', async (_req, res) => {
  try {
    const [totals] = await query(
      `SELECT
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM students WHERE status = 'active') AS activeStudents,
        (SELECT COUNT(*) FROM students WHERE status = 'probation') AS probationStudents,
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM enrollments) AS enrollments;`
    );

    const courseStats = await query(
      `SELECT
        c.id,
        c.code,
        c.title,
        c.instructor,
        c.credits,
        c.capacity,
        c.schedule_day,
        c.schedule_time,
        c.schedule_location,
        COALESCE(SUM(CASE WHEN e.status = 'enrolled' THEN 1 ELSE 0 END), 0) AS enrolled,
        COALESCE(SUM(CASE WHEN e.status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlisted
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id
      ORDER BY enrolled DESC
      LIMIT 3;`
    );

    const announcements = await query(
      'SELECT id, title, detail, announcement_date FROM announcements ORDER BY announcement_date DESC LIMIT 10;'
    );

    res.json({
      totals: {
        students: totals.students,
        activeStudents: totals.activeStudents,
        probationStudents: totals.probationStudents,
        courses: totals.courses,
        enrollments: totals.enrollments
      },
      courseStats: courseStats.map((course) => ({
        ...cleanCourse(course),
        enrolled: course.enrolled,
        waitlisted: course.waitlisted
      })),
      announcements: announcements.map((ann) => ({
        id: ann.id,
        title: ann.title,
        detail: ann.detail,
        date: ann.announcement_date
      }))
    });
  } catch (error) {
    console.error('Dashboard summary error', error);
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
});

// Students CRUD
app.get('/api/students', async (_req, res) => {
  try {
    const rows = await query(`SELECT ${STUDENT_COLUMNS} FROM students;`);
    res.json(rows.map(cleanStudent));
  } catch (error) {
    console.error('Fetch students error', error);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
});

app.post('/api/students/recalculate-gpas', async (_req, res) => {
  try {
    const results = await recalcAllStudentGpas();
    res.json({ updated: results.length, results });
  } catch (error) {
    console.error('Recalculate GPA error', error);
    res.status(500).json({ message: 'Failed to recalculate GPAs.' });
  }
});

app.get('/api/students/records', async (_req, res) => {
  try {
    const rows = await query(`SELECT ${STUDENT_COLUMNS} FROM students;`);

    const records = [];

    for (const row of rows) {
      const enrollments = await getStudentEnrollments(row.id);
      const gpa = await recalcStudentGpa(row.id);
      records.push({
        student: cleanStudent({ ...row, gpa }),
        gpa,
        enrollments
      });
    }

    res.json(records);
  } catch (error) {
    console.error('Fetch student records error', error);
    res.status(500).json({ message: 'Failed to fetch student records.' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    return res.json(cleanStudent(student));
  } catch (error) {
    console.error('Fetch student error', error);
    res.status(500).json({ message: 'Failed to fetch student.' });
  }
});

app.get('/api/students/:id/transcript', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const enrollments = await getStudentEnrollments(req.params.id);
    const gpa = await recalcStudentGpa(req.params.id);

    return res.json({
      student: cleanStudent({ ...student, gpa }),
      gpa,
      enrollments
    });
  } catch (error) {
    console.error('Fetch transcript error', error);
    res.status(500).json({ message: 'Failed to load transcript.' });
  }
});

app.post('/api/students/:id/auto-enroll-defaults', async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const { created, skipped } = await autoEnrollDefaultCourses(req.params.id);
    const gpa = await recalcStudentGpa(req.params.id);
    const enrollments = await getStudentEnrollments(req.params.id);

    return res.json({
      student: cleanStudent({ ...student, gpa }),
      autoEnrollments: created,
      skipped,
      gpa,
      enrollments
    });
  } catch (error) {
    console.error('Auto-enroll defaults error', error);
    res.status(500).json({ message: 'Failed to auto-enroll default courses.' });
  }
});

app.post('/api/students', async (req, res) => {
  const required = ['name', 'email', 'major', 'year'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required student fields.' });
  }

  const newStudent = {
    id: uuid(),
    name: req.body.name,
    email: req.body.email,
    major: req.body.major,
    year: req.body.year,
    status: req.body.status || 'active',
    gpa: req.body.gpa ?? null,
    advisor: req.body.advisor || 'Not Assigned'
  };

  try {
    await query(
      'INSERT INTO students (id, name, email, major, year, status, gpa, advisor) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        newStudent.id,
        newStudent.name,
        newStudent.email,
        newStudent.major,
        newStudent.year,
        newStudent.status,
        newStudent.gpa,
        newStudent.advisor
      ]
    );

    let login = null;
    if (req.body.password) {
      login = await createStudentLogin(newStudent, req.body.password);
    }

    let autoEnrollments = [];
    let autoEnrollNote = null;
    try {
      const { created, skipped } = await autoEnrollDefaultCourses(newStudent.id);
      autoEnrollments = created;
      if (skipped.length) {
        autoEnrollNote = `Skipped ${skipped.length} default courses due to limits or existing matches.`;
      }
    } catch (autoError) {
      console.error('Default enrollment error', autoError);
      autoEnrollNote = 'Default courses could not be assigned.';
    }

    return res
      .status(201)
      .json({ student: cleanStudent(newStudent), login, autoEnrollments, autoEnrollNote });
  } catch (error) {
    console.error('Create student error', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A student with this email already exists.' });
    }
    return res.status(500).json({ message: 'Failed to create student.' });
  }
});

// Doctors management (admin use)
app.get('/api/staff/doctors', async (_req, res) => {
  try {
    const doctors = await query('SELECT id, name, email, role FROM users WHERE role = ?;', ['doctor']);
    res.json(doctors.map(cleanDoctor));
  } catch (error) {
    console.error('Fetch doctors error', error);
    res.status(500).json({ message: 'Failed to fetch doctors.' });
  }
});

app.post('/api/staff/doctors', async (req, res) => {
  const required = ['name', 'email', 'password'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const exists = await query('SELECT id FROM users WHERE email = ? LIMIT 1;', [req.body.email]);
    if (exists.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const doctorUser = {
      id: `doctor-${uuid()}`,
      name: req.body.name,
      email: req.body.email,
      role: 'doctor',
      password: req.body.password
    };

    await query(
      'INSERT INTO users (id, name, email, role, password) VALUES (?, ?, ?, ?, ?);',
      [doctorUser.id, doctorUser.name, doctorUser.email, doctorUser.role, doctorUser.password]
    );

    return res
      .status(201)
      .json({ doctor: cleanDoctor(doctorUser), login: { email: doctorUser.email, password: doctorUser.password } });
  } catch (error) {
    console.error('Create doctor error', error);
    res.status(500).json({ message: 'Failed to create doctor.' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const allowedFields = ['name', 'email', 'major', 'year', 'status', 'gpa', 'advisor'];
  const updates = allowedFields.filter((field) => req.body[field] !== undefined);

  if (!updates.length) {
    return res.status(400).json({ message: 'No valid student fields provided for update.' });
  }

  try {
    const values = updates.map((field) => (field === 'gpa' ? req.body[field] ?? null : req.body[field]));
    values.push(req.params.id);

    const result = await query(
      `UPDATE students SET ${updates.map((field) => `${field} = ?`).join(', ')} WHERE id = ?;`,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const updated = await getStudentById(req.params.id);
    return res.json(cleanStudent(updated));
  } catch (error) {
    console.error('Update student error', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A student with this email already exists.' });
    }
    res.status(500).json({ message: 'Failed to update student.' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await query('DELETE FROM enrollments WHERE student_id = ?;', [req.params.id]);
    await query('UPDATE users SET student_id = NULL WHERE student_id = ?;', [req.params.id]);

    const result = await query('DELETE FROM students WHERE id = ?;', [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete student error', error);
    res.status(500).json({ message: 'Failed to delete student.' });
  }
});

// Course CRUD
app.get('/api/courses', async (_req, res) => {
  try {
    const rows = await query(`SELECT ${COURSE_COLUMNS} FROM courses;`);
    res.json(rows.map(cleanCourse));
  } catch (error) {
    console.error('Fetch courses error', error);
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.json(cleanCourse(course));
  } catch (error) {
    console.error('Fetch course error', error);
    res.status(500).json({ message: 'Failed to fetch course.' });
  }
});

app.post('/api/courses', async (req, res) => {
  const required = ['code', 'title', 'instructor', 'credits'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required course fields.' });
  }

  const newCourse = {
    id: uuid(),
    code: req.body.code.toUpperCase(),
    title: req.body.title,
    instructor: req.body.instructor,
    credits: Number(req.body.credits),
    capacity: Number(req.body.capacity) || 30,
    course_type: req.body.courseType || 'core',
    department: req.body.department || null,
    schedule_day: req.body.schedule?.day || 'TBD',
    schedule_time: req.body.schedule?.time || 'TBD',
    schedule_location: req.body.schedule?.location || 'TBD'
  };

  try {
    await query(
      'INSERT INTO courses (id, code, title, instructor, credits, capacity, course_type, department, schedule_day, schedule_time, schedule_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        newCourse.id,
        newCourse.code,
        newCourse.title,
        newCourse.instructor,
        newCourse.credits,
        newCourse.capacity,
        newCourse.course_type,
        newCourse.department,
        newCourse.schedule_day,
        newCourse.schedule_time,
        newCourse.schedule_location
      ]
    );

    return res.status(201).json(cleanCourse(newCourse));
  } catch (error) {
    console.error('Create course error', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A course with this code already exists.' });
    }
    res.status(500).json({ message: 'Failed to create course.' });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  const allowedFields = [
    'code',
    'title',
    'instructor',
    'credits',
    'capacity',
    'course_type',
    'department',
    'schedule_day',
    'schedule_time',
    'schedule_location'
  ];

  const updates = allowedFields.filter((field) => {
    if (field.startsWith('schedule_') && req.body.schedule) {
      const key = field.replace('schedule_', '');
      return req.body.schedule[key] !== undefined;
    }
    return req.body[field] !== undefined;
  });

  if (!updates.length) {
    return res.status(400).json({ message: 'No valid course fields provided for update.' });
  }

  const values = updates.map((field) => {
    if (field.startsWith('schedule_')) {
      const key = field.replace('schedule_', '');
      return req.body.schedule?.[key];
    }
    if (field === 'credits' || field === 'capacity') {
      return Number(req.body[field]);
    }
    return req.body[field];
  });

  values.push(req.params.id);

  try {
    const result = await query(
      `UPDATE courses SET ${updates.map((field) => `${field} = ?`).join(', ')} WHERE id = ?;`,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const updated = await getCourseById(req.params.id);
    return res.json(cleanCourse(updated));
  } catch (error) {
    console.error('Update course error', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A course with this code already exists.' });
    }
    res.status(500).json({ message: 'Failed to update course.' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await query('DELETE FROM enrollments WHERE course_id = ?;', [req.params.id]);
    const result = await query('DELETE FROM courses WHERE id = ?;', [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete course error', error);
    res.status(500).json({ message: 'Failed to delete course.' });
  }
});

// Enrollments
app.get('/api/enrollments', async (_req, res) => {
  try {
    const rows = await query(`${ENROLLMENT_DETAIL_SELECT};`);
    res.json(rows.map(mapEnrollmentDetail));
  } catch (error) {
    console.error('Fetch enrollments error', error);
    res.status(500).json({ message: 'Failed to fetch enrollments.' });
  }
});

app.post('/api/enrollments', async (req, res) => {
  const { studentId, courseId, status = 'enrolled' } = req.body;
  if (!studentId || !courseId) {
    return res.status(400).json({ message: 'studentId and courseId are required.' });
  }

  try {
    const student = await getStudentById(studentId);
    const course = await getCourseById(courseId);

    if (!student || !course) {
      return res.status(404).json({ message: 'Student or course not found.' });
    }

    const [{ courseCount, totalCredits }] = await query(
      `SELECT
        COUNT(*) AS courseCount,
        COALESCE(SUM(c.credits), 0) AS totalCredits
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ?
        AND e.status IN ('enrolled', 'waitlisted');`,
      [studentId]
    );

    const currentCourses = Number(courseCount) || 0;
    const currentCredits = Number(totalCredits) || 0;
    const projectedCredits = currentCredits + Number(course.credits);

    if (currentCourses >= COURSE_LIMIT) {
      return res.status(409).json({ message: `Course limit reached (${COURSE_LIMIT}).` });
    }

    if (projectedCredits > CREDIT_LIMIT) {
      return res
        .status(409)
        .json({ message: `Adding this course would exceed the ${CREDIT_LIMIT}-credit limit.` });
    }

    const existing = await query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1;',
      [studentId, courseId]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Student is already linked to this course.' });
    }

    const record = { id: uuid(), studentId, courseId, status };
    await query(
      'INSERT INTO enrollments (id, student_id, course_id, status, grade_letter, grade_points) VALUES (?, ?, ?, ?, ?, ?);',
      [record.id, studentId, courseId, status, null, null]
    );

    return res.status(201).json(record);
  } catch (error) {
    console.error('Create enrollment error', error);
    res.status(500).json({ message: 'Failed to create enrollment.' });
  }
});

app.put('/api/enrollments/:id', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, student_id, course_id, status, grade_letter, grade_released FROM enrollments WHERE id = ? LIMIT 1;',
      [req.params.id]
    );

    const enrollment = rows[0];
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    const newStatus = req.body.status || enrollment.status;
    const gradeLetter = req.body.grade ?? enrollment.grade_letter ?? null;
    const gradePoints = gradeLetterToPoints(gradeLetter);
    const publish =
      req.body.publish === true || req.body.publish === 'true'
        ? 1
        : req.body.publish === false || req.body.publish === 'false'
        ? 0
        : null;

    const updateFields = ['status = ?', 'grade_letter = ?', 'grade_points = ?'];
    const updateValues = [newStatus, gradeLetter, gradePoints];
    if (publish !== null) {
      updateFields.push('grade_released = ?');
      updateValues.push(publish);
    }
    updateValues.push(req.params.id);

    await query(`UPDATE enrollments SET ${updateFields.join(', ')} WHERE id = ?;`, updateValues);

    await recalcStudentGpa(enrollment.student_id);

    return res.json({
      id: enrollment.id,
      studentId: enrollment.student_id,
      courseId: enrollment.course_id,
      status: newStatus,
      grade: gradeLetter,
      gradePoints,
      gradePublished: publish !== null ? Boolean(publish) : Boolean(enrollment.grade_released)
    });
  } catch (error) {
    console.error('Update enrollment error', error);
    res.status(500).json({ message: 'Failed to update enrollment.' });
  }
});

app.delete('/api/enrollments/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM enrollments WHERE id = ?;', [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete enrollment error', error);
    res.status(500).json({ message: 'Failed to delete enrollment.' });
  }
});

// Schedule feed
app.get('/api/schedule', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT
        c.id,
        c.code,
        c.title,
        c.instructor,
        c.schedule_day,
        c.schedule_time,
        c.schedule_location,
        COALESCE(SUM(CASE WHEN e.status = 'enrolled' THEN 1 ELSE 0 END), 0) AS enrolled
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id;`
    );

    const schedule = rows.map((course) => ({
      courseId: course.id,
      code: course.code,
      title: course.title,
      instructor: course.instructor,
      day: course.schedule_day,
      time: course.schedule_time,
      location: course.schedule_location,
      enrolled: course.enrolled
    }));

    res.json(schedule);
  } catch (error) {
    console.error('Fetch schedule error', error);
    res.status(500).json({ message: 'Failed to fetch schedule.' });
  }
});

// ==================== FACILITIES MODULE ====================

// Facilities CRUD
app.get('/api/facilities', async (_req, res) => {
  try {
    const facilities = await query(
      'SELECT id, name, facility_type, building, floor, capacity, equipment, amenities, status, created_at FROM facilities ORDER BY building, name;'
    );
    res.json(facilities);
  } catch (error) {
    console.error('Fetch facilities error', error);
    res.status(500).json({ message: 'Failed to fetch facilities.' });
  }
});

app.post('/api/facilities', async (req, res) => {
  const required = ['name', 'facilityType', 'building', 'capacity'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required facility fields.' });
  }

  try {
    const facilityId = uuid();
    await query(
      'INSERT INTO facilities (id, name, facility_type, building, floor, capacity, equipment, amenities, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        facilityId,
        req.body.name,
        req.body.facilityType,
        req.body.building,
        req.body.floor || null,
        req.body.capacity,
        req.body.equipment || null,
        req.body.amenities || null,
        req.body.status || 'available'
      ]
    );
    const [facility] = await query('SELECT * FROM facilities WHERE id = ?;', [facilityId]);
    res.status(201).json(facility);
  } catch (error) {
    console.error('Create facility error', error);
    res.status(500).json({ message: 'Failed to create facility.' });
  }
});

// Facility Bookings
app.get('/api/facilities/bookings', async (req, res) => {
  try {
    const { facilityId, date } = req.query;
    let queryStr = `
      SELECT b.*, f.name as facility_name, u.name as booked_by_name
      FROM facility_bookings b
      JOIN facilities f ON f.id = b.facility_id
      JOIN users u ON u.id = b.booked_by
      WHERE 1=1
    `;
    const params = [];
    if (facilityId) {
      queryStr += ' AND b.facility_id = ?';
      params.push(facilityId);
    }
    if (date) {
      queryStr += ' AND b.booking_date = ?';
      params.push(date);
    }
    queryStr += ' ORDER BY b.booking_date, b.start_time;';
    const bookings = await query(queryStr, params);
    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error', error);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
});

app.post('/api/facilities/bookings', async (req, res) => {
  const required = ['facilityId', 'bookedBy', 'purpose', 'bookingDate', 'startTime', 'endTime'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required booking fields.' });
  }

  try {
    // Check for conflicts
    const conflicts = await query(
      `SELECT id FROM facility_bookings 
       WHERE facility_id = ? AND booking_date = ? 
       AND status != 'cancelled'
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
      [
        req.body.facilityId,
        req.body.bookingDate,
        req.body.startTime,
        req.body.startTime,
        req.body.endTime,
        req.body.endTime
      ]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Time slot is already booked.' });
    }

    const bookingId = uuid();
    await query(
      'INSERT INTO facility_bookings (id, facility_id, booked_by, purpose, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        bookingId,
        req.body.facilityId,
        req.body.bookedBy,
        req.body.purpose,
        req.body.bookingDate,
        req.body.startTime,
        req.body.endTime,
        req.body.status || 'pending'
      ]
    );
    const [booking] = await query(
      'SELECT b.*, f.name as facility_name, u.name as booked_by_name FROM facility_bookings b JOIN facilities f ON f.id = b.facility_id JOIN users u ON u.id = b.booked_by WHERE b.id = ?;',
      [bookingId]
    );
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error', error);
    res.status(500).json({ message: 'Failed to create booking.' });
  }
});

// Maintenance Requests
app.get('/api/facilities/maintenance', async (_req, res) => {
  try {
    const requests = await query(
      `SELECT m.*, f.name as facility_name, u.name as reported_by_name
       FROM maintenance_requests m
       JOIN facilities f ON f.id = m.facility_id
       JOIN users u ON u.id = m.reported_by
       ORDER BY m.reported_at DESC;`
    );
    res.json(requests);
  } catch (error) {
    console.error('Fetch maintenance requests error', error);
    res.status(500).json({ message: 'Failed to fetch maintenance requests.' });
  }
});

app.post('/api/facilities/maintenance', async (req, res) => {
  const required = ['facilityId', 'reportedBy', 'issueDescription'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const requestId = uuid();
    await query(
      'INSERT INTO maintenance_requests (id, facility_id, reported_by, issue_description, priority, status) VALUES (?, ?, ?, ?, ?, ?);',
      [
        requestId,
        req.body.facilityId,
        req.body.reportedBy,
        req.body.issueDescription,
        req.body.priority || 'medium',
        'reported'
      ]
    );
    const [request] = await query(
      'SELECT m.*, f.name as facility_name, u.name as reported_by_name FROM maintenance_requests m JOIN facilities f ON f.id = m.facility_id JOIN users u ON u.id = m.reported_by WHERE m.id = ?;',
      [requestId]
    );
    res.status(201).json(request);
  } catch (error) {
    console.error('Create maintenance request error', error);
    res.status(500).json({ message: 'Failed to create maintenance request.' });
  }
});

// Resources
app.get('/api/resources', async (_req, res) => {
  try {
    const resources = await query('SELECT * FROM resources ORDER BY name;');
    res.json(resources);
  } catch (error) {
    console.error('Fetch resources error', error);
    res.status(500).json({ message: 'Failed to fetch resources.' });
  }
});

app.post('/api/resources', async (req, res) => {
  const required = ['name', 'resourceType', 'quantityTotal'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required resource fields.' });
  }

  try {
    const resourceId = uuid();
    await query(
      'INSERT INTO resources (id, name, resource_type, description, quantity_total, quantity_available, location, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        resourceId,
        req.body.name,
        req.body.resourceType,
        req.body.description || null,
        req.body.quantityTotal,
        req.body.quantityAvailable || req.body.quantityTotal,
        req.body.location || null,
        req.body.department || null
      ]
    );
    const [resource] = await query('SELECT * FROM resources WHERE id = ?;', [resourceId]);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Create resource error', error);
    res.status(500).json({ message: 'Failed to create resource.' });
  }
});

app.post('/api/resources/allocate', async (req, res) => {
  const required = ['resourceId', 'allocatedTo', 'allocationType', 'quantity'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required allocation fields.' });
  }

  try {
    const [resource] = await query('SELECT quantity_available FROM resources WHERE id = ?;', [req.body.resourceId]);
    if (!resource || resource.quantity_available < req.body.quantity) {
      return res.status(409).json({ message: 'Insufficient resources available.' });
    }

    const allocationId = uuid();
    await query(
      'INSERT INTO resource_allocations (id, resource_id, allocated_to, allocation_type, quantity, return_date, status) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        allocationId,
        req.body.resourceId,
        req.body.allocatedTo,
        req.body.allocationType,
        req.body.quantity,
        req.body.returnDate || null,
        'active'
      ]
    );

    await query('UPDATE resources SET quantity_available = quantity_available - ? WHERE id = ?;', [
      req.body.quantity,
      req.body.resourceId
    ]);

    const [allocation] = await query(
      'SELECT a.*, r.name as resource_name, u.name as allocated_to_name FROM resource_allocations a JOIN resources r ON r.id = a.resource_id JOIN users u ON u.id = a.allocated_to WHERE a.id = ?;',
      [allocationId]
    );
    res.status(201).json(allocation);
  } catch (error) {
    console.error('Allocate resource error', error);
    res.status(500).json({ message: 'Failed to allocate resource.' });
  }
});

// Admission Applications
app.get('/api/admissions/applications', async (_req, res) => {
  try {
    const applications = await query(
      'SELECT a.*, u.name as reviewed_by_name FROM admission_applications a LEFT JOIN users u ON u.id = a.reviewed_by ORDER BY a.submitted_at DESC;'
    );
    res.json(applications);
  } catch (error) {
    console.error('Fetch applications error', error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
});

app.post('/api/admissions/applications', async (req, res) => {
  const required = ['applicantName', 'applicantEmail', 'program'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required application fields.' });
  }

  try {
    const applicationId = uuid();
    await query(
      'INSERT INTO admission_applications (id, applicant_name, applicant_email, phone, program, application_status) VALUES (?, ?, ?, ?, ?, ?);',
      [
        applicationId,
        req.body.applicantName,
        req.body.applicantEmail,
        req.body.phone || null,
        req.body.program,
        'submitted'
      ]
    );
    const [application] = await query('SELECT * FROM admission_applications WHERE id = ?;', [applicationId]);
    res.status(201).json(application);
  } catch (error) {
    console.error('Create application error', error);
    res.status(500).json({ message: 'Failed to submit application.' });
  }
});

// ==================== CURRICULUM MODULE ENHANCEMENTS ====================

// Assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const { courseId } = req.query;
    let queryStr = 'SELECT a.*, c.code as course_code, c.title as course_title FROM assignments a JOIN courses c ON c.id = a.course_id WHERE 1=1';
    const params = [];
    if (courseId) {
      queryStr += ' AND a.course_id = ?';
      params.push(courseId);
    }
    queryStr += ' ORDER BY a.due_date DESC;';
    const assignments = await query(queryStr, params);
    res.json(assignments);
  } catch (error) {
    console.error('Fetch assignments error', error);
    res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
});

app.post('/api/assignments', async (req, res) => {
  const required = ['courseId', 'title', 'dueDate', 'maxPoints', 'createdBy'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required assignment fields.' });
  }

  try {
    const assignmentId = uuid();
    await query(
      'INSERT INTO assignments (id, course_id, title, description, assignment_type, due_date, max_points, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        assignmentId,
        req.body.courseId,
        req.body.title,
        req.body.description || null,
        req.body.assignmentType || 'assignment',
        req.body.dueDate,
        req.body.maxPoints,
        req.body.createdBy
      ]
    );
    const [assignment] = await query(
      'SELECT a.*, c.code as course_code, c.title as course_title FROM assignments a JOIN courses c ON c.id = a.course_id WHERE a.id = ?;',
      [assignmentId]
    );
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error', error);
    res.status(500).json({ message: 'Failed to create assignment.' });
  }
});

app.get('/api/assignments/:id/submissions', async (req, res) => {
  try {
    const submissions = await query(
      `SELECT s.*, st.name as student_name, st.email as student_email
       FROM assignment_submissions s
       JOIN students st ON st.id = s.student_id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC;`,
      [req.params.id]
    );
    res.json(submissions);
  } catch (error) {
    console.error('Fetch submissions error', error);
    res.status(500).json({ message: 'Failed to fetch submissions.' });
  }
});

app.post('/api/assignments/:id/submit', async (req, res) => {
  const required = ['studentId'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const submissionId = uuid();
    await query(
      'INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_text, submission_file_url) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE submission_text = VALUES(submission_text), submission_file_url = VALUES(submission_file_url), submitted_at = CURRENT_TIMESTAMP;',
      [
        submissionId,
        req.params.id,
        req.body.studentId,
        req.body.submissionText || null,
        req.body.submissionFileUrl || null
      ]
    );
    const [submission] = await query(
      'SELECT s.*, st.name as student_name FROM assignment_submissions s JOIN students st ON st.id = s.student_id WHERE s.id = ?;',
      [submissionId]
    );
    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit assignment error', error);
    res.status(500).json({ message: 'Failed to submit assignment.' });
  }
});

app.put('/api/assignments/submissions/:id/grade', async (req, res) => {
  const required = ['pointsEarned'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Points earned is required.' });
  }

  try {
    await query(
      'UPDATE assignment_submissions SET points_earned = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [req.body.pointsEarned, req.body.feedback || null, req.params.id]
    );
    const [submission] = await query('SELECT * FROM assignment_submissions WHERE id = ?;', [req.params.id]);
    res.json(submission);
  } catch (error) {
    console.error('Grade submission error', error);
    res.status(500).json({ message: 'Failed to grade submission.' });
  }
});

// ==================== STAFF MODULE ENHANCEMENTS ====================

// Teaching Assistants
app.get('/api/staff/tas', async (_req, res) => {
  try {
    const tas = await query(
      `SELECT ta.*, u.name, u.email, c.code as course_code, c.title as course_title
       FROM teaching_assistants ta
       JOIN users u ON u.id = ta.user_id
       LEFT JOIN courses c ON c.id = ta.assigned_course_id
       ORDER BY u.name;`
    );
    res.json(tas);
  } catch (error) {
    console.error('Fetch TAs error', error);
    res.status(500).json({ message: 'Failed to fetch TAs.' });
  }
});

app.post('/api/staff/tas', async (req, res) => {
  const required = ['userId'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const taId = uuid();
    await query(
      'INSERT INTO teaching_assistants (id, user_id, assigned_course_id, responsibilities, hourly_rate, status) VALUES (?, ?, ?, ?, ?, ?);',
      [
        taId,
        req.body.userId,
        req.body.assignedCourseId || null,
        req.body.responsibilities || null,
        req.body.hourlyRate || null,
        req.body.status || 'active'
      ]
    );
    const [ta] = await query(
      'SELECT ta.*, u.name, u.email FROM teaching_assistants ta JOIN users u ON u.id = ta.user_id WHERE ta.id = ?;',
      [taId]
    );
    res.status(201).json(ta);
  } catch (error) {
    console.error('Create TA error', error);
    res.status(500).json({ message: 'Failed to create TA.' });
  }
});

// Office Hours
app.get('/api/staff/office-hours', async (req, res) => {
  try {
    const { staffId } = req.query;
    let queryStr = `
      SELECT oh.*, u.name as staff_name, u.email as staff_email
      FROM office_hours oh
      JOIN users u ON u.id = oh.staff_id
      WHERE 1=1
    `;
    const params = [];
    if (staffId) {
      queryStr += ' AND oh.staff_id = ?';
      params.push(staffId);
    }
    queryStr += ' ORDER BY oh.day_of_week, oh.start_time;';
    const officeHours = await query(queryStr, params);
    res.json(officeHours);
  } catch (error) {
    console.error('Fetch office hours error', error);
    res.status(500).json({ message: 'Failed to fetch office hours.' });
  }
});

app.post('/api/staff/office-hours', async (req, res) => {
  const required = ['staffId', 'dayOfWeek', 'startTime', 'endTime'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required office hours fields.' });
  }

  try {
    const officeHourId = uuid();
    await query(
      'INSERT INTO office_hours (id, staff_id, day_of_week, start_time, end_time, location, is_virtual, virtual_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        officeHourId,
        req.body.staffId,
        req.body.dayOfWeek,
        req.body.startTime,
        req.body.endTime,
        req.body.location || null,
        req.body.isVirtual || false,
        req.body.virtualLink || null
      ]
    );
    const [officeHour] = await query(
      'SELECT oh.*, u.name as staff_name FROM office_hours oh JOIN users u ON u.id = oh.staff_id WHERE oh.id = ?;',
      [officeHourId]
    );
    res.status(201).json(officeHour);
  } catch (error) {
    console.error('Create office hours error', error);
    res.status(500).json({ message: 'Failed to create office hours.' });
  }
});

// Performance Tracking
app.get('/api/staff/performance', async (req, res) => {
  try {
    const { staffId } = req.query;
    let queryStr = `
      SELECT p.*, u.name as staff_name, e.name as evaluator_name
      FROM staff_performance p
      JOIN users u ON u.id = p.staff_id
      LEFT JOIN users e ON e.id = p.evaluated_by
      WHERE 1=1
    `;
    const params = [];
    if (staffId) {
      queryStr += ' AND p.staff_id = ?';
      params.push(staffId);
    }
    queryStr += ' ORDER BY p.evaluated_at DESC;';
    const performance = await query(queryStr, params);
    res.json(performance);
  } catch (error) {
    console.error('Fetch performance error', error);
    res.status(500).json({ message: 'Failed to fetch performance records.' });
  }
});

app.post('/api/staff/performance', async (req, res) => {
  const required = ['staffId', 'evaluationPeriod', 'evaluationType'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required performance fields.' });
  }

  try {
    const performanceId = uuid();
    await query(
      'INSERT INTO staff_performance (id, staff_id, evaluation_period, evaluation_type, rating, comments, evaluated_by) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        performanceId,
        req.body.staffId,
        req.body.evaluationPeriod,
        req.body.evaluationType,
        req.body.rating || null,
        req.body.comments || null,
        req.body.evaluatedBy || null
      ]
    );
    const [performance] = await query(
      'SELECT p.*, u.name as staff_name FROM staff_performance p JOIN users u ON u.id = p.staff_id WHERE p.id = ?;',
      [performanceId]
    );
    res.status(201).json(performance);
  } catch (error) {
    console.error('Create performance record error', error);
    res.status(500).json({ message: 'Failed to create performance record.' });
  }
});

// Research Publications
app.get('/api/staff/research', async (req, res) => {
  try {
    const { staffId } = req.query;
    let queryStr = `
      SELECT r.*, u.name as staff_name
      FROM research_publications r
      JOIN users u ON u.id = r.staff_id
      WHERE 1=1
    `;
    const params = [];
    if (staffId) {
      queryStr += ' AND r.staff_id = ?';
      params.push(staffId);
    }
    queryStr += ' ORDER BY r.publication_date DESC;';
    const publications = await query(queryStr, params);
    res.json(publications);
  } catch (error) {
    console.error('Fetch research error', error);
    res.status(500).json({ message: 'Failed to fetch research publications.' });
  }
});

app.post('/api/staff/research', async (req, res) => {
  const required = ['staffId', 'title', 'publicationType'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required research fields.' });
  }

  try {
    const researchId = uuid();
    await query(
      'INSERT INTO research_publications (id, staff_id, title, publication_type, publication_date, publisher, co_authors, doi, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        researchId,
        req.body.staffId,
        req.body.title,
        req.body.publicationType,
        req.body.publicationDate || null,
        req.body.publisher || null,
        req.body.coAuthors || null,
        req.body.doi || null,
        req.body.url || null
      ]
    );
    const [research] = await query(
      'SELECT r.*, u.name as staff_name FROM research_publications r JOIN users u ON u.id = r.staff_id WHERE r.id = ?;',
      [researchId]
    );
    res.status(201).json(research);
  } catch (error) {
    console.error('Create research publication error', error);
    res.status(500).json({ message: 'Failed to create research publication.' });
  }
});

// Professional Development
app.get('/api/staff/development', async (req, res) => {
  try {
    const { staffId } = req.query;
    let queryStr = `
      SELECT d.*, u.name as staff_name
      FROM professional_development d
      JOIN users u ON u.id = d.staff_id
      WHERE 1=1
    `;
    const params = [];
    if (staffId) {
      queryStr += ' AND d.staff_id = ?';
      params.push(staffId);
    }
    queryStr += ' ORDER BY d.start_date DESC;';
    const development = await query(queryStr, params);
    res.json(development);
  } catch (error) {
    console.error('Fetch development error', error);
    res.status(500).json({ message: 'Failed to fetch professional development records.' });
  }
});

app.post('/api/staff/development', async (req, res) => {
  const required = ['staffId', 'activityType', 'title'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required development fields.' });
  }

  try {
    const developmentId = uuid();
    await query(
      'INSERT INTO professional_development (id, staff_id, activity_type, title, description, start_date, end_date, provider, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        developmentId,
        req.body.staffId,
        req.body.activityType,
        req.body.title,
        req.body.description || null,
        req.body.startDate || null,
        req.body.endDate || null,
        req.body.provider || null,
        req.body.status || 'planned'
      ]
    );
    const [development] = await query(
      'SELECT d.*, u.name as staff_name FROM professional_development d JOIN users u ON u.id = d.staff_id WHERE d.id = ?;',
      [developmentId]
    );
    res.status(201).json(development);
  } catch (error) {
    console.error('Create development record error', error);
    res.status(500).json({ message: 'Failed to create development record.' });
  }
});

// Leave Requests
app.get('/api/staff/leave-requests', async (req, res) => {
  try {
    const { staffId } = req.query;
    let queryStr = `
      SELECT l.*, u.name as staff_name, r.name as reviewer_name
      FROM leave_requests l
      JOIN users u ON u.id = l.staff_id
      LEFT JOIN users r ON r.id = l.reviewed_by
      WHERE 1=1
    `;
    const params = [];
    if (staffId) {
      queryStr += ' AND l.staff_id = ?';
      params.push(staffId);
    }
    queryStr += ' ORDER BY l.requested_at DESC;';
    const leaveRequests = await query(queryStr, params);
    res.json(leaveRequests);
  } catch (error) {
    console.error('Fetch leave requests error', error);
    res.status(500).json({ message: 'Failed to fetch leave requests.' });
  }
});

app.post('/api/staff/leave-requests', async (req, res) => {
  const required = ['staffId', 'leaveType', 'startDate', 'endDate'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required leave request fields.' });
  }

  try {
    const leaveId = uuid();
    await query(
      'INSERT INTO leave_requests (id, staff_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        leaveId,
        req.body.staffId,
        req.body.leaveType,
        req.body.startDate,
        req.body.endDate,
        req.body.reason || null,
        'pending'
      ]
    );
    const [leaveRequest] = await query(
      'SELECT l.*, u.name as staff_name FROM leave_requests l JOIN users u ON u.id = l.staff_id WHERE l.id = ?;',
      [leaveId]
    );
    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Create leave request error', error);
    res.status(500).json({ message: 'Failed to create leave request.' });
  }
});

app.put('/api/staff/leave-requests/:id/review', async (req, res) => {
  const required = ['status', 'reviewedBy'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Status and reviewer are required.' });
  }

  try {
    await query(
      'UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [req.body.status, req.body.reviewedBy, req.params.id]
    );
    const [leaveRequest] = await query(
      'SELECT l.*, u.name as staff_name, r.name as reviewer_name FROM leave_requests l JOIN users u ON u.id = l.staff_id LEFT JOIN users r ON r.id = l.reviewed_by WHERE l.id = ?;',
      [req.params.id]
    );
    res.json(leaveRequest);
  } catch (error) {
    console.error('Review leave request error', error);
    res.status(500).json({ message: 'Failed to review leave request.' });
  }
});

// ==================== COMMUNITY MODULE ====================

// Parents
app.get('/api/parents', async (req, res) => {
  try {
    const { studentId } = req.query;
    let queryStr = `
      SELECT p.*, s.name as student_name, s.email as student_email
      FROM parents p
      JOIN students s ON s.id = p.student_id
      WHERE 1=1
    `;
    const params = [];
    if (studentId) {
      queryStr += ' AND p.student_id = ?';
      params.push(studentId);
    }
    queryStr += ' ORDER BY p.name;';
    const parents = await query(queryStr, params);
    res.json(parents);
  } catch (error) {
    console.error('Fetch parents error', error);
    res.status(500).json({ message: 'Failed to fetch parents.' });
  }
});

app.post('/api/parents', async (req, res) => {
  const required = ['name', 'email', 'studentId', 'relationship'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required parent fields.' });
  }

  try {
    const parentId = uuid();
    await query(
      'INSERT INTO parents (id, name, email, phone, student_id, relationship) VALUES (?, ?, ?, ?, ?, ?);',
      [
        parentId,
        req.body.name,
        req.body.email,
        req.body.phone || null,
        req.body.studentId,
        req.body.relationship
      ]
    );
    const [parent] = await query(
      'SELECT p.*, s.name as student_name FROM parents p JOIN students s ON s.id = p.student_id WHERE p.id = ?;',
      [parentId]
    );
    res.status(201).json(parent);
  } catch (error) {
    console.error('Create parent error', error);
    res.status(500).json({ message: 'Failed to create parent record.' });
  }
});

app.post('/api/parents/:id/register', async (req, res) => {
  const required = ['email', 'password'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userId = uuid();
    await query(
      'INSERT INTO parent_users (id, parent_id, email, password) VALUES (?, ?, ?, ?);',
      [userId, req.params.id, req.body.email, req.body.password]
    );
    res.status(201).json({ message: 'Parent account created successfully.', userId });
  } catch (error) {
    console.error('Register parent error', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: 'Failed to register parent account.' });
  }
});

// Messages
app.get('/api/messages', async (req, res) => {
  try {
    const { userId, type } = req.query;
    let queryStr = `
      SELECT m.*, 
             s.name as sender_name, s.email as sender_email,
             r.name as receiver_name, r.email as receiver_email
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE 1=1
    `;
    const params = [];
    if (userId) {
      queryStr += ' AND (m.sender_id = ? OR m.receiver_id = ?)';
      params.push(userId, userId);
    }
    if (type) {
      queryStr += ' AND m.message_type = ?';
      params.push(type);
    }
    queryStr += ' ORDER BY m.created_at DESC;';
    const messages = await query(queryStr, params);
    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error', error);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

app.post('/api/messages', async (req, res) => {
  const required = ['senderId', 'receiverId', 'messageText'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required message fields.' });
  }

  try {
    const messageId = uuid();
    await query(
      'INSERT INTO messages (id, sender_id, receiver_id, subject, message_text, message_type, parent_message_id) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        messageId,
        req.body.senderId,
        req.body.receiverId,
        req.body.subject || null,
        req.body.messageText,
        req.body.messageType || 'direct',
        req.body.parentMessageId || null
      ]
    );
    const [message] = await query(
      `SELECT m.*, 
              s.name as sender_name, r.name as receiver_name
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       JOIN users r ON r.id = m.receiver_id
       WHERE m.id = ?;`,
      [messageId]
    );
    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error', error);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

app.put('/api/messages/:id/read', async (req, res) => {
  try {
    await query('UPDATE messages SET is_read = TRUE WHERE id = ?;', [req.params.id]);
    res.json({ message: 'Message marked as read.' });
  } catch (error) {
    console.error('Mark message read error', error);
    res.status(500).json({ message: 'Failed to mark message as read.' });
  }
});

// Meetings
app.get('/api/meetings', async (req, res) => {
  try {
    const { staffId, requesterId } = req.query;
    let queryStr = `
      SELECT m.*, 
             r.name as requester_name, r.email as requester_email,
             s.name as staff_name, s.email as staff_email
      FROM meetings m
      JOIN users r ON r.id = m.requester_id
      JOIN users s ON s.id = m.staff_id
      WHERE 1=1
    `;
    const params = [];
    if (staffId) {
      queryStr += ' AND m.staff_id = ?';
      params.push(staffId);
    }
    if (requesterId) {
      queryStr += ' AND m.requester_id = ?';
      params.push(requesterId);
    }
    queryStr += ' ORDER BY m.meeting_date, m.meeting_time;';
    const meetings = await query(queryStr, params);
    res.json(meetings);
  } catch (error) {
    console.error('Fetch meetings error', error);
    res.status(500).json({ message: 'Failed to fetch meetings.' });
  }
});

app.post('/api/meetings', async (req, res) => {
  const required = ['requesterId', 'staffId', 'meetingSubject', 'meetingDate', 'meetingTime'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required meeting fields.' });
  }

  try {
    const meetingId = uuid();
    await query(
      'INSERT INTO meetings (id, requester_id, staff_id, meeting_subject, meeting_date, meeting_time, duration_minutes, location, is_virtual, virtual_link, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        meetingId,
        req.body.requesterId,
        req.body.staffId,
        req.body.meetingSubject,
        req.body.meetingDate,
        req.body.meetingTime,
        req.body.durationMinutes || 30,
        req.body.location || null,
        req.body.isVirtual || false,
        req.body.virtualLink || null,
        'requested',
        req.body.notes || null
      ]
    );
    const [meeting] = await query(
      `SELECT m.*, 
              r.name as requester_name, s.name as staff_name
       FROM meetings m
       JOIN users r ON r.id = m.requester_id
       JOIN users s ON s.id = m.staff_id
       WHERE m.id = ?;`,
      [meetingId]
    );
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Create meeting error', error);
    res.status(500).json({ message: 'Failed to request meeting.' });
  }
});

app.put('/api/meetings/:id/confirm', async (req, res) => {
  try {
    await query('UPDATE meetings SET status = ? WHERE id = ?;', ['confirmed', req.params.id]);
    const [meeting] = await query(
      `SELECT m.*, 
              r.name as requester_name, s.name as staff_name
       FROM meetings m
       JOIN users r ON r.id = m.requester_id
       JOIN users s ON s.id = m.staff_id
       WHERE m.id = ?;`,
      [req.params.id]
    );
    res.json(meeting);
  } catch (error) {
    console.error('Confirm meeting error', error);
    res.status(500).json({ message: 'Failed to confirm meeting.' });
  }
});

// Events
app.get('/api/events', async (_req, res) => {
  try {
    const events = await query(
      `SELECT e.*, u.name as created_by_name
       FROM events e
       LEFT JOIN users u ON u.id = e.created_by
       ORDER BY e.event_date, e.event_time;`
    );
    res.json(events);
  } catch (error) {
    console.error('Fetch events error', error);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});

app.post('/api/events', async (req, res) => {
  const required = ['title', 'eventDate'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'Missing required event fields.' });
  }

  try {
    const eventId = uuid();
    await query(
      'INSERT INTO events (id, title, description, event_date, event_time, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        eventId,
        req.body.title,
        req.body.description || null,
        req.body.eventDate,
        req.body.eventTime || null,
        req.body.location || null,
        req.body.eventType || 'academic',
        req.body.createdBy || null
      ]
    );
    const [event] = await query(
      'SELECT e.*, u.name as created_by_name FROM events e LEFT JOIN users u ON u.id = e.created_by WHERE e.id = ?;',
      [eventId]
    );
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error', error);
    res.status(500).json({ message: 'Failed to create event.' });
  }
});

// EAV Model API Routes
// Get all entity types
app.get('/api/eav/entity-types', async (_req, res) => {
  try {
    const entityTypes = await eav.getEntityTypes();
    res.json({ entityTypes });
  } catch (error) {
    console.error('Get entity types error', error);
    res.status(500).json({ message: 'Failed to fetch entity types.' });
  }
});

// Attribute CRUD
app.get('/api/eav/attributes/:entityType', async (req, res) => {
  try {
    const attributes = await eav.getAttributesByEntityType(req.params.entityType);
    res.json(attributes);
  } catch (error) {
    console.error('Get attributes error', error);
    res.status(500).json({ message: 'Failed to fetch attributes.' });
  }
});

app.get('/api/eav/attributes/id/:id', async (req, res) => {
  try {
    const attribute = await eav.getAttributeById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ message: 'Attribute not found.' });
    }
    res.json(attribute);
  } catch (error) {
    console.error('Get attribute error', error);
    res.status(500).json({ message: 'Failed to fetch attribute.' });
  }
});

app.post('/api/eav/attributes', async (req, res) => {
  const required = ['entityType', 'attributeName'];
  if (!validateRequiredFields(req.body, required)) {
    return res.status(400).json({ message: 'entityType and attributeName are required.' });
  }

  try {
    const attribute = await eav.createAttribute({
      entityType: req.body.entityType,
      attributeName: req.body.attributeName,
      dataType: req.body.dataType || 'string',
      description: req.body.description || null,
      isRequired: req.body.isRequired || false,
      defaultValue: req.body.defaultValue || null
    });
    return res.status(201).json(attribute);
  } catch (error) {
    console.error('Create attribute error', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An attribute with this name already exists for this entity type.' });
    }
    res.status(500).json({ message: 'Failed to create attribute.' });
  }
});

app.put('/api/eav/attributes/:id', async (req, res) => {
  try {
    const attribute = await eav.updateAttribute(req.params.id, req.body);
    res.json(attribute);
  } catch (error) {
    console.error('Update attribute error', error);
    if (error.message === 'No valid fields provided for update') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to update attribute.' });
  }
});

app.delete('/api/eav/attributes/:id', async (req, res) => {
  try {
    const deleted = await eav.deleteAttribute(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Attribute not found.' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Delete attribute error', error);
    res.status(500).json({ message: 'Failed to delete attribute.' });
  }
});

// Value CRUD
app.get('/api/eav/values/:entityType/:entityId', async (req, res) => {
  try {
    const format = req.query.format || 'array'; // 'array' or 'object'
    
    if (format === 'object') {
      const values = await eav.getEntityValuesAsObject(req.params.entityType, req.params.entityId);
      return res.json(values);
    } else {
      const values = await eav.getEntityValues(req.params.entityType, req.params.entityId);
      return res.json(values);
    }
  } catch (error) {
    console.error('Get entity values error', error);
    res.status(500).json({ message: 'Failed to fetch entity values.' });
  }
});

app.post('/api/eav/values/:entityType/:entityId', async (req, res) => {
  try {
    if (!req.body.values || typeof req.body.values !== 'object') {
      return res.status(400).json({ message: 'values object is required.' });
    }

    const results = await eav.setEntityValues(req.params.entityType, req.params.entityId, req.body.values);
    return res.status(201).json({ values: results });
  } catch (error) {
    console.error('Set entity values error', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to set entity values.' });
  }
});

app.put('/api/eav/values/:entityType/:entityId/:attributeId', async (req, res) => {
  try {
    if (req.body.value === undefined) {
      return res.status(400).json({ message: 'value is required.' });
    }

    const result = await eav.setEntityValue(
      req.params.entityType,
      req.params.entityId,
      req.params.attributeId,
      req.body.value
    );
    return res.json(result);
  } catch (error) {
    console.error('Set entity value error', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to set entity value.' });
  }
});

app.delete('/api/eav/values/:entityType/:entityId/:attributeId', async (req, res) => {
  try {
    const deleted = await eav.deleteEntityValue(
      req.params.entityType,
      req.params.entityId,
      req.params.attributeId
    );
    if (!deleted) {
      return res.status(404).json({ message: 'Value not found.' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Delete entity value error', error);
    res.status(500).json({ message: 'Failed to delete entity value.' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

ping()
  .then(() => {
    console.log('Connected to MySQL');
    app.listen(PORT, () => {
      console.log(`University API server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MySQL', error);
    process.exit(1);
  });
