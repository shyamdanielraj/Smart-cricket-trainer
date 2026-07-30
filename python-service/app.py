from __future__ import annotations

import io
import os
import tempfile
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from pose_live import PoseLivePipeline

load_dotenv()

app = Flask(__name__)
CORS(app)

_pose_pipeline: Optional[PoseLivePipeline] = None


def get_pose_pipeline() -> PoseLivePipeline:
    global _pose_pipeline
    if _pose_pipeline is None:
        _pose_pipeline = PoseLivePipeline()
    return _pose_pipeline


def _json_safe(obj: Any) -> Any:
    """Flask jsonify fails on numpy / numpy scalar types — normalize for JSON."""
    if obj is None:
        return None
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, (bool, str, int, float)):
        return obj
    return str(obj)


def _bad_request(message, details=None):
    payload = {"error": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), 400


def _read_dataframe(uploaded_file):
    filename = (uploaded_file.filename or "").lower()
    raw = uploaded_file.read()
    if len(raw) == 0:
        raise ValueError("Empty file")

    if filename.endswith(".csv"):
        return pd.read_csv(io.BytesIO(raw))

    if filename.endswith(".json"):
        # Accept either list-of-rows or {"rows":[...]}
        try:
            df = pd.read_json(io.BytesIO(raw))
        except ValueError:
            # try common wrapper
            obj = pd.read_json(io.BytesIO(raw), typ="series")
            if isinstance(obj, pd.Series) and "rows" in obj:
                df = pd.DataFrame(obj["rows"])
            else:
                raise
        if isinstance(df, pd.Series):
            # single row series -> 1-row df
            df = df.to_frame().T
        return df

    raise ValueError("Unsupported file type. Upload a .csv or .json file.")


def _load_model(modelfile):
    default_path = os.getenv("DEFAULT_MODEL_PATH", "model.pkl")
    if modelfile is None:
        if not os.path.exists(default_path):
            raise FileNotFoundError(
                f"Default model not found at '{default_path}'. Upload a .pkl model or place one there."
            )
        return joblib.load(default_path)

    name = (modelfile.filename or "").lower()
    if not (name.endswith(".pkl") or name.endswith(".joblib")):
        raise ValueError("Invalid model file. Upload a .pkl (joblib) scikit-learn model.")

    with tempfile.NamedTemporaryFile(suffix=".pkl", delete=True) as tmp:
        tmp.write(modelfile.read())
        tmp.flush()
        return joblib.load(tmp.name)


def _expected_feature_names(model):
    if hasattr(model, "feature_names_in_") and model.feature_names_in_ is not None:
        return [str(x) for x in model.feature_names_in_]

    # Fallback to kp0_x..kp32_v (33 keypoints x/y/z/v = 132 features)
    names = []
    for i in range(33):
        for suffix in ["x", "y", "z", "v"]:
            names.append(f"kp{i}_{suffix}")
    return names


def _validate_features(df, expected):
    if df.shape[1] != len(expected):
        missing = [c for c in expected if c not in df.columns]
        extra = [c for c in df.columns if c not in expected]
        return False, {
            "message": "Feature mismatch: incorrect number of columns.",
            "expectedColumnCount": len(expected),
            "receivedColumnCount": int(df.shape[1]),
            "missingColumns": missing[:200],
            "extraColumns": extra[:200],
            "expectedColumns": expected,
        }

    missing = [c for c in expected if c not in df.columns]
    extra = [c for c in df.columns if c not in expected]
    if missing or extra:
        return False, {
            "message": "Feature mismatch: column names must match the model feature names.",
            "missingColumns": missing[:200],
            "extraColumns": extra[:200],
            "expectedColumns": expected,
        }

    return True, None


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.post("/predict_frame")
def predict_frame():
    """
    Webcam / browser frame: multipart field 'image' (jpeg/png).
    Optional header X-Session-Id for prediction smoothing.
    """
    if "image" not in request.files:
        return _bad_request("Missing image. Use multipart field name 'image'.")

    f = request.files["image"]
    raw = f.read()
    if not raw:
        return _bad_request("Empty image.")

    session_id = request.headers.get("X-Session-Id", "default")[:128]

    try:
        pipeline = get_pose_pipeline()
        payload, err = pipeline.predict_from_image_bytes(raw, session_id=session_id)
    except FileNotFoundError as e:
        return _bad_request(str(e))
    except Exception as e:
        return _bad_request("Pose inference failed.", {"reason": str(e)})

    if err:
        return _bad_request(err)

    return jsonify(_json_safe(payload))


@app.post("/predict")
def predict():
    if "datafile" not in request.files:
        return _bad_request("Missing dataset upload. Use multipart field name 'datafile'.")

    datafile = request.files["datafile"]
    modelfile = request.files.get("modelfile")

    try:
        model = _load_model(modelfile)
    except FileNotFoundError as e:
        return _bad_request(str(e))
    except Exception as e:
        return _bad_request("Failed to load model.", {"reason": str(e)})

    try:
        df = _read_dataframe(datafile)
    except Exception as e:
        return _bad_request("Invalid dataset file.", {"reason": str(e)})

    max_rows = int(os.getenv("MAX_ROWS", "20000"))
    if len(df) > max_rows:
        return _bad_request("Dataset too large.", {"maxRows": max_rows, "receivedRows": int(len(df))})

    expected = _expected_feature_names(model)
    ok, details = _validate_features(df, expected)
    if not ok:
        return _bad_request("Dataset features do not match the model.", details)

    # Ensure column order matches expected
    df = df[expected]

    try:
        preds = model.predict(df)
        preds = [str(x) for x in np.asarray(preds).tolist()]
    except Exception as e:
        return _bad_request("Prediction failed.", {"reason": str(e)})

    return jsonify({"predictions": preds})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=True)

