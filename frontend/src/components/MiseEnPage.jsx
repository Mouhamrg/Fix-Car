import { Outlet } from "react-router-dom";
import BarreNav from "./BarreNav";

export default function MiseEnPage() {
  return (
    <div className="mise-en-page">
      <BarreNav />
      <main className="contenu-principal">
        <div className="conteneur">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
