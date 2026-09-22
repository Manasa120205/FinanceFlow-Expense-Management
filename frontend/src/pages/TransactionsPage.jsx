import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatINR, formatDate } from '../utils/currency';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/constants';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(''); // '' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal: Add / Edit Transaction
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (filterType) params.append('type', filterType);
      if (filterCategory) params.append('category', filterCategory);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiClient.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Unable to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, filterType, filterCategory, startDate, endDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterCategory('');
    setStartDate('');
    setEndDate('');
    setSortBy('transaction_date');
    setSortOrder('desc');
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    setFormData({
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description || '',
      transaction_date: tx.transaction_date,
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Enter an amount greater than ₹0.');
      return;
    }
    if (!formData.category.trim()) {
      setFormError('Category is required.');
      return;
    }
    if (!formData.transaction_date) {
      setFormError('Please enter a valid date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        // Update existing transaction
        await apiClient.put(`/transactions/${editingTransaction.id}`, {
          type: formData.type,
          amount: amt,
          category: formData.category.trim(),
          description: formData.description.trim() || null,
          transaction_date: formData.transaction_date,
        });
      } else {
        // Create new transaction
        await apiClient.post('/transactions', {
          type: formData.type,
          amount: amt,
          category: formData.category.trim(),
          description: formData.description.trim() || null,
          transaction_date: formData.transaction_date,
        });
      }

      setIsFormModalOpen(false);
      await fetchTransactions();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Operation failed. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/transactions/${deletingId}`);
      setDeletingId(null);
      await fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Transaction could not be deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  const availableCategories =
    formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Transactions</h1>
          <p className="page-subtitle">
            View, search, filter, and manage all your income and expense records.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            {/* Search Input */}
            <div>
              <label className="form-label" htmlFor="searchInput">
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="searchInput"
                  type="text"
                  className="form-input"
                  placeholder="Description or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingRight: '2rem' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="form-label" htmlFor="typeFilter">
                Type
              </label>
              <select
                id="typeFilter"
                className="form-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="form-label" htmlFor="categoryFilter">
                Category
              </label>
              <select
                id="categoryFilter"
                className="form-select"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                <optgroup label="Income">
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={`inc-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Expenses">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={`exp-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="form-label" htmlFor="startDate">
                From Date
              </label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="form-label" htmlFor="endDate">
                To Date
              </label>
              <input
                id="endDate"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Search size={16} /> Search
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Transactions Table Card */}
      <div className="card" style={{ padding: '1rem' }}>
        {loading ? (
          <LoadingSpinner text="Retrieving transactions..." />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </p>
            <button type="button" className="btn btn-primary" onClick={fetchTransactions}>
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description={
              filterType || filterCategory || startDate || endDate || searchQuery
                ? 'No transactions matched your search or filters. Try clearing or broadening them.'
                : 'No transactions recorded yet. Add your first income or expense to get started.'
            }
            actionLabel={
              filterType || filterCategory || startDate || endDate || searchQuery
                ? 'Clear Filters'
                : 'Add Transaction'
            }
            onAction={
              filterType || filterCategory || startDate || endDate || searchQuery
                ? handleResetFilters
                : openCreateModal
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSortBy('transaction_date');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>Date</span>
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th
                      style={{ textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setSortBy('amount');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.35rem',
                        }}
                      >
                        <span>Amount</span>
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.transaction_date)}</td>
                      <td>
                        <span
                          className={`badge ${
                            tx.type === 'income' ? 'badge-income' : 'badge-expense'
                          }`}
                        >
                          {tx.type === 'income' ? '+ Income' : '- Expense'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{tx.category}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {tx.description || (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                            No description
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '0.35rem',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(tx)}
                            title="Edit transaction"
                            style={{ padding: '6px' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeletingId(tx.id)}
                            title="Delete transaction"
                            style={{ padding: '6px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 0.5rem 0',
                borderTop: '1px solid var(--border-light)',
                marginTop: '1rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, totalCount)} of {totalCount} transactions
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0 0.5rem',
                  }}
                >
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="transactionForm"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingTransaction
                ? 'Update Transaction'
                : 'Save Transaction'}
            </button>
          </>
        }
      >
        <form id="transactionForm" onSubmit={handleFormSubmit}>
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <span>{formError}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Transaction Type *</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${formData.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: 'expense',
                    category: EXPENSE_CATEGORIES[0],
                  });
                }}
              >
                Expense (-)
              </button>
              <button
                type="button"
                className={`btn ${formData.type === 'income' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: 'income',
                    category: INCOME_CATEGORIES[0],
                  });
                }}
              >
                Income (+)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txAmountModal">
              Amount (₹) *
            </label>
            <input
              id="txAmountModal"
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 1500"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txCategoryModal">
              Category *
            </label>
            <select
              id="txCategoryModal"
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txDateModal">
              Date *
            </label>
            <input
              id="txDateModal"
              type="date"
              className="form-input"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txDescModal">
              Description (Optional)
            </label>
            <input
              id="txDescModal"
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Monthly Electricity bill"
              maxLength={255}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will permanently remove it from your records and update your financial balance."
        confirmText="Delete Transaction"
        isLoading={isDeleting}
      />
    </div>
  );
}
