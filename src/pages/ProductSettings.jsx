import { useEffect, useState } from 'react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  getProductSettingsApi,
  listBackupsApi,
  registerDeviceTokenApi,
  triggerBackupApi,
  updateProductSettingsApi,
} from '../services/productService';

export default function ProductSettings() {
  const { toast, showToast, clearToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [backups, setBackups] = useState([]);
  const [token, setToken] = useState('');

  const load = async () => {
    try {
      const [s, b] = await Promise.all([getProductSettingsApi(), listBackupsApi()]);
      setSettings(s);
      setBackups(b);
    } catch (err) {
      showToast('error', err.message || 'Failed to load product settings');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product & Premium Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Branding, feature flags, push token registration and backups</p>
      </div>

      {settings && (
        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Branding & Feature Flags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={settings.branding?.productName || ''} onChange={(e) => setSettings((prev) => ({ ...prev, branding: { ...prev.branding, productName: e.target.value } }))} className="px-3 py-2 border rounded-lg text-sm" placeholder="Product name" />
            <input value={settings.branding?.primaryColor || ''} onChange={(e) => setSettings((prev) => ({ ...prev, branding: { ...prev.branding, primaryColor: e.target.value } }))} className="px-3 py-2 border rounded-lg text-sm" placeholder="#2563EB" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!settings.featureFlags?.pwaEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, featureFlags: { ...prev.featureFlags, pwaEnabled: e.target.checked } }))} />
              PWA Enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!settings.featureFlags?.twoFactorEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, featureFlags: { ...prev.featureFlags, twoFactorEnabled: e.target.checked } }))} />
              2FA Enabled
            </label>
          </div>
          <button
            className="mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
            onClick={async () => {
              try {
                await updateProductSettingsApi(settings);
                showToast('success', 'Settings updated');
                load();
              } catch (err) {
                showToast('error', err.message || 'Failed to update settings');
              }
            }}
          >
            Save Settings
          </button>
        </section>
      )}

      <section className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Push Notification Device Token</h2>
        <div className="flex gap-2">
          <input value={token} onChange={(e) => setToken(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="device-token-xyz" />
          <button className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg" onClick={async () => { await registerDeviceTokenApi({ token, platform: 'web' }); setToken(''); showToast('success', 'Device token registered'); }}>
            Register
          </button>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Backup & Restore</h2>
        <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg mb-3" onClick={async () => { await triggerBackupApi({ type: 'manual' }); showToast('success', 'Backup triggered'); load(); }}>
          Trigger Backup
        </button>
        <ul className="text-sm space-y-1">{backups.map((item) => <li key={item._id}>{item.type} - {item.status} - {item.createdAt?.slice(0, 10)}</li>)}</ul>
      </section>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
