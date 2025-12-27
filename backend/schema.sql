-- MySQL schema and seed data for the University Management API
CREATE DATABASE IF NOT EXISTS university;
USE university;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  major VARCHAR(255) NOT NULL,
  year VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  gpa DECIMAL(4,2) DEFAULT NULL,
  advisor VARCHAR(255) NOT NULL DEFAULT 'Not Assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  instructor VARCHAR(255) NOT NULL,
  credits INT NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 0,
  schedule_day VARCHAR(50) NOT NULL DEFAULT 'TBD',
  schedule_time VARCHAR(50) NOT NULL DEFAULT 'TBD',
  schedule_location VARCHAR(255) NOT NULL DEFAULT 'TBD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  detail TEXT NOT NULL,
  announcement_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('admin', 'doctor', 'advisor', 'student') NOT NULL,
  password VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  course_id VARCHAR(50) NOT NULL,
  status ENUM('enrolled', 'waitlisted', 'dropped') NOT NULL DEFAULT 'enrolled',
  grade_letter VARCHAR(3) DEFAULT NULL,
  grade_points DECIMAL(3,2) DEFAULT NULL,
  grade_released BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (student_id, course_id),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Curriculum Module Enhancements
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type ENUM('core', 'elective') DEFAULT 'core';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  course_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignment_type ENUM('assignment', 'quiz', 'exam', 'project') NOT NULL DEFAULT 'assignment',
  due_date DATETIME NOT NULL,
  max_points DECIMAL(10,2) NOT NULL DEFAULT 100,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  assignment_id VARCHAR(50) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  submission_text TEXT,
  submission_file_url VARCHAR(500),
  points_earned DECIMAL(10,2) DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP NULL,
  feedback TEXT,
  UNIQUE KEY unique_submission (assignment_id, student_id),
  CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Facilities Module
