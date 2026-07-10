/**
 * Load the consolidated Monthly Flow runtime, then apply the narrow
 * presentation fixes identified during PR #107 review.
 *
 * The preserved runtime remains in monthly-flow-runtime-base.js so this
 * patch changes only helper copy and timeline markup; financial math and
 * source-data behavior remain untouched.
 */
(function loadMonthlyFlowRuntime() {
  const runtimeScript = document.createElement('script');

  runtimeScript.src = 'js/monthly-flow-runtime-base.js';
  runtimeScript.onload = () => {
    getMonthlyFlowBillCalendarHelperText = function getMonthlyFlowBillCalendarHelperTextPatched() {
      if (isMonthlyFlowSelectedMonthCurrent()) {
        return 'Projections are estimates based on currently dated income and bills.';
      }

      if (isMonthlyFlowSelectedMonthPast()) {
        return `No future bill events for ${getMonthlyFlowMonthName()}.`;
      }

      return `Projections for ${getMonthlyFlowMonthName()} are estimates based on currently dated income and bills.`;
    };

    createMonthlyFlowTimelineRow = function createMonthlyFlowTimelineRowPatched(timelineEvent, isLowestPoint) {
      const row = document.createElement('div');
      const details = document.createElement('div');
      const eventLine = document.createElement('span');
      const balanceLine = document.createElement('span');
      const balanceValue = document.createElement('span');
      const separator = document.createTextNode(' · ');
      const amount = document.createElement('span');
      const label = document.createElement('span');
      const typeLabel = timelineEvent.type === 'income' ? 'Income' : 'Bill';
      const signedAmount = timelineEvent.type === 'income' ? timelineEvent.amount : -timelineEvent.amount;

      row.className = `monthly-flow-timeline-row monthly-flow-timeline-row-${timelineEvent.type}`;
      row.classList.toggle('monthly-flow-timeline-row-lowest', Boolean(isLowestPoint));
      details.className = 'monthly-flow-timeline-details';
      eventLine.className = 'monthly-flow-timeline-event-line';
      balanceLine.className = 'monthly-flow-timeline-balance-line';
      balanceValue.className = 'monthly-flow-timeline-balance-value';
      amount.className = 'monthly-flow-timeline-amount';
      label.className = 'monthly-flow-timeline-lowest-label';

      eventLine.textContent = `Day ${timelineEvent.day} · ${typeLabel} · ${timelineEvent.name}`;
      balanceValue.textContent = `Balance ${monthlyFlowMoney.format(timelineEvent.balanceAfterEvent)}`;
      amount.textContent = `${signedAmount >= 0 ? '+' : '-'}${monthlyFlowMoney.format(Math.abs(signedAmount))}`;
      amount.classList.toggle('monthly-flow-timeline-amount-income', timelineEvent.type === 'income');
      amount.classList.toggle('monthly-flow-timeline-amount-bill', timelineEvent.type === 'bill');
      applyMonthlyFlowMoneyTone(balanceValue, timelineEvent.balanceAfterEvent);

      balanceLine.append(balanceValue, separator, amount);
      details.append(eventLine, balanceLine);

      if (isLowestPoint) {
        label.textContent = 'Lowest point';
        details.append(label);
      }

      row.append(details);

      return row;
    };

    if (typeof refreshMonthlyFlow === 'function') {
      refreshMonthlyFlow();
    }
  };

  runtimeScript.onerror = () => {
    console.error('BDFA Monthly Flow runtime failed to load.');
  };

  document.head.appendChild(runtimeScript);
})();
