# Smart Cricket Trainer

AI-powered cricket batting analysis using Computer Vision, Machine Learning, and Pose Estimation.

<p align="center">
  <img src="client/src/assets/hero.png" alt="Smart Cricket Trainer" width="800">
</p>

<p align="center">
  <strong>Analyze batting techniques, recognize cricket shots, and receive feedback on batting posture.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-TypeScript-blue" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-green" alt="Node.js">
  <img src="https://img.shields.io/badge/Python-Flask-orange" alt="Python">
  <img src="https://img.shields.io/badge/Computer%20Vision-MediaPipe-red" alt="Computer Vision">
</p>

---

## 1. Project Overview

Smart Cricket Trainer is a full-stack AI-based application designed to help cricket players analyze and improve their batting techniques.

The application combines a React frontend, Node.js backend, and Python-based machine learning service. It uses MediaPipe Pose to extract body landmarks and a trained machine learning model to recognize cricket batting shots.

The system provides a platform for practicing batting, analyzing body posture, and viewing performance-related information.

### Problem Statement

Traditional cricket coaching often requires a coach to observe batting technique manually. This can make it difficult for players to receive immediate feedback during practice.

Smart Cricket Trainer aims to provide an accessible computer-vision-based training assistant that can analyze batting movements and present useful feedback through a web application.

### Objectives

* Recognize cricket batting shots using machine learning.
* Extract body landmarks from video frames.
* Analyze selected batting posture measurements.
* Provide a user-friendly interface for cricket practice.
* Store and display relevant performance information.
* Demonstrate the integration of frontend, backend, and AI services.

---

## 2. Features

* Cricket batting shot classification.
* Webcam-based batting analysis.
* Pose estimation using MediaPipe.
* Machine learning prediction using a trained model.
* Batting posture and body-angle analysis.
* User authentication using JWT.
* Analytics and performance dashboard.
* Interactive cricket shot visualization.
* REST API communication between application services.
* Terminal-based local development setup.

---

## 3. Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Framer Motion
* Recharts
* Three.js
* React Three Fiber

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token
* bcrypt
* Axios
* Multer
* Zod

### Machine Learning Service

* Python
* Flask
* MediaPipe
* OpenCV
* NumPy
* Pandas
* Scikit-learn
* Joblib

---

## 4. System Architecture

```text
                  User
                   |
                   v
          React Frontend
          Vite + TypeScript
                   |
                   v
          Node.js Backend
             Express API
                   |
          +--------+--------+
          |                 |
          v                 v
       MongoDB       Python ML Service
                     Flask + MediaPipe
                            |
                            v
                    Pose Extraction
                            |
                            v
                  Trained ML Model
                            |
                            v
                   Shot Prediction
                            |
                            v
                  Feedback / Results
```

### Service Ports

| Service           | Port | Purpose                        |
| ----------------- | ---: | ------------------------------ |
| Frontend          | 5173 | React web application          |
| Backend           | 5050 | Express API                    |
| Python ML Service | 5001 | Pose processing and prediction |

---

## 5. Project Structure

```text
Smart-cricket-trainer/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   ├── package.json
│   └── vercel.json
│
├── python-service/
│   ├── app.py
│   ├── live_feedback.py
│   ├── pose_live.py
│   ├── requirements.txt
│   ├── shot_model.pkl
│   └── ideal_batting_angles.json
│
├── uploads/
├── pose_data.csv
├── ideal_batting_angles.json
├── shot_model.pkl
├── live_feedback.py
├── start.sh
├── .gitignore
└── README.md
```

---

## 6. Prerequisites

Install the following software before running the project:

* Node.js and npm
* Python 3
* pip
* MongoDB
* Git
* A modern web browser

### Recommended Environment

| Software | Recommendation                          |
| -------- | --------------------------------------- |
| Node.js  | Current LTS version                     |
| Python   | Python 3.10 or compatible version       |
| npm      | Included with Node.js                   |
| MongoDB  | Local installation or MongoDB Atlas     |
| Browser  | Chrome, Edge, or another modern browser |

Check your installed versions:

```bash
node --version
npm --version
python3 --version
pip3 --version
git --version
```

On Windows, use `python` and `pip` if `python3` and `pip3` are not available.

---

## 7. Clone the Repository

Clone the public GitHub repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Move into the project directory:

```bash
cd YOUR_REPOSITORY
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with your actual GitHub username and repository name.

---

## 8. Environment Configuration

The backend uses environment variables for database access, authentication, and communication with the other services.

Create a file named `.env` inside the `server` directory.

### server/.env

```env
PORT=5050

MONGODB_URI=mongodb://127.0.0.1:27017/smart_cricket

JWT_SECRET=replace_with_a_secure_random_secret

CLIENT_ORIGIN=http://localhost:5173

PYTHON_SERVICE_URL=http://localhost:5001

UPLOAD_DIR=uploads
```

### Variable Description

| Variable             | Description                            |
| -------------------- | -------------------------------------- |
| `PORT`               | Port used by the Express backend       |
| `MONGODB_URI`        | MongoDB connection string              |
| `JWT_SECRET`         | Secret used for JWT authentication     |
| `CLIENT_ORIGIN`      | Frontend origin allowed by the backend |
| `PYTHON_SERVICE_URL` | URL of the Flask ML service            |
| `UPLOAD_DIR`         | Directory used for uploaded files      |

**Do not commit real passwords, database credentials, or JWT secrets to GitHub.**

If your MongoDB database is hosted on MongoDB Atlas, replace the local MongoDB URI with your Atlas connection string.

---

## 9. Install Dependencies

### 9.1 Install Frontend Dependencies

Open a terminal in the project root:

```bash
cd client
npm install
```

Return to the project root:

```bash
cd ..
```

### 9.2 Install Backend Dependencies

```bash
cd server
npm install
```

Return to the project root:

```bash
cd ..
```

### 9.3 Install Python Dependencies

Move into the Python service:

```bash
cd python-service
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate the virtual environment.

