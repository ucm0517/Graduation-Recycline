import socket
import RPi.GPIO as GPIO
import time
import requests

# ------------------ 핀 설정 ------------------
PUL_PIN = 18
DIR_PIN = 23
ENA_PIN = 24
SERVO_PIN = 19    # 서보모터 PWM
TRIG = 16         # 초음파 센서 트리거
ECHO = 20         # 초음파 센서 에코

FULL_ROTATION_STEPS = 6400
STEPS_FOR_90 = FULL_ROTATION_STEPS // 4
STEPS_FOR_180 = FULL_ROTATION_STEPS // 2
STEPS_FOR_270 = FULL_ROTATION_STEPS * 3 // 4
PULSE_DELAY = 0.00005

UI_ENDPOINT = "http://43.202.10.147:3001/update"

def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(PUL_PIN, GPIO.OUT)
    GPIO.setup(DIR_PIN, GPIO.OUT)
    GPIO.setup(ENA_PIN, GPIO.OUT)
    GPIO.output(ENA_PIN, GPIO.LOW)
    GPIO.setup(SERVO_PIN, GPIO.OUT)
    global pwm
    pwm = GPIO.PWM(SERVO_PIN, 50)
    pwm.start(0)

    GPIO.setup(TRIG, GPIO.OUT)
    GPIO.setup(ECHO, GPIO.IN)

def move_steps(steps, direction):
    GPIO.output(DIR_PIN, GPIO.LOW if direction == 'forward' else GPIO.HIGH)
    for _ in range(steps):
        GPIO.output(PUL_PIN, GPIO.HIGH)
        time.sleep(PULSE_DELAY)
        GPIO.output(PUL_PIN, GPIO.LOW)
        time.sleep(PULSE_DELAY)

def set_angle(angle):
    min_duty = 2.5 # 0도 위치
    max_duty = 12.5 # 180도 위치
    
    # 선형 보간으로 듀티 사이클 계산
    duty = min_duty + (angle / 180.0) * (max_duty - min_duty)
    
    pwm.ChangeDutyCycle(duty)
    time.sleep(1)  # 서보모터 이동 대기
    pwm.ChangeDutyCycle(0)  # PWM 신호 중지
    
def servo_sequence():
    # 쓰레기 투입 시퀀스
    # 중앙(90도) → 투입 허용(180도) → 중앙 복귀(90도)
    
    print("▶ +90도 (180도) 회전")
    set_angle(180)
    time.sleep(1.0)

    print("↩ 중앙 (90도) 복귀")
    set_angle(90)
    time.sleep(1.0)
    
    #  서보모터 완전 복귀 후 추가 안정화 시간
    print("⏰ 서보모터 안정화 대기...")
    time.sleep(0.5)

def measure_distance():
    #  측정 전 트리거 핀 안정화
    GPIO.output(TRIG, False)
    time.sleep(0.1)  # 0.05초 → 0.1초로 증가
    
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    timeout = time.time() + 0.04
    pulse_start = None
    pulse_end = None

    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()
        if time.time() > timeout:
            return -1

    timeout = time.time() + 0.04
    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()
        if time.time() > timeout:
            return -1

    if pulse_start is None or pulse_end is None:
        return -1

    pulse_duration = pulse_end - pulse_start
    distance = pulse_duration * 17150
    return round(distance, 2)

def convert_distance_to_percentage(dist):
    if dist == -1:
        return -1  # 측정 실패
    elif dist >= 28.0:  #  28cm 이상 빈 통
        return 0
    elif dist <= 5:
        return 100
    else:
        # 28cm(빈통) ~ 5cm(꽉참) 사이의 선형 변환
        percentage = int(100 - ((dist - 5) / (28 - 5)) * 100)
        return max(0, min(100, percentage))  # 0~100% 범위 보장

def send_level_to_ui(class_name, level):
    try:
        data = {"class": class_name, "level": level}
        res = requests.post(UI_ENDPOINT, json=data)
        print(f"📡 UI 전송 완료: {res.status_code} {data}")
    except Exception as e:
        print(f"❌ UI 전송 실패: {e}")

def handle_class(class_name):
    if class_name.startswith("check:"):
        # 모드 1: 비움 확인 (측정만)
        check_class = class_name.split(":", 1)[1]
        print(f"[🔍 비움확인 요청 수신: {check_class}]")
        
        # 비움 확인 시 안정화 대기
        print("⏰ 젯슨 회전 완료 대기...")
        time.sleep(0.3)
        
        # ✅ 1회 측정으로 변경
        print(f"[📏 측정] {check_class} 초음파 측정...")
        dist = measure_distance()
        
        if dist != -1:
            level = convert_distance_to_percentage(dist)
            print(f"[초음파] {check_class} - 거리: {dist}cm → 채움도: {level}%")
        else:
            level = -1
            print(f"[초음파] {check_class} - 측정 실패")
            
        send_level_to_ui(check_class, level)
        return
    
    # 모드 2: 일반 분류 (투입 + 측정)
    print(f"[📥 Pi 동작 시작: {class_name}]")
    
    # ✅ 젯슨 회전 완료 대기
    print("⏰ 젯슨 회전 및 안정화 대기...")
    time.sleep(0.5)
    
    # ✅ 서보모터로 쓰레기 투입
    print(f"[서보모터] {class_name} 쓰레기 투입")
    servo_sequence()

    # ✅ 1회 측정으로 변경 (속도 향상)
    print(f"[📏 측정] {class_name} 쓰레기통 측정...")
    dist = measure_distance()
    
    if dist != -1:
        level = convert_distance_to_percentage(dist)
        print(f"[초음파] {class_name} - 거리: {dist}cm → 채움도: {level}%")
    else:
        level = -1
        print(f"[초음파] {class_name} - 측정 실패")
    
    send_level_to_ui(class_name, level)

def start_server():
    setup()
    HOST = ''
    PORT = 9999
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))
        s.listen()
        print("🚪 모터 제어 서버 대기 중...")
        print("📍 라즈베리파이는 고정 위치에서 대기 (젯슨이 회전)")
        print("⚡ 초음파 측정 1회로 최적화 (속도 향상)")

        try:
            while True:
                conn, addr = s.accept()
                with conn:
                    print(f"📥 연결됨: {addr}")
                    class_name = conn.recv(1024).decode().strip()
                    print(f"📦 수신된 분류: {class_name}")
                    handle_class(class_name)

        except KeyboardInterrupt:
            pass
        finally:
            GPIO.output(ENA_PIN, GPIO.HIGH)
            pwm.stop()
            GPIO.cleanup()
            print("🛑 서버 종료 및 GPIO 정리 완료")

if __name__ == "__main__":
    start_server()