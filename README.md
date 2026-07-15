# Loan Approval Prediction

End-to-end machine learning classification project predicting loan approval decisions using Logistic Regression, Random Forest, and XGBoost with data preprocessing, exploratory data analysis, and comparative model evaluation.

## Key Highlights

- Built and compared three classification models:
  - Logistic Regression
  - Random Forest
  - XGBoost
- Performed exploratory data analysis (EDA) with class distribution, correlation analysis, feature distributions, and approval-rate visualizations
- Cleaned and validated the dataset by handling missing values, removing duplicates, and treating invalid negative financial values
- Built a complete preprocessing pipeline using median/most-frequent imputation, feature scaling, and one-hot encoding with `ColumnTransformer`
- Evaluated models using Accuracy, Precision, Recall, F1-score, and ROC-AUC
- Compared ROC curves, confusion matrices, and calculated feature importance using permutation importance

## Tech Stack

Python, Pandas, NumPy, Scikit-learn, XGBoost, Matplotlib, Seaborn

## Dataset

Kaggle **"Loan Risk Prediction Dataset"** (~5,000 synthetic loan applications).

Features include:

- Applicant age
- Income
- Loan amount
- Credit score
- Employment type
- Education
- City
- Years of experience

Target:

- **LoanApproved**
  - 1 = Approved
  - 0 = Rejected

The dataset intentionally contains missing values, slight class imbalance, and noisy observations to simulate real-world credit decision scenarios.

## Model Pipeline

1. Data loading
2. Exploratory Data Analysis (EDA)
3. Data cleaning
4. Missing value imputation
5. Feature encoding & scaling
6. Model training
7. Model comparison
8. Performance evaluation
9. Feature importance analysis

## Results / Conclusion

The models successfully learn the relationship between applicant characteristics and loan approval decisions.
Credit score, income, and employment type emerge as the most influential features, closely reflecting real-world lending criteria.
Ensemble methods such as Random Forest and XGBoost generally outperform Logistic Regression by capturing more complex nonlinear relationships,
while the preprocessing pipeline prevents data leakage by fitting all transformations exclusively on the training data.