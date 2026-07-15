export interface OverviewMetric {
  label: string;
  value: string;
  sub: string;
}

export interface DataPreviewRow {
  Age: number;
  Gender: string;
  City: string;
  Education: string;
  Income: number;
  LoanAmount: number;
  CreditScore: number;
  EmploymentType: string;
  YearsExperience: number;
  LoanApproved: number;
}

export interface ClassBalanceItem {
  label: string;
  count: number;
  pct: number;
}

export interface BoxplotGroup {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface NumericByClass {
  feature: string;
  groups: BoxplotGroup[];
}

export interface CorrelationMatrix {
  columns: string[];
  values: number[][];
}

export interface ApprovalRateItem {
  category: string;
  rate: number;
}

export interface ModelComparisonRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
}

export interface ConfusionMatrixData {
  model: string;
  labels: string[];
  matrix: number[][];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface DashboardData {
  overviewMetrics: OverviewMetric[];
  dataPreview: DataPreviewRow[];
  classBalance: ClassBalanceItem[];
  numericByClass: NumericByClass[];
  correlationMatrix: CorrelationMatrix;
  approvalRateByCategory: Record<string, ApprovalRateItem[]>;
  modelComparison: ModelComparisonRow[];
  rocCurves: Record<string, RocPoint[]>;
  confusionMatrix: ConfusionMatrixData;
  featureImportances: FeatureImportance[];
  bestModel: string;
  meta: {
    repository: string;
    techStack: string[];
  };
}
