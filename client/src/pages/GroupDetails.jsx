import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AddExpenseModal from "../components/groups/AddExpenseModal";
import SettleUpModal from "../components/groups/SettleUpModal"; 
import InviteMemberModal from "../components/groups/InviteMemberModal"; 

function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [splits, setSplits] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(""); 

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false); 

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const fetchData = async () => {
    try {
      const [groupRes, expenseRes, splitRes, userRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/expenses`),
        api.get(`/groups/${id}/splits`),
        api.get(`/auth/me`)
      ]);

      setGroup(groupRes.data);
      setExpenses(expenseRes.data);
      setSplits(splitRes.data);
      setCurrentUser(userRes.data);
    } catch (err) {
      console.error("Error loading group details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  /* ===================== ACTIONS ===================== */

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure? This will delete the group and all expenses permanently.")) return;
    try {
      await api.delete(`/groups/${id}`);
      navigate("/groups");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete group");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api.delete(`/groups/expenses/${expenseId}`);
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete expense");
    }
  };

  // 🔥 UPDATED: Copy Join Code instead of ID
  const copyJoinCode = () => {
    // If old group has no joinCode, fallback to ID (optional)
    const code = group.joinCode || group._id;
    navigator.clipboard.writeText(code);
    setCopySuccess("Code Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
  if (!group) return <div style={{ padding: 30 }}>Group not found</div>;

  const isAdmin = currentUser?.user?._id === group.adminId?._id;
  const myId = currentUser?.user?._id;

  let summaryText = "Loading...";
  if (splits && currentUser?.user) {
    const myBalance = splits.balances?.find(b => b.userId === myId);
    if (myBalance) {
      if (myBalance.balance < -0.01) {
        summaryText = `You owe ${formatCurrency(Math.abs(myBalance.balance))}`;
      } else if (myBalance.balance > 0.01) {
        summaryText = `You are owed ${formatCurrency(myBalance.balance)}`;
      } else {
        summaryText = "All settled up 🎉";
      }
    }
  }

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#1e293b" }}>{group.name}</h2>
          
          <div style={{ color: "#64748b", margin: "5px 0 0", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span>{group.type} • {group.members?.length} Members</span>
            
            <span>|</span>
            
            <button
                onClick={() => setShowInviteModal(true)}
                style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", textDecoration: "underline" }}
            >
                + Invite Email
            </button>

            <span>|</span>

            {/* 🔥 UPDATED: Display Join Code */}
            <button
              onClick={copyJoinCode}
              style={{ background: "#f1f5f9", border: "none", padding: "2px 8px", borderRadius: "4px", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              title="Copy Invite Code to share"
            >
              🔑 {copySuccess || (group.joinCode ? `Code: ${group.joinCode}` : "Copy ID")}
            </button>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={handleDeleteGroup}
            style={{ 
              background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", 
              padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem"
            }}
          >
            Delete Group
          </button>
        )}
      </div>

      {/* ACTION BAR */}
      <div style={{ marginBottom: "25px", display: "flex", gap: "15px" }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            flex: 1, padding: "12px", background: "#6366f1", color: "white",
            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "1rem",
            boxShadow: "0 2px 4px rgba(99, 102, 241, 0.3)"
          }}
        >
          + Add Expense
        </button>

        <button
          onClick={() => setShowSettleModal(true)}
          style={{
            flex: 1, padding: "12px", background: "#10b981", color: "white",
            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "1rem",
            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)"
          }}
        >
          ₹ Settle Up
        </button>
      </div>

      {/* SUMMARY CARD */}
      <div
        style={{
          background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
          border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px",
          marginBottom: "30px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#334155" }}>{summaryText}</h3>
      </div>

      {/* MAIN CONTENT GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        {/* LEFT COLUMN: EXPENSES LIST */}
        <div>
          <h3 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", color: "#475569" }}>Recent Expenses</h3>
          {expenses.length === 0 ? (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No expenses yet.</p>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp._id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "15px", background: "white", marginBottom: "12px",
                  borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9"
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "1.05rem" }}>{exp.description}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                    <span style={{ fontWeight: "500", color: "#6366f1" }}>
                      {exp.paidBy?.username === currentUser?.user?.username ? "You" : exp.paidBy?.username}
                    </span> paid <span style={{ fontWeight: "600", color: "#0f172a" }}>{formatCurrency(exp.amount)}</span>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                   {(isAdmin || exp.paidBy?._id === myId) && (
                    <button 
                      onClick={() => handleDeleteExpense(exp._id)}
                      style={{ 
                        background: "none", border: "none", cursor: "pointer", 
                        fontSize: "1.2rem", color: "#cbd5e1", transition: "color 0.2s"
                      }}
                      onMouseOver={(e) => e.target.style.color = "#ef4444"}
                      onMouseOut={(e) => e.target.style.color = "#cbd5e1"}
                      title="Delete Expense"
                    >
                      🗑️
                    </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: BALANCES & SETTLEMENTS */}
        <div>
          <h3 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", color: "#475569" }}>Balances</h3>
          <div style={{ background: "white", padding: "15px", borderRadius: "10px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {splits?.balances?.map((b, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: index !== splits.balances.length -1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ color: "#334155" }}>{b.userId === myId ? <strong>You</strong> : b.username}</span>
                <span style={{ 
                  fontWeight: "600", 
                  color: b.balance > 0.01 ? "#10b981" : b.balance < -0.01 ? "#ef4444" : "#94a3b8" 
                }}>
                  {b.balance > 0.01 ? `+${formatCurrency(b.balance)}` : b.balance < -0.01 ? `-${formatCurrency(Math.abs(b.balance))}` : "Settled"}
                </span>
              </div>
            ))}
          </div>

          <h3 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginTop: "30px", color: "#475569" }}>Suggested Settlements</h3>
          {!splits?.settlements || splits.settlements.length === 0 ? (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No settlements needed.</p>
          ) : (
            splits.settlements.map((s, index) => {
              const isMyDebt = s.from === currentUser?.user?.username;
              return (
                <div key={index} style={{ 
                    background: "#eff6ff", padding: "12px", borderRadius: "8px", 
                    marginBottom: "10px", fontSize: "0.95rem", border: "1px solid #dbeafe",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>{s.from}</span> pays <span style={{ fontWeight: "600", color: "#1e293b" }}>{s.to}</span> <span style={{ color: "#2563eb", fontWeight: "700", marginLeft: "5px" }}>{formatCurrency(s.amount)}</span>
                  </div>
                  
                  {isMyDebt && (
                    <button
                      onClick={() => setShowSettleModal(true)}
                      style={{
                        fontSize: "0.8rem", padding: "6px 12px", background: "#3b82f6", color: "white",
                        border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500"
                      }}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAddModal && (
        <AddExpenseModal
          groupId={id}
          groupMembers={group.members}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchData}
        />
      )}

      {showSettleModal && (
        <SettleUpModal
          groupId={id}
          groupMembers={group.members.filter(m => m._id !== currentUser?.user?._id)} 
          onClose={() => setShowSettleModal(false)}
          onSettled={fetchData}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          groupId={id}
          onClose={() => setShowInviteModal(false)}
          onInvited={fetchData}
        />
      )}
    </div>
  );
}

export default GroupDetails;