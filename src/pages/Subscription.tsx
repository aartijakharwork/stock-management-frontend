import { Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { subscriptionPlans } from '../data/dummy';
import { formatCurrency } from '../utils/formatters';

export function Subscription() {
  const handleUpgrade = (planName: string) => {
    alert(`Upgrading to ${planName} plan...`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Choose Your Plan</h2>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Simple pricing for your shop. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {subscriptionPlans.map(plan => (
          <Card
            key={plan.id}
            className={`relative flex flex-col transition-shadow hover:shadow-lg ${plan.recommended ? 'border-primary-400 ring-2 ring-primary-400/20' : ''}`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="success">Recommended</Badge>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(plan.price)}</span>
                <span className="text-[13px] text-[var(--text-tertiary)]">/{plan.period}</span>
              </div>
            </div>
            <ul className="mb-6 flex-1 space-y-3">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.recommended ? 'primary' : 'secondary'}
              size="lg"
              className="w-full"
              onClick={() => handleUpgrade(plan.name)}
            >
              {plan.recommended ? 'Get Started' : 'Choose Plan'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
