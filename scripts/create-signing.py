"""Create a permanent, locally backed up Android signing identity, never print secrets."""
import base64, datetime, hashlib, json, pathlib, secrets
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID

root=pathlib.Path(__file__).resolve().parents[1]
folder=root/'.release-private'
folder.mkdir(exist_ok=True)
secret_path=folder/'world-game-signing.json'
store_path=folder/'world-game-release.p12'
if secret_path.exists() or store_path.exists():
    raise SystemExit('Signing identity already exists. It must never be replaced for routine updates.')
if (root/'android/signing-certificate.sha256').exists():
    raise SystemExit('A permanent signing identity is already pinned. Restore the original private backup instead of generating a new key.')

alias='world-game'
password=secrets.token_urlsafe(36)
key=rsa.generate_private_key(public_exponent=65537,key_size=3072)
name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'World Game Journey')])
now=datetime.datetime.now(datetime.timezone.utc)
certificate=(x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
    .serial_number(x509.random_serial_number()).not_valid_before(now-datetime.timedelta(days=1))
    .not_valid_after(now+datetime.timedelta(days=365*35))
    .add_extension(x509.BasicConstraints(ca=False,path_length=None),critical=True)
    .add_extension(x509.KeyUsage(digital_signature=True,content_commitment=False,key_encipherment=False,
        data_encipherment=False,key_agreement=False,key_cert_sign=False,crl_sign=False,
        encipher_only=None,decipher_only=None),critical=True).sign(key,hashes.SHA256()))
data=pkcs12.serialize_key_and_certificates(alias.encode(),key,certificate,None,
    serialization.BestAvailableEncryption(password.encode()))
loaded=pkcs12.load_pkcs12(data,password.encode())
assert loaded.cert.friendly_name==alias.encode()
assert loaded.key.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)==key.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)
fingerprint=certificate.fingerprint(hashes.SHA256()).hex()
assert loaded.cert.certificate.fingerprint(hashes.SHA256()).hex()==fingerprint
bundle={'schemaVersion':1,'storeType':'PKCS12','alias':alias,'password':password,
    'keystoreBase64':base64.b64encode(data).decode(),'certificateSha256':fingerprint}
with store_path.open('xb') as output:output.write(data)
with secret_path.open('x',encoding='utf-8') as output:json.dump(bundle,output,separators=(',',':'))
(folder/'world-game-certificate.pem').write_bytes(certificate.public_bytes(serialization.Encoding.PEM))
(folder/'certificate-sha256.txt').write_text(fingerprint+'\n',encoding='ascii')
(folder/'BACKUP.txt').write_text('Keep this complete folder in a private backup (for example an external drive).\nNever upload it as source files or attach it to a GitHub Release.\nworld-game-signing.json is for the WORLD_GAME_SIGNING GitHub Actions secret only.\nDo not regenerate or change this identity when updating the game.\n',encoding='utf-8')
print('Permanent signing identity created and verified. Private files are in .release-private; excluded from Git.')
print('Public certificate SHA-256: '+fingerprint)
