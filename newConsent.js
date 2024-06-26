// Importing the filesystem and path modules to load the JSON dataset
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Convert __dirname for use with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulating a data access request
const request = {
  ResearchCategory: "research",
  Disease: "Hypertension",
  UsageType: "Non-commercial research",
};

// Define DUO mappings with additional terms and descriptions
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

// Function to filter dataset based on the request
function filterDataset(dataset, request) {
  return dataset.filter((sample) => {
    const hasPermission = sample.ConsentDetails.Permissions.includes(
      request.UsageType
    );
    const matchesDisease = sample.Phenotype.Disease === request.Disease;
    const matchesResearchCategory =
      sample.ConsentDetails.ResearchCategory === request.ResearchCategory;

    // Debug logs for each sample
    console.log(
      `Sample ${sample.SampleID} matches: ${
        hasPermission && matchesDisease && matchesResearchCategory
      }`
    );

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

// Main function to load the dataset and process it
function processDataset(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const dataset = JSON.parse(data);

  console.log(`Loaded dataset: ${dataset.length} samples`);

  const filteredSamples = filterDataset(dataset, request);

  console.log(`Filtered samples: ${filteredSamples.length}`);

  const consentDetails = extractConsentDetails(filteredSamples);

  // Displaying the extracted consent details
  console.log(
    `Extracted consent details: ${JSON.stringify(consentDetails, null, 2)}`
  );
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
