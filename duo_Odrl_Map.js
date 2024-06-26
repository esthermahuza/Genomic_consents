const consentJSON = {
  dataUseConditions: {
    permissions: [
      {
        DUOCode: "DUO:0000014",
        description:
          "Disease-specific research: Specifically for Alzheimer's Disease",
        target: [
          "https://researchdata.org/genomics/alzheimers/genomic_sequences",
          "https://researchdata.org/genomics/alzheimers/phenotypic_data",
          "https://researchdata.org/genomics/alzheimers/clinical_info",
        ],
        dataHandling: "De-identification",
      },
    ],
    prohibitions: [
      {
        DUOCode: "DUO:0000042",
        description: "Non-commercial use only",
        target: "https://researchdata.org/genomics/alzheimers",
      },
    ],
  },
};

function mapToODRLPolicy(consent) {
  const odrlPolicy = {
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    uid: "https://researchdata.org/policies/alzheimers_research_policy",
    type: "Policy",
    assigner: "https://researchdata.org/groups/alzheimers_study_participants",
    assignee: "https://exampleuniversity.org/adrc",
    permission: [],
    prohibition: [],
  };

  // Map permissions
  consent.dataUseConditions.permissions.forEach((p) => {
    odrlPolicy.permission.push({
      target: p.target,
      action: "use",
      constraint: [
        {
          leftOperand: "researchArea",
          operator: "eq",
          rightOperand: "AlzheimersDisease",
        },
        {
          leftOperand: "dataHandling",
          operator: "eq",
          rightOperand: p.dataHandling,
        },
      ],
    });
  });

  // Map prohibitions
  consent.dataUseConditions.prohibitions.forEach((p) => {
    odrlPolicy.prohibition.push({
      target: p.target,
      action: "use",
      constraint: [
        {
          leftOperand: "purpose",
          operator: "eq",
          rightOperand: "CommercialUse",
        },
        {
          leftOperand: "researchArea",
          operator: "neq",
          rightOperand: "AlzheimersDisease",
        },
      ],
    });
  });

  return odrlPolicy;
}

const odrlPolicy = mapToODRLPolicy(consentJSON);
console.log(JSON.stringify(odrlPolicy, null, 2));
