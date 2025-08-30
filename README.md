♻️ Recyclin: AI-Powered Smart Waste Sorting System
Recyclin is an integrated AI-based smart waste classification and monitoring system. It uses Jetson Nano for AI classification, Arduino UNO for stepper motor control, Raspberry Pi for hardware control, AWS EC2 for communication, and a React-based Web UI for real-time monitoring and management.
📦 System Overview
ComponentRoleJetson NanoClassifies waste using YOLOv8, orchestrates system control, sends commands via serial/TCPArduino UNOControls stepper motor for waste bin rotation based on classification resultsRaspberry PiControls servo motor & ultrasonic sensor, sends bin level to EC2EC2 ServerREST API + WebSocket bridge between devices and the web UIAdmin Web UIReact-based dashboard for admins to monitor and manage waste dataRaspberry Pi Display UIOn-site display showing real-time classification and bin levels (read-only)
🔄 System Workflow
[User throws waste]
    ↓
[Jetson Nano]
└─ YOLOv8 classifies waste
└─ Sends classification command to Arduino UNO (USB Serial)
└─ Notifies EC2 via POST /begin

[Arduino UNO]
└─ Receives class command from Jetson Nano
└─ Rotates stepper motor to target angle (based on class)
└─ Returns to home position after operation

[Jetson Nano] (after Arduino rotation)
└─ Sends class to Raspberry Pi (TCP)

[Raspberry Pi]
└─ Activates servo motor (bin opening)
└─ Measures distance with ultrasonic sensor
└─ Sends class + fill level to EC2 (POST /update)

[EC2 Server]
└─ Forwards data to Web UI via WebSocket

[Admin Dashboard (React)]
└─ Displays dashboard, statistics, logs

[On-site UI (Pi Display)]
└─ Shows latest classification + fill level
🌀 Stepper Motor Rotation by Class
Each waste class detected by Jetson Nano is sent to Arduino UNO, which controls the stepper motor rotation to physically sort the waste:
Waste Class (class_name)Motor AngleDescriptionplastic90°Arduino rotates to plastic binmetal180°Arduino rotates to metal/can binglass270°Arduino rotates to glass binothers (general waste)0° (default)No rotation, drops to general waste bin
The stepper motor operates at 6400 steps/rev (1/32 microstepping) for precision control via Arduino UNO.
🧠 Hardware Control Components
🟢 Jetson Nano (jetson_with_arduino.py)

Uses YOLOv8 to classify waste
Sends classification commands to Arduino UNO via USB Serial
Orchestrates overall system timing and control
Sends class to Raspberry Pi (TCP) after Arduino completes rotation
Sends POST /begin to EC2 to indicate task start

🔵 Arduino UNO (arduino_jet.ino) [NEW]

Receives classification commands from Jetson Nano via USB Serial
Controls TB6600 stepper motor driver with GPIO pins (PUL, DIR, ENA)
Executes precise rotation based on waste class
Handles entrance locking/unlocking (+90° rotation) for bin management
Returns to home position (0°) after each operation

🍓 Raspberry Pi (rpi_ec2.py)

Receives class from Jetson Nano (after Arduino rotation completion)
Activates servo motor to open the bin
Measures bin fill level using ultrasonic sensor
Sends { class, level } to EC2 via POST /update

☁️ EC2 Server (ec2_server.js)

Receives data from Jetson & Pi
Sends updates to React UI via WebSocket
Automatically reconnects if disconnected
Ports: 3001 (production), 3000 (local)

🖥️ Admin Web Dashboard (React)
Files: App.jsx, PrivateRoute.jsx, Layout.jsx, Dashboard.jsx, etc.
📂 Main Routes & Features
RouteDescription/admin/dashboardReal-time summary/admin/statisticsClassification charts/admin/logsWaste log table/admin/usersUser management (superadmin only)/pendingPending approval page/auth, /registerAuth & registration pages

Role-based access: admin, superadmin
Uses WebSocket for real-time updates
PrivateRoute ensures only authorized users can access protected pages

📺 Raspberry Pi On-Site UI

Displays classification result and bin level in real-time
Runs on Raspberry Pi-connected LCD/HDMI screen
Read-only interface for public/field use
Lightweight and designed for real-time responsiveness

⚙️ Technical Stack

Jetson Nano: Python, YOLOv8, OpenCV, GStreamer, Flask, Serial Communication
Arduino UNO: C++, Stepper Motor Control, TB6600 Driver, Serial Communication
Raspberry Pi: Python, RPi.GPIO, Servo & Ultrasonic control
EC2: Node.js WebSocket server, Express.js, MySQL
Web UI: React.js, React Router, WebSocket client

🔌 Communication Architecture
Jetson Nano ←USB Serial→ Arduino UNO ←GPIO→ Stepper Motor
     ↓ TCP Socket                    ↓
Raspberry Pi ←GPIO→ Servo Motor + Ultrasonic Sensor
     ↓ HTTP/WebSocket
EC2 Server ←→ React Admin Dashboard
📌 Notes

All devices must be on the same network or use port forwarding
Arduino UNO requires USB connection to Jetson Nano for serial communication
Each component operates in real-time and synchronously
Stepper motor control is now handled by dedicated Arduino for improved precision and reliability

🚀 Key Improvements with Arduino Integration

Dedicated Motor Control: Arduino UNO handles stepper motor control exclusively
Improved Precision: Reliable rotation accuracy with hardware-level control
System Stability: Motor control failures don't affect AI processing
Modular Design: Each component specialized for its primary function
