import { useState } from "react";
import api from "../../api/axios";

function JoinGroupModal({ onClose, onJoined }) {
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId.trim()) return;

    try {
      setLoading(true);
      setError("");
      
      await api.post("/groups/join", { groupId: groupId.trim() });
      
      onJoined(); // Refresh list
      onClose();  // Close modal
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Join a Group</h3>
        <p style={{ color: "#64748b", marginBottom: "15px" }}>
          Ask your friend for the <strong>Group ID</strong> and paste it below.
        </p>

        {error && <p style={{ color: "#ef4444", marginBottom: "10px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Paste Group ID here (e.g. 64f1...)"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "10px", background: "#6366f1", color: "white",
                border: "none", borderRadius: "6px", cursor: "pointer"
              }}
            >
              {loading ? "Joining..." : "Join Group"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", background: "#e2e8f0", color: "#334155",
                border: "none", borderRadius: "6px", cursor: "pointer"
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

export default JoinGroupModal;