import "./App.css";

import { Route, HashRouter, Switch } from "react-router-dom";
import Create from "./components/create";
import Execute from "./components/execute";
import Header from "./components/header";
import Submit from "./components/submit";
import Rotate from "./components/rotate";

function App() {
  return (
    <HashRouter>
      <div className="App">
        <Header />
        <Switch>
          <Route exact path="/">
            <Create />
          </Route>{" "}
          <Route exact path="/create">
            <Create />
          </Route>
          <Route exact path="/submit">
            <Submit />
          </Route>
          <Route exact path="/execute">
            <Execute />
          </Route>
          <Route exact path="/rotate">
            <Rotate />
          </Route>
        </Switch>
      </div>
    </HashRouter>
  );
}

export default App;