CREATE TABLE IF NOT EXISTS facilities (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  facility_type ENUM('classroom', 'laboratory', 'office', 'auditorium', 'meeting_room') NOT NULL,
  building VARCHAR(255) NOT NULL,
  floor INT DEFAULT NULL,
  capacity INT NOT NULL,
  equipment TEXT,
  amenities TEXT,
  status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility_bookings (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  facility_id VARCHAR(50) NOT NULL,
  booked_by VARCHAR(50) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_user FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  facility_id VARCHAR(50) NOT NULL,
  reported_by VARCHAR(50) NOT NULL,
  issue_description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('reported', 'in_progress', 'resolved', 'cancelled') DEFAULT 'reported',
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  CONSTRAINT fk_maintenance_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_user FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  resource_type ENUM('equipment', 'software_license', 'furniture', 'other') NOT NULL,
  description TEXT,
  quantity_total INT NOT NULL DEFAULT 1,
  quantity_available INT NOT NULL DEFAULT 1,
  location VARCHAR(255),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_allocations (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  resource_id VARCHAR(50) NOT NULL,
  allocated_to VARCHAR(50) NOT NULL,
  allocation_type ENUM('department', 'faculty', 'student', 'course') NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  return_date DATE,
  status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
  CONSTRAINT fk_allocation_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  CONSTRAINT fk_allocation_user FOREIGN KEY (allocated_to) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admission_applications (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  program VARCHAR(255) NOT NULL,
  application_status ENUM('submitted', 'under_review', 'accepted', 'rejected', 'waitlisted') DEFAULT 'submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by VARCHAR(50),
  notes TEXT,
  CONSTRAINT fk_application_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Staff Module Enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_location VARCHAR(255) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS teaching_assistants (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  assigned_course_id VARCHAR(50),
  responsibilities TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_course FOREIGN KEY (assigned_course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS office_hours (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_office_hours_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff_performance (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL,
  evaluation_period VARCHAR(50) NOT NULL,
  evaluation_type ENUM('annual', 'semester', 'project') NOT NULL,
  rating DECIMAL(3,2),
  comments TEXT,
  evaluated_by VARCHAR(50),
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_performance_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_evaluator FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS research_publications (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  publication_type ENUM('journal', 'conference', 'book', 'patent', 'other') NOT NULL,
  publication_date DATE,
  publisher VARCHAR(255),
  co_authors TEXT,
  doi VARCHAR(255),
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_research_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS professional_development (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL,
  activity_type ENUM('training', 'conference', 'workshop', 'certification', 'course') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  provider VARCHAR(255),
  status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_development_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL,
  leave_type ENUM('sick', 'vacation', 'personal', 'maternity', 'paternity', 'sabbatical', 'other') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by VARCHAR(50),
  CONSTRAINT fk_leave_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Community Module
CREATE TABLE IF NOT EXISTS parents (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  student_id VARCHAR(50) NOT NULL,
  relationship ENUM('mother', 'father', 'guardian', 'other') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_parent_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parent_users (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  parent_id VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_parent_user_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  sender_id VARCHAR(50) NOT NULL,
  receiver_id VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  message_text TEXT NOT NULL,
  message_type ENUM('direct', 'forum_post', 'announcement') DEFAULT 'direct',
  parent_message_id VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_parent FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  requester_id VARCHAR(50) NOT NULL,
  staff_id VARCHAR(50) NOT NULL,
  meeting_subject VARCHAR(255) NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  location VARCHAR(255),
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link VARCHAR(500),
  status ENUM('requested', 'confirmed', 'cancelled', 'completed') DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_meeting_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  event_type ENUM('academic', 'social', 'sports', 'cultural', 'administrative') DEFAULT 'academic',
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- EAV Model Tables
CREATE TABLE IF NOT EXISTS eav_attributes (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  attribute_name VARCHAR(255) NOT NULL,
  data_type ENUM('string', 'number', 'boolean', 'date', 'text') NOT NULL DEFAULT 'string',
  description TEXT DEFAULT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attribute (entity_type, attribute_name),
  INDEX idx_entity_type (entity_type)
);

CREATE TABLE IF NOT EXISTS eav_values (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  attribute_id VARCHAR(50) NOT NULL,
  value_text TEXT DEFAULT NULL,
  value_number DECIMAL(20, 6) DEFAULT NULL,
  value_boolean BOOLEAN DEFAULT NULL,
  value_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_eav_value (entity_type, entity_id, attribute_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_attribute (attribute_id),
  CONSTRAINT fk_eav_value_attribute FOREIGN KEY (attribute_id) REFERENCES eav_attributes(id) ON DELETE CASCADE
);

-- Seed data (idempotent)
INSERT INTO students (id, name, email, major, year, status, gpa, advisor) VALUES
  ('stu-001', 'Amelia Flores', 'amelia.flores@campus.edu', 'Computer Science', 'Senior', 'active', 3.85, 'Dr. Stone'),
  ('stu-002', 'Noah Harper', 'noah.harper@campus.edu', 'Mechanical Engineering', 'Junior', 'active', 3.50, 'Dr. Chen'),
  ('stu-003', 'Sophia Lee', 'sophia.lee@campus.edu', 'Business Administration', 'Sophomore', 'probation', 2.60, 'Prof. Patel'),
  ('stu-004', 'Liam Walker', 'liam.walker@campus.edu', 'Mathematics', 'Senior', 'active', 3.92, 'Dr. Ramos'),
  ('stu-005', 'Ava Robinson', 'ava.robinson@campus.edu', 'Electrical Engineering', 'Sophomore', 'active', 3.25, 'Dr. Malik'),
  ('stu-006', 'Ethan Carter', 'ethan.carter@campus.edu', 'Physics', 'Junior', 'active', 3.10, 'Dr. Silva'),
  ('stu-007', 'Mia Thompson', 'mia.thompson@campus.edu', 'English Literature', 'Senior', 'active', 3.60, 'Prof. Allen'),
  ('stu-008', 'Oliver Perez', 'oliver.perez@campus.edu', 'Information Systems', 'Sophomore', 'active', 2.95, 'Dr. Nguyen'),
  ('stu-009', 'Isabella Rivera', 'isabella.rivera@campus.edu', 'Chemistry', 'Junior', 'active', 3.40, 'Dr. Alvarez')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  major = VALUES(major),
  year = VALUES(year),
  status = VALUES(status),
  gpa = VALUES(gpa),
  advisor = VALUES(advisor);

INSERT INTO courses (id, code, title, instructor, credits, capacity, schedule_day, schedule_time, schedule_location) VALUES
  ('course-001', 'CS401', 'Distributed Systems', 'Dr. Kline', 4, 30, 'Mon/Wed', '10:00 - 11:30', 'Room CS210'),
  ('course-002', 'ME320', 'Fluid Mechanics', 'Dr. DeMarco', 3, 28, 'Tue/Thu', '09:00 - 10:15', 'Lab E3'),
  ('course-003', 'BUS205', 'Managerial Accounting', 'Prof. Wright', 3, 35, 'Mon/Wed', '13:00 - 14:15', 'Room B115'),
  ('course-004', 'MATH450', 'Numerical Analysis', 'Dr. Ahmad', 3, 25, 'Fri', '08:30 - 11:30', 'Room M302'),
  ('course-005', 'EE210', 'Circuits I', 'Dr. Malik', 3, 40, 'Mon/Wed', '14:00 - 15:15', 'Room EE120'),
  ('course-006', 'PHYS330', 'Quantum Mechanics', 'Dr. Silva', 4, 25, 'Tue/Thu', '11:00 - 12:30', 'Room PH201'),
  ('course-007', 'ENG310', 'Modern Poetry', 'Prof. Allen', 3, 30, 'Mon/Wed', '15:30 - 16:45', 'Room H105'),
  ('course-008', 'IS240', 'Database Systems', 'Dr. Nguyen', 3, 35, 'Tue/Thu', '10:30 - 11:45', 'Room IS220'),
  ('course-009', 'CHEM315', 'Organic Chemistry II', 'Dr. Alvarez', 4, 25, 'Mon/Wed', '09:00 - 10:30', 'Room C210')
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  title = VALUES(title),
  instructor = VALUES(instructor),
  credits = VALUES(credits),
  capacity = VALUES(capacity),
  schedule_day = VALUES(schedule_day),
  schedule_time = VALUES(schedule_time),
  schedule_location = VALUES(schedule_location);

INSERT INTO announcements (id, title, detail, announcement_date) VALUES
  ('ann-001', 'Commencement Rehearsal', 'Graduating seniors must attend rehearsal on April 28 at 3 PM in the main auditorium.', '2024-04-10'),
  ('ann-002', 'Registration Opens', 'Fall 2024 course registration opens on April 15 for seniors and April 18 for juniors.', '2024-04-05'),
  ('ann-003', 'Scholarship Deadline', 'The STEM innovation scholarship deadline is April 25. Submit supporting materials in the portal.', '2024-04-01')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  detail = VALUES(detail),
  announcement_date = VALUES(announcement_date);

INSERT INTO users (id, name, email, role, password, student_id) VALUES
  ('admin-001', 'Dr. Grace West', 'admin@campus.edu', 'admin', 'admin123', NULL),
  ('doctor-001', 'Dr. Layla Hassan', 'doctor@campus.edu', 'doctor', 'doctor123', NULL),
  ('staff-001', 'Henry Adams', 'advisor@campus.edu', 'advisor', 'advisor123', NULL),
  ('student-001', 'Omar Khalid', 'student@campus.edu', 'student', 'student123', 'stu-001')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  role = VALUES(role),
  password = VALUES(password),
  student_id = VALUES(student_id);

INSERT INTO enrollments (id, student_id, course_id, status, grade_letter, grade_points, grade_released) VALUES
  ('enr-001', 'stu-001', 'course-001', 'enrolled', 'A', 4.00, TRUE),
  ('enr-002', 'stu-001', 'course-004', 'waitlisted', NULL, NULL, FALSE),
  ('enr-003', 'stu-002', 'course-002', 'enrolled', 'B+', 3.30, TRUE),
  ('enr-004', 'stu-003', 'course-003', 'enrolled', 'C', 2.00, TRUE),
  ('enr-005', 'stu-004', 'course-004', 'enrolled', 'A-', 3.70, TRUE),
  ('enr-006', 'stu-005', 'course-005', 'enrolled', 'B', 3.00, TRUE),
  ('enr-007', 'stu-005', 'course-008', 'enrolled', 'B+', 3.30, TRUE),
  ('enr-008', 'stu-006', 'course-006', 'enrolled', 'B-', 2.70, TRUE),
  ('enr-009', 'stu-006', 'course-002', 'enrolled', 'A', 4.00, TRUE),
  ('enr-010', 'stu-007', 'course-007', 'enrolled', 'A', 4.00, TRUE),
  ('enr-011', 'stu-007', 'course-003', 'enrolled', 'B+', 3.30, TRUE),
  ('enr-012', 'stu-008', 'course-008', 'enrolled', 'C+', 2.30, TRUE),
  ('enr-013', 'stu-008', 'course-001', 'enrolled', 'B-', 2.70, TRUE),
  ('enr-014', 'stu-009', 'course-009', 'enrolled', 'A-', 3.70, TRUE),
  ('enr-015', 'stu-009', 'course-006', 'enrolled', 'B', 3.00, TRUE)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  grade_letter = VALUES(grade_letter),
  grade_points = VALUES(grade_points),
  grade_released = VALUES(grade_released);

-- Update courses with course_type
UPDATE courses SET course_type = 'core' WHERE code IN ('CS401', 'ME320', 'BUS205', 'MATH450', 'EE210');
UPDATE courses SET course_type = 'elective' WHERE code IN ('PHYS330', 'ENG310', 'IS240', 'CHEM315');

-- Facilities seed data
INSERT INTO facilities (id, name, facility_type, building, floor, capacity, equipment, status) VALUES
  ('fac-001', 'CS210', 'classroom', 'Computer Science Building', 2, 30, 'Projector, Whiteboard, 30 Desks', 'available'),
  ('fac-002', 'Lab E3', 'laboratory', 'Engineering Building', 3, 25, 'Lab Equipment, Computers, Safety Equipment', 'available'),
  ('fac-003', 'Room B115', 'classroom', 'Business Building', 1, 35, 'Projector, Whiteboard', 'available'),
  ('fac-004', 'Room M302', 'classroom', 'Mathematics Building', 3, 25, 'Smart Board, Projector', 'available'),
  ('fac-005', 'Main Auditorium', 'auditorium', 'Main Building', 1, 500, 'Stage, Sound System, Projection', 'available')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  facility_type = VALUES(facility_type),
  building = VALUES(building),
  capacity = VALUES(capacity);

-- Resources seed data
INSERT INTO resources (id, name, resource_type, description, quantity_total, quantity_available, location, department) VALUES
  ('res-001', 'Laptop Set A', 'equipment', 'Dell Laptops for student use', 20, 18, 'Computer Lab E3', 'Computer Science'),
  ('res-002', 'MATLAB License', 'software_license', 'MATLAB Academic License', 50, 45, 'Virtual', 'Engineering'),
  ('res-003', 'Projector Pro 5000', 'equipment', 'High-resolution projector', 10, 8, 'Equipment Room', 'IT Services'),
  ('res-004', 'Lab Equipment Set', 'equipment', 'Chemistry lab equipment', 5, 3, 'Chemistry Lab', 'Chemistry')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  quantity_available = VALUES(quantity_available);

-- Staff enhancements
UPDATE users SET phone = '555-0100', department = 'Administration', office_location = 'Admin Building 101' WHERE id = 'admin-001';
UPDATE users SET phone = '555-0101', department = 'Computer Science', office_location = 'CS Building 205' WHERE id = 'doctor-001';
UPDATE users SET phone = '555-0102', department = 'Student Services', office_location = 'Student Center 301' WHERE id = 'staff-001';

-- Office hours seed data
INSERT INTO office_hours (id, staff_id, day_of_week, start_time, end_time, location) VALUES
  ('oh-001', 'doctor-001', 'Monday', '10:00:00', '12:00:00', 'CS Building 205'),
  ('oh-002', 'doctor-001', 'Wednesday', '14:00:00', '16:00:00', 'CS Building 205'),
  ('oh-003', 'staff-001', 'Tuesday', '09:00:00', '11:00:00', 'Student Center 301'),
  ('oh-004', 'staff-001', 'Thursday', '13:00:00', '15:00:00', 'Student Center 301')
ON DUPLICATE KEY UPDATE
  start_time = VALUES(start_time),
  end_time = VALUES(end_time);

-- Parents seed data
INSERT INTO parents (id, name, email, phone, student_id, relationship) VALUES
  ('par-001', 'Maria Flores', 'maria.flores@email.com', '555-1001', 'stu-001', 'mother'),
  ('par-002', 'John Harper', 'john.harper@email.com', '555-1002', 'stu-002', 'father'),
  ('par-003', 'David Lee', 'david.lee@email.com', '555-1003', 'stu-003', 'father')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email);
