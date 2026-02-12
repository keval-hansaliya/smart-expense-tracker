import mongoose from "mongoose";
import Group from "../models/Group.js";
import GroupExpense from "../models/GroupExpense.js";
import Settlement from "../models/Settlement.js";
import User from "../models/user.js";
import GroupCategory from "../models/GroupCategory.js"; // ✅ Imported once at the top

/* ===================== CREATE GROUP ===================== */
export const createGroup = async (req, res) => {
  try {
    const { name, type } = req.body;
    const group = new Group({
      name,
      type,
      adminId: req.user._id,
      members: [req.user._id]
    });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ===================== GET MY GROUPS ===================== */
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "username email")
      .sort({ createdAt: -1 }); // Show newest first
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== GET SINGLE GROUP ===================== */
export const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

    const group = await Group.findById(id)
      .populate("members", "username email")
      .populate("adminId", "username email");

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some(m => m._id.equals(req.user._id))) return res.status(403).json({ message: "Access denied" });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== DELETE GROUP ===================== */
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.adminId.equals(req.user._id)) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await GroupExpense.deleteMany({ groupId: id });
    await Settlement.deleteMany({ groupId: id });
    await Group.findByIdAndDelete(id);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== INVITE MEMBER (With Notification) ===================== */
export const inviteMember = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { email } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some(m => m.equals(req.user._id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not registered" });

    if (group.members.includes(user._id)) {
      return res.status(400).json({ message: "User already in group" });
    }

    if (user.invitations && user.invitations.includes(groupId)) {
      return res.status(400).json({ message: "User already invited" });
    }

    // Add to User's Invitations
    user.invitations.push(groupId);
    await user.save();

    // SOCKET: Notify the user instantly
    const io = req.app.get("io");
    if (io) {
      io.to(user._id.toString()).emit("new_invite", {
        message: "You have a new group invitation!"
      });
    }

    res.json({ message: "Invitation sent successfully!" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== CATEGORY MANAGEMENT ===================== */

/* ===================== CATEGORY MANAGEMENT ===================== */

// 1. Add a Custom Category to a Group
export const addGroupCategory = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, icon } = req.body;

    const existing = await GroupCategory.findOne({ groupId, name });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const category = new GroupCategory({
      name,
      icon: icon || "🏷️",
      groupId,
      createdBy: req.user._id,
      isDefault: false
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Categories (Defaults + Custom)
export const getGroupCategories = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    // A. Check if defaults exist. If not, create them (One-time setup)
    const defaultCount = await GroupCategory.countDocuments({ isDefault: true });
    if (defaultCount === 0) {
      const defaults = [
        { name: "Food & Drink", icon: "🍔", isDefault: true },
        { name: "Shopping", icon: "🛍️", isDefault: true },
        { name: "Transport", icon: "🚕", isDefault: true },
        { name: "Home", icon: "🏠", isDefault: true },
        { name: "Entertainment", icon: "🎬", isDefault: true },
        { name: "Utilities", icon: "💡", isDefault: true }
      ];
      await GroupCategory.insertMany(defaults);
    }

    // B. Fetch Defaults OR Custom categories for this group
    const categories = await GroupCategory.find({
      $or: [
        { isDefault: true },      // Global defaults
        { groupId: groupId }      // Custom for this group
      ]
    }).sort({ isDefault: -1, name: 1 }); // Defaults first, then alphabetical

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===================== ADD GROUP EXPENSE (Updated) ===================== */
export const addGroupExpense = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { description, amount, splitType, splits, involvedUsers, categoryId } = req.body;

    if (!description || !amount || amount <= 0) return res.status(400).json({ message: "Invalid data" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some(m => m.equals(req.user._id))) return res.status(403).json({ message: "Access denied" });

    let finalSplits = [];

    if (splitType === "equal") {
      const usersToSplit = (involvedUsers && involvedUsers.length > 0) 
        ? involvedUsers 
        : group.members.map(m => m.toString());
        
      const share = amount / usersToSplit.length;
      finalSplits = usersToSplit.map(userId => ({ userId, shareAmount: share }));
    } 
    else if (splitType === "percentage") {
      const totalPercent = splits.reduce((sum, s) => sum + Number(s.shareAmount), 0);
      if (Math.abs(totalPercent - 100) > 0.01) return res.status(400).json({ message: "Total percentage must be 100%" });

      finalSplits = splits.map(s => ({
        userId: s.userId,
        shareAmount: (amount * Number(s.shareAmount)) / 100
      }));
    } 
    else if (splitType === "exact") {
      const totalExact = splits.reduce((sum, s) => sum + Number(s.shareAmount), 0);
      if (Math.abs(totalExact - amount) > 0.01) return res.status(400).json({ message: "Exact amounts must match total" });
      finalSplits = splits;
    } 
    else {
      return res.status(400).json({ message: "Invalid split type" });
    }

    const expense = new GroupExpense({
      groupId,
      description,
      amount,
      category: categoryId || null, // ✅ Save the category
      paidBy: req.user._id,
      splitType,
      splits: finalSplits
    });

    await expense.save();
    res.status(201).json(expense);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== DELETE GROUP EXPENSE ===================== */
export const deleteGroupExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await GroupExpense.findById(expenseId);

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const group = await Group.findById(expense.groupId);
    const isPayer = expense.paidBy.equals(req.user._id);
    const isAdmin = group.adminId.equals(req.user._id);

    if (!isPayer && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    await GroupExpense.findByIdAndDelete(expenseId);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== GET GROUP SPLITS ===================== */
export const getGroupSplits = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    const group = await Group.findById(groupId).populate("members", "username email");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const expenses = await GroupExpense.find({ groupId });
    const settlementsDB = await Settlement.find({ groupId });

    const balancesMap = {};
    group.members.forEach(m => balancesMap[m._id.toString()] = 0);

    expenses.forEach(exp => {
      const payerId = exp.paidBy.toString();
      if (balancesMap[payerId] !== undefined) balancesMap[payerId] += exp.amount;

      exp.splits.forEach(split => {
        const uid = split.userId.toString();
        if (balancesMap[uid] !== undefined) balancesMap[uid] -= split.shareAmount;
      });
    });

    settlementsDB.forEach(s => {
      const fromId = s.fromUser.toString();
      const toId = s.toUser.toString();
      
      if (balancesMap[fromId] !== undefined) balancesMap[fromId] += s.amount;
      if (balancesMap[toId] !== undefined) balancesMap[toId] -= s.amount;
    });

    const balances = group.members.map(member => ({
      userId: member._id,
      username: member.username,
      balance: Number((balancesMap[member._id.toString()] || 0).toFixed(2))
    }));

    const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b, balance: Math.abs(b.balance) }));
    const creditors = balances.filter(b => b.balance > 0.01);
    const settlements = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].balance, creditors[j].balance);
        
        if (amount > 0) {
            settlements.push({
                from: debtors[i].username,
                to: creditors[j].username,
                amount: Number(amount.toFixed(2))
            });
        }

        debtors[i].balance -= amount;
        creditors[j].balance -= amount;

        if (debtors[i].balance < 0.01) i++;
        if (creditors[j].balance < 0.01) j++;
    }

    res.json({ balances, settlements });
  } catch (error) {
    console.error("SPLIT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===================== GET EXPENSES ===================== */
export const getGroupExpenses = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const expenses = await GroupExpense.find({ groupId })
      .populate("paidBy", "username email")
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== ADD SETTLEMENT ===================== */
export const addSettlement = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { toUserId, amount } = req.body; 

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const settlement = new Settlement({
      groupId,
      fromUser: req.user._id, 
      toUser: toUserId,
      amount
    });

    await settlement.save();
    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== LEDGER ===================== */
export const getGroupLedger = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const expenses = await GroupExpense.find({ groupId }).populate("paidBy", "username").sort({ createdAt: -1 });
    const settlements = await Settlement.find({ groupId }).populate("fromUser toUser", "username").sort({ createdAt: -1 });
    res.json({ expenses, settlements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== JOIN GROUP (MANUAL) ===================== */
export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid Group ID format" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already in this group" });
    }

    group.members.push(req.user._id);
    await group.save();

    res.json({ 
      message: "Successfully joined group", 
      group: { id: group._id, name: group.name } 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};