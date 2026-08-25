export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div>
          <p className="text-sm font-semibold text-neutral-900">ReachInbox Scheduler</p>
          <p className="text-xs text-neutral-500">Email job dashboard</p>
        </div>
        <button className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700">
          Logout
        </button>
      </div>
    </header>
  );
}
