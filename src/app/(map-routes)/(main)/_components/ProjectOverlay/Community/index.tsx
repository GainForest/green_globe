// import { Tab } from "@/components/ui/sliding-tabs";
// import { SlidingTabs, Underlay } from "@/components/ui/sliding-tabs";
import React from "react";
// import useCommunityStore from "./store";
// import { Button } from "@/components/ui/button";
import Members from "./Members";
// import Donations from "./Donations";
// import autoAnimate from "@formkit/auto-animate";

const Community = () => {
  // const activeTab = useCommunityStore((state) => state.activeTab);
  // const setActiveTab = useCommunityStore((state) => state.setActiveTab);
  // const tabRendererRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (tabRendererRef.current) {
  //     autoAnimate(tabRendererRef.current);
  //   }
  // }, [activeTab]);
  return (
    <div className="flex flex-col gap-4">
      {/* <SlidingTabs activeKey={activeTab} className="gap-2">
        <Underlay />
        <Tab tabKey="members" asChild>
          <Button
            variant="ghost"
            className="relative z-10 flex-1 disabled:opacity-100"
            onClick={() => setActiveTab("members")}
            disabled={activeTab === "members"}
          >
            Members
          </Button>
        </Tab>
        <Tab tabKey="donations" asChild>
          <Button
            variant="ghost"
            className="relative z-10 flex-1 disabled:opacity-100"
            onClick={() => setActiveTab("donations")}
            disabled={activeTab === "donations"}
          >
            Donations
          </Button>
        </Tab>
      </SlidingTabs>
      <section ref={tabRendererRef}> */}
       <Members />
        {/* {activeTab === "donations" && <Donations />}
      </section> */}
    </div>
  );
};

export default Community;
