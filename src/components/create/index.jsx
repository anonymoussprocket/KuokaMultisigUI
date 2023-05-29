import { MenuItem, Select } from "@material-ui/core";
import { connectTezAccount, getChainID, getNextOperationIndex, keyRotateRequest, setAdminRequest, delegateRequest, balanceTransferRequest } from "../../library/tezos";

import { SigningType } from "@airgap/beacon-sdk";
import { useState } from "react";
import useStyles from "./style";

const config = require('../../library/config.mainnet.js').default;

const Create = () => {
    const classes = useStyles();
    const [operation, setOperation] = useState('rotatekeys');
    const [opData, setOpData] = useState('operation data');
    const [sig, setSig] = useState('your signature');
    const [tokenAddress, setTokenAddress] = useState(config.tokens[0].multisigAddr);
    const handleChange = (event) => {
        setOperation(event.target.value);
    };

    const rotateKeysForm = (handler) => {
        return (
            <form onSubmit={handler}>
                <label htmlFor="threshold" className={classes.label}>Threshold</label>
                <input className={classes.input} type="number" name="threshold" placeholder="2" required />
                <label htmlFor="keys" className={classes.label}>Keys</label>
                <input className={classes.input} type="text" name="keys" placeholder="edpk..., edpk..., edpk..." required />
                <input className={classes.input} type="submit" value="Sign" />
            </form>
        )
    }

    const handleRotateKeys = async (event) => {
        event.preventDefault();
        try {
            const multisigAddr = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0].multisigAddr;
            const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()])
            const data = keyRotateRequest(chainID, opID, event.target.threshold.value, event.target.keys.value.split(',').map(k => k.trim()))
            const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
            setSig(sig.signature)
            setOpData(data.operation)
        } catch (err) {
            console.log("Failed to create operation", err)
            alert("Failed to create operation")
        }
    };

    const setAdmin = () => {
        return (
            <form onSubmit={handleSetAdmin}>
                <label className={classes.label}>
                    Admin:
                </label>
                <input className={classes.input} type="text" name="admin" placeholder="New Admin Address" required />
                <input className={classes.input} type="submit" value="Sign" />
            </form>
        )
    }

    const handleSetAdmin = async (event) => {
        event.preventDefault();
        try {
            const multisigAddr = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0].multisigAddr;
            const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()])
            const data = setAdminRequest(chainID, opID, event.target.admin.value)
            const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
            setSig(sig.signature)
            setOpData(data.operation)
        } catch (err) {
            console.log("Failed to create operation", err)
            alert("Failed to create operation")
        }
    };

    const delegate = () => {
        return (
            <form onSubmit={handleDelegate}>
                <label className={classes.label}>
                    Delegate:
                </label>
                <input className={classes.input} type="text" name="delegate" placeholder="Delegate Address" required />
                <input className={classes.input} type="submit" value="Sign" />
            </form>
        )
    }

    const handleDelegate = async (event) => {
        event.preventDefault();
        try {
            const multisigAddr = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0].multisigAddr;
            const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()]);
            const data = delegateRequest(chainID, opID, multisigAddr, event.target.delegate.value);
            const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
            setSig(sig.signature)
            setOpData(data.operation)
        }
        catch (err) {
            console.log("Failed to create operation", err)
            alert("Failed to create operation")
        }
    };

    const handleBalanceTransfer = async (event) => {
        event.preventDefault();
        try {
            const multisigAddr = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0].multisigAddr;
            const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()]);
            const data = balanceTransferRequest(chainID, opID, multisigAddr, event.target.address.value, event.target.amount.value);
            const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
            setSig(sig.signature)
            setOpData(data.operation)
        }
        catch (err) {
            console.log("Failed to create operation", err)
            alert("Failed to create operation")
        }
    };

    const balanceTransfer = () => {
        return (
            <form onSubmit={handleBalanceTransfer}>
                <label className={classes.label}>
                    Address:
                </label>
                <input className={classes.input} type="text" name="address" placeholder="Address" required />
                <label className={classes.label}>
                    Amount:
                </label>
                <input className={classes.input} type="number" name="amount" placeholder="Amount" required />
                <input className={classes.input} type="submit" value="Sign" />
            </form>
        )
    }

    const renderForm = () => {
        switch (operation) {
            case "setadmin": return setAdmin();
            case "rotatekeys": return rotateKeysForm(handleRotateKeys);
            case "delegate": return delegate();
            case "balancetransfer": return balanceTransfer();
            default: return rotateKeysForm(handleRotateKeys);
        }
    };

    return (
        <div className={classes.container}>
            <label htmlFor="token" className={classes.label}>Token</label>
            <Select
                className={classes.select}
                labelId="token"
                id="token"
                value={tokenAddress}
                label="token"
                onChange={(event) => { setTokenAddress(event.target.value) }}
            >
                {config.tokens.map(token => <MenuItem key={`menuItem${token.tokenName}`} value={token.tokenType === 'multisig' ? token.multisigAddr : token.tokenAddr}>{token.tokenName}</MenuItem>)}
            </Select>

            <label htmlFor="operations" className={classes.label}>Action</label>
            <Select
                className={classes.select}
                labelId="operations"
                id="operations"
                value={operation}
                label="Operation"
                onChange={handleChange}
            >
                <MenuItem value={"setadmin"}>Set Admin</MenuItem>
                <MenuItem value={"rotatekeys"}>Rotate Keys</MenuItem>
                <MenuItem value={"delegate"}>Delegate</MenuItem>
                <MenuItem value={"balancetransfer"}>Balance Transfer</MenuItem>
            </Select>

            {renderForm()}

            <div className={classes.display}>
                <label htmlFor="operation" className={classes.label}>Operation</label>
                <textarea name="operation" className={classes.input} readOnly style={{ width: "600px" }} value={opData}></textarea>
                <br />
                <label htmlFor="signature" className={classes.label}>Signature</label>
                <input name="signature" className={classes.input} type="text" value={sig} readOnly style={{ width: "600px" }} />
            </div>
        </div>
    );
};

export default Create;
