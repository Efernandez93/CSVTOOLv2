/**
 * Search Bar Component
 */

import { Search, X } from 'lucide-react';

const SEARCH_FIELDS = [
    { value: 'all', label: 'All Fields' },
    { value: 'hb', label: 'HB' },
    { value: 'mbl', label: 'MBL' },
    { value: 'container', label: 'Container' },
    { value: 'cnee', label: 'CNEE' },
    { value: 'carrier', label: 'Carrier' },
    { value: 'vessel', label: 'Vessel' },
    { value: 'file_no', label: 'File No' },
    { value: 'dest', label: 'Destination' },
];

export default function SearchBar({
    searchText,
    searchField,
    onSearchChange,
    onFieldChange,
    onClear
}) {
    return (
        <div className="search-bar">
            <Search size={20} style={{ color: 'var(--text-muted)' }} />

            <select
                className="input select"
                style={{ width: '140px' }}
                value={searchField}
                onChange={(e) => onFieldChange(e.target.value)}
            >
                {SEARCH_FIELDS.map(field => (
                    <option key={field.value} value={field.value}>{field.label}</option>
                ))}
            </select>

            <input
                type="text"
                className="input"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ flex: 1 }}
            />

            {searchText && (
                <button className="btn btn-ghost btn-icon" onClick={onClear}>
                    <X size={18} />
                </button>
            )}
        </div>
    );
}
