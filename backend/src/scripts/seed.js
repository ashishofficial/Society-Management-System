import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Member } from '../modules/members/member.model.js';
import { Payment } from '../modules/payments/payment.model.js';
import { Expense } from '../modules/expenses/expense.model.js';
import { Notice } from '../modules/notices/notice.model.js';
import { Complaint } from '../modules/complaints/complaint.model.js';
import { Visitor } from '../modules/visitors/visitor.model.js';
import { Facility } from '../modules/facilities/facility.model.js';
import { FacilityBooking } from '../modules/facilities/facilityBooking.model.js';
import { AuditLog } from '../modules/audit/audit.model.js';
import { ParkingSlot, StaffMember, Parcel, SocietyDocument, EmergencyAlert } from '../modules/operations/operations.model.js';
import { BudgetPlan, ReconciliationEntry } from '../modules/finance/finance.model.js';
import { Poll, SocietyEvent, Announcement } from '../modules/governance/governance.model.js';
import { SocietySetting, BackupRecord, DeviceToken } from '../modules/product/product.model.js';

const SOCIETY_ID = process.env.SEED_SOCIETY_ID || 'default';
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clave.demo';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ACCOUNTANT_EMAIL = process.env.ACCOUNTANT_EMAIL || 'accountant@clave.demo';
const ACCOUNTANT_PASSWORD = process.env.ACCOUNTANT_PASSWORD || 'Account@123';
const MEMBER_EMAIL = process.env.MEMBER_EMAIL || 'member@clave.demo';
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD || 'Member@123';

async function clearSocietyData() {
  await Promise.all([
    Member.deleteMany({ societyId: SOCIETY_ID }),
    Payment.deleteMany({ societyId: SOCIETY_ID }),
    Expense.deleteMany({ societyId: SOCIETY_ID }),
    Notice.deleteMany({ societyId: SOCIETY_ID }),
    Complaint.deleteMany({ societyId: SOCIETY_ID }),
    Visitor.deleteMany({ societyId: SOCIETY_ID }),
    Facility.deleteMany({ societyId: SOCIETY_ID }),
    FacilityBooking.deleteMany({ societyId: SOCIETY_ID }),
    AuditLog.deleteMany({ societyId: SOCIETY_ID }),
    ParkingSlot.deleteMany({ societyId: SOCIETY_ID }),
    StaffMember.deleteMany({ societyId: SOCIETY_ID }),
    Parcel.deleteMany({ societyId: SOCIETY_ID }),
    SocietyDocument.deleteMany({ societyId: SOCIETY_ID }),
    EmergencyAlert.deleteMany({ societyId: SOCIETY_ID }),
    BudgetPlan.deleteMany({ societyId: SOCIETY_ID }),
    ReconciliationEntry.deleteMany({ societyId: SOCIETY_ID }),
    Poll.deleteMany({ societyId: SOCIETY_ID }),
    SocietyEvent.deleteMany({ societyId: SOCIETY_ID }),
    Announcement.deleteMany({ societyId: SOCIETY_ID }),
    SocietySetting.deleteMany({ societyId: SOCIETY_ID }),
    BackupRecord.deleteMany({ societyId: SOCIETY_ID }),
    DeviceToken.deleteMany({ societyId: SOCIETY_ID }),
  ]);
}

