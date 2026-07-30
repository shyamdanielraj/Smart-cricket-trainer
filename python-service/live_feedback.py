import cv2
import mediapipe as mp
import numpy as np
import json
import joblib
from collections import deque

# 🔥 Load ML model
model = joblib.load("shot_model.pkl")

# 🔥 Load angle dataset
with open("ideal_batting_angles.json") as f:
    dataset = json.load(f)

# 🔥 Shot → stance mapping
shot_to_stance = {
    "cover_drive": "side_on_stance",
    "straight_drive": "side_on_stance",
    "pull_shot": "open_stance",
    "hook_shot": "open_stance",
    "sweep_shot": "open_stance"
}

# 🔥 Prediction smoothing
predictions = deque(maxlen=10)

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose()
cap = cv2.VideoCapture(0)

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return int(np.degrees(np.arccos(cosine)))

def get_feedback(joint_name, user, ideal, tolerance):
    diff = user - ideal

    if abs(diff) <= tolerance:
        return f"{joint_name}: OK"

    if joint_name == "Elbow":
        return "Elbow: Raise" if diff < 0 else "Elbow: Lower"

    elif joint_name == "Knee":
        return "Knee: Straight" if diff < 0 else "Knee: Bend"

def is_correct(user, ideal, tolerance):
    return abs(user - ideal) <= tolerance

while True:
    ret, frame = cap.read()
    if not ret:
        break

    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if results.pose_landmarks:
        lm_list = results.pose_landmarks.landmark

        # 🔥 Extract keypoints
        keypoints = []
        for lm in lm_list:
            keypoints.extend([lm.x, lm.y, lm.z, lm.visibility])

        keypoints_np = np.array(keypoints).reshape(1, -1)

        # 🔥 Predict shot
        predicted = model.predict(keypoints_np)[0]
        predictions.append(predicted)
        predicted_shot = max(set(predictions), key=predictions.count)

        # 🔥 Confidence
        probs = model.predict_proba(keypoints_np)
        confidence = np.max(probs)

        # 🔥 Map to stance
        selected_stance = shot_to_stance.get(predicted_shot, "side_on_stance")
        ideal = dataset[selected_stance]

        # 🔥 Joint points
        shoulder = [lm_list[mp_pose.PoseLandmark.LEFT_SHOULDER].x,
                    lm_list[mp_pose.PoseLandmark.LEFT_SHOULDER].y]

        elbow = [lm_list[mp_pose.PoseLandmark.LEFT_ELBOW].x,
                 lm_list[mp_pose.PoseLandmark.LEFT_ELBOW].y]

        wrist = [lm_list[mp_pose.PoseLandmark.LEFT_WRIST].x,
                 lm_list[mp_pose.PoseLandmark.LEFT_WRIST].y]

        hip = [lm_list[mp_pose.PoseLandmark.LEFT_HIP].x,
               lm_list[mp_pose.PoseLandmark.LEFT_HIP].y]

        knee = [lm_list[mp_pose.PoseLandmark.LEFT_KNEE].x,
                lm_list[mp_pose.PoseLandmark.LEFT_KNEE].y]

        ankle = [lm_list[mp_pose.PoseLandmark.LEFT_ANKLE].x,
                 lm_list[mp_pose.PoseLandmark.LEFT_ANKLE].y]

        # 🔥 Angles
        elbow_angle = calculate_angle(shoulder, elbow, wrist)
        knee_angle = calculate_angle(hip, knee, ankle)

        # 🔥 Feedback
        elbow_feedback = get_feedback("Elbow", elbow_angle, ideal["elbow_mean"], ideal["tolerance"])
        knee_feedback = get_feedback("Knee", knee_angle, ideal["knee_mean"], ideal["tolerance"])

        elbow_correct = is_correct(elbow_angle, ideal["elbow_mean"], ideal["tolerance"])
        knee_correct = is_correct(knee_angle, ideal["knee_mean"], ideal["tolerance"])

        # 🔥 Score
        elbow_score = max(0, 100 - abs(elbow_angle - ideal["elbow_mean"]))
        knee_score = max(0, 100 - abs(knee_angle - ideal["knee_mean"]))
        total_score = int((elbow_score + knee_score) / 2)

        h, w, _ = frame.shape

        # 🔥 Joint markers
        ex, ey = int(elbow[0]*w), int(elbow[1]*h)
        kx, ky = int(knee[0]*w), int(knee[1]*h)

        cv2.circle(frame, (ex, ey), 6, (0,255,0) if elbow_correct else (0,0,255), -1)
        cv2.circle(frame, (kx, ky), 6, (0,255,0) if knee_correct else (0,0,255), -1)

        # 🔥 UI panel
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (370, 230), (0,0,0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

        # 🔥 Display text
        cv2.putText(frame, f'Shot: {predicted_shot}', (20, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

        cv2.putText(frame, f'Confidence: {confidence:.2f}', (20, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,255), 2)

        if elbow_feedback != "Elbow: OK":
            cv2.putText(frame, elbow_feedback, (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

        if knee_feedback != "Knee: OK":
            cv2.putText(frame, knee_feedback, (20, 130),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

        cv2.putText(frame, f'Score: {total_score}%', (20, 170),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)

        cv2.putText(frame, f'Stance: {selected_stance}', (20, 200),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 2)

        cv2.putText(frame, "AI Cricket Coach", (20, 230),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,0), 2)

        # 🔥 Skeleton
        mp_drawing.draw_landmarks(frame,
                                  results.pose_landmarks,
                                  mp_pose.POSE_CONNECTIONS)

    cv2.imshow("AI Cricket Coach", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()