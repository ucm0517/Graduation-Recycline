♻️ Recyclin: AI-Powered Smart Waste Sorting System

Recyclin is an integrated AI-based smart waste classification and monitoring system.
It uses Jetson Nano for AI classification, Raspberry Pi for hardware control, AWS EC2 for communication, and a React-based Web UI for real-time monitoring and management.

📦 System Overview
| Component                   | Role                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| **Jetson Nano**             | Classifies waste using YOLOv8, controls stepper motor, sends class to Raspberry Pi |
| **Raspberry Pi**            | Controls servo motor & ultrasonic sensor, sends bin level to EC2                   |
| **EC2 Server**              | REST API + WebSocket bridge between devices and the web UI                         |
| **Admin Web UI**            | React-based dashboard for admins to monitor and manage waste data                  |
| **Raspberry Pi Display UI** | On-site display showing real-time classification and bin levels (read-only)        |


🔄 System Workflow

[User throws waste]

        ↓
        
[Jetson Nano]
 
 └─ YOLOv8 classifies waste
 
 └─ Rotates stepper motor (based on class)
 
 └─ Sends class to Raspberry Pi (TCP)
 
 └─ Notifies EC2 via POST /begin

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
Each waste class detected by Jetson Nano corresponds to a specific stepper motor rotation angle to physically sort the waste:
| Waste Class (`class_name`) | Motor Angle  | Description                |
| -------------------------- | ------------ | -------------------------- |
| `plastic`                  | 90°          | Rotates to plastic bin     |
| `metal`                    | 180°         | Rotates to metal/can bin   |
| `glass`                    | 270°         | Rotates to glass bin       |
| others (general waste)     | 0° (default) | Drops to general waste bin |

The stepper motor operates at 6400 steps/rev (1/32 microstepping) for precision.

🧠 Hardware Control Components
🟢 Jetson Nano (jet_ec2.py)
- Uses YOLOv8 to classify waste
- Controls the stepper motor based on the class
- Sends the class to Raspberry Pi (TCP)
- Sends a POST /begin to EC2 to indicate task start

🍓 Raspberry Pi (rpi_ec2.py)
- Receives class from Jetson Nano
- Activates servo motor to open the bin
- Measures bin fill level using ultrasonic sensor
- Sends { class, level } to EC2 via POST /update

☁️ EC2 Server (server.js)
- Receives data from Jetson & Pi
- Sends updates to React UI via WebSocket
- Automatically reconnects if disconnected
- Ports: 8080 (production), 3000 (local)

🖥️ Admin Web Dashboard (React)
Files: App.jsx, PrivateRoute.jsx, Layout.jsx, Dashboard.jsx, etc.

📂 Main Routes & Features
| Route                | Description                       |
| -------------------- | --------------------------------- |
| `/admin/dashboard`   | Real-time summary                 |
| `/admin/statistics`  | Classification charts             |
| `/admin/logs`        | Waste log table                   |
| `/admin/users`       | User management (superadmin only) |
| `/pending`           | Pending approval page             |
| `/auth`, `/register` | Auth & registration pages         |

- Role-based access: admin, superadmin
- Uses WebSocket for real-time updates
- PrivateRoute ensures only authorized users can access protected pages

📺 Raspberry Pi On-Site UI
- Displays classification result and bin level in real-time
- Runs on Raspberry Pi-connected LCD/HDMI screen
- Read-only interface for public/field use
- Lightweight and designed for real-time responsiveness

⚙️ Technical Stack
- Jetson Nano: Python, YOLOv8, OpenCV, GStreamer, Flask
- Raspberry Pi: Python, RPi.GPIO, Servo & Ultrasonic control
- EC2: Node.js WebSocket server
- Web UI: React.js, React Router, WebSocket client

📌 Notes
- All devices must be on the same network or use port forwarding
- Each component operates in real-time and synchronously
