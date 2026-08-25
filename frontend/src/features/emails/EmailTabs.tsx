import { ComposeEmailButton } from "./ComposeEmailButton";
import { EmptyState } from "../../components/ui/EmptyState";

export function EmailTabs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Emails</h1>
        <ComposeEmailButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Scheduled Emails</h2>
          <EmptyState title="No scheduled emails yet" />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Sent Emails</h2>
          <EmptyState title="No sent emails yet" />
        </section>
      </div>
    </div>
  );
}
