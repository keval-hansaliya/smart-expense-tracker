import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CreateGroupModal from "../components/groups/CreateGroupModal";
import JoinGroupModal from "../components/groups/JoinGroupModal"; // <--- Import
import "../styles/groups.css";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false); // <--- New State

  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (err) {
      console.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="groups-page">
      <div className="groups-header">
        <h2>My Groups</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* JOIN BUTTON */}
          <button 
            className="join-group-btn"
            onClick={() => setShowJoinModal(true)}
            style={{
              padding: "8px 16px", background: "white", color: "#6366f1", 
              border: "1px solid #6366f1", borderRadius: "6px", cursor: "pointer", fontWeight: "600"
            }}
          >
            Join via ID
          </button>
          
          {/* CREATE BUTTON */}
          <button 
            className="create-group-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Group
          </button>
        </div>
      </div>

      {loading ? (
        <p className="groups-loading">Loading groups...</p>
      ) : groups.length === 0 ? (
        <div className="groups-empty">
          <h3>No groups yet</h3>
          <p>Create one or join a friend's group!</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map(group => (
            <div
              key={group._id}
              className="group-card"
              onClick={() => navigate(`/groups/${group._id}`)}
            >
              <h3>{group.name}</h3>
              <p className="group-type">{group.type}</p>
              <p className="group-members">{group.members.length} Members</p>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchGroups}
        />
      )}

      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoined={fetchGroups}
        />
      )}
    </div>
  );
}

export default Groups;