/*
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

ALTER TABLE users
ADD COLUMN name VARCHAR(100) NOT NULL AFTER email;
*/

DROP TABLE IF EXISTS users; -- (기존 테이블 삭제하고 새로 만들 때만)
CREATE DATABASE admin_system;
USE admin_system;


select * from users;



/*삭제 쿼리*/
DELETE FROM users WHERE id = 2;
TRUNCATE TABLE users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('pending', 'admin', 'superadmin') DEFAULT 'pending',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (email, name, password, role, approved)
VALUES (
  'ucm0517@gmail.com',
  '관리자',
  '$2b$10$M.HmYRj807AkH1G6T2H5Ee1eVqKJoXhaSreWiKp.if5OnA6rSC78G',
  'superadmin',
  true
);
/*
$2b$10$M.HmYRj807AkH1G6T2H5Ee1eVqKJoXhaSreWiKp.if5OnA6rSC78G
*/

