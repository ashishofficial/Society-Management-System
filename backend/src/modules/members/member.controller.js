import bcrypt from 'bcryptjs';
import { Member } from './member.model.js';
import { User } from '../users/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const listMembers = asyncHandler(async (req, res) => {
  const members = await Member.find({ societyId: req.societyId }).sort({ flatNumber: 1 }).limit(5000);
  res.json({ data: members });
});

export const createMember = asyncHandler(async (req, res) => {
  const { flatNumber, name, phone, email, isOwner, familyMembers, status, createLogin, loginPassword } = req.body;
  if (!flatNumber || !name) throw new ApiError(400, 'flatNumber and name are required');

  // Validate the optional resident-login fields BEFORE creating the member (avoid orphan records).
  if (createLogin) {
    if (!email) throw new ApiError(400, 'Email is required to create a resident login');
    if (!loginPassword || String(loginPassword).length < 8) {
      throw new ApiError(400, 'Login password must be at least 8 characters');
    }
    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) throw new ApiError(409, 'A login with this email already exists');
  }

  const member = await Member.create({ societyId: req.societyId, flatNumber, name, phone, email, isOwner, familyMembers, status });

  let loginCreated = false;
  if (createLogin) {
    const passwordHash = await bcrypt.hash(String(loginPassword), 10);
    await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role: 'member',
      societyId: req.societyId,
      memberId: member._id,
      flatNumber: member.flatNumber,
    });
    loginCreated = true;
  }

  req.auditEntity = 'member';
  req.auditAction = 'create';
  req.auditEntityId = member._id.toString();
  res.status(201).json({ data: member, loginCreated });
});

// Provision a resident login for a member/flat that already exists.
export const createMemberLogin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const member = await Member.findOne({ _id: id, societyId: req.societyId });
  if (!member) throw new ApiError(404, 'Member not found');
  if (!member.email) throw new ApiError(400, 'This member has no email — add one before creating a login');
  if (!password || String(password).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const email = member.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'A login with this email already exists');

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    name: member.name,
    email,
    passwordHash,
    role: 'member',
    societyId: req.societyId,
    memberId: member._id,
    flatNumber: member.flatNumber,
  });

  req.auditEntity = 'member';
  req.auditAction = 'create_login';
  req.auditEntityId = member._id.toString();
  res.status(201).json({ data: { email: user.email, flatNumber: user.flatNumber } });
});

export const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await Member.findOneAndUpdate(
    { _id: id, societyId: req.societyId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!member) throw new ApiError(404, 'Member not found');
  req.auditEntity = 'member';
  req.auditAction = 'update';
  req.auditEntityId = member._id.toString();
  res.json({ data: member });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await Member.findOneAndDelete({ _id: id, societyId: req.societyId });
  if (!member) throw new ApiError(404, 'Member not found');
  req.auditEntity = 'member';
  req.auditAction = 'delete';
  req.auditEntityId = member._id.toString();
  res.status(204).send();
});
