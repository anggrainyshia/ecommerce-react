import Logo from '../common/Logo';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <div className="flex justify-center mb-2">
          <Logo size="sm" className="[&_span]:text-indigo-400 [&_span:last-child]:text-gray-200" />
        </div>
        <p>EveryBit — React + Node.js + PostgreSQL + Redis</p>
        <p className="mt-1 text-xs text-gray-500">
          Payment powered by Midtrans Sandbox
        </p>
      </div>
    </footer>
  );
}
