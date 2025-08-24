# Raspberry Pi - Sensor & Servo Control

Raspberry Pi에서 실행되는 센서 및 서보모터 제어 코드입니다.

## 📋 파일 목록
- `rpi_ec2.py`: 메인 Python 스크립트
- `requirements.txt`: Python 의존성 패키지

## 🔧 하드웨어 제어
- **서보모터 (DS3120)**: 쓰레기 투입구 개폐
- **초음파 센서 (HC-SR04)**: 쓰레기통 채움도 측정
- **5인치 터치스크린**: 사용자 인터페이스

## 📊 센서 데이터 처리
- 초음파 거리 측정 → 채움도 퍼센트 변환
- 28cm(빈통 0%) ~ 5cm(꽉참 100%) 매핑
- 실시간 데이터를 EC2 서버로 전송

## 📡 통신
- **TCP Server**: Jetson Nano로부터 명령 수신
- **HTTP Client**: EC2 서버로 데이터 전송

## 🚀 설치 및 실행
```bash
# 의존성 설치  
pip install -r requirements.txt

# 프로그램 실행
python rpi_ec2.py
```
