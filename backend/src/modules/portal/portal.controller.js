import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Member } from '../members/member.model.js';
import { Payment } from '../payments/payment.model.js';
import { Complaint } from '../complaints/complaint.model.js';
import { Notice } from '../notices/notice.model.js';

// Resolve the resident record for the logged-in member account. Every portal endpoint is scoped
// to this flat, so a member can only ever see/create data for their own unit.
async function resolveMyFlat(req) {
  const flatNumber = req.user.flatNumber;
  if (!flatNumber) {
    throw new ApiError(403, 'Your account is not linked to a flat. Contact the society admin.');
  }
  const member = await Member.findOne({ societyId: req.societyId, flatNumber });
  return { flatNumber, member };
}

function getSlaDueDate(priority = 'medium') {
  const days = priority === 'high' ? 1 : priority === 'low' ? 5 : 3;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export const getMySummary = asyncHandler(async (req, res) => {
  const { flatNumber, member } = await resolveMyFlat(req);
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const memberId = member?._id;
  const payments = memberId
    ? await Payment.find({ societyId: req.societyId, memberId }).sort({ month: -1 })
    : [];

  const currentDue = payments.find((p) => p.month === month) || null;
  const totalOutstanding = payments
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + Math.max((p.totalDue || 0) - (p.paidAmount || 0), 0), 0);

  const openComplaints = await Complaint.countDocuments({
    societyId: req.societyId,
    flat: flatNumber,
    status: { $in: ['open', 'in_progress'] },
  });

  res.json({
    data: {
      flatNumber,
      member: member
        ? { name: member.name, phone: member.phone, email: member.email, isOwner: member.isOwner, familyMembers: member.familyMembers }
        : null,
      month,
      currentDue: currentDue
        ? {
            month: currentDue.month,
            totalDue: currentDue.totalDue,
            paidAmount: currentDue.paidAmount,
            pendingAmount: Math.max((currentDue.totalDue || 0) - (currentDue.paidAmount || 0), 0),
            status: currentDue.status,
          }
        : null,
      totalOutstanding,
      openComplaints,
    },
  });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const { member } = await resolveMyFlat(req);
  if (!member) return res.json({ data: [] });
  const data = await Payment.find({ societyId: req.societyId, memberId: member._id }).sort({ month: -1 });
  res.json({ data });
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const { flatNumber } = await resolveMyFlat(req);
  const data = await Complaint.find({ societyId: req.societyId, flat: flatNumber }).sort({ createdAt: -1 });
  res.json({ data });
});

export const createMyComplaint = asyncHandler(async (req, res) => {
  const { flatNumber, member } = await resolveMyFlat(req);
  const { subject, description, category, priority } = req.body;
  if (!subject || !description || !category) {
    throw new ApiError(400, 'subject, description and category are required');
  }
  const complaint = await Complaint.create({
    societyId: req.societyId,
    flat: flatNumber, // forced to the member's own flat — never taken from the request body
    subject,
    description,
    category,
    priority: priority || 'medium',
    residentName: member?.name || req.user.name,
    date: new Date().toISOString().split('T')[0],
    slaDueDate: getSlaDueDate(priority),
  });
  req.auditEntity = 'complaint';
  req.auditAction = 'create';
  req.auditEntityId = complaint._id.toString();
  res.status(201).json({ data: complaint });
});

export const getMyNotices = asyncHandler(async (req, res) => {
  const data = await Notice.find({ societyId: req.societyId }).sort({ pinned: -1, date: -1 });
  res.json({ data });
});
