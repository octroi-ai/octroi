import type { RiskLevel, ComplianceStatus } from "@tokenforge/shared";

export interface AiSystemInput {
  id: string;
  name: string;
  description?: string | null;
  riskLevel: string;
  modelsUsed: string[] | null;
  purpose?: string | null;
  deployedAt?: Date | null;
}

export interface ComplianceCheckResult {
  type: string;
  status: ComplianceStatus;
  findings: Record<string, unknown>;
  recommendations: string[];
}

export interface AuditResult {
  riskLevel: RiskLevel;
  overallStatus: ComplianceStatus;
  checks: ComplianceCheckResult[];
  globalRecommendations: string[];
}

// EU AI Act risk categories (Annex III). Terms are matched on whole-word /
// whole-phrase boundaries to avoid substring false positives — e.g. a "data
// migration tool" must NOT be flagged high-risk on the word "migration", and a
// "next-generation" product must NOT be flagged limited on "generation".
const HIGH_RISK_PURPOSES = [
  "biometric identification",
  "critical infrastructure",
  "education",
  "employment",
  "recruitment",
  "essential services",
  "credit scoring",
  "law enforcement",
  "migration control",
  "asylum",
  "border control",
  "administration of justice",
  "judicial",
  "democratic processes",
];

const UNACCEPTABLE_PURPOSES = [
  "social scoring",
  "real-time biometric surveillance",
  "subliminal manipulation",
  "exploitation of vulnerabilities",
];

const LIMITED_INDICATORS = [
  "chatbot",
  "content generation",
  "image generation",
  "text generation",
  "synthetic media",
  "deepfake",
  "emotion recognition",
  "emotion",
  "sentiment",
];

