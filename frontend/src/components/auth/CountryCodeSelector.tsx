import React from 'react'
import { COUNTRIES, Country } from '../../utils/countries'

interface CountryCodeSelectorProps {
  value: string;
  onChange: (country: Country) => void;
  disabled?: boolean;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = COUNTRIES.find(c => c.dialCode === e.target.value);
    if (country) {
      onChange(country);
    }
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="input-cyber pr-3 appearance-none cursor-pointer font-mono text-sm"
        style={{ width: '120px' }}
      >
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.dialCode}>
            {country.flag} {country.dialCode}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountryCodeSelector;
