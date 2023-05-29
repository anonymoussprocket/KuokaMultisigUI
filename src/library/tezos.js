import { DAppClient, TezosOperationType } from "@airgap/beacon-sdk";
import { TezosMessageUtils, TezosNodeReader } from "conseiljs";
import { JSONPath } from "jsonpath-plus";

const config = require('./config.mainnet.js').default;

export const connectTezAccount = async () => {
    const client = new DAppClient({ name: "Multisig" });
    const network = config.network === "mainnet" ? "mainnet" : "ghostnet";
    await client.requestPermissions({ network: { type: network } });
    const account = await client.getActiveAccount();

    console.log(`connected to ${network} at ${config.rpc} as ${account["address"]}`)

    return { client, account: account["address"] };
};

export const getNextOperationIndex = async (multisigAddress) => {
    try {
        const multisigStorage = await TezosNodeReader.getContractStorage(config.rpc, multisigAddress);

        return (Number(JSONPath({ path: "$.args[0].args[0].int", json: multisigStorage })[0]) + 1);
    } catch {
        console.error(`could not read operation index for ${multisigAddress}`);
        return 0;
    }
};

const composeTransferRequest = (chainId, operationIndex, tokenAddress, sourceAddress, destinationAddress, tokenBalance) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, "chain_id").toString("hex");

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" } ] }, { "prim": "CONTRACT", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "int" } ] } ] } ], "annots": [ "%transfer" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "10" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "nat" } ] } ] }, { "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(sourceAddress)}" }, { "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }, { "int": "${tokenBalance}" } ] } ] } ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ] }`;
};

export const transferRequest = (chainId, operationIndex, tokenAddress, sourceAddress, destinationAddress, tokenBalance) => {
    const operation = composeTransferRequest(chainId, operationIndex, tokenAddress, sourceAddress, destinationAddress, tokenBalance);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, "") };
};

const composeMintRequest = (chainId, operationIndex, tokenAddress, destinationAddress, tokenBalance) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, "chain_id").toString("hex");

    return `{ "prim": "Pair", "args": [{ "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }], "annots": ["%mint"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }, { "prim": "Pair", "args": [{ "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }, { "int": "${tokenBalance}" }] }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;
};

export const mintRequest = (chainId, operationIndex, tokenAddress, destinationAddress, tokenBalance) => {
    const operation = composeMintRequest(chainId, operationIndex, tokenAddress, destinationAddress, tokenBalance);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, "") };
};

const composeBurnRequest = (chainId, operationIndex, tokenAddress, destinationAddress, tokenBalance) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, "chain_id").toString("hex");

    return `{ "prim": "Pair", "args": [{ "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }], "annots": ["%burn"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }, { "prim": "Pair", "args": [{ "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }, { "int": "${tokenBalance}" }] }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;
};

export const burnRequest = (chainId, operationIndex, tokenAddress, destinationAddress, tokenBalance) => {
    const operation = composeBurnRequest(chainId, operationIndex, tokenAddress, destinationAddress, tokenBalance);
    return { operation, bytes: TezosMessageUtils.writePackedData(operation, "") };
};

const composeSetAdminRequest = (chainId, operationIndex, tokenAddress, destinationAddress) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, "chain_id").toString("hex");

    return `{ "prim": "Pair", "args": [{ "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "address" }], "annots": ["%setAdministrator"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;
};

export const setAdminRequest = (chainId, operationIndex, tokenAddress, destinationAddress) => {
    const operation = composeSetAdminRequest(chainId, operationIndex, tokenAddress, destinationAddress);
    return {
        operation,
        bytes: TezosMessageUtils.writePackedData(operation, ""),
    };
};

const composeKeyRotateRequest = (chainId, operationIndex, threshold, keys) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, "chain_id").toString("hex");

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, { "prim": "Pair", "args": [ { "int": "${threshold}" }, [ ${keys.map(k => `{ "bytes": "${TezosMessageUtils.writePublicKey(k)}" }`).join(', ')} ] ] } ] } ] }`;
};

export const keyRotateRequest = (chainId, operationIndex, threshold, keys) => {
    const operation = composeKeyRotateRequest(chainId, operationIndex, threshold, keys);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, "") };
};

const composeIndexedTransferRequest = (chainId, operationIndex, tokenAddress, tokenIndex, sourceAddress, destinationAddress, tokenBalance) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, 'chain_id').toString('hex');

    const transfer = `{ "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }, { "prim": "Pair", "args": [ { "int": "${tokenIndex}" }, { "int": "${tokenBalance}" } ] } ] }`;
    const transferList = `[ { "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(sourceAddress)}" }, [ ${transfer} ] ] } ]`;

    const definition = '{ "prim": "list", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "list", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "nat" }, { "prim": "nat" } ] } ] } ] } ] } ]}';

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" } ] }, { "prim": "CONTRACT", "args": [ ${definition} ], "annots": [ "%transfer" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "10" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ ${definition}, ${transferList} ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ]}`;
};

export const transferIndexedRequest = (chainId, operationIndex, tokenAddress, tokenIndex, sourceAddress, destinationAddress, tokenBalance) => {
    const operation = composeIndexedTransferRequest(chainId, operationIndex, tokenAddress, tokenIndex, sourceAddress, destinationAddress, tokenBalance);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, '') };
};

