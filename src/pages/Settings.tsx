import { useState } from 'react';
import { Save, Printer } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { useTheme } from '../context/ThemeContext';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [shop, setShop] = useState({
    name: 'Kumar Auto Parts',
    address: '123, Main Market, Karol Bagh, New Delhi',
    phone: '9876543200',
    gst: '07AABCU9603R1ZM',
  });
  const [autoPrint, setAutoPrint] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">Appearance</h2>
        <Toggle
          label={`Dark Mode (${theme === 'dark' ? 'On' : 'Off'})`}
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">Shop Details</h2>
        <div className="space-y-4">
          <Input
            label="Shop Name"
            value={shop.name}
            onChange={e => setShop({ ...shop, name: e.target.value })}
          />
          <Input
            label="Address"
            value={shop.address}
            onChange={e => setShop({ ...shop, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={shop.phone}
              onChange={e => setShop({ ...shop, phone: e.target.value })}
            />
            <Input
              label="GST Number"
              value={shop.gst}
              onChange={e => setShop({ ...shop, gst: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <Printer size={20} className="text-[var(--text-secondary)]" />
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Printer Setup</h2>
        </div>
        <div className="mt-4 space-y-4">
          <Toggle
            label="Auto-print on bill generation"
            checked={autoPrint}
            onChange={setAutoPrint}
          />
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Uses system default printer. Make sure your thermal printer is set as default.
          </p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button icon={<Save size={18} />} onClick={handleSave}>
          Save Settings
        </Button>
        {saved && <span className="text-[13px] font-medium text-primary-500">Settings saved!</span>}
      </div>
    </div>
  );
}
