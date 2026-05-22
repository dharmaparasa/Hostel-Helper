/**
 * Password validation rules
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /[0-9]/
};

export function validatePassword(password) {
  return {
    isValid: isPasswordValid(password),
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasLowerCase: PASSWORD_REQUIREMENTS.hasLowerCase.test(password),
    hasUpperCase: PASSWORD_REQUIREMENTS.hasUpperCase.test(password),
    hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password)
  };
}

export function isPasswordValid(password) {
  return (
    password.length >= PASSWORD_REQUIREMENTS.minLength &&
    PASSWORD_REQUIREMENTS.hasLowerCase.test(password) &&
    PASSWORD_REQUIREMENTS.hasNumber.test(password)
  );
}

export function getPasswordStrength(password) {
  if (!password) return 0;
  
  const validation = validatePassword(password);
  let strength = 0;
  
  if (validation.minLength) strength += 1;
  if (validation.hasLowerCase) strength += 1;
  if (validation.hasNumber) strength += 1;
  if (validation.hasUpperCase) strength += 1;
  
  return strength;
}
