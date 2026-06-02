import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  createDocument,
  createEmergencyAlert,
  createParcel,
  createParkingSlot,
  createStaff,
  listDocuments,
  listEmergencyAlerts,
  listParcels,
  listParkingSlots,
  listStaff,
  markParcelDelivered,
  updateEmergencyStatus,
  updateStaffAttendance,
} from './operations.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/parking', listParkingSlots);
router.post('/parking', requireRole('admin', 'accountant'), createParkingSlot);

router.get('/staff', requireRole('admin', 'accountant'), listStaff);
router.post('/staff', requireRole('admin', 'accountant'), createStaff);
router.patch('/staff/:id/attendance', requireRole('admin', 'accountant'), updateStaffAttendance);

router.get('/parcels', listParcels);
router.post('/parcels', createParcel);
router.patch('/parcels/:id/delivered', requireRole('admin', 'accountant'), markParcelDelivered);

router.get('/documents', listDocuments);
router.post('/documents', requireRole('admin', 'accountant'), createDocument);

router.get('/emergency-alerts', listEmergencyAlerts);
router.post('/emergency-alerts', createEmergencyAlert);
router.patch('/emergency-alerts/:id/status', requireRole('admin', 'accountant'), updateEmergencyStatus);

export default router;
