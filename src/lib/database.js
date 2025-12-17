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
        return { id: data.upload_id, ...data };
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
            .order('upload_date', { ascending: false });

        if (error) {
            console.error('Supabase getAllUploads error:', error);
            return [];
        }
        return data.map(u => ({ id: u.upload_id, ...u }));
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

        const records = data.map(row => ({
            upload_id: uploadId,
            ...row,
            status: 'active',
        }));

        const { error } = await supabase
            .from(tableName)
            .insert(records);

        if (error) {
            console.error(`Supabase saveReportData error (${mode}):`, error);
            throw error;
        }
        return;
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

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('upload_id', uploadId)
            .eq('status', 'active');

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

        const { error } = await supabase
            .from(tableName)
            .insert(records);

        if (error) {
            console.error(`Supabase saveMasterList error (${mode}):`, error);
            throw error;
        }
        return;
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

export async function updateMasterList(data, mode = 'ocean') {
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

export async function updateAirMasterList(data) {
    return updateMasterList(data, 'air');
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

