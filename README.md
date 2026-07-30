# 🏏 Smart Cricket – AI-Powered Shot Analysis System

Smart Cricket is an AI-powered web application that analyzes cricket shots in real-time using computer vision and machine learning. It provides instant feedback on shot type, stance, and batting form using pose detection and a trained ML model.

---

## 🌐 Live Demo

* 🔗 Frontend (Main App): https://smartcricket-seven.vercel.app
* 🤖 ML Service (Health Check): https://project-exhibition-96-smart-cricket-ml.hf.space/health

---

## 🔌 API Endpoints

* Backend API Base:
  https://smart-cricket-git-main-projectexhibition96s-projects.vercel.app

* ML Prediction Endpoint:
  https://project-exhibition-96-smart-cricket-ml.hf.space/predict_frame

---

## 🚀 Features

* 🎯 Real-time cricket shot classification
* 🧍 Live pose detection with skeleton overlay (MediaPipe)
* 📊 Batting form analysis (elbow, knee, stance)
* 📈 Shot distribution analytics dashboard
* 🎥 Webcam-based live analysis
* 🧠 ML model integration (scikit-learn)
* 🌐 Fully deployed cloud architecture

---

## 🏗️ Architecture

```text
Frontend (Vercel)
        ↓
Backend API (Vercel)
        ↓
ML Service (Hugging Face - Flask + MediaPipe)
```

---

## 📁 Project Structure

```text
smart-cricket/
│
├── client/            # React frontend (Vite)
├── server/            # Node.js backend (Express API)
├── python-service/    # Flask ML service
├── uploads/           # Temporary storage
└── README.md
```

---

## ⚙️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Framer Motion
* React Three Fiber (3D visualization)

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* JWT Authentication

### ML Service

* Flask
* MediaPipe
* OpenCV
* scikit-learn

---

## 🧠 How It Works

1. User enables webcam from the frontend
2. Frames are captured continuously
3. Frames → sent to backend API
4. Backend → forwards frames to ML service
5. ML service:

   * extracts pose landmarks (MediaPipe)
   * runs trained ML model
   * returns prediction + feedback
6. Frontend displays:

   * shot type
   * confidence score
   * stance classification
   * form feedback
   * live skeleton overlay

---

## 🛠️ Local Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/projectexhibition96/Smart-Cricket
cd Smart-Cricket
```

---

### 2️⃣ Start ML Service

```bash
cd python-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Runs on:

```
http://localhost:5001
```

---

### 3️⃣ Start Backend

```bash
cd server
npm install
npm run dev
```

Runs on:

```
http://localhost:5050
```

---

### 4️⃣ Start Frontend

```bash
cd client
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## 🔐 Environment Variables

⚠️ Never commit real secrets. Use placeholders.

### Frontend

```env
VITE_API_BASE_URL=your_backend_url
```

---

### Backend

```env
PYTHON_SERVICE_URL=https://project-exhibition-96-smart-cricket-ml.hf.space
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 📊 ML Model Details

* Model: scikit-learn classifier
* Input: 33 pose landmarks (MediaPipe)
* Output:

  * Shot type
  * Confidence score
  * Stance classification
  * Form feedback

---

## ⚠️ Notes

* Camera requires HTTPS (works on Vercel deployment)
* ML service may take a few seconds on first request (cold start)
* Root Hugging Face URL shows *Not Found* — this is expected (API-only service)
* Backend URL will show `Cannot GET /` — it is an API, not a UI

---

## 🚀 Future Improvements

* Improve model accuracy
* Add more shot types
* Reduce real-time latency
* Enhance mobile responsiveness
* Add advanced coaching insights

---

## 📌 License

This project is for educational and academic purposes.