const composeIndexedMintRequest = (chainId, operationIndex, tokenAddress, tokenIndex, destinationAddress, tokenBalance) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, 'chain_id').toString('hex');

    const entrypointArgs = `{ "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }, { "prim": "Pair", "args": [ { "int": "${tokenIndex}" }, { "int": "${tokenBalance}" } ] } ] }`;
    const entrypointInterface = '{ "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "nat" }, { "prim": "nat" } ] } ] }'

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" } ] }, { "prim": "CONTRACT", "args": [ ${entrypointInterface} ], "annots": [ "%mint" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "10" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ ${entrypointInterface}, ${entrypointArgs} ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ]}`;
};

export const mintIndexedRequest = (chainId, operationIndex, tokenAddress, tokenIndex, destinationAddress, tokenBalance) => {
    const operation = composeIndexedMintRequest(chainId, operationIndex, tokenAddress, tokenIndex, destinationAddress, tokenBalance);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, '') };
};

const composeIndexedBurnRequest = (chainId, operationIndex, tokenAddress, tokenIndex, destinationAddress, tokenBalance) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, 'chain_id').toString('hex');

    const entrypointArgs = `{ "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" }, { "prim": "Pair", "args": [ { "int": "${tokenIndex}" }, { "int": "${tokenBalance}" } ] } ] }`;
    const entrypointInterface = '{ "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "nat" }, { "prim": "nat" } ] } ] }'

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(tokenAddress)}" } ] }, { "prim": "CONTRACT", "args": [ ${entrypointInterface} ], "annots": [ "%burn" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "10" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ ${entrypointInterface}, ${entrypointArgs} ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ]}`;
};

export const burnIndexedRequest = (chainId, operationIndex, tokenAddress, tokenIndex, destinationAddress, tokenBalance) => {
    const operation = composeIndexedBurnRequest(chainId, operationIndex, tokenAddress, tokenIndex, destinationAddress, tokenBalance);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, '') };
};

export function composeBalanceTransferRequest(chainId, operationIndex, multisigAddress, destinationAddress, amount) {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, 'chain_id').toString('hex');

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(multisigAddress)}" } ] }, { "prim": "CONTRACT", "args": [ { "prim": "pair", "args": [ { "prim": "mutez" }, { "prim": "address" } ] } ], "annots": [ "%transfer" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "3" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ { "prim": "pair", "args": [ { "prim": "mutez" }, { "prim": "address" } ] }, { "prim": "Pair", "args": [ { "int": "${amount}" }, { "bytes": "${TezosMessageUtils.writeAddress(destinationAddress)}" } ] } ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ]}`;
}

export function balanceTransferRequest(chainId, operationIndex, multisigAddress, destinationAddress, amount) {
    const operation = composeBalanceTransferRequest(chainId, operationIndex, multisigAddress, destinationAddress, amount);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, '') };
}

export const composeDelegateRequest = (chainId, operationIndex, multisigAddress, delegateAddress) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, 'chain_id').toString('hex');

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(multisigAddress)}" } ] }, { "prim": "CONTRACT", "args": [{ "prim": "option", "args": [ { "prim": "key_hash" } ] }], "annots": ["%delegate"] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "3" }] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [ { "prim": "option", "args": [ { "prim": "key_hash" } ] }, { "prim": "Some", "args": [{ "bytes": "${TezosMessageUtils.writeAddress(delegateAddress).slice(2)}" }]} ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ] }`;
};

export const delegateRequest = (chainId, operationIndex, multisigAddr, delegateAddress) => {
    const operation = composeDelegateRequest(chainId, operationIndex, multisigAddr, delegateAddress);

    return { operation, bytes: TezosMessageUtils.writePackedData(operation, '') };
};

export const submitMultisigOperation = async ({ client, account }, multisigAddress, signatures, operation, entrypoint = 'submit') => {
    const params = `{ "prim": "Pair", "args": [ [ ${signatures.map((s) => `{ "prim": "Elt", "args": [{ "string": "${s.address}" }, { "string": "${s.signature}" }] }`).join(", ")} ], ${operation} ] }`;

    const res = await interact({ client, account }, [
        {
            to: multisigAddress,
            amtInMuTez: 0,
            entrypoint,
            parameters: params,
        },
    ]);

    if (res.status !== "applied") {
        throw new Error("TEZOS TX FAILED");
    }

    return res;
};

export const executeMultisigOperation = async ({ client, account }, multisigAddress, id) => {
    const res = await interact({ client, account }, [ { to: multisigAddress, amtInMuTez: 0, entrypoint: "execute", parameters: `{"int": "${id}"}` } ]);

    if (res.status !== "applied") {
        throw new Error("TEZOS TX FAILED");
    }

    return res;
};

export const getChainID = async () => {
    return TezosNodeReader.getChainId(config.rpc);
};

export const interact = async ({ client, account }, operations, extraGas = 500, extraStorage = 50) => {
    let ops = [];
        operations.forEach((op) => {
            ops.push({
                kind: TezosOperationType.TRANSACTION,
                amount: op.amtInMuTez,
                destination: op.to,
                source: account,
                parameters: {
                    entrypoint: op.entrypoint,
                    value: JSON.parse(op.parameters),
                },
            });
        });

    try {
        let head = 0;
        try { head = (await TezosNodeReader.getBlockHead(config.rpc)).header.level; } catch { }

        const result = await client.requestOperation({ operationDetails: ops, });

        if (head > 0) {
            try {
                await TezosNodeReader.awaitOperationConfirmation(config.rpc, head, result["transactionHash"], 7);
            } catch { }
        }

        return result["transactionHash"];
    } catch (err) {
        console.err(`failed to submit operation: ${ops}`)
        console.error(err);
        throw err;
    }
};
