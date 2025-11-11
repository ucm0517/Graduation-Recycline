import os
import sys

# 환경 설정 (재시작 로직 포함)
if 'LD_PRELOAD' not in os.environ or not os.environ.get('RESTARTED'):
    os.environ['LD_PRELOAD'] = '/usr/lib/aarch64-linux-gnu/libgomp.so.1'
    os.environ['OMP_NUM_THREADS'] = '2'
    os.environ['RESTARTED'] = '1'
    os.execv(sys.executable, [sys.executable] + sys.argv)

import time
from datetime import datetime
import cv2
from ultralytics import YOLO


# GStreamer 카메라 파이프라인
def gstreamer_pipeline(capture_width=1280, capture_height=720,
                       display_width=640, display_height=480,
                       framerate=30, flip_method=0):
    return (
        f"nvarguscamerasrc ! video/x-raw(memory:NVMM), "
        f"width={capture_width}, height={capture_height}, "
        f"format=(string)NV12, framerate={framerate}/1 ! "
        f"nvvidconv flip-method={flip_method} ! "
        f"video/x-raw, width={display_width}, height={display_height}, "
        f"format=(string)BGRx ! videoconvert ! "
        f"video/x-raw, format=(string)BGR ! appsink drop=true max-buffers=1"
    )


def run():
    print("📦 모델 로드 중...")
    try:
        model = YOLO("best.pt")
        print("✅ 모델 로드 성공!")
    except Exception as e:
        print(f"❌ 모델 로드 실패: {e}")
        return

    print("\n🎥 카메라 시작 중...")
    cap = cv2.VideoCapture(gstreamer_pipeline(), cv2.CAP_GSTREAMER)
    
    if not cap.isOpened():
        print("❌ 카메라를 열 수 없습니다.")
        print("\n해결 방법:")
        print("1. 카메라 케이블 연결 확인")
        print("2. 다른 프로그램에서 카메라 사용 중인지 확인")
        print("3. 'ls /dev/video*' 명령으로 카메라 인식 확인")
        return

    print("✅ 카메라 열기 성공!")
    os.makedirs("image", exist_ok=True)
    print("\n▶ 사용법:")
    print("  - '1' 입력: 캡쳐 및 YOLO 추론")
    print("  - 'q' 입력: 종료")
    print("-" * 50)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("⚠️ 프레임 읽기 실패")
                continue

            # 화면에 실시간 표시
            cv2.imshow("📷 Live Camera View", frame)
            key = cv2.waitKey(1) & 0xFF

            # 터미널 입력 받기
            user_input = input("\n명령 입력 (1=캡쳐, q=종료): ").strip().lower()

            if user_input == '1':
                print("\n⏳ 3초 후 캡쳐...")
                for i in range(3, 0, -1):
                    print(f"   {i}...")
                    time.sleep(1)
                
                # 최신 프레임 가져오기
                ret, frame = cap.read()
                if not ret:
                    print("❌ 캡쳐 실패")
                    continue

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                img_path = f"image/{timestamp}.jpg"
                cv2.imwrite(img_path, frame)
                print(f"📸 원본 이미지 저장: {img_path}")

                # YOLO 추론
                print("🧠 YOLO 추론 중...")
                results = model.predict(
                    source=frame, 
                    imgsz=320, 
                    device=0,  # GPU 사용
                    half=True,  # FP16 사용
                    verbose=False
                )
                r = results[0]

                # 결과 처리
                if len(r.boxes) == 0:
                    print("❌ 객체 감지 안됨 → general trash")
                    class_name = "general trash"
                    annotated = frame.copy()
                    
                    # "No Object Detected" 텍스트 추가
                    cv2.putText(annotated, "No Object Detected", (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                else:
                    # 가장 높은 신뢰도의 객체 선택
                    boxes = r.boxes
                    scores = boxes.conf.cpu().numpy()
                    top_idx = scores.argmax()
                    best_box = boxes[top_idx]
                    
                    # 박스 정보 추출
                    xyxy = best_box.xyxy.cpu().numpy()[0]
                    cls_id = int(best_box.cls.cpu().numpy())
                    conf = float(best_box.conf.cpu().numpy())
                    class_name_raw = model.names[cls_id]
                    
                    # 클래스 이름 검증
                    valid_classes = ["plastic", "metal", "glass"]
                    class_name = class_name_raw.lower() if class_name_raw.lower() in valid_classes else "general trash"
                    
                    label = f"{class_name_raw} {conf:.2f}"
                    print(f"✅ 감지됨: {label}")

                    # 바운딩 박스 그리기
                    x1, y1, x2, y2 = map(int, xyxy)
                    annotated = frame.copy()
                    
                    # 박스 그리기
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 255), 2)
                    
                    # 텍스트 배경
                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
                    text_y = max(y1 - 10, th + 10)
                    cv2.rectangle(annotated, (x1, text_y - th - 4), 
                                (x1 + tw, text_y + 4), (0, 0, 0), -1)
                    
                    # 텍스트 그리기
                    cv2.putText(annotated, label, (x1, text_y), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

                # 결과 저장
                result_path = f"image/{timestamp}_result.jpg"
                cv2.imwrite(result_path, annotated)
                print(f"💾 결과 저장: {result_path}")
                print(f"🎯 최종 분류: {class_name}")

                # 결과 이미지 표시 (3초)
                cv2.imshow("🧠 YOLO Result", annotated)
                print("👀 결과 이미지를 3초간 표시합니다...")
                cv2.waitKey(3000)
                cv2.destroyWindow("🧠 YOLO Result")
                
                print("\n" + "=" * 50)

            elif user_input == 'q':
                print("\n👋 프로그램을 종료합니다.")
                break
            else:
                print("⚠️ 잘못된 입력입니다. '1' 또는 'q'를 입력하세요.")

    except KeyboardInterrupt:
        print("\n\n⚠️ Ctrl+C로 중단됨")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("🛑 카메라 및 창 정리 완료")


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 YOLO 카메라 테스트 프로그램")
    print("=" * 50)
    run()