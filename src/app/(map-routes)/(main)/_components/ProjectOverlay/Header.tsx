import { countryToEmoji } from "@/lib/country-emojis";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info, Leaf, LucideProps, Users2 } from "lucide-react";
import QuickTooltip from "@/components/ui/quick-tooltip";
import { cn } from "@/lib/utils";
import useProjectOverlayStore, { ProjectOverlayState } from "./store";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import { AppGainforestOrganizationInfo } from "@/../lexicon-api";
const TabButton = ({
  children,
  label,
  isActive,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label?: string;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <QuickTooltip tooltipContent={label}>
      <Button
        variant={isActive ? "default" : "secondary"}
        className="w-full flex flex-col gap-1 items-center justify-center h-auto text-xs whitespace-normal"
        style={{
          fontSize: "0.6rem",
          lineHeight: "0.75rem",
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
        {label && <span className="font-bold w-full truncate">{label}</span>}
      </Button>
    </QuickTooltip>
  );
};

const TABS_CONFIG: {
  label: string;
  icon: React.FC<LucideProps>;
  id: Exclude<ProjectOverlayState["activeTab"], undefined>;
}[] = [
  {
    label: "Project Info",
    icon: Info,
    id: "info" as const,
  },
  {
    label: "Community",
    icon: Users2,
    id: "community" as const,
  },
  {
    label: "Biodiversity",
    icon: Leaf,
    id: "biodiversity" as const,
  },
  // {
  //   label: "AI Assistant",
  //   icon: MessageCircleQuestion,
  //   id: "ask-ai" as const,
  // },
  // {
  //   label: "Media",
  //   icon: ImagePlay,
  //   id: "media" as const,
  // },
  // {
  //   label: "Remote Sensing Analysis",
  //   icon: Satellite,
  //   id: "remote-sensing-analysis" as const,
  // },
  // {
  //   label: "Logbook",
  //   icon: FileClock,
  //   id: "logbook" as const,
  // },
];
const Tabs = () => {
  const activeTab = useProjectOverlayStore((state) => state.activeTab);
  const setActiveTab = useProjectOverlayStore((state) => state.setActiveTab);
  const navigate = useNavigation();

  const isMaximized = useProjectOverlayStore((state) => state.isMaximized);
  return (
    <div
      className={cn(
        "grid gap-2 mt-4",
        isMaximized ? "grid-cols-8" : "grid-cols-4"
      )}
    >
      {TABS_CONFIG.map((tab) => (
        <TabButton
          key={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id, navigate)}
        >
          <tab.icon size={16} />
        </TabButton>
      ))}
      {/* <TabButton isActive={false} disabled>
        <PencilOff size={16} />
      </TabButton> */}
    </div>
  );
};

const Header = ({
  organization,
}: {
  organization: AppGainforestOrganizationInfo.Record;
}) => {
  const countryDetails =
    Object.keys(countryToEmoji).includes(organization.country) ?
      countryToEmoji[organization.country as keyof typeof countryToEmoji]
    : null;
  // @satyam TODO: Fix the area thing.
  const area = Math.round(0 / 10000);

  const activeTab = useProjectOverlayStore((state) => state.activeTab);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const header = headerRef.current;
      const parent = document.querySelector("#project-overlay .scrollable");
      if (!header || !parent) return;
      const headerRect = header.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setIsStuck(headerRect.top - parentRect.top <= 2);
    };

    handleScroll();
    const parent = document.querySelector("#project-overlay .scrollable");
    if (!parent) return;

    parent.addEventListener("scroll", handleScroll);
    return () => parent.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  return (
    <div
      className={cn(
        "p-4 sticky top-20 -translate-y-20 z-10 bg-gradient-to-b",
        isStuck ?
          "from-neutral-50/90 dark:from-neutral-900/90 to-neutral-50 dark:to-neutral-900 border-b border-b-border backdrop-blur-lg shadow-xl"
        : "from-black/0 via-black/20 to-black/0"
      )}
      ref={headerRef}
    >
      <h1
        className="text-2xl font-bold text-balance"
        style={{
          textShadow: "0px 0px 16px rgb(0 0 0 / 1)",
        }}
      >
        {organization.displayName}
      </h1>
      {countryDetails && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="px-2 py-1 bg-background/50 backdrop-blur-lg rounded-full text-sm">
            {countryDetails.emoji}
            &nbsp;&nbsp;
            {countryDetails.name}
          </span>
          {Boolean(area) && (
            <span className="px-2 py-1 bg-background/50 backdrop-blur-lg rounded-full text-sm">
              <b>{area}</b> {area === 1 ? "hectare" : "hectares"}
            </span>
          )}
        </div>
      )}
      <Tabs />
    </div>
  );
};

export default Header;
