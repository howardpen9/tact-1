export class CompilerContext {

    readonly shared: { [key: symbol]: any } = {};

    constructor(args: { shared: { [key: symbol]: any } } = { shared: {} }) {
        this.shared = args.shared;
        Object.freeze(this.shared);
        Object.freeze(this);
    }

    addShared = <T>(store: symbol, key: string | number, value: T) => {
        let sh: { [key: string]: T } = {};
        if (this.shared[store]) {
            sh = { ...this.shared[store] };
        }
        sh[key] = value;
        return new CompilerContext({ shared: { ...this.shared, [store]: sh } });
    }
}

export function createContextStore<T>() {
    let symbol = Symbol();
    return {
        get(ctx: CompilerContext, key: string | number) {
            if (!ctx.shared[symbol]) {
                return null;
            }
            let m = ctx.shared[symbol] as { [key: string | number]: T };
            if (m[key]) {
                return m[key];
            } else {
                return null;
            }
        },
        all(ctx: CompilerContext): { [key: string | number]: T } {
            if (!ctx.shared[symbol]) {
                return {} as { [key: string | number]: T };
            }
            let m = ctx.shared[symbol] as { [key: string | number]: T };
            return m;
        },
        set(ctx: CompilerContext, key: string | number, v: T) {
            return ctx.addShared(symbol, key, v);
        }
    }
}