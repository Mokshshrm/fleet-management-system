import { User } from '../models/index.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ companyId: req.companyId }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: { users } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    Object.assign(user, req.body);
    await user.save();

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ status: 'success', message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
