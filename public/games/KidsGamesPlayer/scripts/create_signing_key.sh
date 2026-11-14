#!/usr/bin/env bash
# Creates the release key ONCE in .local-signing/ (never overwrites; never prints the password).
source "$(dirname "$0")/common.sh"
DIR="$ROOT/.local-signing"; STORE="$DIR/kidsgamesplayer-release.p12"; PROPS="$DIR/keystore.properties"
if [ -e "$STORE" ] || [ -e "$PROPS" ]; then echo "Signing key already exists in $DIR - nothing changed."; exit 0; fi
JH="$(find_java_home)"
umask 077; mkdir -p "$DIR"; chmod 700 "$DIR"
KGP_STOREPASS="$(head -c 24 /dev/urandom | base64 | tr -d '/+=' )"; export KGP_STOREPASS
"$JH/bin/keytool" -genkeypair -storetype PKCS12 -keystore "$STORE" -alias kgp-release -keyalg RSA -keysize 4096 \
  -validity 10000 -dname "CN=Kids Games Player, OU=Family, O=Family, C=VN" \
  -storepass:env KGP_STOREPASS -keypass:env KGP_STOREPASS >/dev/null 2>&1
printf '# Release signing secrets. Keep private. Never commit or zip. See docs/SIGNING.md\nstoreFile=kidsgamesplayer-release.p12\nstorePassword=%s\nkeyAlias=kgp-release\nkeyPassword=%s\n' "$KGP_STOREPASS" "$KGP_STOREPASS" > "$PROPS"
chmod 600 "$PROPS" "$STORE"; unset KGP_STOREPASS
echo "Created release key in $DIR"
