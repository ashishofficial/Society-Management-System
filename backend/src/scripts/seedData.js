import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { User } from '../modules/users/user.model.js';
import { Member } from '../modules/members/member.model.js';
import { Payment } from '../modules/payments/payment.model.js';
import { Expense } from '../modules/expenses/expense.model.js';
import { Notice } from '../modules/notices/notice.model.js';
import { Complaint } from '../modules/complaints/complaint.model.js';
import { Visitor } from '../modules/visitors/visitor.model.js';
import { Facility } from '../modules/facilities/facility.model.js';
import { FacilityBooking } from '../modules/facilities/facilityBooking.model.js';
import { ParkingSlot, StaffMember, Parcel, SocietyDocument, EmergencyAlert } from '../modules/operations/operations.model.js';
import { BudgetPlan, ReconciliationEntry } from '../modules/finance/finance.model.js';
import { Poll, SocietyEvent, Announcement } from '../modules/governance/governance.model.js';
import { SocietySetting, BackupRecord, DeviceToken } from '../modules/product/product.model.js';

const SOCIETY_ID = process.env.SEED_SOCIETY_ID || 'default';
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const IS_PROD = process.env.NODE_ENV === 'production';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clave.demo';
const ACCOUNTANT_EMAIL = process.env.ACCOUNTANT_EMAIL || 'accountant@clave.demo';
const MEMBER_EMAIL = process.env.MEMBER_EMAIL || 'member@clave.demo';

// Resolve a seed password: prefer the env var; in production NEVER fall back to a guessable
// default — generate a strong random one and record it so it can be printed to the logs once.
function resolvePassword(envVar, devDefault, label, generated) {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  if (IS_PROD) {
    const pw = randomBytes(12).toString('base64url'); // ~16 chars, high entropy
    generated.push({ label, password: pw });
    return pw;
  }
  return devDefault;
}

/**
 * Inserts a full set of demo data for a society. Does NOT clear existing data.
 * Returns a short summary of the created login accounts.
 */
