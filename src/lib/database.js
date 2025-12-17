/**
 * Database Layer - Supabase with localStorage fallback
 * Automatically uses Supabase if configured, otherwise falls back to localStorage
 */

import { supabase, isSupabaseEnabled } from './supabaseClient.js';
import * as localDB from './localDatabase.js';

// Helper to generate unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * UPLOADS OPERATIONS
 */

export async function saveUpload(filename, rowCount, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const uploadId = generateId();
        const { data, error } = await supabase
            .from('uploads')
            .insert({
                upload_id: uploadId,
                mode,
                filename,
                row_count: rowCount,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase saveUpload error:', error);
            throw error;
        }
        // Ensure id is set to upload_id (TEXT) not the UUID id from data
        return { ...data, id: data.upload_id };
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.saveAirUpload(filename, rowCount);
    }
    return localDB.saveUpload(filename, rowCount);
}

export async function getAllUploads(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const { data, error } = await supabase
            .from('uploads')
            .select('*')
            .eq('mode', mode)
            .neq('upload_id', 'master')
            .order('upload_date', { ascending: false });

        if (error) {
            console.error('Supabase getAllUploads error:', error);
            return [];
        }
        console.log('[DEBUG] getAllUploads raw data:', data);
        // Ensure id is set to upload_id (TEXT)
        const mapped = data.map(u => ({ ...u, id: u.upload_id }));
        console.log('[DEBUG] getAllUploads mapped:', mapped);

        // Debug: Check total rows in ocean_data table
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';
        const { data: allRows, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: false })
            .limit(5);
        console.log(`[DEBUG] Total rows in ${tableName} table:`, allRows?.length, 'Sample:', allRows);

        return mapped;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.getAllAirUploads();
    }
    return localDB.getAllUploads();
}

export async function deleteUpload(uploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const { error } = await supabase
            .from('uploads')
            .delete()
            .eq('upload_id', uploadId);

        if (error) {
            console.error('Supabase deleteUpload error:', error);
            throw error;
        }
        return;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.deleteAirUpload(uploadId);
    }
    return localDB.deleteUpload(uploadId);
}

/**
 * REPORT DATA OPERATIONS (Ocean)
 */

export async function saveReportData(uploadId, data, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        // Map CSV columns to database columns
        const records = data.map(row => {
            if (mode === 'air') {
                // Air cargo column mapping
                return {
                    upload_id: uploadId,
                    mawb: row['MAWB'] || row['mawb'] || '',
                    hawb: row['HAWB'] || row['hawb'] || '',
                    flight_number: row['FLIGHT_NUMBER'] || row['FLIGHT NUMBER'] || row['flight_number'] || '',
                    destination: row['DESTINATION'] || row['DEST'] || row['destination'] || '',
                    slac: row['SLAC'] || row['slac'] || '',
                    qty: row['QTY'] || row['qty'] || '',
                    cfs_location: row['CFS_LOCATION'] || row['CFS LOCATION'] || row['cfs_location'] || '',
                    log: row['LOG'] || row['log'] || '',
                    status: 'active',
                };
            } else {
                // Ocean cargo column mapping
                return {
                    upload_id: uploadId,
                    mbl: row['MBL'] || row['mbl'] || '',
                    hb: row['HB'] || row['hb'] || '',
                    container: row['CONTAINER'] || row['container'] || '',
                    dest: row['DEST'] || row['dest'] || '',
                    outer_quantity: row['OUTER QUANTITY'] || row['OUTER_QUANTITY'] || row['outer_quantity'] || '',
                    pcs: row['PCS'] || row['pcs'] || '',
                    frl_date: row['FRL'] || row['frl'] || row['frl_date'] || '',
                    tdf_date: row['TDF'] || row['tdf'] || row['tdf_date'] || '',
                    vbond_date: row['VBOND#'] || row['VBOND'] || row['vbond_date'] || '',
                    status: 'active',
                };
            }
        });

        console.log('[DEBUG] saveReportData records sample:', records.slice(0, 2));

        // Batch insert in chunks if needed, but for now single batch
        const { error } = await supabase
            .from(tableName)
            .insert(records);

        if (error) {
            console.error(`Supabase saveReportData error (${mode}):`, error);
            throw new Error(`Failed to save report data: ${error.message} (${error.details || ''})`);
        }
        console.log(`[DEBUG] Successfully inserted ${records.length} rows into ${tableName}`);
        return records.length;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.saveAirReportData(uploadId, data);
    }
    return localDB.saveReportData(uploadId, data);
}

