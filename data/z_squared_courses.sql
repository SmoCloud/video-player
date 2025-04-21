DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
  course_id int NOT NULL AUTO_INCREMENT,
  course_name varchar(255),
  course_desc varchar(255),
  instructor_id int,
  PRIMARY KEY (course_id)
);