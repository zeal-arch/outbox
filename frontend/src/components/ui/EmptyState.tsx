export function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
      {title}
    </div>
  );
}
