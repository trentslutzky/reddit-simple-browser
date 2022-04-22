import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

import { Subreddit } from "./Subreddit";

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Subreddit />} />
        <Route path="/r/:subreddit" element={<Subreddit />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return <p>home</p>;
}
