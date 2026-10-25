# School Database Design

## Table Explanations
* **`students`**: Stores the core information about the students, including their unique ID, name, and a unique email address.
* **`courses`**: Stores the catalog of available courses, identified by a unique ID and a course name.
* **`enrolments`**: Acts as a bridge between students and courses. It records which student is taking which course and stores their final `grade`.

## Relationships
* **One-to-Many**: The relationship between `courses` and `enrolments`, and between `students` and `enrolments`, is one-to-many. One student can have many enrolments, but a single enrolment record belongs to only one student.
* **Many-to-Many**: The relationship between `students` and `courses` is many-to-many. A student can enroll in multiple courses, and a course can have multiple students. 

## Why a Join Table is Needed
A relational database cannot directly link a many-to-many relationship between two tables. If we tried to put `course_id`s inside the `students` table, we would violate database normalization rules and struggle to store multiple courses per student. The `enrolments` table (a join table) solves this by creating a record that links a `student_id` and a `course_id` together, while also providing a place to store data specific to that relationship, such as the `grade`.

## Index Recommendation
I would add an index on the `enrolments` table for the `student_id` column:
`CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`
**Reason:** When a student logs into the system to view their courses, the database will frequently run queries filtering by `student_id` (e.g., `WHERE student_id = 1`). An index on this column will significantly speed up these lookups, preventing the database from having to scan the entire enrolments table every time.

## SQL vs. NoSQL Recommendation
For this specific school system, I would choose **SQL** (Relational). The data is highly structured, and the relationships (students to courses) are strictly defined. SQL enforces data integrity through features like foreign keys and `UNIQUE` constraints (preventing duplicate enrolments), which is crucial for academic records. Furthermore, the requirement to generate specific reports using `JOIN` and `GROUP BY` makes SQL the perfect tool, as NoSQL databases often struggle with complex relational queries across multiple entities.