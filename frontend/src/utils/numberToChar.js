export const numberToChar = (num) => {
  const division = Math.floor(num / 26);
  const remainder = num % 26;

  const char = String.fromCharCode(remainder + 97).toUpperCase();

  // Adjusting for zero-based index mapping
  return division - 1 >= 0 ? numberToChar(division - 1) + char : char;
};
