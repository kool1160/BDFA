/**
 * Deterministic Monthly Flow intelligence from source records.
 *
 * This module does not classify ambiguous transactions as bills. It exposes
 * uncertainty so the UI can keep incomplete source data visible.
 */

const FREQUENCY_MONTHS = Object.freeze({
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  'six-months': 1 / 6,
  yearly: 1 / 12,
  annual: 1 / 12,
});

export function calculateMonthlyFlowIntelligence(sourceData = {}, options = {}) {
  const bills = rows(sourceData.bills || sourceData.recurringBills);
  const income = rows(sourceData.recurringIncome);
  const transactions = rows(sourceData.transactions);
  const accounts = rows(sourceData.accounts);
  const now = validDate(options.now) || new Date();
  const horizonDays = Number.isInteger(options.horizonDays) && options.horizonDays > 0 ? options.horizonDays : 30;
  const horizonEnd = new Date(now.getTime() + horizonDays * 86400000);
  const recurringBillTotal = bills.reduce((total, bill) => total + monthlyAmount(bill), 0);
  const recurringIncomeTotal = income.reduce((total, item) => total + monthlyAmount(item), 0);
  const transactionEvents = transactions
    .map(transaction => transactionEvent(transaction, now, horizonEnd))
    .filter(Boolean);
  const recurringEvents = [...bills.map(item => recurringEvent(item, 'bill', now, horizonEnd)), ...income.map(item => recurringEvent(item, 'income', now, horizonEnd))].filter(Boolean);
  const upcomingEvents = [...recurringEvents, ...transactionEvents].sort(compareEvents);
  const nearTermBills = upcomingEvents.filter(event => event.type === 'bill').reduce((total, event) => total + event.amount, 0);
  const nearTermIncome = upcomingEvents.filter(event => event.type === 'income').reduce((total, event) => total + event.amount, 0);
  const cashAvailable = accounts.reduce((total, account) => total + cashAmount(account), 0);
  const transactionGroups = groupRecurringCharges(transactions);
  const billChanges = detectBillChanges(bills, transactionGroups);
  const warnings = getMonthlyFlowWarnings(sourceData, transactions, upcomingEvents);

  return {
    recurring: { monthlyIncome: recurringIncomeTotal, monthlyBills: recurringBillTotal, monthlyFlow: recurringIncomeTotal - recurringBillTotal },
    upcomingEvents,
    nearTerm: { horizonDays, bills: nearTermBills, income: nearTermIncome, obligations: nearTermBills - nearTermIncome, availableCashAfterObligations: cashAvailable + nearTermIncome - nearTermBills },
    recurringCharges: transactionGroups,
    billChanges,
    warnings,
    ambiguousTransactions: transactions.filter(isAmbiguousTransaction).map(transaction => ({ id: transaction.id || null, name: transaction.name || transaction.merchantName || 'Unnamed transaction' })),
  };
}

function recurringEvent(item, type, now, horizonEnd) {
  const day = dayOf(item.dueDay ?? item.nextPayDay);
  if (day === null) return null;
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) date.setMonth(date.getMonth() + 1);
  if (date > horizonEnd) return null;
  return { id: item.id || null, type, name: item.name || (type === 'bill' ? 'Unnamed bill' : 'Income source'), amount: Math.abs(number(item.amount)), date: date.toISOString().slice(0, 10), source: 'recurring' };
}

function transactionEvent(transaction, now, horizonEnd) {
  const date = validDate(transaction.date || transaction.postedDate);
  if (!date || date < now || date > horizonEnd) return null;
  if (isAmbiguousTransaction(transaction)) return null;
  const amount = Math.abs(number(transaction.amount));
  const type = isIncome(transaction) ? 'income' : isBillTransaction(transaction) ? 'bill' : null;
  return type && amount ? { id: transaction.id || null, type, name: transaction.name || transaction.merchantName || 'Transaction', amount, date: date.toISOString().slice(0, 10), source: 'transaction' } : null;
}

