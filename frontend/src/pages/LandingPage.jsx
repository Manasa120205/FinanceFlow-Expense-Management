import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  PieChart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            FinanceFlow
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary">
            Log In
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '5rem 1.5rem 4rem',
          textAlign: 'center',
          maxWidth: '960px',
          margin: '0 auto',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}
        >
          <Zap size={15} /> Built for Precision Personal Financial Management
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-main)',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
          }}
        >
          Take control of your money with{' '}
          <span style={{ color: 'var(--primary)' }}>FinanceFlow</span>
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 2.5rem',
          }}
        >
          Seamlessly record income and expenses, set proactive monthly budgets,
          and gain actionable visual insights into your personal wealth. Built with
          enterprise-grade security and zero data leakage.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In to Dashboard
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
            marginTop: '5rem',
            textAlign: 'left',
          }}
        >
          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Expense & Income Tracking
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Effortlessly track every rupee coming in and going out. Categorize transactions,
              perform multi-criteria searches, and maintain complete historical logs.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <PieChart size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Monthly Budget Management
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Set monthly spending targets for categories like Food, Transport, and Bills.
              Receive intuitive visual warnings when spending reaches 80% or exceeds your threshold.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Financial Analytics & Security
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              View monthly cash flow trends, category breakdowns, and budget vs actual reports.
              All data is strictly isolated with cryptographically secured JWT authentication.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#ffffff',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <p>© {new Date().getFullYear()} FinanceFlow Platform. All rights reserved.</p>
        <p style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          Secure • Production-Ready • PostgreSQL Relational Architecture
        </p>
      </footer>
    </div>
  );
}
