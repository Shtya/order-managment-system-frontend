// Company country options shared by onboarding CompanyStep and settings CompanyTab.
// Values are persisted on the company record; labels resolve from the
// "onboarding.company.countries" message namespace via `countries.<value>`.
export const COMPANY_COUNTRIES = [
  "egypt",
  "saudi",
  "uae",
  "kuwait",
  "qatar",
  "bahrain",
  "oman",
  "jordan",
  "lebanon",
];

// Default dial code per company country (must match PHONE_CODES in Signup).
export const COMPANY_COUNTRY_DIAL = {
  egypt: "+20",
  saudi: "+966",
  uae: "+971",
  kuwait: "+965",
  qatar: "+974",
  bahrain: "+973",
  oman: "+968",
  jordan: "+962",
  lebanon: "+961",
};
