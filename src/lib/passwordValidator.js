/**
 * Password validation rules
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /[0-9]/
};

/**
 * Name validation rules - alphanumeric, spaces, and hyphens only
 */
export const NAME_REQUIREMENTS = {
  minLength: 4,
  minLetters: 4, // First 4 characters must be letters
  alphanumericPattern: /^[a-zA-Z0-9\s\-]*$/, // Only letters, numbers, spaces, and hyphens
  noSpecialChars: /[!@#$%^&*()_+=\[\]{};:'",.<>?/\\|`~]/,
  startWithLetters: /^[a-zA-Z]{4,}/, // First 4+ characters must be letters
  onlyLettersAndSpaces: /^[a-zA-Z\s]*$/ // Only letters and spaces allowed
};

export function validateName(name) {
  const trimmedName = name.trim();
  const startsWithLetters = NAME_REQUIREMENTS.startWithLetters.test(trimmedName);
  return {
    isValid: isNameValid(trimmedName),
    minLength: trimmedName.length >= NAME_REQUIREMENTS.minLength,
    startsWithLetters: startsWithLetters,
    isAlphanumeric: NAME_REQUIREMENTS.alphanumericPattern.test(trimmedName),
    noSpecialChars: !NAME_REQUIREMENTS.noSpecialChars.test(trimmedName),
    onlyLettersAndSpaces: NAME_REQUIREMENTS.onlyLettersAndSpaces.test(trimmedName)
  };
}

export function isNameValid(name) {
  const trimmedName = name.trim();
  return (
    trimmedName.length >= NAME_REQUIREMENTS.minLength &&
    // NAME_REQUIREMENTS.startWithLetters.test(trimmedName) &&
    // NAME_REQUIREMENTS.alphanumericPattern.test(trimmedName)
    NAME_REQUIREMENTS.onlyLettersAndSpaces.test(trimmedName)
  );
}

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
