import { Bug, Code2, Globe, Heart, MessageCircle } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";

export function SettingsAbout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">Calca</h3>
          <p className="text-xs text-muted-foreground">AI design tool for the web</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          v0.1.0
        </Badge>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          Built with <Heart className="size-3.5 text-red-400 fill-red-400" /> by Joaquin Terrasa
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">Links</h4>
        <div className="flex flex-col gap-2">
          <a
            href="https://github.com/espetro/calca"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code2 className="size-4" />
            GitHub Repository
          </a>
          <a
            href="https://x.com/josocjoq"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="size-4" />X / Twitter
          </a>
          <a
            href="https://github.com/espetro/calca"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="size-4" />
            Website (comming soon)
          </a>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">License</h4>
        <p className="text-sm text-muted-foreground">
          Open source under{" "}
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
        Report an issue
      </a>
    </div>
  );
}
