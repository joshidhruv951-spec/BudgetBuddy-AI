import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Miscellaneous'];
const INCOME_SOURCES = ['Pocket Money', 'Scholarship', 'Freelance Income'];

const EXPENSE_COLORS = {
  Food: '#f97316',
  Travel: '#3b82f6',
  Shopping: '#ec4899',
  Education: '#8b5cf6',
  Entertainment: '#eab308',
  Miscellaneous: '#64748b'
};

const INCOME_COLORS = {
  'Pocket Money': '#10b981',
  'Scholarship': '#06b6d4',
  'Freelance Income': '#6366f1'
};

function DonutChartCard({ title, total, data, emptyText, centerLabel = "TOTAL" }) {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: '280px' }}>
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#f8fafc', fontWeight: '700' }}>{title}</h3>
        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '13px' }}>
            {emptyText}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth="16" />
                {data.map((item) => {
                  const strokeDash = (item.percentage / 100) * circumference;
                  const strokeOffset = -accumulatedAngle;
                  accumulatedAngle += strokeDash;
                  return (
                    <circle
                      key={item.label}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="16"
                      strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                  );
                })}
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{centerLabel}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>₹{item.amount.toLocaleString()}</span>
                    <span style={{ color: '#94a3b8', marginLeft: '5px' }}>({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Management State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('INFO'); // 'INFO' or 'PASSWORD'
  const [profileData, setProfileData] = useState({ username: '', email: '', date_joined: '' });
  const [profileEmailInput, setProfileEmailInput] = useState('');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Dropdown
  const [showNotifications, setShowNotifications] = useState(false);

  // Forms
  const [formType, setFormType] = useState('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [incomeSource, setIncomeSource] = useState('Pocket Money');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);

  // Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [allocationsInput, setAllocationsInput] = useState({});
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  const formRef = useRef(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const expRes = await api.get('expenses/').catch(() => ({ data: [] }));
      const incRes = await api.get('incomes/').catch(() => ({ data: [] }));
      const budRes = await api.get('budgets/').catch(() => ({ data: [] }));
      const goalRes = await api.get('savings-goals/').catch(() => ({ data: [] }));
      const notifRes = await api.get('notifications/').catch(() => ({ data: [] }));

      setExpenses(expRes.data || []);
      setIncomes(incRes.data || []);
      setSavingsGoals(goalRes.data || []);
      setNotifications(notifRes.data || []);

      if (budRes.data && budRes.data.length > 0) {
        setBudget(budRes.data[0]);
      }
    } catch (err) {
      console.error('Data loading error:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('profile/');
      setProfileData(res.data);
      setProfileEmailInput(res.data.email || '');
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  useEffect(() => {
    loadData();
    fetchProfile();
  }, []);

  const totalIncome = incomes.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const remainingBalance = totalIncome - totalExpenses;
  const budgetAmount = budget ? parseFloat(budget.total_amount) : 0;
  const budgetUtilization = budgetAmount > 0 ? Math.round((totalExpenses / budgetAmount) * 100) : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

  const validNotifications = notifications.filter((n) => {
    if (n.notification_type === 'BUDGET_ALERT' && budgetUtilization < 80) {
      return false;
    }
    return true;
  });
  const unreadCount = validNotifications.filter((n) => !n.is_read).length;

  const expenseChartData = EXPENSE_CATEGORIES.map((cat) => {
    const sum = expenses.filter((e) => e.category === cat).reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const pct = totalExpenses > 0 ? (sum / totalExpenses) * 100 : 0;
    return { label: cat, amount: sum, percentage: Math.round(pct), color: EXPENSE_COLORS[cat] };
  }).filter((item) => item.amount > 0);

  const incomeChartData = INCOME_SOURCES.map((src) => {
    const sum = incomes
      .filter((i) => (i.income_type === src || i.source === src))
      .reduce((acc, i) => acc + parseFloat(i.amount || 0), 0);
    const pct = totalIncome > 0 ? (sum / totalIncome) * 100 : 0;
    return { label: src, amount: sum, percentage: Math.round(pct), color: INCOME_COLORS[src] };
  }).filter((item) => item.amount > 0);

  const cashFlowChartData = [];
  if (totalIncome > 0) {
    const spentPct = Math.round((Math.min(totalExpenses, totalIncome) / totalIncome) * 100);
    const savedPct = Math.max(0, 100 - spentPct);
    cashFlowChartData.push({ label: 'Spent', amount: totalExpenses, percentage: spentPct, color: '#ef4444' });
    if (remainingBalance > 0) {
      cashFlowChartData.push({ label: 'Net Balance', amount: remainingBalance, percentage: savedPct, color: '#10b981' });
    }
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentDateObj = new Date();
  const monthlyTrends = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();

    const mInc = incomes
      .filter((inc) => {
        const incDate = new Date(inc.date);
        return incDate.getMonth() === m && incDate.getFullYear() === y;
      })
      .reduce((acc, inc) => acc + parseFloat(inc.amount || 0), 0);

    const mExp = expenses
      .filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === m && expDate.getFullYear() === y;
      })
      .reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0);

    monthlyTrends.push({
      month: `${monthNames[m]} '${String(y).slice(-2)}`,
      income: mInc,
      expense: mExp
    });
  }

  const maxTrendVal = Math.max(...monthlyTrends.map((t) => Math.max(t.income, t.expense)), 1000);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditingType(item.type);
    setFormType(item.type);
    setAmount(item.amount);
    setDate(item.date);

    if (item.type === 'EXPENSE') {
      setTitle(item.title || '');
      setCategory(item.category || 'Food');
    } else {
      setIncomeSource(item.income_type || item.source || 'Pocket Money');
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setEditingId(null);
    setEditingType(null);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    try {
      if (formType === 'EXPENSE') {
        const payload = { title: title.trim(), amount: parseFloat(amount), category, date };
        if (editingId && editingType === 'EXPENSE') {
          await api.put(`expenses/${editingId}/`, payload);
        } else {
          await api.post('expenses/', payload);
        }
      } else {
        const payload = { income_type: incomeSource, source: incomeSource, amount: parseFloat(amount), date };
        if (editingId && editingType === 'INCOME') {
          await api.put(`incomes/${editingId}/`, payload);
        } else {
          await api.post('incomes/', payload);
        }
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Transaction failed to save.');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      if (type === 'EXPENSE') {
        await api.delete(`expenses/${id}/`);
      } else {
        await api.delete(`incomes/${id}/`);
      }
      loadData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const currentDate = new Date();
    const category_allocations = Object.entries(allocationsInput)
      .filter(([_, val]) => parseFloat(val) > 0)
      .map(([cat, val]) => ({ category: cat, allocated_amount: parseFloat(val) }));

    try {
      await api.post('budgets/', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        total_amount: parseFloat(totalBudgetInput),
        category_allocations
      });
      alert('Budget saved successfully!');
      setShowBudgetModal(false);
      loadData();
    } catch (err) {
      alert('Failed to save budget.');
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalName.trim() || parseFloat(goalTarget) <= 0) {
      alert('Enter valid goal name and target amount > 0');
      return;
    }
    try {
      await api.post('savings-goals/', {
        name: goalName.trim(),
        target_amount: parseFloat(goalTarget),
        current_amount: parseFloat(goalCurrent || 0)
      });
      alert('Savings goal created!');
      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('');
      setShowGoalModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create savings goal');
    }
  };

  const handleAddGoalProgress = async (goal) => {
    const addAmt = prompt(`Add saved funds to "${goal.name}":`, '500');
    if (!addAmt || isNaN(addAmt) || parseFloat(addAmt) <= 0) return;

    const newAmount = parseFloat(goal.current_amount) + parseFloat(addAmt);
    try {
      await api.patch(`savings-goals/${goal.id}/`, {
        current_amount: newAmount
      });
      loadData();
    } catch (err) {
      alert('Failed to update progress');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await api.delete(`savings-goals/${id}/`);
      loadData();
    } catch (err) {
      alert('Failed to delete goal');
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "BudgetBuddy Financial Summary Report\r\n";
      csvContent += `Generated Date,${new Date().toLocaleString()}\r\n\r\n`;

      csvContent += "METRICS,AMOUNT (INR)\r\n";
      csvContent += `Total Income,${totalIncome}\r\n`;
      csvContent += `Total Expenses,${totalExpenses}\r\n`;
      csvContent += `Remaining Balance,${remainingBalance}\r\n`;
      csvContent += `Monthly Budget,${budgetAmount}\r\n`;
      csvContent += `Savings Rate,${savingsRate}%\r\n\r\n`;

      csvContent += "TRANSACTION LOGS\r\n";
      csvContent += "Date,Type,Title / Source,Category,Amount (INR)\r\n";

      const allSorted = [
        ...incomes.map((i) => ({ date: i.date, type: 'INCOME', title: i.income_type || i.source, cat: 'Income', amt: `+${i.amount}` })),
        ...expenses.map((e) => ({ date: e.date, type: 'EXPENSE', title: e.title, cat: e.category, amt: `-${e.amount}` }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      allSorted.forEach((row) => {
        csvContent += `"${row.date}","${row.type}","${row.title}","${row.cat}","${row.amt}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `BudgetBuddy_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`notifications/${id}/mark_read/`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.post(`notifications/clear_all/`);
      setNotifications([]);
    } catch (err) {
      setNotifications([]);
    }
  };

  // Profile Update Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    try {
      const res = await api.patch('profile/', { email: profileEmailInput });
      setProfileData(res.data);
      setProfileMessage({ type: 'success', text: 'Profile email updated successfully!' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.response?.data?.email?.[0] || 'Failed to update profile.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setProfileMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    if (newPassword.length < 6) {
      setProfileMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      const res = await api.post('change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setProfileMessage({ type: 'success', text: res.data.message || 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.old_password?.[0] || 'Password change failed.';
      setProfileMessage({ type: 'error', text: msg });
    }
  };

  const activities = [
    ...expenses.map((e) => ({ ...e, type: 'EXPENSE', displayTitle: e.title })),
    ...incomes.map((i) => ({ ...i, type: 'INCOME', displayTitle: i.income_type || i.source }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const darkInputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#090d16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '18px', fontFamily: 'system-ui, sans-serif' }}>
        Loading BudgetBuddy Dashboard...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#090d16', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '24px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '26px', fontWeight: '800' }}>BudgetBuddy</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Welcome, <strong style={{ color: '#38bdf8' }}>{profileData.username || 'User'}</strong> • Financial Cockpit
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* User Profile Button */}
          <button
            onClick={() => { setShowProfileModal(true); setProfileMessage({ type: '', text: '' }); }}
            title="User Profile & Settings"
            style={{
              backgroundColor: '#131b2e',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👤 Profile
          </button>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            title="Download CSV Report"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            📥 Export CSV
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{
              position: 'relative',
              backgroundColor: '#131b2e',
              border: '1px solid #1e293b',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#f8fafc',
              fontSize: '16px'
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '90px',
                width: '340px',
                backgroundColor: '#131b2e',
                border: '1px solid #334155',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 1000,
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc' }}>Notifications</span>
                <button
                  onClick={handleClearAllNotifications}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  Clear all
                </button>
              </div>

              {validNotifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No active notifications.
                </div>
              ) : (
                validNotifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #1e293b',
                      backgroundColor: n.is_read ? '#131b2e' : '#1e293b44',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: n.notification_type === 'BUDGET_ALERT' ? '#f87171' : '#34d399' }}>
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                        >
                          ✓ Read
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{n.message}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
            <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL INCOME</span>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f8fafc', marginTop: '6px' }}>₹{totalIncome.toLocaleString()}</div>
          </div>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
            <span style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL EXPENSES</span>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f8fafc', marginTop: '6px' }}>₹{totalExpenses.toLocaleString()}</div>
          </div>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
            <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>REMAINING BALANCE</span>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: remainingBalance >= 0 ? '#38bdf8' : '#f87171', marginTop: '6px' }}>
              ₹{remainingBalance.toLocaleString()}
            </div>
          </div>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c084fc', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MONTHLY BUDGET</span>
              <button onClick={() => setShowBudgetModal(true)} style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                ⚙️ Set
              </button>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f8fafc', marginTop: '6px' }}>
              {budgetAmount > 0 ? `₹${budgetAmount.toLocaleString()}` : 'Not Set'}
            </div>
          </div>
        </div>

        {/* Live Financial Health Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '16px 20px', borderRadius: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>SAVINGS RATE</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>{savingsRate}%</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>BUDGET UTILIZATION</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: budgetUtilization > 80 ? '#f87171' : '#38bdf8', marginTop: '4px' }}>
              {budgetUtilization}%
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>ACTIVE SAVINGS GOALS</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c084fc', marginTop: '4px' }}>
              {savingsGoals.length} ({savingsGoals.filter((g) => g.is_completed).length} Completed)
            </div>
          </div>
        </div>

        {/* Monthly Income/Expense Trends Visualization */}
        <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>📈 Monthly Income vs Expense Trends</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Multi-month cash flow comparison (Last 6 Months)</p>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} /> Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px' }} /> Expense
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '160px', padding: '10px 0', borderBottom: '1px solid #334155', gap: '12px' }}>
            {monthlyTrends.map((trend) => {
              const incHeight = (trend.income / maxTrendVal) * 120;
              const expHeight = (trend.expense / maxTrendVal) * 120;
              return (
                <div key={trend.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', width: '100%', justifyContent: 'center' }}>
                    <div
                      title={`Income: ₹${trend.income.toLocaleString()}`}
                      style={{ width: '14px', height: `${Math.max(incHeight, 4)}px`, backgroundColor: '#10b981', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease' }}
                    />
                    <div
                      title={`Expense: ₹${trend.expense.toLocaleString()}`}
                      style={{ width: '14px', height: `${Math.max(expHeight, 4)}px`, backgroundColor: '#ef4444', borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>{trend.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Donut Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <DonutChartCard
            title="📉 Expense Categories"
            total={totalExpenses}
            data={expenseChartData}
            centerLabel="SPENT"
            emptyText="No expenses recorded yet."
          />
          <DonutChartCard
            title="📈 Income Sources"
            total={totalIncome}
            data={incomeChartData}
            centerLabel="EARNED"
            emptyText="No income recorded yet."
          />
          <DonutChartCard
            title="⚖️ Total Cash Flow (In vs Out)"
            total={totalIncome}
            data={cashFlowChartData}
            centerLabel="INFLOW"
            emptyText="Record income to analyze cash flow."
          />
        </div>

        {/* Savings Goals Section */}
        <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>🎯 Savings Goals</h2>
              <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '13px' }}>Milestones & current progress tracking</p>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              + Create New Goal
            </button>
          </div>

          {savingsGoals.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No savings goals created yet. Click "+ Create New Goal" to start.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {savingsGoals.map((g) => {
                const target = parseFloat(g.target_amount);
                const current = parseFloat(g.current_amount);
                const pct = g.progress_percentage || 0;
                return (
                  <div key={g.id} style={{ border: '1px solid #334155', borderRadius: '8px', padding: '16px', backgroundColor: g.is_completed ? '#064e3b33' : '#0f172a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>{g.name}</h4>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Target: ₹{target.toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleDeleteGoal(g.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f87171' }}>🗑️</button>
                    </div>

                    <div style={{ margin: '14px 0 6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#cbd5e1' }}>
                        <span>Saved: ₹{current.toLocaleString()}</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: '8px', width: '100%', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: g.is_completed ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      {g.is_completed ? (
                        <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 'bold' }}>🎉 Target Reached!</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Remaining: ₹{(target - current).toLocaleString()}</span>
                      )}
                      {!g.is_completed && (
                        <button
                          onClick={() => handleAddGoalProgress(g)}
                          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          + Add Funds
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Form & Activity List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Form Card */}
          <div ref={formRef} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => { setFormType('EXPENSE'); resetForm(); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: formType === 'EXPENSE' ? '#dc2626' : '#1e293b', color: formType === 'EXPENSE' ? '#fff' : '#94a3b8' }}
              >
                Record Expense
              </button>
              <button
                type="button"
                onClick={() => { setFormType('INCOME'); resetForm(); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: formType === 'INCOME' ? '#16a34a' : '#1e293b', color: formType === 'INCOME' ? '#fff' : '#94a3b8' }}
              >
                Record Income
              </button>
            </div>

            {editingId && (
              <div style={{ backgroundColor: '#1e3a8a33', border: '1px solid #3b82f6', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#60a5fa' }}>
                  ✏️ Editing {editingType}: <strong>{editingType === 'EXPENSE' ? title : incomeSource}</strong>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ backgroundColor: '#334155', color: '#cbd5e1', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Cancel Edit
                </button>
              </div>
            )}

            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formType === 'EXPENSE' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Title</label>
                    <input type="text" required placeholder="e.g. Hostel Mess / Books" value={title} onChange={(e) => setTitle(e.target.value)} style={darkInputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={darkInputStyle}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} style={{ backgroundColor: '#0f172a', color: '#fff' }}>{c}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Income Source</label>
                  <select value={incomeSource} onChange={(e) => setIncomeSource(e.target.value)} style={darkInputStyle}>
                    {INCOME_SOURCES.map((s) => <option key={s} value={s} style={{ backgroundColor: '#0f172a', color: '#fff' }}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Amount (₹)</label>
                <input type="number" step="0.01" required placeholder="Amount in ₹" value={amount} onChange={(e) => setAmount(e.target.value)} style={darkInputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={darkInputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: editingId ? '#2563eb' : (formType === 'EXPENSE' ? '#dc2626' : '#16a34a'),
                    color: '#fff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  {editingId ? 'Update Record' : `Save ${formType === 'EXPENSE' ? 'Expense' : 'Income'}`}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ backgroundColor: '#334155', color: '#cbd5e1', border: 'none', padding: '12px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Activity Feed */}
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc' }}>Recent Financial Activity</h3>
            {activities.length === 0 ? (
              <p style={{ color: '#64748b' }}>No activity recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '430px', overflowY: 'auto' }}>
                {activities.map((a) => (
                  <div key={`${a.type}_${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#f8fafc' }}>{a.displayTitle}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{a.category || a.income_type} • {a.date}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: a.type === 'EXPENSE' ? '#f87171' : '#4ade80' }}>
                        ₹{parseFloat(a.amount).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleEdit(a)}
                        title="Edit Transaction"
                        style={{ border: 'none', background: '#1e293b', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.type)}
                        title="Delete Transaction"
                        style={{ border: 'none', background: '#1e293b', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile & Password Modal */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #334155', padding: '28px', borderRadius: '14px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>👤 User Profile Management</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => { setProfileTab('INFO'); setProfileMessage({ type: '', text: '' }); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                  backgroundColor: profileTab === 'INFO' ? '#2563eb' : '#1e293b',
                  color: profileTab === 'INFO' ? '#fff' : '#94a3b8'
                }}
              >
                Profile Info
              </button>
              <button
                type="button"
                onClick={() => { setProfileTab('PASSWORD'); setProfileMessage({ type: '', text: '' }); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                  backgroundColor: profileTab === 'PASSWORD' ? '#2563eb' : '#1e293b',
                  color: profileTab === 'PASSWORD' ? '#fff' : '#94a3b8'
                }}
              >
                Change Password
              </button>
            </div>

            {/* Feedback Message */}
            {profileMessage.text && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: profileMessage.type === 'success' ? '#064e3b44' : '#7f1d1d44',
                color: profileMessage.type === 'success' ? '#34d399' : '#f87171',
                border: `1px solid ${profileMessage.type === 'success' ? '#059669' : '#ef4444'}`
              }}>
                {profileMessage.text}
              </div>
            )}

            {/* Tab 1: Profile Info Form */}
            {profileTab === 'INFO' ? (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>USERNAME (READ ONLY)</label>
                  <input type="text" disabled value={profileData.username || ''} style={{ ...darkInputStyle, backgroundColor: '#1e293b', cursor: 'not-allowed', color: '#94a3b8' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email"
                    value={profileEmailInput}
                    onChange={(e) => setProfileEmailInput(e.target.value)}
                    style={darkInputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>ACCOUNT CREATED</label>
                  <input
                    type="text"
                    disabled
                    value={profileData.date_joined ? new Date(profileData.date_joined).toLocaleDateString() : 'Active Member'}
                    style={{ ...darkInputStyle, backgroundColor: '#1e293b', cursor: 'not-allowed', color: '#94a3b8' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: '#2563eb', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Save Profile
                  </button>
                  <button type="button" onClick={() => setShowProfileModal(false)} style={{ flex: 1, backgroundColor: '#334155', color: '#cbd5e1', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 2: Change Password Form */
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>CURRENT PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={darkInputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>NEW PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={darkInputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={darkInputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: '#059669', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Update Password
                  </button>
                  <button type="button" onClick={() => setShowProfileModal(false)} style={{ flex: 1, backgroundColor: '#334155', color: '#cbd5e1', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Savings Goal Modal */}
      {showGoalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #334155', padding: '28px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#f8fafc' }}>Create Savings Goal</h3>
            <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>Goal Name</label>
                <input type="text" required placeholder="e.g. New Laptop" value={goalName} onChange={(e) => setGoalName(e.target.value)} style={darkInputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>Target Amount (₹)</label>
                <input type="number" step="0.01" required placeholder="e.g. 50000" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} style={darkInputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>Initial Saved Amount (Optional)</label>
                <input type="number" step="0.01" placeholder="e.g. 5000" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} style={darkInputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#059669', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Goal</button>
                <button type="button" onClick={() => setShowGoalModal(false)} style={{ flex: 1, backgroundColor: '#334155', color: '#cbd5e1', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: '#131b2e', border: '1px solid #334155', padding: '28px', borderRadius: '12px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', color: '#f8fafc' }}>Set Monthly Allocations</h3>
            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>Total Monthly Limit (₹)</label>
                <input type="number" required placeholder="Total Budget" value={totalBudgetInput} onChange={(e) => setTotalBudgetInput(e.target.value)} style={darkInputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Category Allocations (Optional)</label>
                {EXPENSE_CATEGORIES.map((c) => (
                  <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{c}</span>
                    <input
                      type="number"
                      placeholder="₹0"
                      value={allocationsInput[c] || ''}
                      onChange={(e) => setAllocationsInput({ ...allocationsInput, [c]: e.target.value })}
                      style={{ width: '120px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#2563eb', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save to Backend</button>
                <button type="button" onClick={() => setShowBudgetModal(false)} style={{ flex: 1, backgroundColor: '#334155', color: '#cbd5e1', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;