export async function insertDummyData(societyId = SOCIETY_ID) {
  const month = CURRENT_MONTH;
  const generatedCreds = [];
  const adminPassword = resolvePassword('ADMIN_PASSWORD', 'Admin@123', `admin (${ADMIN_EMAIL})`, generatedCreds);
  const accountantPassword = resolvePassword('ACCOUNTANT_PASSWORD', 'Account@123', `accountant (${ACCOUNTANT_EMAIL})`, generatedCreds);
  const memberPassword = resolvePassword('MEMBER_PASSWORD', 'Member@123', `member (${MEMBER_EMAIL})`, generatedCreds);

  const [passwordHash, accountantHash, memberHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(accountantPassword, 10),
    bcrypt.hash(memberPassword, 10),
  ]);

  const [adminUser, accountantUser, memberUser] = await User.insertMany([
    { name: 'RWA Admin', email: ADMIN_EMAIL, passwordHash, role: 'admin', societyId },
    { name: 'Finance Manager', email: ACCOUNTANT_EMAIL, passwordHash: accountantHash, role: 'accountant', societyId },
    { name: 'Resident User', email: MEMBER_EMAIL, passwordHash: memberHash, role: 'member', societyId },
  ]);

  const members = await Member.insertMany([
    { societyId, flatNumber: 'A-101', name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@gmail.com', familyMembers: 4, isOwner: true },
    { societyId, flatNumber: 'A-102', name: 'Pooja Verma', phone: '9876543211', email: 'pooja@gmail.com', familyMembers: 3, isOwner: true },
    { societyId, flatNumber: 'B-201', name: 'Amit Singh', phone: '9876543212', email: 'amit@gmail.com', familyMembers: 2, isOwner: true },
    { societyId, flatNumber: 'C-301', name: 'Neha Arora', phone: '9876543213', email: 'neha@gmail.com', familyMembers: 5, isOwner: true },
    { societyId, flatNumber: 'C-302', name: 'Karan Mehta', phone: '9876543214', email: 'karan@gmail.com', familyMembers: 1, isOwner: false },
  ]);

  // Link the demo resident login to a real flat so the member portal works.
  memberUser.memberId = members[0]._id;
  memberUser.flatNumber = members[0].flatNumber;
  await memberUser.save();

  await Payment.insertMany([
    { societyId, memberId: members[0]._id, month, amount: 3500, totalDue: 3500, paidAmount: 3500, status: 'paid', paidDate: `${month}-03`, paymentMode: 'upi', transactionRef: 'UPI-1001', updatedBy: adminUser._id },
    { societyId, memberId: members[1]._id, month, amount: 3500, totalDue: 3700, paidAmount: 2000, status: 'partial', paidDate: `${month}-09`, paymentMode: 'cash', transactionRef: 'CASH-1002', updatedBy: accountantUser._id },
    { societyId, memberId: members[2]._id, month, amount: 3500, totalDue: 3900, paidAmount: 0, status: 'overdue', paymentMode: null, transactionRef: null, updatedBy: accountantUser._id },
    { societyId, memberId: members[3]._id, month, amount: 3500, totalDue: 3500, paidAmount: 0, status: 'unpaid', paymentMode: null, transactionRef: null, updatedBy: accountantUser._id },
    { societyId, memberId: members[4]._id, month, amount: 3500, totalDue: 3500, paidAmount: 3500, status: 'paid', paidDate: `${month}-05`, paymentMode: 'bank_transfer', transactionRef: 'NEFT-1005', updatedBy: adminUser._id },
  ]);

  await Expense.insertMany([
    { societyId, date: `${month}-02`, category: 'Security', description: 'Security staff monthly payout', amount: 28000, paidTo: 'Shield Guards Pvt Ltd', paymentMode: 'bank_transfer', receiptNumber: 'EXP-001', addedBy: accountantUser._id },
    { societyId, date: `${month}-08`, category: 'Electricity', description: 'Common area electricity bill', amount: 15400, paidTo: 'State Electricity Board', paymentMode: 'upi', receiptNumber: 'EXP-002', addedBy: accountantUser._id },
    { societyId, date: `${month}-11`, category: 'Maintenance', description: 'Lift preventive maintenance', amount: 7800, paidTo: 'Otis Service Team', paymentMode: 'bank_transfer', receiptNumber: 'EXP-003', addedBy: adminUser._id },
  ]);

  await Notice.insertMany([
    { societyId, title: 'Water Tank Cleaning', description: 'Water supply will be paused from 11 AM to 2 PM on Sunday for tank cleaning.', category: 'maintenance', date: `${month}-07`, postedBy: 'RWA Admin', pinned: true },
    { societyId, title: 'Yoga Session', description: 'Community hall yoga class starts every Saturday at 7 AM.', category: 'event', date: `${month}-10`, postedBy: 'RWA Admin', pinned: false },
  ]);

  await Complaint.insertMany([
    { societyId, flat: 'B-201', subject: 'Lift noise', description: 'Lift making unusual noise near 2nd floor.', category: 'facility', status: 'in_progress', priority: 'high', date: `${month}-06`, assignedTo: 'Maintenance Team', residentName: 'Amit Singh', slaDueDate: `${month}-07`, escalated: true },
    { societyId, flat: 'A-102', subject: 'Basement leakage', description: 'Leakage observed near parking slot 14.', category: 'plumbing', status: 'open', priority: 'medium', date: `${month}-12`, assignedTo: 'RWA Committee', residentName: 'Pooja Verma', slaDueDate: `${month}-15`, escalated: false },
  ]);

  await Visitor.insertMany([
    { societyId, name: 'Zomato Delivery', flat: 'A-101', purpose: 'Food Delivery', status: 'checked_in', checkIn: `${month}-12T19:05:00`, contact: '9988776655', preApproved: true },
    { societyId, name: 'Vivek Gupta', flat: 'C-301', purpose: 'Personal Visit', status: 'expected', vehicle: 'DL10AB1234', contact: '9911223344', preApproved: false },
  ]);

  const facilities = await Facility.insertMany([
    { societyId, name: 'Community Hall', description: 'For parties and meetings', pricePerSlot: 2000, slotDuration: '4 hours', capacity: 100, type: 'hall' },
    { societyId, name: 'Badminton Court', description: 'Indoor court with lights', pricePerSlot: 500, slotDuration: '1 hour', capacity: 4, type: 'sport' },
  ]);

  await FacilityBooking.insertMany([
    { societyId, facilityId: facilities[0]._id, date: `${month}-18`, timeSlot: '06:00 PM - 10:00 PM', purpose: 'Birthday function', flat: 'A-101', residentName: 'Rajesh Sharma', amount: 2000, status: 'confirmed' },
    { societyId, facilityId: facilities[1]._id, date: `${month}-15`, timeSlot: '07:00 AM - 08:00 AM', purpose: 'Morning game', flat: 'C-302', residentName: 'Karan Mehta', amount: 500, status: 'pending' },
  ]);

  await ParkingSlot.insertMany([
    { societyId, slotNumber: 'P-01', vehicleType: '4w', assignedFlat: 'A-101', monthlyCharge: 800, status: 'occupied' },
    { societyId, slotNumber: 'P-02', vehicleType: '4w', assignedFlat: 'A-102', monthlyCharge: 800, status: 'occupied' },
    { societyId, slotNumber: 'P-03', vehicleType: '2w', monthlyCharge: 300, status: 'available' },
  ]);

  await StaffMember.insertMany([
    { societyId, name: 'Ramesh Yadav', role: 'Security Guard', phone: '9000011111', shift: 'Night', salary: 18000, attendanceStatus: 'present' },
    { societyId, name: 'Sanjana Devi', role: 'Housekeeping', phone: '9000011112', shift: 'Morning', salary: 14000, attendanceStatus: 'leave' },
  ]);

  await Parcel.insertMany([
    { societyId, flat: 'C-301', recipientName: 'Neha Arora', courierName: 'BlueDart', trackingId: 'BD12345', status: 'received' },
    { societyId, flat: 'A-101', recipientName: 'Rajesh Sharma', courierName: 'Amazon', trackingId: 'AMZ5566', status: 'delivered', deliveredAt: new Date().toISOString() },
  ]);

  await SocietyDocument.insertMany([
    { societyId, title: 'RWA Bylaws 2026', category: 'legal', url: 'https://example.com/docs/bylaws-2026.pdf', visibility: 'members' },
    { societyId, title: 'Vendor Contracts', category: 'finance', url: 'https://example.com/docs/vendor-contracts.pdf', visibility: 'admin_only' },
  ]);

  await EmergencyAlert.insertMany([
    { societyId, flat: 'B-201', raisedBy: 'Amit Singh', type: 'medical', notes: 'Need immediate ambulance support', status: 'acknowledged' },
    { societyId, flat: 'A-102', raisedBy: 'Pooja Verma', type: 'security', notes: 'Suspicious movement near parking', status: 'open' },
  ]);

  await BudgetPlan.insertMany([
    { societyId, financialYear: '2026-2027', category: 'Security', budgetedAmount: 360000 },
    { societyId, financialYear: '2026-2027', category: 'Electricity', budgetedAmount: 220000 },
    { societyId, financialYear: '2026-2027', category: 'Maintenance', budgetedAmount: 150000 },
  ]);

  await ReconciliationEntry.insertMany([
    { societyId, date: `${month}-05`, reference: 'NEFT-1005', amount: 3500, type: 'credit', status: 'matched' },
    { societyId, date: `${month}-09`, reference: 'CASH-1002', amount: 2000, type: 'credit', status: 'unmatched' },
  ]);

  await Poll.insertMany([
    { societyId, title: 'Install EV Charging Point?', options: ['Yes', 'No'], createdBy: 'RWA Admin', isClosed: false, votes: [{ flat: 'A-101', optionIndex: 0 }, { flat: 'A-102', optionIndex: 0 }, { flat: 'C-302', optionIndex: 1 }] },
  ]);

  await SocietyEvent.insertMany([
    { societyId, title: 'Monthly RWA Meeting', description: 'Discuss budget and pending issues', date: `${month}-20`, location: 'Community Hall', rsvps: [{ flat: 'A-101', residentName: 'Rajesh Sharma', status: 'yes' }, { flat: 'B-201', residentName: 'Amit Singh', status: 'maybe' }] },
  ]);

  await Announcement.insertMany([
    { societyId, title: 'Maintenance Reminder', message: 'Please clear pending maintenance by 15th to avoid late fee.', channel: 'whatsapp', target: 'defaulters' },
  ]);

  await SocietySetting.create({
    societyId,
    branding: { productName: 'ClaveSociety', logoUrl: '', primaryColor: '#2563EB' },
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    maintenanceConfig: { dueDay: 10, lateFeePerDay: 50 },
    featureFlags: { pwaEnabled: true, twoFactorEnabled: false, pushNotificationsEnabled: true },
  });

  await BackupRecord.insertMany([
    { societyId, type: 'manual', status: 'completed', fileUrl: `https://storage.clave.local/${societyId}/backup-1.zip`, notes: 'Seed backup snapshot' },
  ]);

  await DeviceToken.insertMany([
    { societyId, userId: adminUser._id, platform: 'web', token: 'seed-admin-token' },
    { societyId, userId: memberUser._id, platform: 'android', token: 'seed-member-token' },
  ]);

  return {
    societyId,
    logins: [
      { email: ADMIN_EMAIL, role: 'admin' },
      { email: ACCOUNTANT_EMAIL, role: 'accountant' },
      { email: MEMBER_EMAIL, role: 'member' },
    ],
    // Passwords that had to be auto-generated (no env var set) — caller logs these once.
    generatedCreds,
  };
}

/**
 * Seeds dummy data ONLY if the database has no users yet. Safe to call on every
 * startup — it inserts once into an empty DB and is a no-op afterwards.
 */
export async function seedIfEmpty() {
  const userCount = await User.estimatedDocumentCount();
  if (userCount > 0) return { seeded: false };
  const result = await insertDummyData();
  return { seeded: true, ...result };
}
