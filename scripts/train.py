"""Train loan-approval classification models.

Loads the raw Kaggle "Loan Risk Prediction Dataset" CSV, cleans it, builds a
shared preprocessing pipeline, trains three classifiers (Logistic
Regression, Random Forest, XGBoost), evaluates them on a held-out test set,
and persists everything the dashboard export needs.

Run from the repo root:

    python scripts/train.py

Reads:
    data/loan_risk_prediction_dataset.csv

Writes (under models/):
    pipelines.pkl            -- dict[str, Pipeline] for all three models
    results.pkl               -- pd.DataFrame of Accuracy/Precision/Recall/F1/ROC-AUC
    roc_curves.pkl            -- dict[str, tuple[np.ndarray, np.ndarray]] (fpr, tpr)
    best_model_name.pkl       -- str, name of the model with the highest F1-score
    feature_importance.pkl    -- pd.Series, permutation importance for the best model
    confusion_matrix.pkl      -- np.ndarray, confusion matrix for the best model
"""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "loan_risk_prediction_dataset.csv"
MODELS_DIR = ROOT / "models"

RANDOM_STATE = 42
NUMERIC_FEATURES = ["Age", "Income", "LoanAmount", "CreditScore", "YearsExperience"]
CATEGORICAL_FEATURES = ["Gender", "Education", "City", "EmploymentType"]
TARGET = "LoanApproved"


def load_raw_data(path: Path = DATA_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Could not find {path}. Download the Kaggle 'Loan Risk "
            "Prediction Dataset' (sohailkhan05) and place it at "
            "data/loan_risk_prediction_dataset.csv (see data/README.md)."
        )
    return pd.read_csv(path)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the same cleaning steps used during EDA (see the notebook)."""
    df = df.copy()

    # Negative values in Income/LoanAmount are noise, not real -> NaN,
    # to be handled by the imputers inside the Pipeline.
    for col in ["Income", "LoanAmount"]:
        df.loc[df[col] < 0, col] = np.nan

    df = df.drop_duplicates().reset_index(drop=True)
    return df


def build_preprocessor() -> ColumnTransformer:
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer(transformers=[
        ("num", numeric_transformer, NUMERIC_FEATURES),
        ("cat", categorical_transformer, CATEGORICAL_FEATURES),
    ])


def build_models() -> dict:
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=RANDOM_STATE
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, random_state=RANDOM_STATE
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300, max_depth=4, learning_rate=0.1,
            eval_metric="logloss", random_state=RANDOM_STATE,
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=DATA_PATH)
    args = parser.parse_args()

    print(f"Loading raw data from {args.data_path} ...")
    df = load_raw_data(args.data_path)
    print(f"Raw shape: {df.shape}")

    df = clean_data(df)
    print(f"Cleaned shape: {df.shape}")

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    preprocessor = build_preprocessor()
    models = build_models()

    pipelines = {}
    results = []
    roc_curves = {}

    for name, clf in models.items():
        print(f"Training {name} ...")
        pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", clf)])
        pipe.fit(X_train, y_train)
        pipelines[name] = pipe

        y_pred = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1]

        results.append({
            "Model": name,
            "Accuracy": accuracy_score(y_test, y_pred),
            "Precision": precision_score(y_test, y_pred),
            "Recall": recall_score(y_test, y_pred),
            "F1-score": f1_score(y_test, y_pred),
            "ROC-AUC": roc_auc_score(y_test, y_proba),
        })

        fpr, tpr, _ = roc_curve(y_test, y_proba)
        roc_curves[name] = (fpr, tpr)

    results_df = pd.DataFrame(results).set_index("Model").round(4)
    print(results_df)

    best_model_name = results_df["F1-score"].idxmax()
    best_pipe = pipelines[best_model_name]
    print(f"Best model by F1-score: {best_model_name}")

    y_pred_best = best_pipe.predict(X_test)
    cm = confusion_matrix(y_test, y_pred_best)

    print("Computing permutation importance for the best model ...")
    result = permutation_importance(
        best_pipe, X_test, y_test, n_repeats=10, random_state=RANDOM_STATE, n_jobs=-1
    )
    importance = pd.Series(
        result.importances_mean, index=X_test.columns
    ).sort_values()

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipelines, MODELS_DIR / "pipelines.pkl")
    joblib.dump(results_df, MODELS_DIR / "results.pkl")
    joblib.dump(roc_curves, MODELS_DIR / "roc_curves.pkl")
    joblib.dump(best_model_name, MODELS_DIR / "best_model_name.pkl")
    joblib.dump(importance, MODELS_DIR / "feature_importance.pkl")
    joblib.dump(cm, MODELS_DIR / "confusion_matrix.pkl")

    print(f"Saved pipelines and evaluation artifacts to {MODELS_DIR}/")


if __name__ == "__main__":
    main()
