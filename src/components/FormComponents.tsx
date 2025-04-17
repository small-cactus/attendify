import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/solid';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  disabled?: boolean;
  showTimeSelect?: boolean;
  showTimeSelectOnly?: boolean;
  timeIntervals?: number;
  timeCaption?: string;
  dateFormat?: string;
  className?: string;
  isClearable?: boolean;
  minDate?: Date;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText,
  disabled = false,
  showTimeSelect = false,
  showTimeSelectOnly = false,
  timeIntervals = 15,
  timeCaption = "Time",
  dateFormat = "MMMM d, yyyy",
  className = "",
  isClearable = false,
  minDate,
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholderText}
      disabled={disabled}
      showTimeSelect={showTimeSelect}
      showTimeSelectOnly={showTimeSelectOnly}
      timeIntervals={timeIntervals}
      timeCaption={timeCaption}
      dateFormat={dateFormat}
      isClearable={isClearable}
      minDate={minDate}
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      calendarClassName="border border-gray-200 rounded-md shadow-lg"
      wrapperClassName="w-full"
      popperClassName="z-50"
      showPopperArrow={false}
      timeFormat="h:mm aa"
    />
  );
};

interface CustomSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  placeholder,
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`appearance-none w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white disabled:bg-gray-50 disabled:text-gray-500 pr-10 ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </div>
  );
};

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = "",
}) => {
  return (
    <label className={`relative flex items-start ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="flex items-center h-5">
        <div
          className={`w-4 h-4 border rounded transition-all duration-150 flex items-center justify-center
            ${checked 
              ? 'bg-black border-black' 
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {checked && (
            <CheckIcon className="w-3 h-3 text-white" />
          )}
        </div>
      </div>
      <div className="ml-3">
        <span className={`text-sm font-medium ${checked ? 'text-black' : 'text-gray-700'}`}>
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <input
        type="checkbox"
        className="absolute opacity-0 w-0 h-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
};

interface CustomRadioProps {
  selected: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
    description?: string;
  }[];
  disabled?: boolean;
  className?: string;
}

export const CustomRadio: React.FC<CustomRadioProps> = ({
  selected,
  onChange,
  options,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`relative flex items-start ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center h-5">
            <div
              className={`w-4 h-4 rounded-full border transition-all duration-150
                ${selected === option.value
                  ? 'border-[6px] border-black'
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            />
          </div>
          <div className="ml-3">
            <span className={`text-sm font-medium ${selected === option.value ? 'text-black' : 'text-gray-700'}`}>
              {option.label}
            </span>
            {option.description && (
              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
            )}
          </div>
          <input
            type="radio"
            className="absolute opacity-0 w-0 h-0"
            value={option.value}
            checked={selected === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </label>
      ))}
    </div>
  );
}; 