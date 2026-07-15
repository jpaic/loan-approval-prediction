import Hero from "./components/Hero";
import OverviewMetrics, { Section } from "./components/OverviewMetrics";
import { DataPreviewTable } from "./components/DataTables";
import {
  ApprovalRateBarChart,
  BoxplotByClassChart,
  CorrelationHeatmap,
} from "./components/Charts";
import {
  ConfusionMatrixChart,
  FeatureImportanceChart,
  ModelComparisonChart,
  RocCurveChart,
} from "./components/ModelEvaluation";
import { dashboardData } from "@/lib/data";

export default function Home() {
  const {
    overviewMetrics,
    dataPreview,
    numericByClass,
    correlationMatrix,
    approvalRateByCategory,
    modelComparison,
    rocCurves,
    confusionMatrix,
    featureImportances,
    classBalance,
    meta,
  } = dashboardData;

  const bestModel = modelComparison.find((m) => m.model === dashboardData.bestModel);

  return (
    <main>
      <Hero
        classBalance={classBalance}
        bestModel={bestModel}
        repository={meta.repository}
      />

      <Section
        eyebrow="Dataset"
        title="Overview"
        description="5,000 loan applications with financial, demographic, and professional features, cleaned of noisy negative values and duplicates."
      >
        <OverviewMetrics metrics={overviewMetrics} />
        <div className="mt-6">
          <DataPreviewTable rows={dataPreview} />
        </div>
      </Section>

      <Section
        eyebrow="EDA"
        title="Numerical features by outcome"
        description="Distribution (5th–95th percentile, with median) of each numerical feature, split by approved vs. rejected applications."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {numericByClass.map((nbc) => (
            <BoxplotByClassChart key={nbc.feature} {...nbc} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="EDA"
        title="Approval rate by category"
        description="Share of applications approved, broken down by gender, education, city, and employment type."
      >
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(approvalRateByCategory).map(([category, items]) => (
            <ApprovalRateBarChart key={category} items={items} title={category} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="EDA"
        title="Feature correlation"
        description="Pairwise correlation between numerical features and the loan approval outcome."
      >
        <CorrelationHeatmap
          matrix={correlationMatrix}
          emptyLabel="Correlation heatmap will appear once dashboard-data.json is generated."
        />
      </Section>

      <Section
        id="model"
        eyebrow="Model"
        title="Model comparison"
        description="Logistic Regression, Random Forest, and XGBoost compared on Accuracy, Precision, Recall, F1-score, and ROC-AUC on a held-out, stratified 20% test split."
      >
        <ModelComparisonChart rows={modelComparison} />
      </Section>

      <Section
        eyebrow="Model"
        title="ROC curves"
        description="True positive rate vs. false positive rate across decision thresholds, for each model."
      >
        <RocCurveChart curves={rocCurves} />
      </Section>

      <Section
        eyebrow="Model"
        title="Confusion matrix"
        description="Predicted vs. actual outcomes for the best model, selected by F1-score."
      >
        <ConfusionMatrixChart data={confusionMatrix} />
      </Section>

      <Section
        eyebrow="Model"
        title="Feature importance"
        description="Permutation importance for the best model — the drop in accuracy when each feature's values are shuffled."
      >
        <FeatureImportanceChart items={featureImportances} />
      </Section>

      <footer className="max-w-6xl mx-auto px-6 py-14 border-t border-[var(--panel-border)] text-sm text-[var(--muted)]">
        <p className="mb-2">
          Credit score, income, and employment type are the strongest
          predictors of approval — consistent with real-world credit risk
          principles. Because of class imbalance, F1-score and ROC-AUC
          matter more than raw accuracy here.
        </p>
        <p>
          Built with {meta.techStack.join(", ")}. Source data:{" "}
          <a href={meta.repository} className="underline hover:text-[var(--ink)]">
            {meta.repository}
          </a>
        </p>
      </footer>
    </main>
  );
}
