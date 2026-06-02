import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Complaint } from './complaint.model.js';

function getSlaDueDate(priority = 'medium') {
  const days = priority === 'high' ? 1 : priority === 'low' ? 5 : 3;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export const listComplaints = asyncHandler(async (req, res) => {
  const data = await Complaint.find({ societyId: req.societyId }).sort({ createdAt: -1 });
  res.json({ data });
});

export const createComplaint = asyncHandler(async (req, res) => {
  const { flat, subject, description, category, residentName } = req.body;
  if (!flat || !subject || !description || !category || !residentName) {
    throw new ApiError(400, 'flat, subject, description, category and residentName are required');
  }
  const complaint = await Complaint.create({
    ...req.body,
    societyId: req.societyId,
    date: req.body.date || new Date().toISOString().split('T')[0],
    slaDueDate: req.body.slaDueDate || getSlaDueDate(req.body.priority),
  });
  req.auditEntity = 'complaint';
  req.auditAction = 'create';
  req.auditEntityId = complaint._id.toString();
  res.status(201).json({ data: complaint });
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, societyId: req.societyId });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  complaint.status = req.body.status || complaint.status;
  if (complaint.status === 'resolved' || complaint.status === 'closed') {
    complaint.resolvedDate = req.body.resolvedDate || new Date().toISOString().split('T')[0];
  }
  await complaint.save();
  req.auditEntity = 'complaint';
  req.auditAction = 'status_update';
  req.auditEntityId = complaint._id.toString();

  res.json({ data: complaint });
});

export const escalateOverdueComplaints = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const dueComplaints = await Complaint.find({
    societyId: req.societyId,
    status: { $in: ['open', 'in_progress'] },
    escalated: false,
    slaDueDate: { $lte: today },
  });

  for (const complaint of dueComplaints) {
    complaint.escalated = true;
    await complaint.save();
  }

  req.auditEntity = 'complaint';
  req.auditAction = 'escalate_overdue';
  res.json({ data: { escalatedCount: dueComplaints.length } });
});

export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOneAndDelete({ _id: req.params.id, societyId: req.societyId });
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  req.auditEntity = 'complaint';
  req.auditAction = 'delete';
  req.auditEntityId = complaint._id.toString();
  res.status(204).send();
});
