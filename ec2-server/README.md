# EC2 Server - Backend & API

EC2에서 실행되는 백엔드 서버 및 API 코드입니다.

## 📋 파일 목록
- `ec2_server.js`: 메인 Node.js 서버
- `package.json`: Node.js 의존성 패키지

## 🛠️ 주요 기능
- **REST API**: 디바이스 간 데이터 통신
- **WebSocket**: 실시간 웹 UI 업데이트  
- **MySQL 데이터베이스**: 분류 로그 및 채움도 저장
- **사용자 인증**: JWT 기반 로그인 시스템

## 📊 API 엔드포인트
- `POST /begin`: 분류 시작 신호
- `POST /upload`: 이미지 업로드
- `POST /update`: 채움도 데이터 업데이트
- `GET /data`: 실시간 상태 조회

## 🔐 데이터베이스
- **images 테이블**: 분류 이미지 및 결과 저장
- **levels 테이블**: 쓰레기통 채움도 기록
- **users 테이블**: 사용자 계정 관리

## 🚀 설치 및 실행
```bash
# 의존성 설치
npm install

# 서버 시작
node ec2_server.js
```
