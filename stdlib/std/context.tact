struct Context {
    bounced: Bool;
    sender: Address;
    value: Int;
    raw: Slice;
}

@name(__tact_context_get)
native context(): Context;

@name(__tact_context_get_sender)
native sender(): Address;

extends fun readForwardFee(self: Context): Int {
    let sc: Slice = self.raw;
    sc.loadCoins(); // Skip value
    sc.skipBits(1); // Skip extracurrency collection
    sc.loadCoins(); // Skip ihr_fee
    return (sc.loadCoins() * 3) / 2;
}