export async function getReportData(uploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        console.log(`[DEBUG] getReportData called with uploadId: ${uploadId}, mode: ${mode}, table: ${tableName}`);

        // First, try to get data without status filter to debug
        const { data: allData, error: debugError } = await supabase
            .from(tableName)
            .select('*')
            .eq('upload_id', uploadId);

        console.log(`[DEBUG] Query without status filter returned ${allData?.length || 0} rows`, allData?.slice(0, 2));

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('upload_id', uploadId)
            .eq('status', 'active');

        console.log(`[DEBUG] Query with status='active' returned ${data?.length || 0} rows`);

        if (error) {
            console.error(`Supabase getReportData error (${mode}):`, error);
            return [];
        }
        return data;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.getAirReportData(uploadId);
    }
    return localDB.getReportData(uploadId);
}

export async function getAllReportData(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Supabase getAllReportData error (${mode}):`, error);
            return [];
        }
        return data;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.getAllAirReportData();
    }
    return localDB.getAllReportData();
}

export async function deleteReportData(uploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('upload_id', uploadId);

        if (error) {
            console.error(`Supabase deleteReportData error (${mode}):`, error);
            throw error;
        }
        return;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.deleteAirReportData(uploadId);
    }
    return localDB.deleteReportData(uploadId);
}

/**
 * MASTER LIST OPERATIONS
 */


export async function saveMasterList(data, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        // Ensure 'master' upload entry exists to satisfy foreign key constraint
        // Use upsert to handle creation or update idempotently
        const { error: uploadError } = await supabase
            .from('uploads')
            .upsert({
                upload_id: 'master',
                mode: mode,
                filename: 'MASTER_LIST_SNAPSHOT',
                row_count: 0
            }, { onConflict: 'upload_id' });

        if (uploadError) {
            console.error('Supabase create/update master upload error:', uploadError);
            throw new Error(`Failed to initialize Master List record: ${uploadError.message}`);
        }

        // Legacy variable to bypass the old block if it wasn't deleted
        const masterUpload = true;

        if (!masterUpload) {
            const { error: uploadError } = await supabase.from('uploads').insert({
                upload_id: 'master',
                mode: mode,
                filename: 'MASTER_LIST_SNAPSHOT',
                row_count: 0
            });

            if (uploadError) {
                console.error('Supabase create master upload error:', uploadError);
                // We continue, but it might fail the next step if FK is strict
            }
        }

        // Mark all existing as inactive first
        await supabase
            .from(tableName)
            .update({ status: 'inactive' })
            .eq('status', 'active');

        // Insert new master list
        const records = data.map(row => ({
            upload_id: 'master',
            ...row,
            status: 'active',
        }));

        // Batch insert in chunks to avoid payload size limits if necessary, 
        // but for now simple insert.
        const { error } = await supabase
            .from(tableName)
            .insert(records);

        if (error) {
            console.error(`Supabase saveMasterList error (${mode}):`, error);
            throw error;
        }

        // Return metrics (mocked as all new for now, since we replace the list)
        return { itemsAdded: records.length, itemsUpdated: 0 };
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.saveAirMasterList(data);
    }
    return localDB.saveMasterList(data);
}

export async function getMasterList(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('upload_id', 'master')
            .eq('status', 'active');

        if (error) {
            console.error(`Supabase getMasterList error (${mode}):`, error);
            return [];
        }
        return data;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.getAirMasterList();
    }
    return localDB.getMasterList();
}

export async function updateMasterList(uploadId, data, mode = 'ocean') {
    // If called with (data, mode) signature (legacy/overload)
    if (Array.isArray(uploadId)) {
        return saveMasterList(uploadId, data || 'ocean');
    }
    // Called with (uploadId, data, mode)
    return saveMasterList(data, mode);
}

export async function clearMasterList(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('upload_id', 'master');

        if (error) {
            console.error(`Supabase clearMasterList error (${mode}):`, error);
            throw error;
        }
        return;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.clearAirMasterList();
    }
    return localDB.clearMasterList();
}

/**
 * UTILITY FUNCTIONS
 */

export async function clearAllData(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';

        // Delete all data for this mode
        await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('uploads').delete().eq('mode', mode);
        return;
    }

    // Fallback to localStorage
    if (mode === 'air') {
        return localDB.clearAllAirData();
    }
    return localDB.clearAllData();
}

// Check if database is available
export function isDatabaseAvailable() {
    return isSupabaseEnabled();
}

// Get database type
export function getDatabaseType() {
    return isSupabaseEnabled() ? 'supabase' : 'localStorage';
}

/**
 * BACKWARD COMPATIBILITY - Air-specific function wrappers
 */

export async function saveAirUpload(filename, rowCount) {
    return saveUpload(filename, rowCount, 'air');
}

export async function getAllAirUploads() {
    return getAllUploads('air');
}

export async function deleteAirUpload(uploadId) {
    return deleteUpload(uploadId, 'air');
}

export async function saveAirReportData(uploadId, data) {
    return saveReportData(uploadId, data, 'air');
}

export async function getAirReportData(uploadId) {
    return getReportData(uploadId, 'air');
}

export async function getAllAirReportData() {
    return getAllReportData('air');
}

export async function deleteAirReportData(uploadId) {
    return deleteReportData(uploadId, 'air');
}

export async function saveAirMasterList(data) {
    return saveMasterList(data, 'air');
}

export async function getAirMasterList() {
    return getMasterList('air');
}

export async function updateAirMasterList(uploadId, data) {
    // If called with (data) signature
    if (Array.isArray(uploadId)) {
        return updateMasterList(null, uploadId, 'air');
    }
    return updateMasterList(uploadId, data, 'air');
}

export async function clearAirMasterList() {
    return clearMasterList('air');
}


export async function clearAllAirData() {
    return clearAllData('air');
}

// Additional helper functions that Dashboard might need
export async function getMasterListData(mode = 'ocean') {
    return getMasterList(mode);
}

export async function getMasterListMetrics(mode = 'ocean') {
    const data = await getMasterList(mode);
    // Calculate metrics from master list
    return {
        total: data.length,
        new: data.filter(item => item.is_new).length,
        removed: data.filter(item => item.is_removed).length,
        updated: data.filter(item => item.is_updated).length,
    };
}

export async function getMasterListNewItems(mode = 'ocean') {
    const data = await getMasterList(mode);
    return data.filter(item => item.is_new);
}

export async function getAirMasterListData() {
    return getMasterListData('air');
}

export async function getAirMasterListMetrics() {
    return getMasterListMetrics('air');
}

export async function getAirMasterListNewItems() {
    return getMasterListNewItems('air');
}

export async function getMasterListUpdatedItems(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const data = await getMasterList(mode);
        const updatedItems = data.filter(item => item.is_updated && item.last_update_reason);
        return { count: updatedItems.length, data: updatedItems };
    }
    return localDB.getMasterListUpdatedItems();
}

export async function getMasterListNewFrl(mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const data = await getMasterList(mode);
        const newFrlItems = data.filter(
            item => item.last_update_reason && item.last_update_reason.includes('FRL')
        );
        return { count: newFrlItems.length, data: newFrlItems };
    }
    return localDB.getMasterListNewFrl();
}

export async function detectNewItems(currentUploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';
        const keyField = mode === 'air' ? 'hawb' : 'hb';

        // Get all uploads to find previous
        const uploads = await getAllUploads(mode);
        const currentIndex = uploads.findIndex(u => u.id === currentUploadId || u.upload_id === currentUploadId);

        if (currentIndex === -1 || currentIndex >= uploads.length - 1) {
            // No previous upload - all items are new
            const { data } = await supabase
                .from(tableName)
                .select(keyField)
                .eq('upload_id', currentUploadId);
            return data ? data.length : 0;
        }

        const prevUploadId = uploads[currentIndex + 1].id || uploads[currentIndex + 1].upload_id;

        const { data: currentData } = await supabase
            .from(tableName)
            .select(keyField)
            .eq('upload_id', currentUploadId);

        const { data: prevData } = await supabase
            .from(tableName)
            .select(keyField)
            .eq('upload_id', prevUploadId);

        const currentKeys = new Set((currentData || []).map(r => r[keyField]).filter(Boolean));
        const prevKeys = new Set((prevData || []).map(r => r[keyField]).filter(Boolean));

        let count = 0;
        currentKeys.forEach(key => {
            if (!prevKeys.has(key)) count++;
        });

        return count;
    }
    return localDB.detectNewItems(currentUploadId);
}

export async function detectRemovedItems(currentUploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';
        const keyField = mode === 'air' ? 'hawb' : 'hb';

        const uploads = await getAllUploads(mode);
        const currentIndex = uploads.findIndex(u => u.id === currentUploadId || u.upload_id === currentUploadId);

        if (currentIndex === -1 || currentIndex >= uploads.length - 1) {
            return 0;
        }

        const prevUploadId = uploads[currentIndex + 1].id || uploads[currentIndex + 1].upload_id;

        const { data: currentData } = await supabase
            .from(tableName)
            .select(keyField)
            .eq('upload_id', currentUploadId);

        const { data: prevData } = await supabase
            .from(tableName)
            .select(keyField)
            .eq('upload_id', prevUploadId);

        const currentKeys = new Set((currentData || []).map(r => r[keyField]).filter(Boolean));
        const prevKeys = new Set((prevData || []).map(r => r[keyField]).filter(Boolean));

        let count = 0;
        prevKeys.forEach(key => {
            if (!currentKeys.has(key)) count++;
        });

        return count;
    }
    return localDB.detectRemovedItems(currentUploadId);
}

export async function getNewItemsData(currentUploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';
        const keyField = mode === 'air' ? 'hawb' : 'hb';

        const uploads = await getAllUploads(mode);
        const currentIndex = uploads.findIndex(u => u.id === currentUploadId || u.upload_id === currentUploadId);

        const { data: currentData } = await supabase
            .from(tableName)
            .select('*')
            .eq('upload_id', currentUploadId);

        if (currentIndex === -1 || currentIndex >= uploads.length - 1) {
            return currentData || [];
        }

        const prevUploadId = uploads[currentIndex + 1].id || uploads[currentIndex + 1].upload_id;

        const { data: prevData } = await supabase
            .from(tableName)
            .select(keyField)
            .eq('upload_id', prevUploadId);

        const prevKeys = new Set((prevData || []).map(r => r[keyField]).filter(Boolean));

        return (currentData || []).filter(r => r[keyField] && !prevKeys.has(r[keyField]));
    }
    return localDB.getNewItemsData(currentUploadId);
}

export async function getRemovedItemsData(currentUploadId, mode = 'ocean') {
    if (isSupabaseEnabled()) {
        const tableName = mode === 'air' ? 'air_data' : 'ocean_data';
        const keyField = mode === 'air' ? 'hawb' : 'hb';

        const uploads = await getAllUploads(mode);
        const currentIndex = uploads.findIndex(u => u.id === currentUploadId || u.upload_id === currentUploadId);

        if (currentIndex === -1 || currentIndex >= uploads.length - 1) {
            return [];
        }

        const prevUploadId = uploads[currentIndex + 1].id || uploads[currentIndex + 1].upload_id;

        const { data: currentData } = await supabase
            .from(tableName)
            .select(keyField)
            .eq('upload_id', currentUploadId);

        const { data: prevData } = await supabase
            .from(tableName)
            .select('*')
            .eq('upload_id', prevUploadId);

        const currentKeys = new Set((currentData || []).map(r => r[keyField]).filter(Boolean));

        return (prevData || []).filter(r => r[keyField] && !currentKeys.has(r[keyField]));
    }
    return localDB.getRemovedItemsData(currentUploadId);
}

