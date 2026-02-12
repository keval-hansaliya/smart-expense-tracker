import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import SummaryCards from "../components/dashboard/SummaryCards";
import Notifications from "../components/dashboard/Notifications"; // ✅ Import Notifications
import IncomeExpenseBar from "../components/charts/IncomeExpenseBar";
import ExpenseCategoryDonut from "../components/charts/ExpenseCategoryDonut";
import CashFlowLine from "../components/charts/CashFlowLine";

import "../styles/dashboard.css";

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("90d");

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/transactions");
        setTransactions(res.data);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ===== RANGE TO DAYS ===== */
  const daysBack = useMemo(() => {
    if (range === "7d") return 7;
    if (range === "30d") return 30;
    if (range === "90d") return 90;
    return 0;
  }, [range]);

  /* ===== CURRENT PERIOD ===== */
  const filteredTransactions = useMemo(() => {
    if (!daysBack) return transactions;

    const now = new Date();
    // Set to end of day to ensure all transactions from today are included
    now.setHours(23, 59, 59, 999);

    const fromDate = new Date();
    fromDate.setDate(now.getDate() - daysBack);

    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= fromDate && d <= now;
    });
  }, [transactions, daysBack]);

  /* ===== PREVIOUS PERIOD ===== */
  const previousTransactions = useMemo(() => {
    if (!daysBack) return [];

    const now = new Date();
    const prevEnd = new Date();
    prevEnd.setDate(now.getDate() - daysBack);

    const prevStart = new Date();
    prevStart.setDate(now.getDate() - daysBack * 2);

    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= prevStart && d < prevEnd;
    });
  }, [transactions, daysBack]);

  /* ===== SUMMARY ===== */
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  /* ===== COMPARISON ===== */
  const comparison = useMemo(() => {
    let currentExpense = 0;
    let previousExpense = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "expense") currentExpense += t.amount;
    });

    previousTransactions.forEach((t) => {
      if (t.type === "expense") previousExpense += t.amount;
    });

    if (previousExpense === 0) return null;

    const diff = ((currentExpense - previousExpense) / previousExpense) * 100;

    return {
      isIncrease: diff > 0,
      value: Math.abs(diff).toFixed(1),
    };
  }, [filteredTransactions, previousTransactions]);

  /* ===== STATES ===== */
  if (loading) return <p className="dashboard-loading">Loading dashboard…</p>;
  if (error) return <p className="dashboard-error">{error}</p>;

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p className="dashboard-subtitle">Your financial overview</p>
        </div>

        {/* DROPDOWN FILTER */}
        <select
          className="range-dropdown"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      {/* 🔥 ADD NOTIFICATIONS HERE */}
      <Notifications />

      {/* SUMMARY CARDS */}
      <SummaryCards
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
      />



      {/* INSIGHTS */}
      <div className="charts-section">
        <h3 className="section-title">Insights</h3>

        {comparison && (
          <p className="comparison-text">
            {comparison.isIncrease ? "▲" : "▼"} Expenses{" "}
            {comparison.isIncrease ? "increased" : "decreased"} by{" "}
            <strong>{comparison.value}%</strong> compared to the previous period
          </p>
        )}


        <div className="charts-grid">
          <div className="chart-card">
            <IncomeExpenseBar transactions={filteredTransactions} />
          </div>

          <div className="chart-card">
            <ExpenseCategoryDonut transactions={filteredTransactions} />
          </div>

          <div className="chart-card full-width">
            <CashFlowLine transactions={filteredTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
