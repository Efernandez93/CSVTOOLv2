/**
 * Data Table Component - Displays CSV data in a sortable, resizable table
 * With duplicate highlighting for HB and MBL columns
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DISPLAY_COLUMNS } from '../lib/csvUtils';

export default function DataTable({ data, loading }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnWidths, setColumnWidths] = useState({});
    const tableRef = useRef(null);
    const resizingRef = useRef(null);

    // Calculate duplicates for HB and MBL columns
    const duplicates = useMemo(() => {
        if (!data || data.length === 0) return { hb: new Set(), mbl: new Set() };

        const hbCounts = {};
        const mblCounts = {};

        data.forEach(row => {
            const hb = row.hb;
            const mbl = row.mbl;
            if (hb && hb.trim() !== '') {
                hbCounts[hb] = (hbCounts[hb] || 0) + 1;
            }
            if (mbl && mbl.trim() !== '') {
                mblCounts[mbl] = (mblCounts[mbl] || 0) + 1;
            }
        });

        // Only include values that appear more than once
        const duplicateHBs = new Set(Object.keys(hbCounts).filter(k => hbCounts[k] > 1));
        const duplicateMBLs = new Set(Object.keys(mblCounts).filter(k => mblCounts[k] > 1));

        return { hb: duplicateHBs, mbl: duplicateMBLs };
    }, [data]);

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

    // Check if a cell should be highlighted as duplicate
    const isDuplicate = (colKey, value) => {
        if (!value || value.trim() === '') return false;
        if (colKey === 'hb') return duplicates.hb.has(value);
        if (colKey === 'mbl') return duplicates.mbl.has(value);
        return false;
    };

    // Column resize handlers
    const handleMouseDown = useCallback((e, colKey) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const th = e.target.closest('th');
        const startWidth = th.offsetWidth;

        resizingRef.current = { colKey, startX, startWidth };

        const handleMouseMove = (moveEvent) => {
            if (!resizingRef.current) return;
            const diff = moveEvent.clientX - resizingRef.current.startX;
            const newWidth = Math.max(50, resizingRef.current.startWidth + diff);
            setColumnWidths(prev => ({
                ...prev,
                [resizingRef.current.colKey]: newWidth
            }));
        };

        const handleMouseUp = () => {
            resizingRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

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
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }} ref={tableRef}>
            <table className="data-table" style={{ tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        {DISPLAY_COLUMNS.map(col => (
                            <th
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                style={{
                                    width: columnWidths[col.key] || 'auto',
                                    minWidth: '60px',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {col.label}
                                    {getSortIcon(col.key)}
                                </div>
                                {/* Resize handle */}
                                <div
                                    className="resize-handle"
                                    onMouseDown={(e) => handleMouseDown(e, col.key)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '6px',
                                        cursor: 'col-resize',
                                        background: 'transparent',
                                        zIndex: 1
                                    }}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, idx) => (
                        <tr key={row.id || idx}>
                            {DISPLAY_COLUMNS.map(col => {
                                const value = row[col.key];
                                const hasDuplicate = isDuplicate(col.key, value);
                                return (
                                    <td
                                        key={col.key}
                                        style={{
                                            backgroundColor: hasDuplicate ? 'rgba(250, 204, 21, 0.25)' : 'transparent',
                                            width: columnWidths[col.key] || 'auto',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                        title={hasDuplicate ? `Duplicate ${col.key.toUpperCase()}: ${value}` : undefined}
                                    >
                                        {formatCellValue(value)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
