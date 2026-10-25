-- ==========================================
-- 1. CREATE TABLE STATEMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE -- Required: UNIQUE student email
);

CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    -- Foreign Keys linking the tables
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    -- Rule preventing the same student enrolling on the same course twice
    UNIQUE (student_id, course_id) 
);

-- ==========================================
-- 2. INSERT STATEMENTS
-- ==========================================

-- 3 Students
INSERT INTO students (name, email) VALUES 
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com');

-- 3 Courses
INSERT INTO courses (course_name) VALUES 
('Introduction to SQL'),
('Web Development'),
('Data Science');

-- 5 Enrolments (Note: Charlie has no enrolments to satisfy the LEFT JOIN query later)
INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'A'), -- Alice in SQL
(1, 2, 'B'), -- Alice in Web Dev
(2, 1, 'C'), -- Bob in SQL
(2, 3, 'A'), -- Bob in Data Science
(3, 2, 'B'); -- Charlie in Web Dev

-- ==========================================
-- 3. THE FIVE REQUIRED QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name). Using a standard JOIN.
SELECT courses.course_name 
FROM courses 
JOIN enrolments ON courses.course_id = enrolments.course_id 
JOIN students ON enrolments.student_id = students.student_id 
WHERE students.name = 'Alice Smith';

-- Query 2: All students on one course.
SELECT students.name 
FROM students 
JOIN enrolments ON students.student_id = enrolments.student_id 
JOIN courses ON enrolments.course_id = courses.course_id 
WHERE courses.course_name = 'Introduction to SQL';

-- Query 3: The number of students per course. Using GROUP BY.
SELECT courses.course_name, COUNT(enrolments.student_id) AS student_count
FROM courses 
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id 
GROUP BY courses.course_name;

-- Query 4: Students who have no enrolments. Using LEFT JOIN.
-- A LEFT JOIN returns all students, and the WHERE clause filters for those where no enrolment was found (IS NULL).
SELECT students.name 
FROM students 
LEFT JOIN enrolments ON students.student_id = enrolments.student_id 
WHERE enrolments.enrolment_id IS NULL;

-- Query 5: An update of one enrolment's grade.
UPDATE enrolments 
SET grade = 'A' 
WHERE student_id = 2 AND course_id = 1; -- Changing Bob's grade in SQL from C to A