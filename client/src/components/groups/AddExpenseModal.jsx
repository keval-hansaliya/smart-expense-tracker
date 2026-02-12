import { useEffect, useState } from "react";
import api from "../../api/axios";
import "../../styles/modal.css";

function AddExpenseModal({ groupId, groupMembers, onClose, onAdded }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(""); // ✅ New State
  const [categories, setCategories] = useState([]); // ✅ New State
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState("equal");
  
  const [involvedUsers, setInvolvedUsers] = useState([]);
  const [customSplits, setCustomSplits] = useState([]);

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/categories`);
        setCategories(res.data);
      } catch (err) { console.error("Error fetching categories"); }
    };
    fetchCats();
  }, [groupId]);

  useEffect(() => {
    if (groupMembers?.length) {
      setInvolvedUsers(groupMembers.map(m => m._id));
      setCustomSplits(groupMembers.map((member) => ({ userId: member._id, value: "" })));
    }
  }, [groupMembers]);

  const toggleInvolvedUser = (userId) => {
    setInvolvedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits((prev) => prev.map((s) => (s.userId === userId ? { ...s, value } : s)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { alert("Enter valid amount"); return; }

    try {
      setLoading(true);
      let payload = {
        description: description || "Expense",
        amount: Number(amount),
        categoryId, // ✅ Send Category ID
        splitType
      };

      if (splitType === "equal") {
        payload.involvedUsers = involvedUsers;
        if (involvedUsers.length === 0) { alert("Select at least one person"); setLoading(false); return; }
      } else {
        payload.splits = customSplits.map(split => ({ userId: split.userId, shareAmount: Number(split.value) || 0 }));
      }

      await api.post(`/groups/${groupId}/expenses`, payload);
      onAdded();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

 // client/src/components/groups/AddExpenseModal.jsx

return (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Add Expense</h3>
      <form onSubmit={handleSubmit}>
        
        <div className="amount-wrapper">
          <input
            type="number"
            className="amount-input-large"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-section">
          <label>Description</label>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="input-grid form-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">General</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Split Method</label>
            <select value={splitType} onChange={(e) => setSplitType(e.target.value)}>
              <option value="equal">Equally (=)</option>
              <option value="percentage">Percent (%)</option>
              <option value="exact">Exact (₹)</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <label>Split with</label>
          <div className="member-list-container">
            {groupMembers?.map((member) => (
              <div key={member._id} className="split-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {splitType === "equal" && (
                    <input 
                      type="checkbox" 
                      checked={involvedUsers.includes(member._id)} 
                      onChange={() => toggleInvolvedUser(member._id)} 
                      style={{ accentColor: "#6366f1" }}
                    />
                  )}
                  <span className="member-name">{member.username}</span>
                </div>

                {/* Show split inputs for Percent or Exact */}
                {splitType !== "equal" && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="number"
                      className="split-input-small"
                      placeholder="0"
                      value={customSplits.find(s => s.userId === member._id)?.value || ""}
                      onChange={(e) => handleCustomSplitChange(member._id, e.target.value)}
                    />
                    <span className="split-unit">
                      {splitType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? "Saving..." : "Save Expense"}
          </button>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

export default AddExpenseModal;