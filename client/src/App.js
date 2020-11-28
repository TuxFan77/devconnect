import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import "./App.css";
import Navbar from "./components/layout/Navbar";
import Landing from "./components/layout/Landing";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Route exact path="/">
          <Landing />
        </Route>
      </Router>
    </>
  );
}

export default App;
