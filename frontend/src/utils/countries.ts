export interface Country {
  code: string;        // ISO 3166-1 alpha-2 (e.g., "US", "IN")
  name: string;        // Full country name
  dialCode: string;    // International dialing code (e.g., "+1", "+91")
  flag: string;        // Unicode flag emoji
}

export const COUNTRIES: Country[] = [
  // Priority countries first
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  
  // Other countries alphabetically
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
];

export interface ValidationRule {
  minLength: number;
  maxLength: number;
  pattern?: RegExp;
}

export const VALIDATION_RULES: Record<string, ValidationRule> = {
  "+1": { minLength: 10, maxLength: 10, pattern: /^[2-9]\d{9}$/ },
  "+91": { minLength: 10, maxLength: 10, pattern: /^[6-9]\d{9}$/ },
  "+44": { minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/ },
  "+61": { minLength: 9, maxLength: 9, pattern: /^[2-9]\d{8}$/ },
  "+81": { minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
  default: { minLength: 7, maxLength: 15, pattern: /^\d{7,15}$/ }
};

export const formatToE164 = (countryCode: string, phoneNumber: string): string => {
  // Remove any non-digit characters from phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  // Combine with country code
  return `${countryCode}${cleaned}`;
};

export const validatePhoneNumber = (countryCode: string, phoneNumber: string): string | null => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const rules = VALIDATION_RULES[countryCode] || VALIDATION_RULES.default;
  
  if (cleaned.length < rules.minLength) {
    return `Phone number must be at least ${rules.minLength} digits`;
  }
  
  if (cleaned.length > rules.maxLength) {
    return `Phone number must be at most ${rules.maxLength} digits`;
  }
  
  if (rules.pattern && !rules.pattern.test(cleaned)) {
    const country = COUNTRIES.find(c => c.dialCode === countryCode);
    return `Please enter a valid phone number for ${country?.name || 'this country'}`;
  }
  
  return null;
};

export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  return COUNTRIES.find(c => c.dialCode === dialCode);
};
