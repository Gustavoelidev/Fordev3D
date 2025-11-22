/**
 * Formats a number as Brazilian Real currency.
 * @param {number} value - The value to format.
 * @returns {string} - The formatted currency string.
 */
export const fmt = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

/**
 * Parses a currency string back to a float.
 * @param {string} value - The currency string (e.g., "R$ 1.234,56").
 * @returns {number} - The parsed number.
 */
export const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
};
