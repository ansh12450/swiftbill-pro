import { useShopSettings } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, updateSettings } = useShopSettings();

  const handleSave = () => {
    toast.success('Settings saved!');
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold">Shop Settings</h2>

      <div className="stat-card space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Shop Name</label>
          <Input value={settings.shopName} onChange={e => updateSettings({ shopName: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Address</label>
          <Input value={settings.address} onChange={e => updateSettings({ address: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">GSTIN</label>
          <Input value={settings.gstin} onChange={e => updateSettings({ gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Phone</label>
          <Input value={settings.phone} onChange={e => updateSettings({ phone: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Email (optional)</label>
          <Input value={settings.email || ''} onChange={e => updateSettings({ email: e.target.value })} />
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
