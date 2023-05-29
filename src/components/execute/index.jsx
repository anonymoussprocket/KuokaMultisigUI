import { MenuItem, Select } from "@material-ui/core";
import { useEffect, useState } from "react";

import { connectTezAccount, executeMultisigOperation, getNextOperationIndex } from "../../library/tezos";
import useStyles from "./style";

const config = require('../../library/config.mainnet.js').default;

const Execute = () => {
  const classes = useStyles();
  const [multisigAddress, setMultisigAddress] = useState(config.tokens[0].multisigAddr);
  const [operationIndex, setOperationIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      let idx = 0;
      try {
        idx = await getNextOperationIndex(multisigAddress);
      } catch { }
      setOperationIndex(idx - 1);
    }

      fetchData().catch(console.error);
  }, [multisigAddress]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const client = await connectTezAccount()
      await executeMultisigOperation(client, multisigAddress, event.target.id.value)
    } catch (err) {
      console.log("Failed to submit operation", err)
      alert("Failed to submit operation")
    }
  };

  return (
    <div className={classes.container}>
      <form onSubmit={handleSubmit}>
      <label htmlFor="token" className={classes.label}>Token</label>
        <Select
            className={classes.select}
            labelId="token"
            id="token"
            value={multisigAddress}
            label="token"
            onChange={(event) => { setMultisigAddress(event.target.value); }}
          >
          {config.tokens.map(token => <MenuItem key={`menuItem${token.tokenName}`} value={token.multisigAddr}>{token.tokenName}</MenuItem>)}
        </Select>
        <label htmlFor="id" className={classes.label}>Operation Index</label>
        <input className={classes.input} type="number" name="id" value={operationIndex} onChange={(event) => setOperationIndex(event.target.value)} required />
        <input className={classes.input} type="submit" value="Execute" />
      </form>
    </div>
  );
};

export default Execute;
