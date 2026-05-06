import { m } from "#/lib/i18n";
import { cn } from "#/lib/utils";
import { Button } from "#/shared/components/ui/button";

interface OnboardingBannerProps {
  onClick?: () => void;
}

const OnboardingBanner = ({ onClick }: OnboardingBannerProps) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
      <Button
        variant="secondary"
        className={cn(
          "flex items-center gap-2",
          "bg-chart-1/10 backdrop-blur-xl",
          "border border-chart-1/20",
          "text-chart-1",
          "hover:bg-chart-1/20",
          "shadow-sm",
        )}
        onClick={onClick}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-chart-1 animate-pulse" />
        {m.banner.addApiKey()}
      </Button>
    </div>
  );
};

export default OnboardingBanner;
