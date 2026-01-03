const PHYSIO_TEMPLATE = {
  flex: null,
  abd: null,
  extension: null,
  rotation: null,
  spasm: null,
  stiffness: null,
  tenderness: null,
  effusion: null,
  mmt: null,
  cc: null,
  history: null,
  examinationComment: null,
  nrs: null,
  dosage1: null,
  dosage2: null,
  dosage3: null,
  dosage4: null,
  dosage5: null,
  dosage6: null,
  joint: null,
  treatment: null,
  prescribeMedicine: null,
  description: null,
};

// const DENTAL_TEMPLATE = {
//   toothNumber: null,
//   complaint: null,
//   gumCondition: null,
//   xrayRequired: null,
//   dentalQuestions: {},
// };
const DENTAL_TEMPLATE = {
//   toothNumber: null,
//   complaint: null,
//   gumCondition: null,
//   xrayRequired: null,
  dentalQuestions: {
    // You can map fields from your uploaded form
    specificConcern: null,        // "What specific concern would you like to address?"
    previousTreatments: null,     // "Have you undergone any previous dental treatments?"
    medicalHistory: {
      underCareOfOtherDentist: null, // "Are you currently under care of any other dentist?"
      medications: null,              // "List any current medications or supplements"
      allergies: null,                // "Any known allergies?"
    },
    evaluationAndTreatmentPlan: null, // "Dental Evaluation and Treatment Plan"
    consent: {
      agreed: null, // true/false
      signature: null,
      date: null,
    },
  },
};

const ESTHETIC_TEMPLATE = {
  skinType: null,
  allergies: null,
  procedureType: null,
  estheticsQuestions: {
    specificConcern: null,
    previousTreatments: null,
    medicationsOrSupplements: null,
    aestheticGoals: null,
    interestedInProcedures: null,
    skincareRoutine: null,
    consent: {
      signedBy: null,
      date: null,
      acknowledgment: null
    }
  }
};


function getEmptyFormData(formType) {
  switch (formType) {
    case "DENTAL":
      return { ...DENTAL_TEMPLATE };

    case "ESTHETIC":
      return { ...ESTHETIC_TEMPLATE };

    case "PHYSIO":
    default:
      return { ...PHYSIO_TEMPLATE };
  }
}

module.exports = { getEmptyFormData };
