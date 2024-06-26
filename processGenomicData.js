// Importing the filesystem and path modules to load the JSON dataset
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Convert __filename and __dirname for use with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulating a data access request from a researcher
const request = {
  ResearchCategory: "research",
  Disease: "Hypertension",
  UsageType: "Non-commercial research",
};

// Define DUO mappings and descriptions
const duoMappings = {
  "Non-commercial research": {
    term: "DUO:0000020",
    description: "Non-commercial research",
  },
  "Biomedical research": {
    term: "DUO:0000007",
    description: "Biomedical research",
  },
  "Commercial use": { term: "DUO:0000016", description: "Commercial use" },
  "International data sharing": {
    term: "DUO:0000017",
    description: "International data sharing",
  },
  "Disease-specific research": {
    term: "DUO:0000006",
    description: "Disease-specific research",
  },
  "Genetic studies only": {
    term: "DUO:0000014",
    description: "Genetic studies only",
  },
  "General research use": {
    term: "DUO:0000018",
    description: "General research use",
  },
  "Publication required": {
    term: "DUO:0000023",
    description: "Publication required",
  },
  "Collaboration required": {
    term: "DUO:0000022",
    description: "Collaboration required",
  },
  "No re-identification": {
    term: "DUO:0000024",
    description: "No re-identification",
  },
};

// Define ODRL mappings for DUO terms
const odrlMappings = {
  "DUO:0000020": {
    action: "use",
    constraint: {
      leftOperand: "purpose",
      operator: "eq",
      rightOperand: "non-commercial",
    },
  },
  "DUO:0000007": {
    action: "use",
    constraint: {
      leftOperand: "purpose",
      operator: "eq",
      rightOperand: "biomedical",
    },
  },
  "DUO:0000016": {
    action: "prohibit",
    constraint: {
      leftOperand: "purpose",
      operator: "eq",
      rightOperand: "commercial",
    },
  },
  "DUO:0000017": {
    action: "prohibit",
    constraint: {
      leftOperand: "geoLocation",
      operator: "neq",
      rightOperand: "international",
    },
  },
  "DUO:0000006": {
    action: "use",
    constraint: {
      leftOperand: "purpose",
      operator: "eq",
      rightOperand: "disease-specific",
    },
  },
  "DUO:0000014": {
    action: "use",
    constraint: {
      leftOperand: "purpose",
      operator: "eq",
      rightOperand: "genetic-studies",
    },
  },
  "DUO:0000018": {
    action: "use",
    constraint: {
      leftOperand: "purpose",
      operator: "eq",
      rightOperand: "general-research",
    },
  },
  "DUO:0000023": {
    action: "duty",
    constraint: {
      leftOperand: "action",
      operator: "eq",
      rightOperand: "publish",
    },
  },
  "DUO:0000022": {
    action: "duty",
    constraint: {
      leftOperand: "action",
      operator: "eq",
      rightOperand: "collaborate",
    },
  },
  "DUO:0000024": {
    action: "duty",
    constraint: {
      leftOperand: "action",
      operator: "eq",
      rightOperand: "no-re-identification",
    },
  },
};

// Function to filter dataset based on the request
function filterDataset(dataset, request) {
  return dataset.filter((sample) => {
    const hasPermission = sample.ConsentDetails.Permissions.includes(
      request.UsageType
    );
    const matchesDisease = sample.Phenotype.Disease === request.Disease;
    const matchesResearchCategory =
      sample.ConsentDetails.ResearchCategory === request.ResearchCategory;

    return hasPermission && matchesDisease && matchesResearchCategory;
  });
}

// Function to extract consent details and map to DUO terms with descriptions from the filtered dataset
function extractConsentDetails(filteredSamples) {
  return filteredSamples.map((sample) => {
    const permissions = sample.ConsentDetails.Permissions.map((permission) => {
      const duo = duoMappings[permission];
      return { term: duo.term, description: duo.description };
    });
    const prohibitions = sample.ConsentDetails.Prohibitions.map(
      (prohibition) => {
        const duo = duoMappings[prohibition];
        return { term: duo.term, description: duo.description };
      }
    );

    return {
      SampleID: sample.SampleID,
      ConsentDate: sample.ConsentDetails.ConsentDate,
      ResearchCategory: sample.ConsentDetails.ResearchCategory,
      Permissions: permissions,
      Prohibitions: prohibitions,
      ConsentDocumentURL: sample.ConsentDetails.ConsentDocumentURL,
    };
  });
}

// Function to generate ODRL policies based on DUO terms
function generateODRLPolicies(consentDetails) {
  return consentDetails.map((consent) => {
    const policies = [];

    consent.Permissions.forEach((duoTerm) => {
      const odrl = odrlMappings[duoTerm.term];
      if (odrl && odrl.action) {
        policies.push({
          action: odrl.action,
          constraint: odrl.constraint,
        });
      }
    });

    consent.Prohibitions.forEach((duoTerm) => {
      const odrl = odrlMappings[duoTerm.term];
      if (odrl && odrl.action) {
        policies.push({
          action: odrl.action,
          constraint: odrl.constraint,
        });
      }
    });

    return {
      SampleID: consent.SampleID,
      ODRLPolicy: policies,
    };
  });
}

// Function to evaluate access request against ODRL policies
function evaluateAccessRequest(odrlPolicies, request) {
  return odrlPolicies.map((policy) => {
    let accessGranted = true;
    let reason = "All permissions matched and no prohibitions violated.";

    policy.ODRLPolicy.forEach((rule) => {
      if (
        rule.action === "use" &&
        rule.constraint.rightOperand === request.UsageType
      ) {
        // Permission granted
      } else if (
        rule.action === "prohibit" &&
        rule.constraint.rightOperand === request.UsageType
      ) {
        accessGranted = false;
        reason = `Prohibition on '${rule.constraint.rightOperand}' violated.`;
      } else if (rule.action === "duty") {
        // Handle duty constraints if necessary
      }
    });

    return {
      SampleID: policy.SampleID,
      AccessGranted: accessGranted,
      Reason: reason,
    };
  });
}

// Main function to load the dataset and process it
function processDataset(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const dataset = JSON.parse(data);

  const filteredSamples = filterDataset(dataset, request);

  const consentDetails = extractConsentDetails(filteredSamples);

  const odrlPolicies = generateODRLPolicies(consentDetails);

  const accessResults = evaluateAccessRequest(odrlPolicies, request);

  // Displaying the final access results
  console.log(`Access results: ${JSON.stringify(accessResults, null, 2)}`);
}

// Use the correct path for Unix-like environment
const filePath = path.join(
  "/mnt",
  "c",
  "Users",
  "esthe",
  "Downloads",
  "simulated_genomic_data.json"
);
processDataset(filePath);
