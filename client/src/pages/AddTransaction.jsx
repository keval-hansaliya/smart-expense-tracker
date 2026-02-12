import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Modal from "../components/Modal";
import "../styles/addTransaction.css";

function AddTransaction() {
  const navigate = useNavigate();

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.filter(c => c.type === type));
      } catch {
        console.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/transactions", {
        amount: Number(amount),
        type,
        date,
        description,
        categoryId,
      });
      navigate("/expenses");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-page">
      <div className="transaction-card">
        <h2>Add Transaction</h2>
        <p className="subtitle">Track your income and expenses</p>

        {error && <p className="error-text">{error}</p>}

        {/* Type toggle */}
        <div className="type-toggle">
          <button
            className={type === "expense" ? "active expense" : ""}
            onClick={() => setType("expense")}
            type="button"
          >
            Expense
          </button>
          <button
            className={type === "income" ? "active income" : ""}
            onClick={() => setType("income")}
            type="button"
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="amount-field">
            <span>₹</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="category-field" style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              style={{ flex: 1 }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="add-category-btn"
              onClick={() => setIsModalOpen(true)}
              style={{
                marginLeft: "10px",
                padding: "8px 12px",
                backgroundColor: "#ececec",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1.2rem",
                lineHeight: "1",
              }}
            >
              +
            </button>
          </div>

          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Transaction"}
          </button>

        </form>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Custom Category"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                width: "100%"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#f0f0f0",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newCategoryName.trim()) return;
                  try {
                    const res = await api.post("/categories", { name: newCategoryName, type });
                    setCategories([...categories, res.data]);
                    setCategoryId(res.data._id);
                    setNewCategoryName("");
                    setIsModalOpen(false);
                  } catch (err) {
                    alert(err.response?.data?.message || "Failed to add category");
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#007bff",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Add
              </button>
            </div>
          </div>
        </Modal>
      </div >
    </div >
  );
}

export default AddTransaction;
