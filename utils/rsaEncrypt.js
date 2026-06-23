import forge from 'node-forge';

// RSA-2048 public key from climbing.ge backend (storage/framework/private.key counterpart)
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuydxIbJIeJhsmra7QKZa
eXo12J/17Q5Yah+K0hFP7BWvvnDZ1D3IZ0GvIh2PhZLvBc/wzXMK3gyH3qUCuqmh
rG9+4pg2OMFtD9fbNhFP2cIEL+B4qIFVh589JLBs6uduHHloofKElIzBlN7sxHfF
R1fNag6AbqDJfB/aXW0XpK8oABDblGO44/m64Kh6OpWvolxEfC+Mnhs+SXIdj3rn
R39id5+axL6sdWnXpW5uMRqy633JuKiGamvVkEk+BzzWqMMVoGLvKRJR67w52DG9
jfcB6GWPL237h6UE9vcCGfIdHOk9l3nErU5N9s8Q1taebwsMDgLe2FrOtM+FmkfH
2wIDAQAB
-----END PUBLIC KEY-----`;

let _publicKey = null;

function getPublicKey() {
  if (!_publicKey) {
    _publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
  }
  return _publicKey;
}

export function encryptPassword(plaintext) {
  const publicKey = getPublicKey();
  const encrypted = publicKey.encrypt(plaintext, 'RSAES-PKCS1-V1_5');
  return forge.util.encode64(encrypted);
}
