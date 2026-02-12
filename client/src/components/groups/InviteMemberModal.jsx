import { useState } from "react";
import api from "../../api/axios";

function InviteMemberModal({ groupId, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");

      // The backend now returns { message: "Invitation sent successfully!" }
      const res = await api.post(`/groups/${groupId}/invite`, { email });
      
      // ✅ FIX: Use the backend message instead of hardcoding "User Added"
      setSuccessMsg(res.data.message || "Invitation sent successfully!");
      
      setEmail(""); // Clear input
      
      // Notify parent (optional, since user isn't added yet, list won't change)
      if (onInvited) onInvited();

      // Close after a brief delay so user sees success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error("INVITE ERROR:", err);
      setError(err.response?.data?.message || "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Invite Member</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "15px" }}>
          Enter the email address. They will receive a notification to join.
        </p>

        {error && <p style={{ color: "#ef4444", marginBottom: "10px", fontSize: "0.9rem" }}>{error}</p>}
        {successMsg && <p style={{ color: "#10b981", marginBottom: "10px", fontSize: "0.9rem" }}>{successMsg}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 5 }}>User Email</label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              {loading ? "Inviting..." : "Send Invite"}
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

export default InviteMemberModal;