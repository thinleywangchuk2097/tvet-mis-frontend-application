/**
 * Validates an assessment input value.
 * @param {string|number} value
 * @param {number} maxDiploma - max allowed when certification level is diploma
 * @param {boolean} isDiploma - whether the cert level is diploma (111/112)
 */
export const validateAssessmentInput = (value, maxDiploma, isDiploma) => {
  if (value === "") return true;
  const numValue = Number(value);
  if (isNaN(numValue)) return false;
  if (isDiploma) return numValue >= 0 && numValue <= maxDiploma;
  return numValue >= 0 && numValue <= 100;
};

export const getAssessmentMaxValue = (field, isDiploma) => {
  if (!isDiploma) return null;
  const maxMap = { theory: 20, practical: 60, viva: 20, vivaPractical: 60 };
  return maxMap[field] ?? null;
};

export const getAssessmentTooltipMessage = (field, isDiploma) => {
  const maxVal = getAssessmentMaxValue(field, isDiploma);
  if (!maxVal) return "";
  return `Maximum value that can be entered is ${maxVal}`;
};

/**
 * Parses a raw assessment value according to cert-level rules.
 * Use for building API payloads.
 */
export const parseIntIfNumeric = (raw, isNumeric) => {
  if (raw === null || raw === undefined || raw === "") return null;
  return isNumeric ? parseInt(raw, 10) : raw;
};

/**
 * Checks whether every trainee has the required assessment values.
 * @param {Array} trainees
 * @param {Object} assessmentState - { viva, vivaPractical, theory, practical }
 * @param {boolean} isVivaType - true for service 39/41, false otherwise
 * @param {boolean} hasInternalAssessment - feature flag
 */
export const allTraineesHaveAssessments = (
  trainees,
  assessmentState,
  isVivaType,
  hasInternalAssessment,
) => {
  if (!hasInternalAssessment) return true;

  return trainees.every((trainee) => {
    const hasInternal =
      trainee.internal_assessment !== null &&
      trainee.internal_assessment !== "";
    if (!hasInternal) return true;

    if (isVivaType) {
      const viva =
        assessmentState.viva[trainee.id] || trainee.viva_assessment || "";
      const practical =
        assessmentState.vivaPractical[trainee.id] ||
        trainee.practical_assessment ||
        "";
      return viva !== "" && practical !== "";
    }
    const theory =
      assessmentState.theory[trainee.id] || trainee.theory_assessment || "";
    const practical =
      assessmentState.practical[trainee.id] ||
      trainee.practical_assessment ||
      "";
    return theory !== "" && practical !== "";
  });
};