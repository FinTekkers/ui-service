
function uuidStrToSigBits(uuid) {
    const invalidError = () => new Error(`Invalid UUID string: '${uuid}'`);
    if (uuid == null || typeof uuid !== "string") throw invalidError();
  
    const parts = uuid.split("-").map((p) => `0x${p}`);
    if (parts.length !== 5) throw invalidError();
  
    return {
      lsb: (hexStrToBigInt(parts[3]) << 48n) | hexStrToBigInt(parts[4]),
      msb:
        (hexStrToBigInt(parts[0]) << 32n) |
        (hexStrToBigInt(parts[1]) << 16n) |
        hexStrToBigInt(parts[2]),
    };
  }
  
  function hexStrToBigInt(hex): bigint {
    return BigInt(Number.parseInt(hex, 16));
  }