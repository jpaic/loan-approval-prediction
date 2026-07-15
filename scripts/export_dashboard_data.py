"""Export precomputed dashboard data for the Next.js frontend.

Reloads the trained pipelines and evaluation artifacts produced by
train.py, reruns the same cleaning/split used during training, and writes
a single static JSON file that the frontend reads directly. This keeps the
deployed site simple: Vercel never needs to run Python, pandas, or
scikit-learn at request time.

Run from the repo root:

    python scripts/export_dashboard_data.py

Reads:
    data/loan_risk_prediction_dataset.csv
    models/pipelines.pkl
    models/results.pkl
    models/roc_curves.pkl
    models/best_model_name.pkl
    models/feature_importance.pkl
    models/confusion_matrix.pkl

Writes:
    app/frontend/public/dashboard-data.json
"""

import json
import math
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from train import CATEGORICAL_FEATURES, NUMERIC_FEATURES, RANDOM_STATE, TARGET, clean_data, load_raw_data

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"
OUT = ROOT / "app" / "frontend" / "public" / "dashboard-data.json"


# ---------------------------------------------------------------------------
# Small JSON-shaping helpers
# ---------------------------------------------------------------------------

def clean_number(value, digits=4):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return round(float(value), digits)
    return value


def boxplot_by_class(df: pd.DataFrame, feature: str, target: str = TARGET):
    groups = []
    for cls in sorted(df[target].dropna().unique()):
        values = df.loc[df[target] == cls, feature].dropna()
        if len(values) < 5:
            continue
        groups.append({
            "label": "Approved" if cls == 1 else "Rejected",
            "min": clean_number(values.quantile(0.05), 2),
            "q1": clean_number(values.quantile(0.25), 2),
            "median": clean_number(values.quantile(0.5), 2),
            "q3": clean_number(values.quantile(0.75), 2),
            "max": clean_number(values.quantile(0.95), 2),
        })
    return groups


def approval_rate_by_category(df: pd.DataFrame, col: str, target: str = TARGET):
    rate = df.groupby(col)[target].mean().sort_values(ascending=False)
    return [
        {"category": str(idx), "rate": clean_number(val, 4)}
        for idx, val in rate.items()
    ]


def sanitize_json(obj):
    """Recursively replace NaN/Infinity with None.

    Python's json module happily writes bare `NaN`/`Infinity` tokens by
    default, which are not valid JSON and break strict parsers like the one
    Next.js/Turbopack uses for JSON module imports. Missing values in the
    real dataset (e.g. Education, Income, CreditScore) surface as NaN in raw
    dict/records output, so every payload must be sanitized before dumping.
    """
    if isinstance(obj, dict):
        return {k: sanitize_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_json(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def downsample_roc(fpr, tpr, max_points=60):
    if len(fpr) <= max_points:
        idx = range(len(fpr))
    else:
        idx = np.linspace(0, len(fpr) - 1, max_points).astype(int)
    return [
        {"fpr": clean_number(fpr[i], 4), "tpr": clean_number(tpr[i], 4)} for i in idx
    ]


# ---------------------------------------------------------------------------
# Data + model loading
# ---------------------------------------------------------------------------

def load_artifacts():
    return {
        "pipelines": joblib.load(MODELS_DIR / "pipelines.pkl"),
        "results": joblib.load(MODELS_DIR / "results.pkl"),
        "roc_curves": joblib.load(MODELS_DIR / "roc_curves.pkl"),
        "best_model_name": joblib.load(MODELS_DIR / "best_model_name.pkl"),
        "feature_importance": joblib.load(MODELS_DIR / "feature_importance.pkl"),
        "confusion_matrix": joblib.load(MODELS_DIR / "confusion_matrix.pkl"),
    }


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export() -> None:
    artifacts = load_artifacts()

    raw = load_raw_data()
    df = clean_data(raw)

    X = df.drop(columns=[TARGET])
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    results_df: pd.DataFrame = artifacts["results"]
    best_model_name: str = artifacts["best_model_name"]
    importance: pd.Series = artifacts["feature_importance"]
    cm = artifacts["confusion_matrix"]

    value_counts = df[TARGET].value_counts(normalize=True).sort_index()

    preview_cols = [
        "Age", "Gender", "City", "Education", "Income", "LoanAmount",
        "CreditScore", "EmploymentType", "YearsExperience", TARGET,
    ]

    corr_cols = NUMERIC_FEATURES + [TARGET]
    corr = df[corr_cols].corr().round(2)

    model_comparison = [
        {
            "model": model,
            "accuracy": clean_number(row["Accuracy"], 4),
            "precision": clean_number(row["Precision"], 4),
            "recall": clean_number(row["Recall"], 4),
            "f1": clean_number(row["F1-score"], 4),
            "rocAuc": clean_number(row["ROC-AUC"], 4),
        }
        for model, row in results_df.iterrows()
    ]

    roc_curves = {
        name: downsample_roc(fpr, tpr)
        for name, (fpr, tpr) in artifacts["roc_curves"].items()
    }

    payload = {
        "overviewMetrics": [
            {"label": "Applications", "value": f"{df.shape[0]:,}", "sub": "cleaned rows"},
            {"label": "Approval rate", "value": f"{value_counts.get(1, 0) * 100:.1f}%", "sub": "class balance"},
            {"label": "Missing values", "value": str(int(df.isna().sum().sum())), "sub": "before imputation"},
            {"label": "Best model", "value": best_model_name, "sub": "by F1-score"},
        ],
        "dataPreview": df[preview_cols].head(10).to_dict("records"),
        "classBalance": [
            {"label": "Rejected", "count": int((df[TARGET] == 0).sum()), "pct": clean_number(value_counts.get(0, 0), 4)},
            {"label": "Approved", "count": int((df[TARGET] == 1).sum()), "pct": clean_number(value_counts.get(1, 0), 4)},
        ],
        "numericByClass": [
            {"feature": feature, "groups": boxplot_by_class(df, feature)}
            for feature in NUMERIC_FEATURES
        ],
        "correlationMatrix": {
            "columns": corr_cols,
            "values": [[clean_number(v, 2) for v in row] for row in corr.values.tolist()],
        },
        "approvalRateByCategory": {
            col: approval_rate_by_category(df, col) for col in CATEGORICAL_FEATURES
        },
        "modelComparison": model_comparison,
        "rocCurves": roc_curves,
        "confusionMatrix": {
            "model": best_model_name,
            "labels": ["Rejected", "Approved"],
            "matrix": cm.tolist(),
        },
        "featureImportances": [
            {"feature": index, "importance": clean_number(value, 5)}
            for index, value in importance.items()
        ],
        "bestModel": best_model_name,
        "meta": {
            "repository": "https://github.com/<your-username>/loan-approval-prediction",
            "techStack": [
                "Python", "Pandas", "Scikit-learn", "XGBoost",
                "Next.js", "TypeScript", "Vercel",
            ],
        },
    }

    payload = sanitize_json(payload)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    # allow_nan=False: fail loudly here if a NaN/Infinity ever slips through,
    # rather than silently shipping invalid JSON that breaks the frontend build.
    OUT.write_text(json.dumps(payload, indent=2, allow_nan=False), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    export()
