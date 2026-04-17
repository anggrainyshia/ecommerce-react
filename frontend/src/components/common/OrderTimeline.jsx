const STEPS = [
  { key: 'pending',          label: 'Order Placed',      icon: '🛍️' },
  { key: 'paid',             label: 'Payment Confirmed',  icon: '✅' },
  { key: 'packed',           label: 'Order Packed',       icon: '📦' },
  { key: 'shipped',          label: 'Shipped',            icon: '📮' },
  { key: 'out_for_delivery', label: 'Out for Delivery',   icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',          icon: '🎉' },
];

const STATUS_COLORS = {
  pending:          'text-gray-500 dark:text-gray-400',
  paid:             'text-green-600 dark:text-green-400',
  packed:           'text-yellow-600 dark:text-yellow-400',
  shipped:          'text-blue-600 dark:text-blue-400',
  out_for_delivery: 'text-orange-600 dark:text-orange-400',
  delivered:        'text-purple-600 dark:text-purple-400',
  failed:           'text-red-600 dark:text-red-400',
};

const STATUS_BG = {
  pending:          'bg-gray-100 dark:bg-gray-700',
  paid:             'bg-green-100 dark:bg-green-900/40',
  packed:           'bg-yellow-100 dark:bg-yellow-900/40',
  shipped:          'bg-blue-100 dark:bg-blue-900/40',
  out_for_delivery: 'bg-orange-100 dark:bg-orange-900/40',
  delivered:        'bg-purple-100 dark:bg-purple-900/40',
  failed:           'bg-red-100 dark:bg-red-900/40',
};

export default function OrderTimeline({ tracking = [], currentStatus }) {
  // If order failed, show a simplified failed indicator instead of the normal timeline
  if (currentStatus === 'failed') {
    return (
      <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${STATUS_BG.failed}`}>
        <span className="text-xl">❌</span>
        <div>
          <p className={`text-sm font-semibold ${STATUS_COLORS.failed}`}>Order Failed</p>
          {tracking.find((t) => t.status === 'failed')?.note && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tracking.find((t) => t.status === 'failed').note}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = step.key === currentStatus;
        const trackingEntry = tracking.find((t) => t.status === step.key);
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Icon column with connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                  ${done
                    ? active
                      ? `${STATUS_BG[step.key]} border-2 border-current ${STATUS_COLORS[step.key]}`
                      : 'bg-gray-200 dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-300'
                    : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                  }`}
              >
                {done ? (active ? step.icon : '✓') : '○'}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-6 mt-0.5 ${
                    done && i < currentIdx
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                />
              )}
            </div>

            {/* Label column */}
            <div className={`pb-1 ${isLast ? '' : 'mb-0'}`} style={{ paddingTop: '4px' }}>
              <p
                className={`text-sm font-${active ? '700' : '500'} ${
                  active
                    ? STATUS_COLORS[step.key]
                    : done
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {step.label}
              </p>
              {trackingEntry && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {new Date(trackingEntry.createdAt).toLocaleString()}
                  {trackingEntry.note ? ` · ${trackingEntry.note}` : ''}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
