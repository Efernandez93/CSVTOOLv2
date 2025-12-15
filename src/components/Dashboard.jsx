/**
 * Dashboard Component - Main application view
 */

import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, X } from 'lucide-react';
import Sidebar from './Sidebar';
import MetricsBar from './MetricsBar';
import DataTable from './DataTable';
import SearchBar from './SearchBar';
import UploadModal from './UploadModal';
import DockTallyReport from './DockTallyReport';
import { exportToCSV } from '../lib/csvUtils';
import {
    getAllUploads,
    deleteUpload,
    getReportData,
    getMasterListData,
    getMasterListMetrics,
    getMasterListNewItems,
    getMasterListUpdatedItems,
    getMasterListNewFrl,
    getNewItemsData,
    getRemovedItemsData,
    detectNewItems,
    detectRemovedItems,
} from '../lib/localDatabase';

export default function Dashboard({ onLogout }) {
    // State
    const [uploads, setUploads] = useState([]);
    const [selectedUpload, setSelectedUpload] = useState(null);
    const [isMasterList, setIsMasterList] = useState(true);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDockReport, setShowDockReport] = useState(false);
    const [toast, setToast] = useState(null);

    // Metrics state
    const [metrics, setMetrics] = useState({
        totalRows: 0,
        withFrl: 0,
        withoutFrl: 0,
        newItems: 0,
        updatedItems: 0,
        removedItems: 0,
        newFrl: 0,
    });

    // Load uploads on mount
    useEffect(() => {
        loadUploads();
    }, []);

    // Load data when selection changes
    useEffect(() => {
        if (isMasterList) {
            loadMasterListData();
        } else if (selectedUpload) {
            loadUploadData(selectedUpload);
        }
    }, [isMasterList, selectedUpload, activeFilter]);

    const loadUploads = async () => {
        const uploadList = await getAllUploads();
        setUploads(uploadList);
    };

    const loadMasterListData = async () => {
        setLoading(true);
        try {
            // Load metrics
            const masterMetrics = await getMasterListMetrics();
            const newItems = await getMasterListNewItems();
            const updatedItems = await getMasterListUpdatedItems();
            const newFrl = await getMasterListNewFrl();

            setMetrics({
                totalRows: masterMetrics.totalRows,
                withFrl: masterMetrics.withFrl,
                withoutFrl: masterMetrics.withoutFrl,
                newItems: newItems.count,
                updatedItems: updatedItems.count,
                removedItems: 0,
                newFrl: newFrl.count,
            });

            // Load data based on filter
            let loadedData = [];
            switch (activeFilter) {
                case 'new_items':
                    loadedData = newItems.data;
                    break;
                case 'updated_items':
                    loadedData = updatedItems.data;
                    break;
                case 'new_frl':
                    loadedData = newFrl.data;
                    break;
                default:
                    loadedData = await getMasterListData(activeFilter);
            }

            setData(loadedData);
        } catch (err) {
            console.error('Error loading master list:', err);
            showToast('Error loading data', 'error');
        }
        setLoading(false);
    };

    const loadUploadData = async (uploadId) => {
        setLoading(true);
        try {
            // Load metrics
            const reportData = await getReportData(uploadId);
            const withFrl = reportData.filter(r => r.frl && r.frl.trim() !== '').length;

            const newItemsCount = await detectNewItems(uploadId);
            const removedItemsCount = await detectRemovedItems(uploadId);

            setMetrics({
                totalRows: reportData.length,
                withFrl,
                withoutFrl: reportData.length - withFrl,
                newItems: newItemsCount,
                removedItems: removedItemsCount,
                updatedItems: 0,
                newFrl: 0,
            });

            // Load data based on filter
            let loadedData = [];
            switch (activeFilter) {
                case 'new_items':
                    loadedData = await getNewItemsData(uploadId);
                    break;
                case 'updated_items':
                    loadedData = await getRemovedItemsData(uploadId);
                    break;
                default:
                    loadedData = await getReportData(uploadId, activeFilter);
            }

            setData(loadedData);
        } catch (err) {
            console.error('Error loading upload data:', err);
            showToast('Error loading data', 'error');
        }
        setLoading(false);
    };

    // Filtered data based on search
    const filteredData = useMemo(() => {
        if (!searchText.trim()) return data;

        const searchLower = searchText.toLowerCase();

        return data.filter(row => {
            if (searchField === 'all') {
                return Object.values(row).some(val =>
                    val && String(val).toLowerCase().includes(searchLower)
                );
            }
            const value = row[searchField];
            return value && String(value).toLowerCase().includes(searchLower);
        });
    }, [data, searchText, searchField]);

    // Handlers
    const handleSelectUpload = (uploadId) => {
        setSelectedUpload(uploadId);
        setIsMasterList(false);
        setActiveFilter('all');
        setSearchText('');
    };

    const handleSelectMasterList = () => {
        setSelectedUpload(null);
        setIsMasterList(true);
        setActiveFilter('all');
        setSearchText('');
    };

    const handleDeleteUpload = async (uploadId) => {
        const success = await deleteUpload(uploadId);
        if (success) {
            await loadUploads();
            if (selectedUpload === uploadId) {
                handleSelectMasterList();
            }
            showToast('Upload deleted successfully', 'success');
        } else {
            showToast('Failed to delete upload', 'error');
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setSearchText('');
    };

    const handleUploadSuccess = async ({ rowsInserted, itemsAdded, itemsUpdated }) => {
        await loadUploads();
        handleSelectMasterList();
        showToast(
            `Upload successful! ${rowsInserted} rows, ${itemsAdded} new items, ${itemsUpdated} updated`,
            'success'
        );
    };

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `export_${timestamp}.csv`;
        exportToCSV(filteredData, filename);
        showToast('CSV downloaded successfully', 'success');
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getSelectedTitle = () => {
        if (isMasterList) return '📦 Master List';
        const upload = uploads.find(u => u.id === selectedUpload);
        if (upload) {
            const date = new Date(upload.upload_date);
            return `📄 ${date.toLocaleDateString()} - ${upload.filename}`;
        }
        return 'Select an upload';
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                uploads={uploads}
                selectedUpload={selectedUpload}
                isMasterList={isMasterList}
                masterListCount={metrics.totalRows}
                onSelectUpload={handleSelectUpload}
                onSelectMasterList={handleSelectMasterList}
                onUploadClick={() => setShowUploadModal(true)}
                onDeleteUpload={handleDeleteUpload}
                onRefresh={loadUploads}
                onLogout={onLogout}
            />

            <main className="main-content">
                <header className="content-header">
                    <div>
                        <h1 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                            {getSelectedTitle()}
                        </h1>
                        {activeFilter !== 'all' && (
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setActiveFilter('all')}
                                style={{ marginTop: '4px' }}
                            >
                                <X size={14} />
                                Clear Filter
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowDockReport(true)}
                        >
                            <FileText size={18} />
                            Dock Report
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleDownloadCSV}
                            disabled={filteredData.length === 0}
                        >
                            <Download size={18} />
                            Download CSV
                        </button>
                    </div>
                </header>

                <div className="content-body">
                    <MetricsBar
                        metrics={metrics}
                        activeFilter={activeFilter}
                        onFilterChange={handleFilterChange}
                        isMasterList={isMasterList}
                    />

                    <SearchBar
                        searchText={searchText}
                        searchField={searchField}
                        onSearchChange={setSearchText}
                        onFieldChange={setSearchField}
                        onClear={() => setSearchText('')}
                    />

                    <div style={{
                        marginBottom: '12px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)'
                    }}>
                        Showing {filteredData.length} of {data.length} rows
                    </div>

                    <DataTable data={filteredData} loading={loading} />
                </div>
            </main>

            {/* Modals */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={handleUploadSuccess}
            />

            <DockTallyReport
                isOpen={showDockReport}
                onClose={() => setShowDockReport(false)}
                uploadId={isMasterList ? null : selectedUpload}
            />

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? '✓' : '⚠'}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}
