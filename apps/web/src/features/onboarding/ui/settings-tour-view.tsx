import { SettingsContent } from "#/features/settings/ui/settings-content";

export function SettingsTourView() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[45]">
      <div
        className="bg-background rounded-xl shadow-lg border border-border overflow-hidden w-full max-w-2xl mx-4"
        aria-hidden="true"
      >
        <SettingsContent defaultSection="general" />
      </div>
    </div>
  );
}
