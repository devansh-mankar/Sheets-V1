export const charToNumber = (letters) =>
  letters
    .split("")
    .reverse()
    .map(
      (letter, index) =>
        letter.toLowerCase().charCodeAt(0) - 97 + (index === 0 ? 0 : 1)
    )
    .reduce((sum, value, position) => sum + value * 26 ** position, 0);
