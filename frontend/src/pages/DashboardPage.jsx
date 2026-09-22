import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Layers,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import apiClient from '../api/client';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { formatINR, formatDate, formatPercent } from '../utils/currency';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/constants';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Add Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense'); // 'income' | 'expense'
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, txRes, budgetRes, trendsRes] = await Promise.all([
        apiClient.get('/dashboard/summary'),
        apiClient.get('/transactions?page=1&page_size=5&sort_by=transaction_date&sort_order=desc'),
        apiClient.get('/budgets'),
        apiClient.get('/dashboard/monthly?months=6'),
      ]);

      setSummary(summaryRes.data);
      setRecentTransactions(txRes.data.items);
      setBudgets(budgetRes.data.items);
      setMonthlyTrends(trendsRes.data.trends);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openAddModal = (type) => {
    setModalType(type);
    setFormAmount('');
    setFormCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Enter an amount greater than ₹0.');
      return;
    }
    if (!formCategory) {
      setFormError('Please select a category.');
      return;
    }
    if (!formDate) {
      setFormError('Please enter a valid date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/transactions', {
        type: modalType,
        amount: amt,
        category: formCategory,
        description: formDescription.trim() || null,
        transaction_date: formDate,
      });

      setIsModalOpen(false);
      // Refresh dashboard
      await fetchDashboardData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to record transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading your financial dashboard..." />;
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="text-danger" style={{ fontWeight: 600, marginBottom: '1rem' }}>
          {error}
        </p>
        <button type="button" className="btn btn-primary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with Quick Actions */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Financial Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your income, expenses, and monthly budget progress.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => openAddModal('income')}
          >
            <ArrowUpRight size={18} /> Add Income
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => openAddModal('expense')}
          >
            <ArrowDownRight size={18} /> Add Expense
          </button>
        </div>
      </div>

      {/* 5 Core Financial Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Current Balance"
          value={formatINR(summary?.current_balance || 0)}
          icon={Wallet}
          variant={summary?.current_balance >= 0 ? 'primary' : 'danger'}
          subtext="Net lifetime savings"
        />

        <StatCard
          title="Total Income"
          value={formatINR(summary?.total_income || 0)}
          icon={TrendingUp}
          variant="success"
          subtext="Total earnings recorded"
        />

        <StatCard
          title="Total Expenses"
          value={formatINR(summary?.total_expenses || 0)}
          icon={TrendingDown}
          variant="danger"
          subtext="Total outflows recorded"
        />

        <StatCard
          title="This Month's Spending"
          value={formatINR(summary?.current_month_spending || 0)}
          icon={Calendar}
          variant="warning"
          subtext={`Income: ${formatINR(summary?.current_month_income || 0)}`}
        />

        <StatCard
          title="Total Transactions"
          value={summary?.total_transactions || 0}
          icon={Layers}
          variant="primary"
          subtext="Lifetime records"
        />
      </div>

      {/* Mid Section: Cash Flow Chart & Active Budgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Cash Flow Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Cash Flow Trends</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Income vs Expenses (Last 6 Months)
              </p>
            </div>
            <Link to="/analytics" className="btn btn-secondary btn-sm">
              View Analytics <ArrowRight size={14} />
            </Link>
          </div>

          {monthlyTrends.length > 0 && monthlyTrends.some((t) => t.income > 0 || t.expense > 0) ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatINR(value), '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No chart data available"
              description="Add income and expense transactions to view cash flow charts."
            />
          )}
        </div>

        {/* Active Budgets Preview */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Active Monthly Budgets</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Current month spending limits
              </p>
            </div>
            <Link to="/budgets" className="btn btn-secondary btn-sm">
              Manage Budgets <ArrowRight size={14} />
            </Link>
          </div>

          {budgets.length === 0 ? (
            <EmptyState
              title="No budgets set"
              description="Set monthly spending targets to keep your expenses under control."
              actionLabel="Create Budget"
              onAction={() => (window.location.href = '/budgets')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {budgets.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: b.is_exceeded
                      ? 'var(--danger-bg)'
                      : b.is_warning
                      ? 'var(--warning-bg)'
                      : 'var(--bg-main)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatINR(b.actual_spent)} / {formatINR(b.amount)}
                      </span>
                      {b.is_exceeded ? (
                        <span className="badge badge-expense">
                          <AlertTriangle size={12} /> Exceeded
                        </span>
                      ) : b.is_warning ? (
                        <span className="badge badge-warning">
                          <AlertTriangle size={12} /> Warning
                        </span>
                      ) : (
                        <span className="badge badge-income">
                          <CheckCircle size={12} /> On track
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${
                        b.is_exceeded
                          ? 'progress-exceeded'
                          : b.is_warning
                          ? 'progress-warning'
                          : 'progress-normal'
                      }`}
                      style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{formatPercent(b.percentage_used)} used</span>
                    <span>
                      {b.is_exceeded
                        ? `Over by ${formatINR(b.actual_spent - b.amount)}`
                        : `${formatINR(b.remaining)} remaining`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Recent Transactions</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Your latest financial activities
            </p>
          </div>
          <Link to="/transactions" className="btn btn-secondary btn-sm">
            View All Transactions <ArrowRight size={14} />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Start recording your earnings and expenses to populate your history."
            actionLabel="Add Transaction"
            onAction={() => openAddModal('expense')}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.transaction_date)}</td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type === 'income' ? '+ Income' : '- Expense'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{tx.category}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {tx.description || <span style={{ fontStyle: 'italic' }}>No description</span>}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Add Income/Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'income' ? 'Add New Income' : 'Add New Expense'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="quickAddForm"
              className={`btn ${modalType === 'income' ? 'btn-success' : 'btn-danger'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </>
        }
      >
        <form id="quickAddForm" onSubmit={handleCreateTransaction}>
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="txAmount">
              Amount (₹) *
            </label>
            <input
              id="txAmount"
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="e.g. 2500"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txCategory">
              Category *
            </label>
            <select
              id="txCategory"
              className="form-select"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              required
            >
              {(modalType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txDate">
              Date *
            </label>
            <input
              id="txDate"
              type="date"
              className="form-input"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txDesc">
              Description (Optional)
            </label>
            <input
              id="txDesc"
              type="text"
              className="form-input"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Supermarket grocery shopping"
              maxLength={255}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
