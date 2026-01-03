function mapSpecialityToFormType(specialityName) {
  if (!specialityName) return "PHYSIO";

  const key = specialityName.toLowerCase();

  // PHYSIO
  if (["physio", "physiotherapist", "physical therapy"].some(k => key.includes(k))) {
    return "PHYSIO";
  }

  // DENTAL
  if (["dental", "dentist", "dental surgeon", "orthodontist"].some(k => key.includes(k))) {
    return "DENTAL";
  }

  // ESTHETIC
  if (["esthetic", "cosmetic", "dermatologist", "skin"].some(k => key.includes(k))) {
    return "ESTHETIC";
  }

  // Default fallback
  return "PHYSIO";
};


module.exports = mapSpecialityToFormType;
