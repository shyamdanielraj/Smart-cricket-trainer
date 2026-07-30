# 🏏 Smart Cricket trainer
<p align="center">
  <img src="client/src/assets/hero.png" alt="Smart Cricket Banner" width="800">
</p>

<p align="center">
  <strong>Analyze cricket shots in real time using Computer Vision, Machine Learning, and Artificial Intelligence.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-blue" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green" />
  <img src="https://img.shields.io/badge/Flask-ML%20API-orange" />
  <img src="https://img.shields.io/badge/MediaPipe-Pose%20Detection-red" />
  <img src="https://img.shields.io/badge/License-MIT-purple" />
</p>

---

## 📌 Overview

Smart Cricket is an AI-powered cricket analytics platform designed to analyze batting techniques in real time. The system uses pose estimation, machine learning, and computer vision to classify cricket shots and provide instant feedback to players.

The platform helps players improve their:

* Batting posture
* Elbow and knee alignment
* Balance and stance
* Shot execution
* Overall performance

---

## ✨ Features

* 🎯 Real-time cricket shot recognition
* 🧠 Machine learning-based classification
* 📷 Live webcam analysis
* 🏏 Cover drive, pull shot, straight drive, and other shot detection
* 📊 Analytics dashboard
* 🔥 Pose tracking using MediaPipe
* ☁️ Cloud deployment support
* 📈 Performance monitoring and feedback

---

## 🏗️ System Architecture

```text
                 User Webcam
                        │
                        ▼
             React Frontend (Vite)
                        │
                        ▼
             Node.js Backend API
                        │
                        ▼
        Flask + MediaPipe ML Service
                        │
                        ▼
              Machine Learning Model
```

---

## 📂 Project Structure

```text
smart-cricket/
│
├── client/                  # React frontend
├── server/                  # Node.js backend
├── python-service/          # Flask ML service
├── uploads/                 # Uploaded files
├── shot_model.pkl           # Trained model
├── pose_data.csv            # Pose dataset
└── README.md
```

---

## 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion

### Backend

* Node.js
* Express.js
* MongoDB
* JWT Authentication

### Artificial Intelligence

* Python
* Flask
* OpenCV
* MediaPipe
* NumPy
* Scikit-learn
* Pandas

---

## 🚀 Installation

### Clone the repository

```bash
git clone https://github.com/your-username/smart-cricket.git
cd smart-cricket
```

---

### Install frontend dependencies

```bash
cd client
npm install
npm run dev
```

---

### Install backend dependencies

```bash
cd server
npm install
npm start
```

---

### Install Python dependencies

```bash
cd python-service
pip install -r requirements.txt
python app.py
```

---

## 🌐 Deployment

| Service  | Platform            |
| -------- | ------------------- |
| Frontend | Vercel              |
| Backend  | Vercel              |
| ML API   | Hugging Face Spaces |

---

## 📊 Workflow

1. The user opens the application.
2. The webcam captures live video.
3. MediaPipe extracts body landmarks.
4. The machine learning model predicts the shot.
5. The system analyzes the player's posture.
6. Feedback is displayed instantly.

---

## 🔮 Future Enhancements

* Mobile application support
* Bowling analysis
* Player performance history
* Personalized coaching suggestions
* Advanced statistics dashboard
* Multi-player tracking

---

## 👨‍💻 Contributors

* Ramanadula Shyam Daniel Raj
* Project Team Members

---

## ⭐ Support

If you find this project useful, consider giving it a star on GitHub.

```bash
⭐ Star the repository
🍴 Fork the project
🛠️ Contribute to the codebase
```

---

<p align="center">
  Built with ❤️ using Artificial Intelligence, Computer Vision, and Machine Learning.
</p>
