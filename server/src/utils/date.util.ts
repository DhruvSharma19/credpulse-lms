/**
 * Accurately calculates age in complete calendar years from Date of Birth.
 * Takes month and day into account so birthdays later in the current year are not prematurely counted.
 */
export const calculateAgeFromDob = (dobInput: Date | string): number => {
  const dob = typeof dobInput === 'string' ? new Date(dobInput) : dobInput;
  if (isNaN(dob.getTime())) {
    throw new Error('Invalid Date of Birth provided.');
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};