// Whole-word / whole-phrase, case-insensitive match.
function mentions(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function assessRiskLevel(system: AiSystemInput): RiskLevel {
  const combined = `${system.purpose || ""} ${system.description || ""}`;

  if (UNACCEPTABLE_PURPOSES.some((t) => mentions(combined, t))) return "unacceptable";
  if (HIGH_RISK_PURPOSES.some((t) => mentions(combined, t))) return "high";
  if (LIMITED_INDICATORS.some((t) => mentions(combined, t))) return "limited";

  return "minimal";
}

export async function runComplianceAudit(system: AiSystemInput): Promise<AuditResult> {
  const riskLevel = assessRiskLevel(system);
  const checks: ComplianceCheckResult[] = [];
  const globalRecommendations: string[] = [];

  // Check 1: Documentation (Article 11)
  checks.push(checkDocumentation(system));

  // Check 2: Data governance (Article 10)
  checks.push(checkDataGovernance(system));

  // Check 3: Transparency (Article 13/52)
  checks.push(checkTransparency(system));

  // Check 4: Human oversight (Article 14)
  checks.push(checkHumanOversight(system));

  // Check 5: Accuracy & robustness (Article 15)
  checks.push(checkAccuracyRobustness(system));

  // Check 6: Risk management (Article 9)
  if (riskLevel === "high" || riskLevel === "unacceptable") {
    checks.push(checkRiskManagement(system));
  }

  // Determine overall status
  const hasNonCompliant = checks.some((c) => c.status === "non_compliant");
  const hasReviewNeeded = checks.some((c) => c.status === "review_needed");
  const overallStatus: ComplianceStatus = hasNonCompliant
    ? "non_compliant"
    : hasReviewNeeded
    ? "review_needed"
    : "compliant";

  // Add risk-level specific recommendations
  if (riskLevel === "unacceptable") {
    globalRecommendations.push(
      "Ce système est classé comme présentant un risque inacceptable. Son déploiement est interdit par l'EU AI Act."
    );
  } else if (riskLevel === "high") {
    globalRecommendations.push(
      "Système à haut risque : conformité obligatoire aux Articles 6 à 51 de l'EU AI Act.",
      "Un système de gestion de la qualité conforme à l'Article 17 est requis.",
      "L'enregistrement dans la base de données EU est obligatoire (Article 60)."
    );
  }

  return {
    riskLevel,
    overallStatus,
    checks,
    globalRecommendations,
  };
}

function checkDocumentation(system: AiSystemInput): ComplianceCheckResult {
  const findings: Record<string, unknown> = {};
  const recommendations: string[] = [];
  let status: ComplianceStatus = "compliant";

  if (!system.description || system.description.length < 50) {
    status = "non_compliant";
    findings.description = "Description insuffisante du système";
    recommendations.push(
      "Fournir une description détaillée du système IA conforme à l'Article 11 (min. 50 caractères, 200+ recommandé)"
    );
  }

  if (!system.purpose) {
    status = "non_compliant";
    findings.purpose = "Finalité du système non documentée";
    recommendations.push(
      "Documenter la finalité prévue du système conformément à l'Annexe IV"
    );
  }

  if (!system.modelsUsed || system.modelsUsed.length === 0) {
    status = status === "compliant" ? "review_needed" : status;
    findings.models = "Modèles IA utilisés non spécifiés";
    recommendations.push(
      "Lister tous les modèles IA utilisés avec leurs versions et fournisseurs"
    );
  }

  return { type: "documentation_article_11", status, findings, recommendations };
}

function checkDataGovernance(system: AiSystemInput): ComplianceCheckResult {
  const recommendations: string[] = [
    "Documenter les sources de données d'entraînement et de fine-tuning",
    "Mettre en place des procédures de détection et correction des biais",
    "Assurer la conformité RGPD pour toutes les données personnelles traitées",
  ];

  return {
    type: "data_governance_article_10",
    status: "review_needed",
    findings: {
      note: "Audit automatique des données non disponible — vérification manuelle requise",
    },
    recommendations,
  };
}

function checkTransparency(system: AiSystemInput): ComplianceCheckResult {
  const recommendations: string[] = [];
  let status: ComplianceStatus = "review_needed";

  recommendations.push(
    "S'assurer que les utilisateurs sont informés qu'ils interagissent avec un système IA",
    "Documenter les capacités et limitations du système de manière accessible"
  );

  return {
    type: "transparency_article_13_52",
    status,
    findings: {
      note: "Vérification de transparence requise pour les interfaces utilisateur",
    },
    recommendations,
  };
}

function checkHumanOversight(system: AiSystemInput): ComplianceCheckResult {
  return {
    type: "human_oversight_article_14",
    status: "review_needed",
    findings: {
      note: "Vérifier que des mécanismes de supervision humaine sont en place",
    },
    recommendations: [
      "Implémenter un mécanisme de supervision humaine avec possibilité d'intervention",
      "Former les opérateurs humains aux risques et limitations du système",
      "Mettre en place des procédures d'arrêt d'urgence si nécessaire",
    ],
  };
}

function checkAccuracyRobustness(system: AiSystemInput): ComplianceCheckResult {
  return {
    type: "accuracy_robustness_article_15",
    status: "review_needed",
    findings: {
      note: "Évaluation de la précision et de la robustesse requise",
    },
    recommendations: [
      "Mettre en place des métriques de performance et de précision",
      "Tester la robustesse face aux entrées adverses",
      "Documenter les niveaux de précision attendus et observés",
    ],
  };
}

function checkRiskManagement(system: AiSystemInput): ComplianceCheckResult {
  return {
    type: "risk_management_article_9",
    status: "non_compliant",
    findings: {
      note: "Système de gestion des risques requis pour les systèmes à haut risque",
    },
    recommendations: [
      "Établir un système de gestion des risques conforme à l'Article 9",
      "Identifier et analyser les risques connus et prévisibles",
      "Mettre en place des mesures d'atténuation appropriées",
      "Documenter les risques résiduels acceptables",
    ],
  };
}

export function generateArticle11Documentation(system: AiSystemInput): string {
  const riskLevel = assessRiskLevel(system);

  return `
# Documentation Technique — Article 11 EU AI Act
## Système: ${system.name}

### 1. Informations Générales
- **Nom du système**: ${system.name}
- **Description**: ${system.description || "Non renseigné"}
- **Finalité**: ${system.purpose || "Non renseigné"}
- **Niveau de risque**: ${riskLevel}
- **Modèles utilisés**: ${(system.modelsUsed || []).join(", ") || "Non renseigné"}
- **Date de déploiement**: ${system.deployedAt ? new Date(system.deployedAt).toISOString().split("T")[0] : "Non renseigné"}

### 2. Exigences de l'Article 11
${riskLevel === "high" ? `
#### 2.1 Système de gestion de la qualité (Art. 17)
- [ ] Politique qualité documentée
- [ ] Procédures de conception et développement
- [ ] Procédures de test et validation
- [ ] Gestion des données et gouvernance

#### 2.2 Documentation technique (Annexe IV)
- [ ] Description générale du système
- [ ] Description des éléments du système et de son processus de développement
- [ ] Informations sur le suivi, le fonctionnement et le contrôle du système
- [ ] Description des mesures de précision et de robustesse
` : `
Ce système est classé comme "${riskLevel}".
Les exigences de documentation technique complète s'appliquent principalement aux systèmes à haut risque.
Néanmoins, les bonnes pratiques de transparence (Art. 52) s'appliquent.
`}

### 3. Registre d'Utilisation
Les logs d'utilisation sont conservés conformément au RGPD avec une durée de rétention appropriée.

---
Document généré par Octroi Compliance Engine
Date de génération: ${new Date().toISOString().split("T")[0]}
  `.trim();
}
