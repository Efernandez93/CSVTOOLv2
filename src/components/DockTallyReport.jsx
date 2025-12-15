/**
 * Dock Tally Report Component - 
 * Generates printable Ocean Dock Tally Reports grouped by MBL
 */

import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { getDataGroupedByMBL } from '../lib/localDatabase';

export default function DockTallyReport({ isOpen, onClose, uploadId }) {
    const [loading, setLoading] = useState(true);
    const [groupedData, setGroupedData] = useState({});
    const [selectedMBLs, setSelectedMBLs] = useState([]);
    const printRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, uploadId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDataGroupedByMBL(uploadId);
            setGroupedData(data);
            // Select all MBLs by default
            setSelectedMBLs(Object.keys(data));
        } catch (err) {
            console.error('Error loading data:', err);
        }
        setLoading(false);
    };

    const toggleMBL = (mbl) => {
        setSelectedMBLs(prev =>
            prev.includes(mbl)
                ? prev.filter(m => m !== mbl)
                : [...prev, mbl]
        );
    };

    const selectAll = () => setSelectedMBLs(Object.keys(groupedData));
    const selectNone = () => setSelectedMBLs([]);

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'width=900,height=700');

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ocean Dock Tally Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            margin: 0;
            padding: 20px;
          }
          .report-page {
            page-break-after: always;
            margin-bottom: 20px;
          }
          .report-page:last-child {
            page-break-after: auto;
          }
          .report-header {
            border: 2px solid black;
            margin-bottom: 0;
          }
          .report-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            padding: 8px;
            border-bottom: 2px solid black;
          }
          .report-info-grid {
            display: flex;
          }
          .report-left-panel {
            width: 220px;
            border-right: 2px solid black;
            padding: 10px;
          }
          .report-left-panel p {
            margin: 4px 0;
            font-weight: bold;
          }
          .report-right-panel {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 6px 8px;
            text-align: left;
          }
          th {
            background: #e0e0e0;
            font-weight: bold;
            font-size: 10pt;
          }
          .arrival-header {
            text-align: center;
            font-weight: bold;
            padding: 4px;
            background: #f0f0f0;
          }
          .mfst-cell {
            display: flex;
            flex-direction: column;
          }
          .mfst-outer {
            border-bottom: 1px solid #999;
            padding-bottom: 2px;
          }
          .mfst-pcs {
            padding-top: 2px;
          }
          @media print {
            .report-page {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (!isOpen) return null;

    const mblList = Object.keys(groupedData);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1000px', maxHeight: '90vh' }}
            >
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} />
                        Generate Dock Tally Report
                    </h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ overflow: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span>
                            <p style={{ marginTop: '16px' }}>Loading data...</p>
                        </div>
                    ) : mblList.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📄</div>
                            <h3>No data available</h3>
                            <p>Upload a CSV file first to generate reports.</p>
                        </div>
                    ) : (
                        <>
                            {/* MBL Selection */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <span style={{ fontWeight: '500' }}>
                                        Select MBLs to include ({selectedMBLs.length} of {mblList.length})
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-sm btn-secondary" onClick={selectAll}>
                                            Select All
                                        </button>
                                        <button className="btn btn-sm btn-secondary" onClick={selectNone}>
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    maxHeight: '120px',
                                    overflowY: 'auto',
                                    padding: '12px',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    {mblList.map(mbl => (
                                        <label
                                            key={mbl}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                background: selectedMBLs.includes(mbl) ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMBLs.includes(mbl)}
                                                onChange={() => toggleMBL(mbl)}
                                                style={{ display: 'none' }}
                                            />
                                            {mbl}
                                            <span style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.7
                                            }}>
                                                ({groupedData[mbl].items.length})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{
                                maxHeight: '400px',
                                overflowY: 'auto',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                background: 'white'
                            }}>
                                <div ref={printRef}>
                                    {selectedMBLs.map(mbl => {
                                        const group = groupedData[mbl];
                                        if (!group) return null;

                                        return (
                                            <div key={mbl} className="report-page" style={{
                                                padding: '20px',
                                                color: 'black',
                                                fontFamily: 'Arial, sans-serif',
                                                fontSize: '12px'
                                            }}>
                                                {/* Header */}
                                                <div style={{ border: '2px solid black' }}>
                                                    <div style={{
                                                        textAlign: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        borderBottom: '2px solid black'
                                                    }}>
                                                        Ocean Dock Tally Report
                                                    </div>

                                                    <div style={{ display: 'flex' }}>
                                                        {/* Left Panel - MBL/Container Info */}
                                                        <div style={{
                                                            width: '200px',
                                                            borderRight: '2px solid black',
                                                            padding: '8px'
                                                        }}>
                                                            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                                                                MB: {mbl}
                                                            </p>
                                                            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                                                                CO: {group.containers.join(', ')}
                                                            </p>
                                                            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>HB:</p>
                                                            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Destination:</p>
                                                            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Dock Notes:</p>
                                                        </div>

                                                        {/* Right Panel - Table */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                textAlign: 'center',
                                                                fontWeight: 'bold',
                                                                padding: '4px',
                                                                borderBottom: '1px solid black',
                                                                background: '#f0f0f0'
                                                            }}>
                                                                Arrival
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                borderBottom: '1px solid black',
                                                                background: '#f0f0f0',
                                                                fontWeight: 'bold',
                                                                fontSize: '10px'
                                                            }}>
                                                                <div style={{ width: '70px', padding: '4px', borderRight: '1px solid black' }}>Mfst Qty</div>
                                                                <div style={{ width: '60px', padding: '4px', borderRight: '1px solid black' }}>PCS</div>
                                                                <div style={{ width: '60px', padding: '4px', borderRight: '1px solid black' }}>LOC</div>
                                                                <div style={{ width: '60px', padding: '4px', borderRight: '1px solid black' }}>TIME</div>
                                                                <div style={{ width: '60px', padding: '4px', borderRight: '1px solid black' }}>DMG</div>
                                                                <div style={{ flex: 1, padding: '4px' }}>CRW</div>
                                                            </div>

                                                            {/* Data Rows */}
                                                            {group.items.map((item, idx) => (
                                                                <div key={idx} style={{ display: 'flex', minHeight: '60px' }}>
                                                                    {/* Mfst Qty */}
                                                                    <div style={{
                                                                        width: '70px',
                                                                        borderRight: '1px solid black',
                                                                        borderBottom: '1px solid black',
                                                                        display: 'flex',
                                                                        flexDirection: 'column'
                                                                    }}>
                                                                        <div style={{
                                                                            flex: 1,
                                                                            padding: '4px',
                                                                            borderBottom: '1px solid #ccc'
                                                                        }}>
                                                                            {item.outer_quantity || ''}
                                                                        </div>
                                                                        <div style={{ flex: 1, padding: '4px' }}>
                                                                            {item.pcs || ''}
                                                                        </div>
                                                                    </div>
                                                                    {/* Empty cells for manual entry */}
                                                                    <div style={{ width: '60px', borderRight: '1px solid black', borderBottom: '1px solid black' }}></div>
                                                                    <div style={{ width: '60px', borderRight: '1px solid black', borderBottom: '1px solid black' }}></div>
                                                                    <div style={{ width: '60px', borderRight: '1px solid black', borderBottom: '1px solid black' }}></div>
                                                                    <div style={{ width: '60px', borderRight: '1px solid black', borderBottom: '1px solid black' }}></div>
                                                                    <div style={{ flex: 1, borderBottom: '1px solid black' }}></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* HB/Destination List (left side continuation) */}
                                                    <div style={{ borderTop: '1px solid black', padding: '8px' }}>
                                                        <table style={{
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            fontSize: '11px'
                                                        }}>
                                                            <tbody>
                                                                {group.items.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td style={{
                                                                            padding: '4px 8px',
                                                                            borderBottom: '1px solid #ddd',
                                                                            width: '150px',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {item.hb || ''}
                                                                        </td>
                                                                        <td style={{
                                                                            padding: '4px 8px',
                                                                            borderBottom: '1px solid #ddd'
                                                                        }}>
                                                                            {item.dest || ''}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handlePrint}
                        disabled={loading || selectedMBLs.length === 0}
                    >
                        <Printer size={18} />
                        Print Report
                    </button>
                </div>
            </div>
        </div>
    );
}
