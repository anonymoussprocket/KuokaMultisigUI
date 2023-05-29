import { Link } from "react-router-dom";
import useStyles from "./style";

const Header = () => {
  const classes = useStyles();
  return (
    <div className={classes.header}>
      <div className={classes.container}>
        <h1 className={classes.title}>Tezos Africa MultiSig UI</h1>
        <div className={classes.menu}>
          <Link to="/create" className={classes.menuItem}>Create</Link>
          <Link to="/submit" className={classes.menuItem}>Submit</Link>
          <Link to="/execute" className={classes.menuItem}>Execute</Link>
          <Link to="/rotate" className={classes.menuItem}>Rotate</Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
