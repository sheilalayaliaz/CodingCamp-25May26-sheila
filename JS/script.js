'use strict';

const STORAGE_KEY = 'expense_visualizer_v1';

const CATEGORY_COLORS = {
  Food:      '#f97316',
  Transport: '#3b82f6',
  Fun:       '#a855f7',
};

let expenses = loadExpenses();

function loadExpenses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function fmt(n) {
  return '$' + n.toFixed(2);
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const pieChart = new Chart(
  document.getElementById('pieChart').getContext('2d'),
  {
    type: 'doughnut',
    data: {
      labels: ['Food', 'Transport', 'Fun'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: Object.values(CATEGORY_COLORS),
        borderColor: '#1a1d27',
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${fmt(ctx.parsed)}`,
          },
        },
      },
      animation: { animateRotate: true, duration: 500 },
    },
  }
);

function render() {
  updateTotals();
  updateChart();
  updateList();
}

function updateTotals() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };

  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const grand = totals.Food + totals.Transport + totals.Fun;

  document.getElementById('totalDisplay').textContent   = fmt(grand);
  document.getElementById('foodTotal').textContent      = fmt(totals.Food);
  document.getElementById('transportTotal').textContent = fmt(totals.Transport);
  document.getElementById('funTotal').textContent       = fmt(totals.Fun);
}

function updateChart() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };

  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  pieChart.data.datasets[0].data = [totals.Food, totals.Transport, totals.Fun];
  pieChart.update();
}

function updateList() {
  const list  = document.getElementById('txList');
  const empty = document.getElementById('emptyState');

  list.querySelectorAll('.tx-item').forEach((el) => el.remove());

  if (expenses.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  [...expenses].reverse().forEach((exp, revIdx) => {
    const realIdx = expenses.length - 1 - revIdx;

    const item = document.createElement('div');
    item.className = 'tx-item';
    item.innerHTML = `
      <div class="tx-dot ${exp.category}"></div>
      <div class="tx-info">
        <div class="tx-name">${escHtml(exp.name)}</div>
        <div class="tx-cat">${exp.category}</div>
      </div>
      <div class="tx-amount">${fmt(exp.amount)}</div>
      <button class="btn-del" aria-label="Delete ${escHtml(exp.name)}" data-idx="${realIdx}">✕</button>
    `;

    list.appendChild(item);
  });
}

document.getElementById('expenseForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name     = document.getElementById('itemName').value.trim();
  const amount   = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;

  if (!name || isNaN(amount) || amount <= 0) return;

  expenses.push({ id: Date.now(), name, amount, category });
  saveExpenses();
  render();

  this.reset();
  document.getElementById('itemName').focus();
});

document.getElementById('txList').addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-del');
  if (!btn) return;

  const idx = parseInt(btn.dataset.idx, 10);
  expenses.splice(idx, 1);
  saveExpenses();
  render();
});

render();
