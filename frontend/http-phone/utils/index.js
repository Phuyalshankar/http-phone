'use strict';

/**
 * Utils barrel — shared utility functions.
 */

/**
 * Format a price value to a locale string.
 * @param {number} amount
 * @param {string} currency
 */
function formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

module.exports = { formatPrice };
