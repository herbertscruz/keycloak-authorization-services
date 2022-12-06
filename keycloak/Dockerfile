FROM quay.io/keycloak/keycloak:20.0.1

# Import the realm settings
COPY /keycloak/main-realm.json /opt/keycloak/data/import/

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm"]