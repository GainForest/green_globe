import HoveredTreeOverlay from "./_components/HoveredTreeOverlay";
import Map from "./_components/Map";
import Sidebar from "./_components/Overlay";
import TreeClusterOverlay from "./_components/Map/TreeClusterOverlay";
import TreesLoadingOverlay from "./_components/Map/TreesLoadingOverlay";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 flex flex-col">
      <Map />
      <Sidebar />
      <HoveredTreeOverlay />
      <TreesLoadingOverlay />
      <TreeClusterOverlay />
      {children}
    </div>
  );
}
