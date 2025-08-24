int PUL = 7;  // Pulse
int DIR = 6;  // Direction
int ENA = 5;  // Enable

const int FULL_ROTATION_STEPS = 6400;
const int PULSE_DELAY = 200; // μs

void setup() {
  pinMode(PUL, OUTPUT);
  pinMode(DIR, OUTPUT);
  pinMode(ENA, OUTPUT);

  digitalWrite(PUL, LOW);
  digitalWrite(DIR, LOW);
  digitalWrite(ENA, HIGH);
  
  Serial.begin(9600);
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toLowerCase();

    // 비움 확인 명령들
    if (cmd == "check:general trash") {
      handleEmptyCheckStart();
    } else if (cmd == "check:plastic") {
      handleEmptyCheck(1600);
    } else if (cmd == "check:metal") {
      handleEmptyCheck(1600);
    } else if (cmd == "check:glass") {
      handleEmptyCheck(1600);
    } else if (cmd == "empty_check_home") {
      handleEmptyCheckHome();
    }
    // 일반 분류 명령들
    else if (cmd == "plastic") {
      handleRotationWithWait(1600);
    } else if (cmd == "metal") {
      handleRotationWithWait(3200);
    } else if (cmd == "glass") {
      handleRotationWithWait(4800);
    } else if (cmd == "general trash") {
      handleGeneralTrash();
    }
    // 입구 제어 명령들
    else if (cmd == "return_home") {
      handleReturnHome();
    } else if (cmd == "block_entrance") {
      handleBlockEntrance();
    } else if (cmd == "unblock_entrance") {
      handleUnblockEntrance();
    }
  }
}

// 분류용 회전 처리: 회전 → 대기 → 복귀
void handleRotationWithWait(int steps) {
  rotateSteps(steps, true);     // 반시계 방향 회전
  delay(8000);                  // 라즈베리파이 동작 대기
  rotateSteps(steps, false);    // 시계 방향 복귀
}

// 일반쓰레기 처리: 회전 없이 대기만
void handleGeneralTrash() {
  delay(5000);  // 라즈베리파이 동작 대기
}

// 홈 위치로 복귀
void handleReturnHome() {
  rotateSteps(4800, false);  // 270도 시계방향 복귀
}

// 입구 차단: +90도 회전
void handleBlockEntrance() {
  rotateSteps(1600, true);   // 90도 반시계 회전
}

// 입구 개방: -90도 회전
void handleUnblockEntrance() {
  rotateSteps(1600, false);  // 90도 시계 회전
}

// 비움 확인 시작: 0도에서 측정
void handleEmptyCheckStart() {
  delay(2500);  // 라즈베리파이 측정 대기
}

// 비움 확인: 해당 위치로 이동 후 측정
void handleEmptyCheck(int steps) {
  rotateSteps(steps, true);  // 반시계 방향 회전
  delay(2500);               // 라즈베리파이 측정 대기
}

// 비움 확인 완료: 홈으로 복귀
void handleEmptyCheckHome() {
  rotateSteps(4800, false);  // 270도 복귀
}

// 스테퍼 모터 회전 실행
void rotateSteps(int steps, bool counterClockwise) {
  digitalWrite(DIR, counterClockwise ? LOW : HIGH);
  delay(50);

  for (int i = 0; i < steps; i++) {
    digitalWrite(PUL, HIGH);
    delayMicroseconds(PULSE_DELAY);
    digitalWrite(PUL, LOW);
    delayMicroseconds(PULSE_DELAY);
  }
}