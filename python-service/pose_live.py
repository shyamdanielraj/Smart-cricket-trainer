"""
Pose + shot classification + form feedback.
Used by Flask /predict_frame with images from the browser.
"""
import json
import os
from collections import deque
from typing import Any, Dict, Optional, Tuple

import cv2
import joblib
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

DEFAULT_SHOT_TO_STANCE = {
    "cover_drive": "side_on_stance",
    "straight_drive": "side_on_stance",
    "pull_shot": "open_stance",
    "hook_shot": "open_stance",
    "sweep_shot": "open_stance",
}

SMOOTH_WINDOW = int(os.getenv("POSE_SMOOTH_WINDOW", "10"))
_prediction_history: Dict[str, deque] = {}


def _session_deque(session_id: str) -> deque:
    if session_id not in _prediction_history:
        _prediction_history[session_id] = deque(maxlen=SMOOTH_WINDOW)
    return _prediction_history[session_id]


def calculate_angle(a, b, c) -> int:
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom < 1e-8:
        return 0
    cosine = np.dot(ba, bc) / denom
    cosine = float(np.clip(cosine, -1.0, 1.0))
    return int(np.degrees(np.arccos(cosine)))


def get_feedback(joint_name: str, user: float, ideal: float, tolerance: float) -> str:
    diff = user - ideal

    if abs(diff) <= tolerance:
        return f"{joint_name}: OK"

    if joint_name == "Elbow":
        return "Elbow: Raise" if diff < 0 else "Elbow: Lower"

    if joint_name == "Knee":
        return "Knee: Straight" if diff < 0 else "Knee: Bend"

    if joint_name == "Shoulder":
        return "Shoulder: Open more" if diff < 0 else "Shoulder: Close slightly"

    if joint_name == "Hip":
        return "Hip: Rotate more" if diff < 0 else "Hip: Rotate back"

    return f"{joint_name}: Adjust"


def is_correct(user: float, ideal: float, tolerance: float) -> bool:
    return abs(user - ideal) <= tolerance


def score_from_angle(user: float, ideal: float, tolerance: float) -> int:
    """
    100 when perfect, then smoothly decreases.
    At ideal +/- tolerance => still decent score.
    Clamped to [0, 100].
    """
    diff = abs(user - ideal)
    score = 100 - int((diff / max(tolerance, 1)) * 20)
    return max(0, min(100, score))


def _point_xy(lm_list, landmark_enum):
    lm = lm_list[landmark_enum]
    return [lm.x, lm.y]


def _extract_angles(lm_list) -> Dict[str, int]:
    left_shoulder = _point_xy(lm_list, mp_pose.PoseLandmark.LEFT_SHOULDER)
    left_elbow = _point_xy(lm_list, mp_pose.PoseLandmark.LEFT_ELBOW)
    left_wrist = _point_xy(lm_list, mp_pose.PoseLandmark.LEFT_WRIST)
    left_hip = _point_xy(lm_list, mp_pose.PoseLandmark.LEFT_HIP)
    left_knee = _point_xy(lm_list, mp_pose.PoseLandmark.LEFT_KNEE)
    left_ankle = _point_xy(lm_list, mp_pose.PoseLandmark.LEFT_ANKLE)
    right_shoulder = _point_xy(lm_list, mp_pose.PoseLandmark.RIGHT_SHOULDER)
    right_hip = _point_xy(lm_list, mp_pose.PoseLandmark.RIGHT_HIP)

    elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    knee_angle = calculate_angle(left_hip, left_knee, left_ankle)

    # Shoulder openness approximation:
    # angle at left shoulder formed by left elbow - left shoulder - right shoulder
    shoulder_angle = calculate_angle(left_elbow, left_shoulder, right_shoulder)

    # Hip rotation/posture approximation:
    # angle at left hip formed by left shoulder - left hip - left knee
    hip_angle = calculate_angle(left_shoulder, left_hip, left_knee)

    return {
        "elbow": elbow_angle,
        "knee": knee_angle,
        "shoulder": shoulder_angle,
        "hip": hip_angle,
    }


