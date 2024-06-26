import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Convert __dirname for use with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the ODRL policy from the JSON file
const odrlPolicy = JSON.parse(
  fs.readFileSync(path.join(__dirname, "odrl_policy_policy.json"), "utf8")
);

function checkCompliance(dataRequest) {
  const { requesterId, researchType, useType } = dataRequest;

  // Check permissions based on researchType and additional conditions
  const permission = odrlPolicy.permission.find(
    (p) =>
      p.action === "use" &&
      p.constraint.some(
        (c) =>
          c.leftOperand === "researchArea" &&
          c.operator === "eq" &&
          c.rightOperand === researchType
      ) &&
      p.constraint.some(
        (c) =>
          c.leftOperand === "dataHandling" &&
          c.operator === "eq" &&
          c.rightOperand === "De-identification"
      )
  );

  if (!permission) {
    console.log(
      `Request denied for ${requesterId}: Research type '${researchType}' not permitted or data handling requirements not met.`
    );
    return false;
  }

  // Check prohibitions based on useType and other conditions
  const prohibition = odrlPolicy.prohibition.find(
    (p) =>
      (p.action === "use" &&
        p.constraint.some(
          (c) =>
            c.leftOperand === "purpose" &&
            c.operator === "eq" &&
            c.rightOperand === useType
        )) ||
      p.constraint.some(
        (c) =>
          c.leftOperand === "researchArea" &&
          c.operator === "neq" &&
          c.rightOperand !== researchType
      )
  );

  if (prohibition) {
    console.log(
      `Request denied for ${requesterId}: Use type '${useType}' is prohibited or research area is not allowed.`
    );
    return false;
  }

  // Request complies with the ODRL policy
  console.log(`Request approved for ${requesterId}.`);
  return true;
}

// data use request
const dataUseRequest = {
  requesterId: "researcher123",
  researchType: "AlzheimersDisease",
  useType: "CommercialUse",
};

/* const dataUseRequestNonCommercial = {
  requesterId: "researcher456",
  researchType: "Genomics",
  useType: "NonCommercial"
};*/

// Check if the request complies with the ODRL policy
checkCompliance(dataUseRequest);
