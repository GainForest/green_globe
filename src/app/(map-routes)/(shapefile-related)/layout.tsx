import Map from "./_components/Map";
import Overlay from "./_components/Overlay";
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 flex flex-col">
      <Map />
      <Overlay />
      {children}
    </div>
  );
}