def _normalize_ideal_config(stance_data: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
    """
    Supports both old and new JSON formats.

    Old format:
    {
      "elbow_mean": 90,
      "knee_mean": 160,
      "tolerance": 15
    }

    New format:
    {
      "tolerance": 15,
      "joints": {
        "elbow": {"mean": 90, "tolerance": 12, "weight": 0.35},
        ...
      }
    }
    """
    if not isinstance(stance_data, dict):
        return {}

    # New format
    joints = stance_data.get("joints")
    if isinstance(joints, dict):
        normalized = {}
        default_tol = float(stance_data.get("tolerance", 15))
        for joint_name, cfg in joints.items():
            if not isinstance(cfg, dict):
                continue
            if "mean" not in cfg:
                continue
            normalized[joint_name] = {
                "mean": float(cfg["mean"]),
                "tolerance": float(cfg.get("tolerance", default_tol)),
                "weight": float(cfg.get("weight", 1.0)),
            }
        return normalized

    # Old format
    default_tol = float(stance_data.get("tolerance", 15))
    normalized = {}

    mapping = {
        "elbow": "elbow_mean",
        "knee": "knee_mean",
        "shoulder": "shoulder_mean",
        "hip": "hip_mean",
    }

    for joint_name, mean_key in mapping.items():
        if mean_key in stance_data:
            normalized[joint_name] = {
                "mean": float(stance_data[mean_key]),
                "tolerance": default_tol,
                "weight": 1.0,
            }

    return normalized


def _evaluate_joints(measured_angles: Dict[str, int], stance_data: Dict[str, Any]) -> Dict[str, Any]:
    joint_cfg = _normalize_ideal_config(stance_data)
    if not joint_cfg:
        return {
            "joint_feedback": {},
            "joint_scores": {},
            "joint_correct": {},
            "total_score": None,
        }

    feedback = {}
    scores = {}
    correct = {}
    weighted_sum = 0.0
    weight_total = 0.0

    for joint_name, cfg in joint_cfg.items():
        if joint_name not in measured_angles:
            continue

        measured = measured_angles[joint_name]
        ideal = float(cfg["mean"])
        tolerance = float(cfg["tolerance"])
        weight = float(cfg["weight"])

        pretty_name = joint_name.capitalize()
        fb = get_feedback(pretty_name, measured, ideal, tolerance)
        sc = score_from_angle(measured, ideal, tolerance)
        ok = is_correct(measured, ideal, tolerance)

        feedback[joint_name] = fb
        scores[joint_name] = sc
        correct[joint_name] = ok

        weighted_sum += sc * weight
        weight_total += weight

    total_score = None
    if weight_total > 0:
        total_score = int(round(weighted_sum / weight_total))

    return {
        "joint_feedback": feedback,
        "joint_scores": scores,
        "joint_correct": correct,
        "total_score": total_score,
    }


class PoseLivePipeline:
    def __init__(self):
        self.model = None
        self.dataset: Dict[str, Any] = {}
        self.shot_to_stance = dict(DEFAULT_SHOT_TO_STANCE)
        self.pose = None

    def ensure_loaded(self):
        if self.model is not None:
            return

        model_path = os.getenv("SHOT_MODEL_PATH", "shot_model.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Shot model not found: {model_path}. Place shot_model.pkl or set SHOT_MODEL_PATH."
            )
        self.model = joblib.load(model_path)

        angles_path = os.getenv("IDEAL_ANGLES_PATH", "ideal_batting_angles.json")
        if os.path.exists(angles_path):
            with open(angles_path, encoding="utf-8") as f:
                self.dataset = json.load(f)
        else:
            self.dataset = {}

        stance_map_path = os.getenv("SHOT_TO_STANCE_PATH", "")
        if stance_map_path and os.path.exists(stance_map_path):
            with open(stance_map_path, encoding="utf-8") as f:
                self.shot_to_stance = json.load(f)

        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=int(os.getenv("MEDIAPIPE_MODEL_COMPLEXITY", "1")),
            min_detection_confidence=float(os.getenv("MIN_DETECTION_CONFIDENCE", "0.5")),
            min_tracking_confidence=float(os.getenv("MIN_TRACKING_CONFIDENCE", "0.5")),
        )

    def predict_from_image_bytes(
        self, image_bytes: bytes, session_id: str
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        self.ensure_loaded()
        assert self.pose is not None and self.model is not None

        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return None, "Could not decode image"

        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)

        if not results.pose_landmarks:
            return {
                "pose_detected": False,
                "shot": None,
                "raw_shot": None,
                "confidence": None,
                "stance": None,
                "angles": {},
                "joint_feedback": {},
                "joint_scores": {},
                "joint_correct": {},
                "total_score": None,
                "elbow_feedback": None,
                "knee_feedback": None,
                "elbow_angle": None,
                "knee_angle": None,
            }, None

        lm_list = results.pose_landmarks.landmark

        keypoints = []
        for lm in lm_list:
            keypoints.extend([lm.x, lm.y, lm.z, lm.visibility])
        keypoints_np = np.array(keypoints, dtype=np.float32).reshape(1, -1)

        try:
            raw_pred = self.model.predict(keypoints_np)[0]
            predicted_raw = str(raw_pred)
        except Exception as e:
            return None, f"Model predict failed: {e}"

        dq = _session_deque(session_id or "default")
        dq.append(predicted_raw)
        predicted_shot = str(max(set(dq), key=dq.count))

        confidence = None
        if hasattr(self.model, "predict_proba"):
            try:
                probs = self.model.predict_proba(keypoints_np)
                confidence = float(np.max(probs))
            except Exception:
                pass

        selected_stance = self.shot_to_stance.get(predicted_shot, "side_on_stance")
        ideal = self.dataset.get(selected_stance, {}) if self.dataset else {}

        measured_angles = _extract_angles(lm_list)
        evaluation = _evaluate_joints(measured_angles, ideal)

        payload: Dict[str, Any] = {
            "pose_detected": True,
            "shot": predicted_shot,
            "raw_shot": predicted_raw,
            "confidence": confidence,
            "stance": selected_stance,
            "angles": measured_angles,
            "joint_feedback": evaluation["joint_feedback"],
            "joint_scores": evaluation["joint_scores"],
            "joint_correct": evaluation["joint_correct"],
            "total_score": evaluation["total_score"],
            # backward-compatible fields for your current frontend
            "elbow_angle": measured_angles.get("elbow"),
            "knee_angle": measured_angles.get("knee"),
            "elbow_feedback": evaluation["joint_feedback"].get("elbow"),
            "knee_feedback": evaluation["joint_feedback"].get("knee"),
            "elbow_correct": evaluation["joint_correct"].get("elbow"),
            "knee_correct": evaluation["joint_correct"].get("knee"),
        }

        return payload, None