async function seed() {
  await connectDb();
  console.log(`Connected. Seeding society: ${SOCIETY_ID}`);

  await clearSocietyData();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const accountantHash = await bcrypt.hash(ACCOUNTANT_PASSWORD, 10);
  const memberHash = await bcrypt.hash(MEMBER_PASSWORD, 10);

  await User.deleteMany({
    email: { $in: [ADMIN_EMAIL, ACCOUNTANT_EMAIL, MEMBER_EMAIL] },
  });

  const [adminUser, accountantUser, memberUser] = await User.insertMany([
    { name: 'RWA Admin', email: ADMIN_EMAIL, passwordHash, role: 'admin' },
    { name: 'Finance Manager', email: ACCOUNTANT_EMAIL, passwordHash: accountantHash, role: 'accountant' },
    { name: 'Resident User', email: MEMBER_EMAIL, passwordHash: memberHash, role: 'member' },
  ]);

  const members = await Member.insertMany([
    { societyId: SOCIETY_ID, flatNumber: 'A-101', name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@gmail.com', familyMembers: 4, isOwner: true },
    { societyId: SOCIETY_ID, flatNumber: 'A-102', name: 'Pooja Verma', phone: '9876543211', email: 'pooja@gmail.com', familyMembers: 3, isOwner: true },
    { societyId: SOCIETY_ID, flatNumber: 'B-201', name: 'Amit Singh', phone: '9876543212', email: 'amit@gmail.com', familyMembers: 2, isOwner: true },
    { societyId: SOCIETY_ID, flatNumber: 'C-301', name: 'Neha Arora', phone: '9876543213', email: 'neha@gmail.com', familyMembers: 5, isOwner: true },
    { societyId: SOCIETY_ID, flatNumber: 'C-302', name: 'Karan Mehta', phone: '9876543214', email: 'karan@gmail.com', familyMembers: 1, isOwner: false },
  ]);

  await Payment.insertMany([
    { societyId: SOCIETY_ID, memberId: members[0]._id, month: CURRENT_MONTH, amount: 3500, totalDue: 3500, paidAmount: 3500, status: 'paid', paidDate: `${CURRENT_MONTH}-03`, paymentMode: 'upi', transactionRef: 'UPI-1001', updatedBy: adminUser._id },
    { societyId: SOCIETY_ID, memberId: members[1]._id, month: CURRENT_MONTH, amount: 3500, totalDue: 3700, paidAmount: 2000, status: 'partial', paidDate: `${CURRENT_MONTH}-09`, paymentMode: 'cash', transactionRef: 'CASH-1002', updatedBy: accountantUser._id },
    { societyId: SOCIETY_ID, memberId: members[2]._id, month: CURRENT_MONTH, amount: 3500, totalDue: 3900, paidAmount: 0, status: 'overdue', paymentMode: null, transactionRef: null, updatedBy: accountantUser._id },
    { societyId: SOCIETY_ID, memberId: members[3]._id, month: CURRENT_MONTH, amount: 3500, totalDue: 3500, paidAmount: 0, status: 'unpaid', paymentMode: null, transactionRef: null, updatedBy: accountantUser._id },
    { societyId: SOCIETY_ID, memberId: members[4]._id, month: CURRENT_MONTH, amount: 3500, totalDue: 3500, paidAmount: 3500, status: 'paid', paidDate: `${CURRENT_MONTH}-05`, paymentMode: 'bank_transfer', transactionRef: 'NEFT-1005', updatedBy: adminUser._id },
  ]);

  await Expense.insertMany([
    { societyId: SOCIETY_ID, date: `${CURRENT_MONTH}-02`, category: 'Security', description: 'Security staff monthly payout', amount: 28000, paidTo: 'Shield Guards Pvt Ltd', paymentMode: 'bank_transfer', receiptNumber: 'EXP-001', addedBy: accountantUser._id },
    { societyId: SOCIETY_ID, date: `${CURRENT_MONTH}-08`, category: 'Electricity', description: 'Common area electricity bill', amount: 15400, paidTo: 'State Electricity Board', paymentMode: 'upi', receiptNumber: 'EXP-002', addedBy: accountantUser._id },
    { societyId: SOCIETY_ID, date: `${CURRENT_MONTH}-11`, category: 'Maintenance', description: 'Lift preventive maintenance', amount: 7800, paidTo: 'Otis Service Team', paymentMode: 'bank_transfer', receiptNumber: 'EXP-003', addedBy: adminUser._id },
  ]);

  await Notice.insertMany([
    { societyId: SOCIETY_ID, title: 'Water Tank Cleaning', description: 'Water supply will be paused from 11 AM to 2 PM on Sunday for tank cleaning.', category: 'maintenance', date: `${CURRENT_MONTH}-07`, postedBy: 'RWA Admin', pinned: true },
    { societyId: SOCIETY_ID, title: 'Yoga Session', description: 'Community hall yoga class starts every Saturday at 7 AM.', category: 'event', date: `${CURRENT_MONTH}-10`, postedBy: 'RWA Admin', pinned: false },
  ]);

  await Complaint.insertMany([
    { societyId: SOCIETY_ID, flat: 'B-201', subject: 'Lift noise', description: 'Lift making unusual noise near 2nd floor.', category: 'facility', status: 'in_progress', priority: 'high', date: `${CURRENT_MONTH}-06`, assignedTo: 'Maintenance Team', residentName: 'Amit Singh', slaDueDate: `${CURRENT_MONTH}-07`, escalated: true },
    { societyId: SOCIETY_ID, flat: 'A-102', subject: 'Basement leakage', description: 'Leakage observed near parking slot 14.', category: 'plumbing', status: 'open', priority: 'medium', date: `${CURRENT_MONTH}-12`, assignedTo: 'RWA Committee', residentName: 'Pooja Verma', slaDueDate: `${CURRENT_MONTH}-15`, escalated: false },
  ]);

  await Visitor.insertMany([
    { societyId: SOCIETY_ID, name: 'Zomato Delivery', flat: 'A-101', purpose: 'Food Delivery', status: 'checked_in', checkIn: `${CURRENT_MONTH}-12T19:05:00`, contact: '9988776655', preApproved: true },
    { societyId: SOCIETY_ID, name: 'Vivek Gupta', flat: 'C-301', purpose: 'Personal Visit', status: 'expected', vehicle: 'DL10AB1234', contact: '9911223344', preApproved: false },
  ]);

  const facilities = await Facility.insertMany([
    { societyId: SOCIETY_ID, name: 'Community Hall', description: 'For parties and meetings', pricePerSlot: 2000, slotDuration: '4 hours', capacity: 100, type: 'hall' },
    { societyId: SOCIETY_ID, name: 'Badminton Court', description: 'Indoor court with lights', pricePerSlot: 500, slotDuration: '1 hour', capacity: 4, type: 'sport' },
  ]);

  await FacilityBooking.insertMany([
    { societyId: SOCIETY_ID, facilityId: facilities[0]._id, date: `${CURRENT_MONTH}-18`, timeSlot: '06:00 PM - 10:00 PM', purpose: 'Birthday function', flat: 'A-101', residentName: 'Rajesh Sharma', amount: 2000, status: 'confirmed' },
    { societyId: SOCIETY_ID, facilityId: facilities[1]._id, date: `${CURRENT_MONTH}-15`, timeSlot: '07:00 AM - 08:00 AM', purpose: 'Morning game', flat: 'C-302', residentName: 'Karan Mehta', amount: 500, status: 'pending' },
  ]);

  await ParkingSlot.insertMany([
    { societyId: SOCIETY_ID, slotNumber: 'P-01', vehicleType: '4w', assignedFlat: 'A-101', monthlyCharge: 800, status: 'occupied' },
    { societyId: SOCIETY_ID, slotNumber: 'P-02', vehicleType: '4w', assignedFlat: 'A-102', monthlyCharge: 800, status: 'occupied' },
    { societyId: SOCIETY_ID, slotNumber: 'P-03', vehicleType: '2w', monthlyCharge: 300, status: 'available' },
  ]);

  await StaffMember.insertMany([
    { societyId: SOCIETY_ID, name: 'Ramesh Yadav', role: 'Security Guard', phone: '9000011111', shift: 'Night', salary: 18000, attendanceStatus: 'present' },
    { societyId: SOCIETY_ID, name: 'Sanjana Devi', role: 'Housekeeping', phone: '9000011112', shift: 'Morning', salary: 14000, attendanceStatus: 'leave' },
  ]);

  await Parcel.insertMany([
    { societyId: SOCIETY_ID, flat: 'C-301', recipientName: 'Neha Arora', courierName: 'BlueDart', trackingId: 'BD12345', status: 'received' },
    { societyId: SOCIETY_ID, flat: 'A-101', recipientName: 'Rajesh Sharma', courierName: 'Amazon', trackingId: 'AMZ5566', status: 'delivered', deliveredAt: new Date().toISOString() },
  ]);

  await SocietyDocument.insertMany([
    { societyId: SOCIETY_ID, title: 'RWA Bylaws 2026', category: 'legal', url: 'https://example.com/docs/bylaws-2026.pdf', visibility: 'members' },
    { societyId: SOCIETY_ID, title: 'Vendor Contracts', category: 'finance', url: 'https://example.com/docs/vendor-contracts.pdf', visibility: 'admin_only' },
  ]);

  await EmergencyAlert.insertMany([
    { societyId: SOCIETY_ID, flat: 'B-201', raisedBy: 'Amit Singh', type: 'medical', notes: 'Need immediate ambulance support', status: 'acknowledged' },
    { societyId: SOCIETY_ID, flat: 'A-102', raisedBy: 'Pooja Verma', type: 'security', notes: 'Suspicious movement near parking', status: 'open' },
  ]);

  await BudgetPlan.insertMany([
    { societyId: SOCIETY_ID, financialYear: '2026-2027', category: 'Security', budgetedAmount: 360000 },
    { societyId: SOCIETY_ID, financialYear: '2026-2027', category: 'Electricity', budgetedAmount: 220000 },
    { societyId: SOCIETY_ID, financialYear: '2026-2027', category: 'Maintenance', budgetedAmount: 150000 },
  ]);

  await ReconciliationEntry.insertMany([
    { societyId: SOCIETY_ID, date: `${CURRENT_MONTH}-05`, reference: 'NEFT-1005', amount: 3500, type: 'credit', status: 'matched' },
    { societyId: SOCIETY_ID, date: `${CURRENT_MONTH}-09`, reference: 'CASH-1002', amount: 2000, type: 'credit', status: 'unmatched' },
  ]);

  await Poll.insertMany([
    { societyId: SOCIETY_ID, title: 'Install EV Charging Point?', options: ['Yes', 'No'], createdBy: 'RWA Admin', isClosed: false, votes: [{ flat: 'A-101', optionIndex: 0 }, { flat: 'A-102', optionIndex: 0 }, { flat: 'C-302', optionIndex: 1 }] },
  ]);

  await SocietyEvent.insertMany([
    { societyId: SOCIETY_ID, title: 'Monthly RWA Meeting', description: 'Discuss budget and pending issues', date: `${CURRENT_MONTH}-20`, location: 'Community Hall', rsvps: [{ flat: 'A-101', residentName: 'Rajesh Sharma', status: 'yes' }, { flat: 'B-201', residentName: 'Amit Singh', status: 'maybe' }] },
  ]);

  await Announcement.insertMany([
    { societyId: SOCIETY_ID, title: 'Maintenance Reminder', message: 'Please clear pending maintenance by 15th to avoid late fee.', channel: 'whatsapp', target: 'defaulters' },
  ]);

  await SocietySetting.create({
    societyId: SOCIETY_ID,
    branding: { productName: 'ClaveSociety', logoUrl: '', primaryColor: '#2563EB' },
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    maintenanceConfig: { dueDay: 10, lateFeePerDay: 50 },
    featureFlags: { pwaEnabled: true, twoFactorEnabled: false, pushNotificationsEnabled: true },
  });

  await BackupRecord.insertMany([
    { societyId: SOCIETY_ID, type: 'manual', status: 'completed', fileUrl: `https://storage.clave.local/${SOCIETY_ID}/backup-1.zip`, notes: 'Seed backup snapshot' },
  ]);

  await DeviceToken.insertMany([
    { societyId: SOCIETY_ID, userId: adminUser._id, platform: 'web', token: 'seed-admin-token' },
    { societyId: SOCIETY_ID, userId: memberUser._id, platform: 'android', token: 'seed-member-token' },
  ]);

  await AuditLog.insertMany([
    {
      societyId: SOCIETY_ID,
      userId: adminUser._id,
      userRole: 'admin',
      method: 'POST',
      route: '/api/v1/payments/apply-late-fees',
      statusCode: 200,
      entity: 'payment',
      action: 'apply_late_fees',
      entityId: null,
      requestBody: { month: CURRENT_MONTH },
    },
  ]);

  console.log('Dummy data seeded successfully.');
  console.log('Login users (match frontend VITE_* env):');
  console.log(`${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`${ACCOUNTANT_EMAIL} / ${ACCOUNTANT_PASSWORD}`);
  console.log(`${MEMBER_EMAIL} / ${MEMBER_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
