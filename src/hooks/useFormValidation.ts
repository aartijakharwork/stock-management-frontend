import { useState, useCallback, useMemo } from 'react';

type Rule<T> = {
  validate: (value: T[keyof T], values: T) => boolean;
  message: string;
};

type Rules<T> = Partial<Record<keyof T, Rule<T>[]>>;

export function useFormValidation<T extends Record<string, unknown>>(initialValues: T, rules: Rules<T>) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((field: keyof T, value: T[keyof T], allValues: T): string | undefined => {
    const fieldRules = rules[field];
    if (!fieldRules) return undefined;
    for (const rule of fieldRules) {
      if (!rule.validate(value, allValues)) return rule.message;
    }
    return undefined;
  }, [rules]);

  const validateAll = useCallback((values: T): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let valid = true;
    for (const field of Object.keys(rules) as (keyof T)[]) {
      const error = validateField(field, values[field], values);
      if (error) {
        newErrors[field] = error;
        valid = false;
      }
    }
    setErrors(newErrors);
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const field of Object.keys(rules) as (keyof T)[]) {
      allTouched[field] = true;
    }
    setTouched(allTouched);
    return valid;
  }, [rules, validateField]);

  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const setFieldError = useCallback((field: keyof T, value: T[keyof T], allValues: T) => {
    const error = validateField(field, value, allValues);
    setErrors(prev => {
      const next = { ...prev };
      if (error) next[field] = error; else delete next[field];
      return next;
    });
  }, [validateField]);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  }, [errors, touched]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return { errors, touched, validateAll, touchField, setFieldError, getFieldError, clearErrors, isValid };
}

export const required = (message = 'This field is required') => ({
  validate: (value: unknown) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    return value != null;
  },
  message,
});

export const minLength = (min: number, message?: string) => ({
  validate: (value: unknown) => typeof value === 'string' && value.length >= min,
  message: message || `Must be at least ${min} characters`,
});

export const isEmail = (message = 'Enter a valid email') => ({
  validate: (value: unknown) => typeof value === 'string' && (!value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  message,
});

export const isPhone = (message = 'Enter a valid phone number') => ({
  validate: (value: unknown) => typeof value === 'string' && (!value || /^[+]?[\d\s-]{10,15}$/.test(value)),
  message,
});
