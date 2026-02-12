import { useState } from "react";
import api from "../../api/axios";

function SettleUpModal({ groupId, groupMembers, onClose, onSettled }) {
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter out the current user from the list (handled by backend auth usually, 
  // but good to filter visually if you have the current user's ID. 
  // For now, we show all, or you can pass currentUserId prop to filter).
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!toUserId || !amount || Number(amount) <= 0) {
      alert("Please select a recipient and enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/groups/₹{groupId}/settle`, {
        toUserId,
        amount: Number(amount)
      });
      
      onSettled(); // Refresh data
      onClose();   // Close modal
    } catch (err) {
      console.error("SETTLE ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to record settlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Record a Payment</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
          Record a cash payment you made to settle your debt.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 5 }}>Paid To</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="">Select Recipient</option>
              {groupMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 5 }}>Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                background: "#e2e8f0",
                color: "#334155",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettleUpModal;