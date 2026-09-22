import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  PieChart,
} from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatINR, formatPercent } from '../utils/currency';
import { EXPENSE_CATEGORIES, MONTH_NAMES } from '../utils/constants';

export default function BudgetsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [budgetData, setBudgetData] = useState({
    items: [],
    total_budget: 0,
    total_spent: 0,
    overall_percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(
        `/budgets?month=${selectedMonth}&year=${selectedYear}`
      );
      setBudgetData(res.data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setError('Unable to load budget data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormAmount('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormCategory(budget.category);
    setFormAmount(String(budget.amount));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Enter an amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudget) {
        // Update budget limit
        await apiClient.put(`/budgets/${editingBudget.id}`, { amount: amt });
      } else {
        // Create new budget
        await apiClient.post('/budgets', {
          category: formCategory,
          amount: amt,
          month: selectedMonth,
          year: selectedYear,
        });
      }

      setIsModalOpen(false);
      await fetchBudgets();
    } catch (err) {
      setFormError(
        err.response?.data?.detail || 'Failed to save budget. A budget for this category might already exist.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/budgets/${deletingId}`);
      setDeletingId(null);
      await fetchBudgets();
    } catch (err) {
      alert(err.response?.data?.detail || 'Budget could not be deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  const yearOptions = [
    selectedYear - 1,
    selectedYear,
    selectedYear + 1,
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Monthly Budgets</h1>
          <p className="page-subtitle">
            Set and track categorical monthly spending targets to keep your expenses in check.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Month & Year Selectors */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Calendar size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ border: 'none', padding: '4px 8px', width: 'auto', background: 'transparent' }}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ border: 'none', padding: '4px 8px', width: 'auto', background: 'transparent' }}
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Set Category Budget
          </button>
        </div>
      </div>

      {/* Overall Month Summary Banner */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Overall Budget
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {formatINR(budgetData.total_spent)} / {formatINR(budgetData.total_budget)}
          </div>
        </div>

        <div style={{ minWidth: '220px', flex: 1, maxWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 600 }}>Overall Usage</span>
            <span style={{ fontWeight: 700 }}>{formatPercent(budgetData.overall_percentage)}</span>
          </div>
          <div className="progress-bar-container" style={{ height: '10px' }}>
            <div
              className={`progress-bar-fill ${
                budgetData.overall_percentage > 100
                  ? 'progress-exceeded'
                  : budgetData.overall_percentage >= 80
                  ? 'progress-warning'
                  : 'progress-normal'
              }`}
              style={{ width: `${Math.min(budgetData.overall_percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <LoadingSpinner text="Calculating categorical budgets and expenditures..." />
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="text-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </p>
          <button type="button" className="btn btn-primary" onClick={fetchBudgets}>
            Retry
          </button>
        </div>
      ) : budgetData.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={PieChart}
            title={`No budgets set for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            description="Create category budgets (e.g., Food, Transport, Bills) to track your usage with real-time alerts."
            actionLabel="Create First Budget"
            onAction={openCreateModal}
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {budgetData.items.map((b) => (
            <div
              key={b.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: b.is_exceeded
                  ? 'var(--danger-border)'
                  : b.is_warning
                  ? 'var(--warning-border)'
                  : 'var(--border-light)',
                backgroundColor: b.is_exceeded
                  ? 'var(--danger-bg)'
                  : b.is_warning
                  ? 'var(--warning-bg)'
                  : 'var(--bg-surface)',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{b.category}</h3>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(b)}
                      title="Edit budget limit"
                      style={{ padding: '4px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeletingId(b.id)}
                      title="Delete budget"
                      style={{ padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{ marginBottom: '1rem' }}>
                  {b.is_exceeded ? (
                    <span className="badge badge-expense">
                      <AlertCircle size={13} /> Budget Exceeded ({formatPercent(b.percentage_used)})
                    </span>
                  ) : b.is_warning ? (
                    <span className="badge badge-warning">
                      <AlertTriangle size={13} /> Approaching Limit ({formatPercent(b.percentage_used)})
                    </span>
                  ) : (
                    <span className="badge badge-income">
                      <CheckCircle size={13} /> On Track ({formatPercent(b.percentage_used)})
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-container" style={{ height: '9px' }}>
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

                {/* Numbers */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-light)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Budget Limit</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatINR(b.amount)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Actual Spent</div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: b.is_exceeded ? 'var(--danger)' : 'var(--text-main)',
                      }}
                    >
                      {formatINR(b.actual_spent)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom remaining callout */}
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                <span>{b.is_exceeded ? 'Exceeded by:' : 'Remaining:'}</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: b.is_exceeded ? 'var(--danger)' : 'var(--success)',
                  }}
                >
                  {b.is_exceeded
                    ? formatINR(b.actual_spent - b.amount)
                    : formatINR(b.remaining)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingBudget
            ? `Update ${editingBudget.category} Budget`
            : `Set Budget for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
        }
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
              form="budgetForm"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingBudget ? 'Update Budget' : 'Set Budget'}
            </button>
          </>
        }
      >
        <form id="budgetForm" onSubmit={handleFormSubmit}>
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <span>{formError}</span>
            </div>
          )}

          {!editingBudget && (
            <div className="form-group">
              <label className="form-label" htmlFor="budgetCat">
                Expense Category *
              </label>
              <select
                id="budgetCat"
                className="form-select"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="budgetAmt">
              Monthly Budget Amount (₹) *
            </label>
            <input
              id="budgetAmt"
              type="number"
              step="0.01"
              min="1"
              className="form-input"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="e.g. 8000"
              required
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Applies to <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>.
            You will receive a warning indicator at 80% spending and an alert if exceeded.
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget"
        message="Are you sure you want to remove this budget? Your transaction history will not be deleted."
        confirmText="Delete Budget"
        isLoading={isDeleting}
      />
    </div>
  );
}
