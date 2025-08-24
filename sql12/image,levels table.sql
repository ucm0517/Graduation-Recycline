USE admin_system;
show tables;

# 이미지 테이블
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(50),
  filename VARCHAR(255),
  class VARCHAR(50),
  angle INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

select * from images;

# 레벨 테이블(라즈베리파이용)
CREATE TABLE levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(50),
  class VARCHAR(50),
  level INT,
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
select * from levels;