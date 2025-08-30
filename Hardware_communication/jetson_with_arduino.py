import os
import time
import socket
import serial  
from datetime import datetime
import cv2
from ultralytics import YOLO
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import Jetson.GPIO as GPIO 

# LED 핀 번호
LED_PIN = 20

# 환경 설정
os.environ['LD_PRELOAD'] = '/usr/lib/aarch64-linux-gnu/libgomp.so.1'
os.environ["OMP_NUM_THREADS"] = "2"

# Raspberry Pi 정보
PI_HOST = '192.168.122.20'
PI_PORT = 9999

# 아두이노 시리얼 통신 설정
ARDUINO_PORT = '/dev/ttyACM0'  # 아두이노 포트 (또는 /dev/ttyUSB0)
ARDUINO_BAUD = 9600
arduino_serial = None

# EC2 주소
UI_BEGIN_ENDPOINT = "http://43.202.10.147:3001/begin"
UPLOAD_ENDPOINT = "http://43.202.10.147:3001/upload"

# Flask 앱
app = Flask(__name__)
CORS(app)

# 전역 상태
is_processing = False   
is_locked = False   
last_started_time = 0 

# LED 초기화 
def setup_led():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.output(LED_PIN, GPIO.HIGH)  # LED 켜기
    print("LED 켜짐 - 젯슨 시스템 동작 중")

def cleanup_led():
    GPIO.output(LED_PIN, GPIO.LOW)  # LED 끄기
    GPIO.cleanup()
    print("LED 꺼짐 - 시스템 종료")
    
# 아두이노 연결 및 초기화
def setup_arduino():
    global arduino_serial
    try:
        arduino_serial = serial.Serial(ARDUINO_PORT, ARDUINO_BAUD, timeout=2)
        time.sleep(3)  # 아두이노 초기화 대기
        print(f"아두이노 연결 성공: {ARDUINO_PORT}")
        
        # 연결 테스트
        send_to_arduino("test")
        return True
        
    except Exception as e:
        print(f"아두이노 연결 실패: {e}")
        print(" - USB 케이블 확인")
        print(" - 권한 설정: sudo chmod 666 /dev/ttyACM0")
        arduino_serial = None
        return False

def send_to_arduino(message):
    global arduino_serial
    if arduino_serial and arduino_serial.is_open:
        try:
            message_bytes = (message + '\n').encode('utf-8')
            arduino_serial.write(message_bytes)
            print(f"아두이노로 전송: '{message}'")
            
            time.sleep(0.1)
            if arduino_serial.in_waiting > 0:
                response = arduino_serial.readline().decode('utf-8').strip()
                print(f"아두이노 응답: {response}")
                
            return True
        except Exception as e:
            print(f"아두이노 전송 실패: {e}")
            return False
    else:
        print("아두이노가 연결되지 않음")
        return False

def send_class_to_pi(class_name):
    """라즈베리파이에 소켓 신호 전송"""
    try:
        print(f"라즈베리파이 소켓 연결 시도")
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((PI_HOST, PI_PORT))
            s.sendall(class_name.encode())
            print(f"'{class_name}' → 라즈베리파이에 전송 완료")
            return True
    except Exception as e:
        print(f"라즈베리파이 전송 실패: {e}")
        return False


def notify_ui_begin():
    """UI 시작 신호 전송"""
    try:
        res = requests.post(UI_BEGIN_ENDPOINT)
        print(f"UI에 처리 시작 알림 전송 완료: {res.status_code}")
    except Exception as e:
        print(f"UI 처리 시작 알림 실패: {e}")

