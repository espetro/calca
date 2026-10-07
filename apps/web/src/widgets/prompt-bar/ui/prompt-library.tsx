import { X } from "lucide-react";
import { useState } from "react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";

interface PromptLibraryProps {
  open: boolean;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
}

interface PromptItem {
  text: string;
  label: string;
}

interface PromptCategory {
  name: string;
  icon: string;
  prompts: PromptItem[];
}

const getCategories = (): PromptCategory[] => [
  {
    icon: "◻",
    name: m.promptlib_catUi(),
    prompts: [
      {
        label: m.promptlib_toastLabel(),
        text: m.promptlib_toastText(),
      },
      {
        label: m.promptlib_pricingCardsLabel(),
        text: m.promptlib_pricingCardsText(),
      },
      {
        label: m.promptlib_loginFormLabel(),
        text: m.promptlib_loginFormText(),
      },
      {
        label: m.promptlib_settingsPanelLabel(),
        text: m.promptlib_settingsPanelText(),
      },
      {
        label: m.promptlib_navBarLabel(),
        text: m.promptlib_navBarText(),
      },
      {
        label: m.promptlib_modalDialogLabel(),
        text: m.promptlib_modalDialogText(),
      },
    ],
  },
  {
    icon: "▣",
    name: m.promptlib_catPages(),
    prompts: [
      {
        label: m.promptlib_heroSectionLabel(),
        text: m.promptlib_heroSectionText(),
      },
      {
        label: m.promptlib_dashboardLabel(),
        text: m.promptlib_dashboardText(),
      },
      {
        label: m.promptlib_pricingPageLabel(),
        text: m.promptlib_pricingPageText(),
      },
      {
        label: m.promptlib_blogPostLabel(),
        text: m.promptlib_blogPostText(),
      },
    ],
  },
  {
    icon: "◈",
    name: m.promptlib_catMarketing(),
    prompts: [
      {
        label: m.promptlib_socialCardLabel(),
        text: m.promptlib_socialCardText(),
      },
      {
        label: m.promptlib_emailHeaderLabel(),
        text: m.promptlib_emailHeaderText(),
      },
      {
        label: m.promptlib_bannerAdLabel(),
        text: m.promptlib_bannerAdText(),
      },
      {
        label: m.promptlib_featureSectionLabel(),
        text: m.promptlib_featureSectionText(),
      },
    ],
  },
];

export function PromptLibrary({ open, onClose, onUsePrompt }: PromptLibraryProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const categories = getCategories();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleUse = (text: string) => {
    onUsePrompt(text);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Slide-out panel */}
      <div className="fixed top-3 right-3 bottom-3 z-50 w-[400px] max-w-[85vw] bg-glass-bg backdrop-blur-2xl border border-glass-border rounded-2xl shadow-glass flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h2 className="text-[15px] font-semibold text-foreground">{m.promptlib_title()}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm opacity-60">{cat.icon}</span>
                <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.name}
                </h3>
              </div>
              <div className="space-y-2">
                {cat.prompts.map((p) => (
                  <div
                    key={p.label}
                    className="group/item bg-glass-bg/60 hover:bg-glass-bg backdrop-blur-sm rounded-xl border border-border/40 hover:border-border/60 px-4 py-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground mb-1">
                          {p.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {p.text}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Button variant="default" size="sm" onClick={() => handleUse(p.text)}>
                        {m.promptlib_usePrompt()}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(p.text)}>
                        {copied === p.text ? m.promptlib_copied() : m.promptlib_copy()}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
