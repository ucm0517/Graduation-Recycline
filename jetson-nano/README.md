# Jetson Nano - AI Classification & System Control

Jetson Nano에서 실행되는 AI 분류 및 시스템 제어 코드입니다.

## 📋 파일 목록
- `jetson_with_arduino.py`: 메인 Python 스크립트
- `best.pt`: YOLOv8 모델 가중치 파일
- `requirements.txt`: Python 의존성 패키지

## 🧠 주요 기능
- **YOLOv8 AI 모델**로 쓰레기 실시간 분류
- **USB Serial 통신**으로 Arduino 제어
- **TCP Socket 통신**으로 Raspberry Pi 연결
- **HTTP API 통신**으로 EC2 서버와 데이터 교환

## 📡 통신 구조
```
Jetson Nano ←USB Serial→ Arduino UNO
     ↓ TCP Socket
Raspberry Pi
     ↓ HTTP
EC2 Server
```

## 🚀 설치 및 실행
```bash
# 의존성 설치
pip install -r requirements.txt

# 프로그램 실행
python jetson_with_arduino.py
```

## ⚙️ 요구사항
- CUDA 지원 Jetson Nano
- CSI 카메라 모듈
- Arduino UNO (USB 연결)
- 네트워크 연결
