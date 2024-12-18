import { useState } from "react";
import Join from "./Join";
import Create from "./Create";

const Home = () => {
  const [tabIndex, settabIndex] = useState(0);

  return (
    <div>
      <div role="tablist" className="tabs tabs-boxed rounded-none">
        <button
          onClick={() => settabIndex(0)}
          role="tab"
          className={`tab ${tabIndex === 0 ? "tab-active" : ""}`}
        >
          Create Game
        </button>
        <button
          onClick={() => settabIndex(1)}
          role="tab"
          className={`tab ${tabIndex === 1 ? "tab-active" : ""}`}
        >
          Join Game
        </button>
      </div>
      {tabIndex === 0 ? <Create /> : <Join />}
    </div>
  );
};

export default Home;
