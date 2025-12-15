/**
 * Data Table Component - Displays CSV data in a sortable table
 */

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DISPLAY_COLUMNS } from '../lib/csvUtils';

export default function DataTable({ data, loading }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const sortedData = useMemo(() => {
        if (!data || !sortConfig.key) return data || [];

        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} />
            : <ArrowDown size={14} />;
    };

    const formatCellValue = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.toLowerCase() === 'nan' || value.toLowerCase() === 'none')) {
            return '';
        }
        return value;
    };

    if (loading) {
        return (
            <div className="empty-state">
                <span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span>
                <h3 style={{ marginTop: '16px' }}>Loading data...</h3>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <h3>No data to display</h3>
                <p>Upload a CSV file or select a different filter</p>
            </div>
        );
    }

    return (
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        {DISPLAY_COLUMNS.map(col => (
                            <th key={col.key} onClick={() => handleSort(col.key)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {col.label}
                                    {getSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, idx) => (
                        <tr key={row.id || idx}>
                            {DISPLAY_COLUMNS.map(col => (
                                <td key={col.key}>
                                    {formatCellValue(row[col.key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
