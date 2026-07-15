/**
 * Explainability helpers for source freshness and confidence.
 * This module only describes source quality; it does not alter calculations.
 */

const COLLECTIONS = ['accounts', 'bills', 'allocations', 'investments', 'assets', 'liabilities', 'recurringIncome', 'transactions'];
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function evaluateDataTrust(sourceData = {}, connectionState = {}, now = Date.now()) {
  const counts = COLLECTIONS.reduce((result, collection) => {
    result[collection] = Array.isArray(sourceData[collection]) ? sourceData[collection].length : 0;
    return result;
  }, {});
  const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const timestamp = connectionState.sourceTimestamp || findLatestRecordTimestamp(sourceData);
  const parsedTimestamp = Date.parse(timestamp || '');
  const ageMs = Number.isFinite(parsedTimestamp) ? Math.max(0, now - parsedTimestamp) : null;
  const status = String(connectionState.status || '').toLowerCase();
  const rows = COLLECTIONS.flatMap(collection => Array.isArray(sourceData[collection]) ? sourceData[collection] : []);
  const hasManualData = totalRecords > 0 && rows.some(row => row && row.source === 'manual');
  const hasNoData = totalRecords === 0;
  const isStale = ageMs !== null && ageMs > STALE_AFTER_MS;
  const isError = ['failed', 'invalid', 'backup-failed', 'reauthentication-required'].includes(status);
  const isPartial = status === 'partial' || sourceData.metadata?.quality === 'partial';
  const confidence = hasNoData ? 'missing' : isError ? (status === 'reauthentication-required' ? 'partial' : 'stale') : isStale ? 'stale' : isPartial ? 'partial' : hasManualData ? 'manual-only' : 'complete';

  return {
    counts, totalRecords, timestamp: Number.isFinite(parsedTimestamp) ? timestamp : null,
    ageMs, confidence, label: confidenceLabel(confidence),
    freshness: formatFreshness(timestamp, ageMs), warning: trustWarning(confidence, status),
  };
}

export function confidenceLabel(confidence) {
  return ({ complete: 'Complete source data', partial: 'Partial source data', stale: 'Stale source data', 'manual-only': 'Manual-only source data', missing: 'Missing source data' })[confidence] || 'Source quality unknown';
}

export function formatFreshness(timestamp, ageMs) {
  if (!timestamp) return 'Freshness unavailable in local mode';
  if (ageMs > STALE_AFTER_MS) return 'Last updated ' + Math.floor(ageMs / (24 * 60 * 60 * 1000)) + ' days ago';
  if (ageMs > 60 * 60 * 1000) return 'Last updated ' + Math.floor(ageMs / (60 * 60 * 1000)) + ' hours ago';
  return 'Updated within the last hour';
}

export function metricAudit(label, collections, trust) {
  const sources = collections.map(collection => (trust.counts[collection] || 0) + ' ' + collection).join(', ');
  return label + ' Based on ' + sources + '. ' + trust.freshness + '. ' + trust.label + '.';
}

function findLatestRecordTimestamp(sourceData) {
  return COLLECTIONS.flatMap(collection => Array.isArray(sourceData[collection]) ? sourceData[collection] : [])
    .map(row => row?.updatedAt || row?.createdAt)
    .filter(value => Number.isFinite(Date.parse(value || '')))
    .sort((first, second) => Date.parse(second) - Date.parse(first))[0] || null;
}

function trustWarning(confidence, status) {
  if (confidence === 'missing') return 'No source records are available, so derived numbers cannot be trusted yet.';
  if (status === 'reauthentication-required') return 'Reconnect the source before treating these numbers as current.';
  if (confidence === 'stale') return 'Refresh the source before making decisions from these numbers.';
  if (confidence === 'partial') return 'Some source records are missing; totals may not represent the complete picture.';
  if (confidence === 'manual-only') return 'These records were entered locally and are not automatically refreshed.';
  return '';
}
