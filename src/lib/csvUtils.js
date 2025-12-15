/**
 * CSV Processing Utilities
 */

import Papa from 'papaparse';

export const REQUIRED_COLUMNS = [
    'CONTAINER', 'SEAL #', 'CARRIER', 'MBL', 'MI', 'VESSEL', 'HB',
    'OUTER QUANTITY', 'PCS', 'WT_LBS', 'CNEE', 'FRL', 'FILE_NO',
    'DEST', 'VOLUME', 'VBOND#', 'TDF'
];

/**
 * Parse CSV file
 * @param {File} file - The CSV file to parse
 * @returns {Promise<{data: Array, errors: Array, meta: Object}>}
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

/**
 * Validate CSV has all required columns
 * @param {Array} headers - Column headers from CSV
 * @returns {{isValid: boolean, message: string, missingColumns: Array}}
 */
export function validateColumns(headers) {
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        return {
            isValid: false,
            message: `Missing required columns: ${missingColumns.join(', ')}`,
            missingColumns
        };
    }

    return {
        isValid: true,
        message: 'CSV is valid',
        missingColumns: []
    };
}

/**
 * Clean and normalize CSV data
 * @param {Array} data - Raw CSV data rows
 * @returns {Array} Cleaned data rows
 */
export function cleanData(data) {
    return data
        .map(row => {
            const cleaned = {};

            for (const key of Object.keys(row)) {
                let value = row[key];

                // Trim whitespace from string values
                if (typeof value === 'string') {
                    value = value.trim();
                }

                // Normalize HB column (handle scientific notation)
                if (key === 'HB') {
                    value = normalizeHB(value);
                }

                cleaned[key] = value;
            }

            return cleaned;
        })
        // Remove rows where CONTAINER or HB is empty
        .filter(row => {
            const container = row['CONTAINER'];
            const hb = row['HB'];
            return container && container !== '' && container.toLowerCase() !== 'nan';
        });
}

/**
 * Normalize HB value (handle scientific notation like 6.17E+08)
 * @param {any} value - HB value
 * @returns {string} Normalized HB value
 */
function normalizeHB(value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    try {
        // Convert to float first (handles scientific notation)
        const num = parseFloat(value);
        if (!isNaN(num)) {
            // Convert to integer then string (removes decimal places)
            return String(Math.floor(num));
        }
        return String(value).trim();
    } catch {
        return String(value).trim();
    }
}

/**
 * Export data to CSV and trigger download
 * @param {Array} data - Data to export
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, filename = 'export.csv') {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Column mapping from CSV headers to database column names
 */
export const COLUMN_MAPPING = {
    'CONTAINER': 'container',
    'SEAL #': 'seal_number',
    'CARRIER': 'carrier',
    'MBL': 'mbl',
    'MI': 'mi',
    'VESSEL': 'vessel',
    'HB': 'hb',
    'OUTER QUANTITY': 'outer_quantity',
    'PCS': 'pcs',
    'WT_LBS': 'wt_lbs',
    'CNEE': 'cnee',
    'FRL': 'frl',
    'FILE_NO': 'file_no',
    'DEST': 'dest',
    'VOLUME': 'volume',
    'VBOND#': 'vbond',
    'TDF': 'tdf'
};

/**
 * Display column names for the table
 */
export const DISPLAY_COLUMNS = [
    { key: 'container', label: 'CONTAINER' },
    { key: 'seal_number', label: 'SEAL #' },
    { key: 'carrier', label: 'CARRIER' },
    { key: 'mbl', label: 'MBL' },
    { key: 'mi', label: 'MI' },
    { key: 'vessel', label: 'VESSEL' },
    { key: 'hb', label: 'HB' },
    { key: 'outer_quantity', label: 'OUTER QTY' },
    { key: 'pcs', label: 'PCS' },
    { key: 'wt_lbs', label: 'WT LBS' },
    { key: 'cnee', label: 'CNEE' },
    { key: 'frl', label: 'FRL' },
    { key: 'file_no', label: 'FILE NO' },
    { key: 'dest', label: 'DEST' },
    { key: 'volume', label: 'VOLUME' },
    { key: 'vbond', label: 'VBOND#' },
    { key: 'tdf', label: 'TDF' },
];
