import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Target,
  Calendar,
} from 'lucide-react';
import apiClient from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatINR, formatPercent } from '../utils/currency';
import { CATEGORY_COLORS, MONTH_NAMES } from '../utils/constants';

export default function AnalyticsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [trendMonths, setTrendMonths] = useState(6);

  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState({ categories: [], total_expense: 0 });
  const [budgetVsActualData, setBudgetVsActualData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trendsRes, categoriesRes, budgetRes] = await Promise.all([
        apiClient.get(`/dashboard/monthly?months=${trendMonths}`),
        apiClient.get(`/dashboard/categories?month=${selectedMonth}&year=${selectedYear}`),
        apiClient.get(`/dashboard/budget-vs-actual?month=${selectedMonth}&year=${selectedYear}`),
      ]);

      setMonthlyData(trendsRes.data.trends);
      setCategoryData(categoriesRes.data);
      setBudgetVsActualData(budgetRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load financial analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth, selectedYear, trendMonths]);

  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

  const hasTrendData = monthlyData.some((p) => p.income > 0 || p.expense > 0);
  const hasCategoryData = categoryData.categories.length > 0;
  const hasBudgetData = budgetVsActualData.items.length > 0;

  const PIE_COLORS = [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6', '#f97316'
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Financial Analytics</h1>
          <p className="page-subtitle">
            Comprehensive charts and visual intelligence powered by your real transaction data.
          </p>
        </div>

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
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Synthesizing financial analytics and charts..." />
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </p>
          <button type="button" className="btn btn-primary" onClick={fetchAnalytics}>
            Retry
          </button>
        </div>
      ) : (
        <div className="analytics-charts-grid">
          {/* CHART 1: Income vs Expense (Bar Chart) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--primary)" /> Chart 1: Income vs Expense
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cash flow comparison over time
                </p>
              </div>

              <select
                className="form-select"
                value={trendMonths}
                onChange={(e) => setTrendMonths(Number(e.target.value))}
                style={{ width: 'auto', fontSize: '0.8rem', padding: '4px 8px' }}
              >
                <option value={6}>Past 6 Months</option>
                <option value={12}>Past 12 Months</option>
              </select>
            </div>

            {hasTrendData ? (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(val) => [formatINR(val), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.85rem' }} />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No cash flow records"
                description="Add income and expense transactions to render the Income vs Expense chart."
              />
            )}
          </div>

          {/* CHART 2: Monthly Expenses Trend (Area Chart) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="#ef4444" /> Chart 2: Monthly Expenses Trend
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total monthly spending evolution
                </p>
              </div>
            </div>

            {hasTrendData ? (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(val) => [formatINR(val), 'Expenses']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No expense data"
                description="Record monthly expenses to visualize your spending trend curve."
              />
            )}
          </div>

          {/* CHART 3: Expense by Category (Donut Chart) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieIcon size={18} color="#f59e0b" /> Chart 3: Expense by Category
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear} spending distribution
                </p>
              </div>
              {hasCategoryData && (
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Total: {formatINR(categoryData.total_expense)}
                </div>
              )}
            </div>

            {hasCategoryData ? (
              <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.categories}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {categoryData.categories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CATEGORY_COLORS[entry.category] ||
                            PIE_COLORS[index % PIE_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, props) => [
                        `${formatINR(val)} (${props.payload.percentage}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No categorized expenses"
                description={`No expenses recorded for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`}
              />
            )}
          </div>

          {/* CHART 4: Budget vs Actual Spending (Grouped Bar Chart) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={18} color="var(--primary)" /> Chart 4: Budget vs Actual Spending
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Target limits vs real outflows in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
            </div>

            {hasBudgetData ? (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetVsActualData.items}
                    margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="category"
                      stroke="#64748b"
                      fontSize={11}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(val) => [formatINR(val), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.85rem' }} verticalAlign="top" />
                    <Bar dataKey="budget" name="Budget Limit" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No budget comparison data"
                description={`Set budgets or record expenses in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} to compare.`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
