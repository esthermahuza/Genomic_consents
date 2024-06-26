import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Convert __filename and __dirname for use with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read JSON data from a file
function loadJsonData(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    console.log(`Attempting to load: ${fullPath}`);
    const fileData = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    console.error(`Error loading file ${filePath}: ${error}`);
    return null;
  }
}

// Function to evaluate ODRL policies
function evaluatePolicy(consent, policies) {
  // Extract policies array from the loaded JSON
  const policyArray = policies.policies; // Adjusted to match the JSON structure
  const relevantPolicies = policyArray.filter((policy) =>
    policy.permission.some(
      (permission) => permission.target === consent.consent_id
    )
  );

  if (relevantPolicies.length === 0) {
    console.log(
      `No relevant policies found for consent ID: ${consent.consent_id}`
    );
    return false;
  }

  // Evaluate constraints (simplified example, should be extended as needed)
  return relevantPolicies.every((policy) =>
    policy.permission.every((permission) =>
      permission.constraint.every((constraint) =>
        consent.consent_details.purpose.includes(constraint.rightOperand)
      )
    )
  );
}

// Function to handle the researcher's query based on consent and ODRL policies
function handleResearchQueryByConsent(researchType, useType) {
  const studies = loadJsonData("studies_genomic.json");
  const consents = loadJsonData("consents.json");
  const policies = loadJsonData("odrl_policies.json");

  if (!studies || !consents || !policies) {
    console.log("Failed to load one or more JSON files.");
    return;
  }

  console.log(
    `Data loaded successfully. Processing query for ${researchType} and ${useType}...`
  );
  const matchingConsents = consents.filter(
    (consent) =>
      consent.status === "active" &&
      consent.consent_details.purpose
        .toLowerCase()
        .includes(researchType.toLowerCase()) &&
      consent.DUO_terms.some((duo) => duo.code === useType)
  );

  console.log(`Found ${matchingConsents.length} matching consents.`);

  matchingConsents.forEach((consent) => {
    const associatedStudy = studies.find(
      (study) => study.consent_id === consent.consent_id
    );
    if (associatedStudy) {
      if (evaluatePolicy(consent, policies)) {
        console.log(`Access Granted for study: ${associatedStudy.title}`);
      } else {
        console.log(`Access Denied for study: ${associatedStudy.title}`);
      }
    } else {
      console.log(`No study found for consent ID: ${consent.consent_id}`);
    }
  });

  if (matchingConsents.length === 0) {
    console.log("No matching consents found for the specified conditions.");
  }
}

// Main execution of the script
handleResearchQueryByConsent("biomedical research", "HMB");
