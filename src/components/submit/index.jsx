import { MenuItem, Select } from "@material-ui/core";
import { TezosMessageUtils } from "conseiljs";
import { useEffect, useState } from "react";

import { connectTezAccount, getNextOperationIndex, submitMultisigOperation } from "../../library/tezos";
import useStyles from "./style";

const config = require('../../library/config.mainnet.js').default;

const Submit = () => {
  const classes = useStyles();
  const [count, setCount] = useState(1);
  const [opID, setOpID] = useState(0);
  const [multisigAddress, setMultisigAddress] = useState(config.tokens[0].multisigAddr);

  useEffect(() => {
    const fetchData = async () => {
      let idx = 0;
      try {
        idx = await getNextOperationIndex(multisigAddress);
      } catch { }
      setOpID(idx);
    }

      fetchData().catch(console.error);
  }, [multisigAddress]);

  const handleSigs = (event) => {
    event.preventDefault();
    setCount(event.target.count.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const sigs = []
      for (let i = 1; i <= count; i++) {
        sigs.push({ signature: event.target[`signature${i}`].value, address: event.target[`address${i}`].value })
      }

      sigs.sort((a, b) => {
        // eslint-disable-next-line no-undef
        const a1 = BigInt("0x" + TezosMessageUtils.writeAddress(a.address))
        // eslint-disable-next-line no-undef
        const b1 = BigInt("0x" + TezosMessageUtils.writeAddress(b.address))

        if (a1 > b1) { return 1; }

        if (a1 < b1) { return -1; }

        return 0;
      })

      const client = await connectTezAccount();
      const opID = await getNextOperationIndex(multisigAddress);

      await submitMultisigOperation(client, multisigAddress, sigs, event.target.operation.value, 'submit');

      alert("operation submitted")
      setOpID(opID);
    } catch (err) {
      console.log("Failed to submit operation", err)
      alert("Failed to submit operation")
    }
  };

  const renderForm = () => {
    let sigs = [];
    for (let i = 1; i <= count; i++) {
      sigs.push(
        <div key={`sigContainer${i}`}>
          <label htmlFor={`address${i}`} className={classes.label}>Address {i}</label>
          <input className={classes.input} type="text" name={`address${i}`} placeholder="Address" required />
          <label htmlFor={`signature${i}`} className={classes.label}>Signature {i}</label>
          <input className={classes.input} type="text" name={`signature${i}`} placeholder="Signature" required />
        </div>
      )
    }
    return (
      <form onSubmit={handleSubmit}>
        <label htmlFor="token" className={classes.label}>Token</label>
        <Select
            className={classes.select}
            labelId="token"
            id="token"
            value={multisigAddress}
            label="token"
            onChange={(event) => { setMultisigAddress(event.target.value) }}
          >
        {config.tokens.map(token => <MenuItem key={`menuItem${token.tokenName}`} value={token.multisigAddr}>{token.tokenName}</MenuItem>)}
        </Select>
        <label htmlFor="operation" className={classes.label}>Operation</label>
        <input className={classes.input} type="text" name="operation" placeholder="Operation" required />
        <br /><br />
        {sigs}

        <input className={classes.input} type="submit" value="Submit" />
      </form>
    )
  }
  return (
    <div className={classes.container}>
      <form onSubmit={handleSigs}>
        <label htmlFor="count" className={classes.label}>Signature Count</label>
        <input className={classes.input} type="number" min={1} name="count" placeholder="Signature Count" required />
        <input className={classes.input} type="submit" value="Set" />
      </form><br />
      {renderForm()}
      <div className={classes.opID}>Operation Index: {opID}</div>
    </div>
  );
};

export default Submit;