function groupRecurringCharges(transactions) {
  const groups = new Map();
  transactions.filter(transaction => isBillTransaction(transaction) && !isAmbiguousTransaction(transaction)).forEach(transaction => {
    const key = normalizeName(transaction.merchantName || transaction.name);
    if (!key) return;
    const group = groups.get(key) || { key, name: transaction.merchantName || transaction.name || 'Recurring charge', occurrences: 0, total: 0, amounts: [], transactionIds: [] };
    group.occurrences += 1;
    group.total += Math.abs(number(transaction.amount));
    group.amounts.push(Math.abs(number(transaction.amount)));
    group.transactionIds.push(transaction.id || null);
    groups.set(key, group);
  });
  return [...groups.values()].filter(group => group.occurrences >= 2).map(group => ({ ...group, averageAmount: group.total / group.occurrences }));
}

function detectBillChanges(bills, groups) {
  return groups.flatMap(group => {
    const bill = bills.find(item => normalizeName(item.name) === group.key || group.key.includes(normalizeName(item.name)) || normalizeName(item.name).includes(group.key));
    if (!bill || !group.amounts.length) return [];
    const latest = group.amounts[group.amounts.length - 1];
    const baseline = number(bill.amount);
    if (!baseline || latest === baseline) return [];
    return [{ name: group.name, previousAmount: baseline, latestAmount: latest, difference: latest - baseline, direction: latest > baseline ? 'increased' : 'decreased' }];
  });
}

function getMonthlyFlowWarnings(sourceData, transactions, upcomingEvents) {
  const warnings = [];
  const metadata = sourceData.metadata || {};
  if (metadata.quality === 'partial' || metadata.quality === 'missing-data' || metadata.partialData) warnings.push('Source data is incomplete; Monthly Flow may omit accounts or obligations.');
  if (metadata.connectionHealth && ['stale', 'error', 'reauthentication-required'].includes(metadata.connectionHealth.status)) warnings.push('Source data may be stale; verify recent transactions before relying on this projection.');
  if (!transactions.length) warnings.push('No transactions are available, so recurring-charge and bill-change intelligence is limited.');
  if (transactions.some(isAmbiguousTransaction)) warnings.push('Some transactions are ambiguous and were not classified as bills or income.');
  if (!upcomingEvents.length && (rows(sourceData.bills || sourceData.recurringBills).length || rows(sourceData.recurringIncome).length)) warnings.push('No dated income or bill events fall within the near-term planning window.');
  return warnings;
}

function isIncome(row) { return /income|payroll|deposit|salary|paycheck/i.test(String(row.type || row.category || '')); }
function isBillTransaction(row) { return number(row.amount) < 0 || /expense|bill|subscription|payment|purchase|debit/i.test(String(row.type || row.category || '')); }
function isAmbiguousTransaction(row) { return !isIncome(row) && !isBillTransaction(row); }
function monthlyAmount(row) { return Math.abs(number(row.amount)) * (FREQUENCY_MONTHS[String(row.frequency || 'monthly').toLowerCase()] || 1); }
function cashAmount(row) { const type = String(row.type || '').toLowerCase(); return /cash|checking|savings/.test(type) ? number(row.balance ?? row.amount) : 0; }
function dayOf(value) { const text = String(value ?? '').trim(); const day = Number(text.match(/^\d{1,2}$/)?.[0] || text.match(/(?:^|T)(?:\d{4}-\d{2}-)(\d{2})/)?.[1]); return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null; }
function validDate(value) { const date = value instanceof Date ? new Date(value) : new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function compareEvents(first, second) { return first.date.localeCompare(second.date) || (first.type === 'income' ? -1 : 1); }
function normalizeName(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function number(value) { const result = Number(value); return Number.isFinite(result) ? result : 0; }
function rows(value) { return Array.isArray(value) ? value : []; }

if (typeof window !== 'undefined') {
  window.BDFA = window.BDFA || {};
  window.BDFA.calculateMonthlyFlowIntelligence = calculateMonthlyFlowIntelligence;
  window.dispatchEvent(new CustomEvent('bdfa:monthly-flow-intelligence-ready'));
}