def send_image_to_server(filepath, class_name, angle):
    if not os.path.exists(filepath):
        print(f"이미지 없음: {filepath}")
        return
    try:
        files = {"image": open(filepath, "rb")}
        data = {"class": class_name, "angle": str(angle), "device_id": "jetson"}
        res = requests.post(UPLOAD_ENDPOINT, files=files, data=data)
        if res.status_code == 200:
            print(f"이미지 업로드 성공: {filepath}")
            print(res.json())
        else:
            print(f"업로드 실패: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"이미지 업로드 실패: {e}")
        
def gstreamer_pipeline(capture_width=1280, capture_height=720,
                        display_width=640, display_height=480,
                        framerate=30, flip_method=0):
    """GStreamer 파이프라인 설정"""
    return (
        f"nvarguscamerasrc ! video/x-raw(memory:NVMM), width={capture_width}, height={capture_height}, format=(string)NV12, framerate={framerate}/1 ! "
        f"nvvidconv flip-method={flip_method} ! video/x-raw, width={display_width}, height={display_height}, format=(string)BGRx ! "
        f"videoconvert ! video/x-raw, format=(string)BGR ! appsink"
    )

def check_trash_level(class_name):
    try:
        
         # DB에서 최신 데이터 조회
        res = requests.get("http://43.202.10.147:3001/api/levels")
        
        if not res.ok:
            print(f"채움률 API 요청 실패: {res.status_code}")
            return 0
            
        level_data = res.json()
        print(f"DB에서 조회한 전체 레벨 데이터: {level_data}")
        
        # API 응답 형식에 맞게 파싱
        for item in level_data:
            if item.get('type') == class_name:
                level = item.get('level', 0)
                print(f"DB에서 조회: {class_name} = {level}%")
                return level
        
        print(f"DB에서 {class_name} 데이터를 찾을 수 없음")
        return 0
        
    except Exception as e:
        print(f"채움률 확인 실패: {e}")
        return 0

def control_step_motor_arduino_with_blocking(class_name):
    class_name = class_name.lower().strip()
    
    print(f"[🎯 아두이노 통합 제어] 클래스: {class_name}")
    
    # 1단계: 아두이노로 분류 명령 전송 (회전 시작)
    print(f"📤 아두이노에 분류 신호 전송: {class_name}")
    arduino_success = send_to_arduino(class_name)
    
    if not arduino_success:
        print("❌ 아두이노 통신 실패 - 시스템 중단")
        return False
    
    # 2단계: 아두이노 회전 완료 대기
    if class_name == "general trash":
        rotation_time = 0  # 일반쓰레기는 회전 없음
    else:
        rotation_time = 2.5  # 회전 시간 (90도 기준 약 2.5초)
    
    if rotation_time > 0:
        print(f"⏰ 아두이노 회전 완료 대기 중... ({rotation_time}초)")
        time.sleep(rotation_time)
    
    # 측정 전 현재 레벨 저장 (중요!)
    old_level = get_current_level_quick(class_name)
    print(f"측정 전 레벨: {class_name} = {old_level}%")
    
    pi_success = send_class_to_pi(class_name)
    if not pi_success:
        return False
    
    # 4단계: 기존 시간은 유지 (시간 안 늘림)
    if class_name == "general trash":
        remaining_time = 4  # 유지
    else:
        remaining_time = 5  # 유지
    
    print(f"아두이노 전체 동작 완료 대기 중... ({remaining_time}초)")
    time.sleep(remaining_time)
    
    # 5단계: 새로운 측정값 확인 (시간 늘리지 않고 똑똑하게)
    final_level = check_for_new_level(class_name, old_level, max_checks=5)
    
    print(f"{class_name} 최종 채움률: {final_level}%")
    
    # 나머지 입구 막기 로직은 기존과 동일
    if final_level >= 80:
        print(f"🚫 {class_name} 쓰레기통이 꽉 참 ({final_level}%) - 입구를 막습니다")
        
        if class_name == "general trash":
            block_success = send_to_arduino("block_entrance")
            if block_success:
                time.sleep(3)
                print("일반쓰레기 입구 막기 완료")
        else:
            block_success = send_to_arduino("block_entrance")
            if block_success:
                time.sleep(3)
                print(f"{class_name} 입구 막기 완료")
    else:
        print(f"{class_name} 쓰레기통 정상 ({final_level}%) - 계속 사용 가능")
    
    return True

def get_current_level_quick(class_name):
    try:
        res = requests.get("http://43.202.10.147:3001/api/levels", timeout=3)
        if res.ok:
            level_data = res.json()
            for item in level_data:
                if item.get('type') == class_name:
                    return item.get('level', 0)
    except:
        pass
    return 0

def check_for_new_level(class_name, old_level, max_checks=5):
    print(f"새로운 측정값 확인 중... (기준값: {old_level}%)")
    
    for i in range(max_checks):
        current_level = get_current_level_quick(class_name)
        print(f"체크 {i+1}: {current_level}%")
        
        # 새로운 값이 감지되면 즉시 반환
        if current_level != old_level:
            print(f"새로운 값 감지: {old_level}% → {current_level}%")
            return current_level
        
        # 마지막 체크가 아니면 2초 대기
        if i < max_checks - 1:
            time.sleep(2)
    
    print(f"새로운 값 감지되지 않음 - 현재값 사용: {current_level}%")
    return current_level


def run_once():
    """메인 분류 처리 함수"""
    global is_processing
    print("📦 모델 로드 중...")
    try:
        model = YOLO("best.pt")
        print("모델 로드 완료")
    except Exception as e:
        print(f"모델 로드 실패: {e}")
        is_processing = False
        return

    cap = cv2.VideoCapture(gstreamer_pipeline(), cv2.CAP_GSTREAMER)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        print("🚨 카메라 열기 실패")
        is_processing = False
        return

    try:
        time.sleep(3)
        notify_ui_begin()
        
        # 초기 프레임 버퍼 비우기
        for _ in range(5): 
            cap.read()
            
        ret, frame = cap.read()
        if not ret:
            print("프레임 캡처 실패")
            return

        # 이미지 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        img_path = f"image/{timestamp}.jpg"
        os.makedirs("image", exist_ok=True)
        cv2.imwrite(img_path, frame)
        print(f"원본 이미지 저장 완료: {img_path}")

        # AI 모델 예측
        results = model.predict(source=frame, imgsz=320, device=0, half=True, verbose=False)
        r = results[0]

        # 기본값 설정
        class_name = "general trash"
        annotated = frame.copy()

        if len(r.boxes) == 0:
            print("객체 없음 → 일반쓰레기")
        else:
            boxes = r.boxes
            top_idx = boxes.conf.cpu().numpy().argmax()
            best_box = boxes[top_idx]
            xyxy = best_box.xyxy.cpu().numpy()[0]
            cls_id = int(best_box.cls.cpu().numpy())
            class_name_raw = model.names[cls_id]
            valid_classes = ["general trash", "plastic", "metal", "glass"]
            class_name = class_name_raw.lower() if class_name_raw.lower() in valid_classes else "general trash"
            
            # label 정의 (신뢰도 포함)
            confidence = float(best_box.conf.cpu().numpy())
            label = f"{class_name_raw} {confidence:.2f}"
            print(f"객체 감지: {label}")
            
            # 바운딩 박스 그리기
            x1, y1, x2, y2 = map(int, xyxy)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 255), 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            text_y = y1 - 10 if y1 - 10 > th + 4 else y1 + th + 10
            cv2.rectangle(annotated, (x1, text_y - th - 4), (x1 + tw, text_y), (0, 0, 0), -1)
            cv2.putText(annotated, label, (x1, text_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # 결과 이미지 저장
        result_path = f"image/{timestamp}_result.jpg"
        cv2.imwrite(result_path, annotated)
        print(f"[{class_name}] 결과 이미지 저장 완료 → {result_path}")

        # 🔥 여기가 핵심 수정 부분: 실제 회전 각도 계산
        def get_rotation_angle(class_name):
            """분류에 따른 회전 각도 반환"""
            angle_map = {
                "general trash": 0,    # 0도 (회전 없음)
                "plastic": 90,         # 90도 회전
                "metal": 180,          # 180도 회전  
                "glass": 270           # 270도 회전
            }
            return angle_map.get(class_name, 0)

        # 실제 회전 각도 계산
        rotation_angle = get_rotation_angle(class_name)

        # 아두이노 + 라즈베리파이 통합 제어
        success = control_step_motor_arduino_with_blocking(class_name)
        
        if success:
            print(f"✅ [{class_name}] 아두이노 분류 및 입구 제어 완료")
        else:
            print(f"❌ [{class_name}] 분류 처리 실패")
        
        # 🔥 수정된 부분: 실제 회전 각도를 전달
        send_image_to_server(result_path, class_name, rotation_angle)
        print(f"📤 이미지 업로드 완료 - 각도: {rotation_angle}도")

    except Exception as e:
        print(f"처리 중단: {e}")
    finally:
        try:
            cap.release()
            cv2.destroyAllWindows()
        except Exception as e:
            print(f"정리 중 오류: {e}")

        is_processing = False
        print("처리 완료 및 자원 해제")

@app.route("/start", methods=["POST"])
def start():
    """분류 시작 API"""
    global is_processing, last_started_time
    now = time.time()
    if is_processing or (now - last_started_time < 3):
        return "Already processing", 429
    last_started_time = now
    is_processing = True
    threading.Thread(target=run_once).start()
    return "Started", 200

@app.route("/empty_check_all", methods=["POST"])
def empty_check_all():
    global is_processing, is_locked
    if is_processing:
        return jsonify({"status": "busy"}), 409

    is_processing = True
    try:
        print("[전체 비움 확인 시작]")

        print("[비움 확인 전 입구 해제]")
        unblock_success = send_to_arduino("unblock_entrance") 
        if unblock_success:
            time.sleep(2) 
            print("입구 해제 완료")
        else:
            print("입구 해제 실패")

        levels = {}
        
        check_sequence = [
            ("check:general trash", "general trash"),  # 0도에서 측정 (회전 없음)
            ("check:plastic", "plastic"),              # 0→90도
            ("check:metal", "metal"),                  # 90→180도  
            ("check:glass", "glass"),                  # 180→270도
            ("empty_check_home", None)                 # 270→0도 (복귀만)
        ]
        
        for arduino_cmd, class_name in check_sequence:
            if class_name is None:  # 복귀 명령
                print(f"[복귀] 원점으로 복귀 중...")
                success = send_to_arduino(arduino_cmd)
                time.sleep(1.5)  
                continue
                
            print(f"[🔄 비움 확인] {class_name} 위치에서 측정 중...")
            
            # 아두이노로 위치 이동 (또는 현재 위치에서 측정)
            success = send_to_arduino(arduino_cmd)
            if not success:
                print(f"아두이노 통신 실패: {arduino_cmd}")
                levels[class_name] = -1
                continue
                
            # 회전 대기 시간
            if class_name == "general trash":
                time.sleep(0.5)  
            else:
                time.sleep(1.0)  
            
            # 라즈베리파이로 측정 명령
            pi_success = send_class_to_pi(f"check:{class_name}")
            if pi_success:
                time.sleep(3)  
            else:
                print(f"라즈베리파이 통신 실패: {class_name}")
                levels[class_name] = -1
                continue

            # 결과 확인
            try:
                res = requests.get("http://43.202.10.147:3001/data", timeout=2)
                level_data = res.json()
                level = level_data.get(class_name, -1)
                levels[class_name] = level
                print(f"{class_name} 측정 결과: {level}%")
            except Exception as e:
                print(f"데이터 조회 실패: {e}")
                levels[class_name] = -1

        # 비움 상태 확인 
        if all(levels[c] >= 0 and levels[c] < 80 for c in levels):
            is_locked = False
            print("모든 클래스가 비워짐 → 분류 가능 상태로 전환")
            return jsonify({
                "status": "cleared",
                "levels": levels
            }), 200
        else:
            is_locked = True
            print("아직 꽉 찬 클래스 있음 → 비움 확인 반복 필요")
            
            print("꽉 찬 쓰레기통이 남아있어 입구를 막습니다")
            block_success = send_to_arduino("block_entrance")
            if block_success:
                time.sleep(2)
                print("비움 확인 후 입구 막기 완료")
            else:
                print("비움 확인 후 입구 막기 실패")
            
            return jsonify({
                "status": "still_full",
                "levels": levels
            }), 200

    except Exception as e:
        print(f"empty_check_all 에러: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        is_processing = False

@app.route("/test_arduino", methods=["POST"])
def test_arduino():
    """아두이노 테스트 API"""
    try:
        data = request.json or {}
        message = data.get('message', 'test')
        
        success = send_to_arduino(message)
        
        if success:
            return jsonify({"status": "success", "message": f"Sent '{message}' to Arduino"}), 200
        else:
            return jsonify({"status": "error", "message": "Arduino communication failed"}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    print("젯슨 나노 + 아두이노 시스템 시작")
    
    # LED 초기화
    try:
        setup_led()
    except Exception as e:
        print(f"LED 초기화 실패: {e}")
    
    # 아두이노 연결
    arduino_connected = setup_arduino()
    
    if arduino_connected:
        print("  아두이노 모드로 실행 - 메인 모터 제어: 아두이노")
        print("  사용 가능한 API:")
        print("  - POST /start : 분류 시작")
        print("  - POST /empty_check_all : 비움 확인")
        print("  - POST /test_arduino : 아두이노 테스트")
        
        try:
            app.run(host="0.0.0.0", port=3002, debug=False)
        except KeyboardInterrupt:
            print("\n⏹사용자에 의한 프로그램 중단")
        finally:
            cleanup_led()  # 프로그램 종료 시 LED 끄기
    else:
        print("아두이노 연결 실패 - 시스템을 종료합니다")
        print("해결 방법:")
        print("1. 아두이노 USB 연결 확인")
        print("2. 포트 권한 설정: sudo chmod 666 /dev/ttyACM0")
        print("3. 아두이노 전원 및 코드 업로드 확인")
        cleanup_led()  # 실패 시에도 LED 끄기
        exit(1)