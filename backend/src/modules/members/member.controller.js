import { Member } from './member.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const listMembers = asyncHandler(async (req, res) => {
  const members = await Member.find({ societyId: req.societyId }).sort({ flatNumber: 1 }).limit(5000);
  res.json({ data: members });
});

export const createMember = asyncHandler(async (req, res) => {
  const { flatNumber, name, phone, email, isOwner, familyMembers, status } = req.body;
  if (!flatNumber || !name) throw new ApiError(400, 'flatNumber and name are required');

  const member = await Member.create({ societyId: req.societyId, flatNumber, name, phone, email, isOwner, familyMembers, status });
  req.auditEntity = 'member';
  req.auditAction = 'create';
  req.auditEntityId = member._id.toString();
  res.status(201).json({ data: member });
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
