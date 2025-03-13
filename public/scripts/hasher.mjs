import { createHash } from "crypto";

function hashMake(pa) {
    const hash = createHash("sha256");
    hash.update(pa, "utf-8");
    var en_pa = hash.digest("hex");
    return en_pa;
}

function hashCheck(p1, p2) {
    if (hashMake(p1) == p2) {
        return true;
    }
    else {
        return false;
    }
}

export { hashMake, hashCheck };