#### Linux / macOS

```bash
source .venv/bin/activate
```

#### Windows

```powershell
.venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Return to the project root:

```bash
cd ..
```

---

## 10. Run the Project

The application consists of three services:

1. React frontend
2. Node.js backend
3. Python Flask machine learning service

All three services must be running for complete application functionality.

### Option A: Start All Services Using start.sh

On Linux or macOS:

```bash
chmod +x start.sh
./start.sh
```

The script starts the frontend, backend, and Python service.

Expected local addresses:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5050
ML API:   http://localhost:5001
```

Open the frontend in your browser:

```text
http://localhost:5173
```

### Option B: Start Each Service Separately

This option is useful for debugging.

#### Terminal 1: Start the Python ML Service

```bash
cd python-service
source .venv/bin/activate
python app.py
```

On Windows:

```powershell
cd python-service
.venv\Scripts\activate
python app.py
```

The Python service runs on port `5001`.

#### Terminal 2: Start the Node.js Backend

```bash
cd server
npm start
```

The backend runs on port `5050`.

#### Terminal 3: Start the React Frontend

```bash
cd client
npm run dev
```

The frontend runs on port `5173`.

---

## 11. Machine Learning Workflow

The machine learning service processes batting movement through the following workflow:

```text
Input Video / Image Frame
          |
          v
   MediaPipe Pose
          |
          v
  Body Landmark Extraction
          |
          v
   Feature Preparation
          |
          v
  Trained ML Model
          |
          v
   Shot Classification
          |
          v
 Posture / Angle Analysis
          |
          v
   Feedback and Results
```

### Model Files

The Python service contains:

* `shot_model.pkl` — trained machine learning model.
* `ideal_batting_angles.json` — reference batting-angle data.
* `pose_live.py` — pose-processing functionality.
* `live_feedback.py` — feedback-related functionality.
* `app.py` — Flask application entry point.

The trained model is loaded by the Python service during execution.

---

## 12. Application Workflow

1. The user opens the Smart Cricket Trainer web application.
2. The user accesses the available cricket training features.
3. The application captures or receives batting-related input.
4. The Python service processes the input using computer vision.
5. MediaPipe extracts body landmarks.
6. The trained machine learning model predicts the batting shot.
7. Relevant posture measurements are analyzed.
8. The backend handles application data and authentication.
9. The frontend displays the prediction and available feedback.
10. Performance information can be viewed through the dashboard.

---

## 13. Testing the Project

### Build the Frontend

```bash
cd client
npm run build
```

### Run Frontend Linting

```bash
npm run lint
```

### Check Backend Startup

```bash
cd server
npm start
```

### Check Python Service Startup

```bash
cd python-service
python app.py
```

If all services start without errors, open:

```text
http://localhost:5173
```

### Troubleshooting

#### Port Already in Use

If a port is occupied, stop the process using that port or change the relevant configuration.

The default ports are:

```text
5173 - Frontend
5050 - Backend
5001 - Python ML Service
```

#### MongoDB Connection Error

Check that MongoDB is running and that `MONGODB_URI` in `server/.env` is correct.

#### Python Dependency Error

Activate the virtual environment and run:

```bash
pip install -r requirements.txt
```

#### Frontend Cannot Connect to Backend

Check that:

* The backend is running.
* The backend is using port `5050`.
* The frontend is configured to use the correct backend URL.
* The `CLIENT_ORIGIN` value matches the frontend address.

#### Machine Learning Service Error

Check that:

* Python dependencies are installed.
* The trained model file exists.
* The ML service is running on port `5001`.
* The backend is configured with the correct `PYTHON_SERVICE_URL`.

---

## 14. Deployment

The project can be deployed as separate services.

| Component         | Possible Deployment Platform              |
| ----------------- | ----------------------------------------- |
| Frontend          | Vercel                                    |
| Backend           | Vercel or another Node.js hosting service |
| Python ML Service | Docker-compatible hosting service         |
| Database          | MongoDB Atlas                             |

Deployment requires configuring the production environment variables and service URLs.

For local evaluation, the project can be run using the terminal commands described above.

---

## 15. Future Enhancements

* Improve shot-classification accuracy with a larger dataset.
* Add more cricket shots and batting techniques.
* Introduce personalized coaching recommendations.
* Add player progress tracking.
* Support bowling analysis.
* Add mobile application support.
* Improve real-time feedback performance.
* Add automated model evaluation and reporting.
* Support multi-player tracking.

---

## 16. Contributors

* Ramanadula Shyam Daniel Raj
* Project Team Members

---

## 17. License

This project is intended for educational and academic purposes.

---

## 18. Acknowledgements

This project uses open-source technologies including React, Node.js, Flask, MediaPipe, OpenCV, and Scikit-learn.

The project demonstrates the integration of web development, computer vision, machine learning, and cricket analytics.
