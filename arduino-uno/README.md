# Arduino UNO - Stepper Motor Control

이 폴더에는 스테퍼모터 제어를 위한 Arduino 코드가 포함되어 있습니다.

## 📋 파일 목록
- `arduino_jet.ino`: 메인 Arduino 스케치
- 스테퍼모터 정밀 제어 (6400 steps/revolution)
- USB Serial 통신으로 Jetson과 연결

## 🔧 하드웨어 연결
- **PUL 핀 (Digital 7)**: 스테퍼모터 펄스 신호
- **DIR 핀 (Digital 6)**: 회전 방향 제어
- **ENA 핀 (Digital 5)**: 모터 활성화

## 📡 통신 프로토콜
- **Jetson → Arduino**: USB Serial (9600 baud)
- **명령어 예시**: "plastic", "metal", "glass", "general trash"

## 🎯 회전 각도
- 플라스틱: 90° (1600 steps)
- 금속: 180° (3200 steps)  
- 유리: 270° (4800 steps)
- 일반쓰레기: 0° (회전 없음)

## 🚀 설치 방법
1. Arduino IDE 설치
2. `arduino_jet.ino` 파일 열기
3. Arduino UNO 보드에 업로드
4. Jetson Nano와 USB 케이블로 연결
