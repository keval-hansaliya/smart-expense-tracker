import bcrypt from "bcrypt";
import User from "../models/user.js";
import Group from "../models/Group.js";
import generateToken from "../utils/createToken.js";

/* ===================== AUTH (Login/Signup/Logout) ===================== */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(400).json({ msg: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) return res.status(400).json({ msg: "Invalid password" });

    generateToken(res, existingUser._id);
    return res.status(200).json({
      email: existingUser.email,
      username: existingUser.username,
      _id: existingUser._id,
    });
  } catch (error) {
    res.status(400).json({ msg: "Error: " + error.message });
  }
};

export const signup = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    if (!username || !email || !password) return res.status(400).json({ msg: "Fill all details" });

    if (await User.findOne({ username })) return res.status(400).json({ msg: "User already exists" });
    if (await User.findOne({ email })) return res.status(400).json({ msg: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({ email, password: hashedPassword, username });
    generateToken(res, newUser._id);

    return res.status(200).json({
      email: newUser.email,
      username: newUser.username,
      _id: newUser._id,
    });
  } catch (error) {
    res.status(400).json({ msg: "Error: " + error.message });
  }
};

export const logout = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ msg: "Logged out" });
};

/* ===================== INVITATIONS ===================== */
export const getInvitations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("invitations", "name type");
    res.json(user.invitations || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToInvitation = async (req, res) => {
  try {
    const { groupId, status } = req.body; 
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user.invitations || !user.invitations.includes(groupId)) {
      return res.status(400).json({ message: "Invitation not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // 1. Handle Acceptance
    if (status === "accept") {
      if (!group.members.includes(userId)) {
        group.members.push(userId);
        await group.save();
      }
    }

    // 2. Remove Invitation
    user.invitations = user.invitations.filter(id => id.toString() !== groupId);
    await user.save();

    // 3. 🔥 NOTIFY ADMIN
    // Find the admin and push a notification
    const adminId = group.adminId;
    if (adminId) {
       const message = `${user.username} has ${status}ed your invitation to join "${group.name}".`;
       await User.findByIdAndUpdate(adminId, {
         $push: { notifications: { message, isRead: false } }
       });
    }

    res.json({ message: `Invitation ${status}ed` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== NOTIFICATIONS ===================== */
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notifications");
    // Sort newest first
    const sorted = user.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notifications.forEach(n => n.isRead = true);
    await user.save();
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};