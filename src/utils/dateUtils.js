// export function extractDateFromSymbol(symbol) {
//   const match = symbol.match(/(BTC|ETH)-(\d{1,2}[A-Z]{3}\d{2})/);
//   return match ? match[2] : null;
// }

// export function parseDate(dateStr) {
//   const match = dateStr.match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
//   if (!match) return null;

//   const [, dayStr, monStr, yearStr] = match;

//   const months = {
//     JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//     JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
//   };

//   const day = parseInt(dayStr, 10);
//   const year = parseInt('20' + yearStr, 10);

//   return new Date(year, months[monStr], day);
// }
export function extractDateFromSymbol(symbol) {
  // Extract date like 4JUL25 or 25JUL25 from BTC-4JUL25-102000-C
  const match = symbol.match(/^[A-Z]+-(\d{1,2}[A-Z]{3}\d{2})/);
  return match ? match[1] : null;
}

export function parseDate(dateStr) {
  // Parse string like 4JUL25 or 25JUL25 into Date object
  const match = dateStr.match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
  if (!match) return null;

  const [, dayStr, monStr, yearStr] = match;

  const months = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  const day = parseInt(dayStr, 10);
  const month = months[monStr];
  const year = parseInt('20' + yearStr, 10);

  if (isNaN(day) || month === undefined || isNaN(year)) return null;

  return new Date(year, month, day);
}
