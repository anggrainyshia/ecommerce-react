import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const fetchCountries = async () => {
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag');
  const data = await res.json();
  return data
    .filter((c) => c.idd?.root && c.idd?.suffixes?.length > 0)
    .map((c) => ({
      name: c.name.common,
      code: c.idd.root + c.idd.suffixes[0],
      flag: c.flag,
    }))
    .filter((c) => c.code && c.code !== '+')
    .sort((a, b) => a.name.localeCompare(b.name));
};

export default function PhoneInput({
  value = '',
  onChange,
  placeholder = '812 3456 7890',
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dialCode, setDialCode] = useState('+62');
  const [number, setNumber] = useState('');
  const dropdownRef = useRef(null);
  const initialized = useRef(false);

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ['phone-countries'],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });

  // Parse initial value once countries are loaded
  useEffect(() => {
    if (!value || initialized.current || countries.length === 0) return;
    const sorted = [...countries].sort((a, b) => b.code.length - a.code.length);
    const match = sorted.find((c) => value.startsWith(c.code));
    if (match) {
      setDialCode(match.code);
      setNumber(value.slice(match.code.length));
    } else {
      setNumber(value);
    }
    initialized.current = true;
  }, [value, countries]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCodeChange = (code) => {
    setDialCode(code);
    setOpen(false);
    setSearch('');
    onChange?.(code + number);
  };

  const handleNumberChange = (e) => {
    const n = e.target.value.replace(/\D/g, '');
    setNumber(n);
    onChange?.(dialCode + n);
  };

  const selected = countries.find((c) => c.code === dialCode);
  const filtered = search
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : countries;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-visible focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {/* Country code button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0 rounded-l-lg"
        >
          <span className="text-base leading-none">{selected?.flag ?? '🌐'}</span>
          <span className="font-mono">{dialCode}</span>
          <svg
            className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          required={required}
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none rounded-r-lg"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500 p-3 text-center">Loading countries...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-500 p-3 text-center">No results</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={`${c.code}-${c.name}`}
                  type="button"
                  onClick={() => handleCodeChange(c.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                    c.code === dialCode
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-mono flex-shrink-0">
                    {c.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
