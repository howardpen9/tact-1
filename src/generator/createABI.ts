import { ABIGetter, ABIReceiver, ABIType, ContractABI } from "ton-core";
import { contractErrors } from "../abi/errors";
import { CompilerContext } from "../context";
import { getSupportedIntefaces } from "../types/getSupportedInterfaces";
import { createABITypeRefFromTypeRef } from "../types/resolveABITypeRef";
import { getAllTypes } from "../types/resolveDescriptors";
import { getAllErrors } from "../types/resolveStrings";

export function createABI(ctx: CompilerContext, name: string): ContractABI {

    let allTypes = Object.values(getAllTypes(ctx));

    // Contract
    let contract = allTypes.find((v) => v.name === name)!;
    if (!contract) {
        throw Error(`Contract ${name} not found`);
    }
    if (contract.kind !== 'contract') {
        throw Error('Not a contract');
    }

    // Structs
    let types: ABIType[] = [];
    for (let t of allTypes) {
        if (t.kind === 'struct') {
            types.push({
                name: t.name,
                header: t.header,
                fields: t.fields.map((v) => v.abi)
            });
        }
    }

    // // Receivers
    let receivers: ABIReceiver[] = [];
    for (let r of Object.values(contract.receivers)) {
        if (r.selector.kind === 'internal-binary') {
            receivers.push({
                receiver: 'internal',
                message: {
                    kind: 'typed',
                    type: r.selector.type
                }
            });
        } else if (r.selector.kind === 'internal-empty') {
            receivers.push({
                receiver: 'internal',
                message: {
                    kind: 'empty'
                }
            });
        } else if (r.selector.kind === 'internal-comment') {
            receivers.push({
                receiver: 'internal',
                message: {
                    kind: 'text',
                    text: r.selector.comment
                }
            });
        } else if (r.selector.kind === 'internal-comment-fallback') {
            receivers.push({
                receiver: 'internal',
                message: {
                    kind: 'text'
                }
            });
        } else if (r.selector.kind === 'internal-fallback') {
            receivers.push({
                receiver: 'internal',
                message: {
                    kind: 'any'
                }
            });
        }
    }

    // Getters
    let getters: ABIGetter[] = [];
    for (let f of contract.functions.values()) {
        if (f.isGetter) {
            getters.push({
                name: f.name,
                arguments: f.args.map((v) => ({ name: v.name, type: createABITypeRefFromTypeRef(v.type) })),
                returnType: f.returns.kind !== 'void' ? createABITypeRefFromTypeRef(f.returns) : null
            });
        }
    }

    // Errors
    let errors: { [key: string]: { message: string } } = {};
    errors['2'] = { message: 'Stack undeflow' };
    errors['3'] = { message: 'Stack overflow' };
    errors['4'] = { message: 'Integer overflow' };
    errors['5'] = { message: 'Integer out of expected range' };
    errors['6'] = { message: 'Invalid opcode' };
    errors['7'] = { message: 'Type check error' };
    errors['8'] = { message: 'Cell overflow' };
    errors['9'] = { message: 'Cell underflow' };
    errors['10'] = { message: 'Dictionary error' };
    errors['13'] = { message: 'Out of gas error' };
    errors['32'] = { message: 'Method ID not found' };
    errors['34'] = { message: 'Action is invalid or not supported' };
    errors['37'] = { message: 'Not enough TON' };
    errors['38'] = { message: 'Not enough extra-currencies' };
    for (let e of Object.values(contractErrors)) {
        errors[e.id] = { message: e.message };
    }
    let codeErrors = getAllErrors(ctx);
    for (let c of codeErrors) {
        errors[c.id + ''] = { message: c.value };
    }

    // Interfaces
    let interfaces = ['org.ton.introspection.v0', ...getSupportedIntefaces(contract, ctx)];

    return {
        name: contract.name,
        types,
        receivers,
        getters,
        errors,
        interfaces
    } as any;
}