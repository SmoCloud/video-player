import { createHash } from 'crypto';

export function hashMake(pa) {
    // console.log(crypto);
    const hash = createHash("sha256");
    hash.update(pa, "utf-8");
    var en_pa = hash.digest("hex");
    return en_pa;
}

export default function hashCheck(p1, p2) {
    if (hashMake(p1) == p2) {
        return true;
    }
    else {
        return false;
    }
}