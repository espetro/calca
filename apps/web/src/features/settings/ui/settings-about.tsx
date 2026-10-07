import { Bug, Code2, Globe, Heart, MessageCircle } from "lucide-react";

import { m } from "#/lib/i18n";
import { Badge } from "#/shared/components/ui/badge";
import { Separator } from "#/shared/components/ui/separator";

export function SettingsAbout() {
  const appVersion = import.meta.env.VITE_APP_VERSION;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">{m.settings_aboutAppName()}</h3>
          <p className="text-xs text-muted-foreground">{m.settings_aboutTagline()}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {appVersion}
        </Badge>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          {m.settings_aboutBuiltWith()} <Heart className="size-3.5 text-red-400 fill-red-400" />{" "}
          {m.settings_aboutBuiltBy()}
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">
          {m.settings_aboutLinksHeading()}
        </h4>
        <div className="flex flex-col gap-2">
          <a
            href="https://github.com/espetro/calca"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code2 className="size-4" />
            {m.settings_aboutGithubRepo()}
          </a>
          <a
            href="https://x.com/josocjoq"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="size-4" />
            {m.settings_aboutTwitter()}
          </a>
          <a
            href="https://github.com/espetro/calca"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="size-4" />
            {m.settings_aboutWebsite()}
          </a>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">
          {m.settings_aboutLicenseHeading()}
        </h4>
        <p className="text-sm text-muted-foreground">
          {m.settings_aboutLicenseText()}{" "}
          <a
            href="https://github.com/espetro/calca/blob/main/LICENSE"
            className="text-foreground hover:underline font-medium"
          >
            AGPL-3.0
          </a>
        </p>
      </div>

      <Separator />

      <a
        href="#"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bug className="size-4" />
        {m.settings_aboutReportIssue()}
      </a>
    </div>
  );
}
