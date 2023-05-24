# Polygon ID Issuer Node for Udoc claims

This is a Polygon ID issuer node for issuing claims to users. It allows users to use the API endpoints available through an ngrok tunnel to generate claims.
---

## Prerequisites

In order to deploy this issuer node you will need the following

1. ngrok
2. [Docker Engine](https://docs.docker.com/engine/) `1.27+`
3. Makefile toolchain `GNU Make 3.81`
4. Unix based OS
> **NOTE:** There is no compatibility with Windows environments at this time.

### Initialization of the issuer node

1. Get a public ip address to serve your issuer node

```bash
# FROM: another terminal

ngrok 3001

# Expected Output/Prompt:
#   ngrok                                                           (Ctrl+C to quit)
                                                                                
#  Announcing ngrok-go: The ngrok agent as a Go library: https://ngrok.com/go      
                                                                                
#  Session Status                online                                            
#  Account                       <Your account> (Plan: Free)                   
#  Update                        update available (version 3.3.0, Ctrl-U to update)
#  Version                       3.2.2                                             
#  Region                        United States (us)                                
#  Latency                       103ms                                             
#  Web Interface                 http://127.0.0.1:4040                             
#  Forwarding                    ttps://unique-forwaring-or-public-url.ngrok-free.app -> http
 
```

2. Make a copy of the following environment variables files:

```bash
# FROM: ./

cp .env-api.sample .env-api;
cp .env-issuer.sample .env-issuer;
# (Optional - For issuer UI)
cp .env-ui.sample .env-ui;
```

3. Get a RPC provider:
Any of the following RPC providers can be used:

- [Chainstack](https://chainstack.com/)
- [Ankr](https://ankr.com/)
- [QuickNode](https://quicknode.com/)
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://www.infura.io/)

4. Get your metamask private key:
Login to your metamask account and export your private key
![Screen Shot 2023-05-24 at 12 00 10 PM](https://github.com/uniandes-bancolombia-dapp-project/issuer-node-docs-dapp/assets/69653044/504ff08b-5311-484c-ba87-fe174fa6b43b)
![Screen Shot 2023-05-24 at 12 00 21 PM](https://github.com/uniandes-bancolombia-dapp-project/issuer-node-docs-dapp/assets/69653044/99c82b3f-3946-482c-a9d9-ca499a79e97f)
![Screen Shot 2023-05-24 at 12 00 27 PM](https://github.com/uniandes-bancolombia-dapp-project/issuer-node-docs-dapp/assets/69653044/6d2f0933-f19b-48a5-9652-33064540d488)
![Screen Shot 2023-05-24 at 12 00 32 PM](https://github.com/uniandes-bancolombia-dapp-project/issuer-node-docs-dapp/assets/69653044/2205a74d-782c-4a49-aaa1-019b76249357)
![Screen Shot 2023-05-24 at 12 00 50 PM](https://github.com/uniandes-bancolombia-dapp-project/issuer-node-docs-dapp/assets/69653044/dd528d29-e070-42a6-8c76-d6d2ed016805)

#### Node Issuer Configuration
5. Configure `.env-issuer` with the following details (or amend as desired).

```bash
# ...

# See Section: Getting A Public URL
ISSUER_SERVER_URL=<https://unique-forwaring-or-public-url.ngrok-free.app>
# Defaults for Basic Auth in Base64 ("user-issuer:password-issuer" = "dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy")
# If you just want to get started, don't change these
ISSUER_API_AUTH_USER=user-issuer
ISSUER_API_AUTH_PASSWORD=password-issuer
# !!!MUST BE SET or other steps will not work
ISSUER_ETHEREUM_URL=<YOUR_RPC_PROVIDER_URI_ENDPOINT>
```
#### Start Redis Postgres & Vault

6. This will start the necessary local services needed to store the wallet private key to the Hashicorp vault and allow storing data associated to the issuer.

```bash
# FROM: ./

make up;

# Expected Output:
#   docker compose -p issuer -f /Users/username/path/to/sh-id-platform/infrastructure/local/docker-compose-infra.yml up -d redis postgres vault
#   [+] Running 4/4
#   ⠿ Network issuer-network       Created                                                                                   0.0s
#   ⠿ Container issuer-vault-1     Started                                                                                   0.5s
#   ⠿ Container issuer-redis-1     Started                                                                                   0.4s
#   ⠿ Container issuer-postgres-1  Started  
```
#### Import Wallet Private Key To Vault

7. In order to secure the wallet private key so that the issuer can use it to issue credentials, it must be stored in the Hashicorp Vault.

> **NOTE:** Make sure the wallet that is provided has Testnet Matic to be able to send transactions.

```bash
# FROM: ./

# Make sure to verify that the issuer-vault-1 is full initialized to avoid: "Error writing data to iden3/import/pbkey: Error making API request."
make private_key=<YOUR_WALLET_PRIVATE_KEY> add-private-key;
# Expected Output:
#   docker exec issuer-vault-1 \
#           vault write iden3/import/pbkey key_type=ethereum private_key=<YOUR_WALLET_PRIVATE_KEY>
#   Success! Data written to: iden3/import/pbkey
```

#### Add Vault To Configuration File

8. This will get the vault token from the Hashicorp vault docker instance and add it to our `./env-issuer` file.

```bash
# FROM: ./

make add-vault-token;
# (Equivalent)
#   TOKEN=$(docker logs issuer-vault-1 2>&1 | grep " .hvs" | awk  '{print $2}' | tail -1);
# sed '/ISSUER_KEY_STORE_TOKEN/d' .env-issuer > .env-issuer.tmp;
# echo ISSUER_KEY_STORE_TOKEN=$TOKEN >> .env-issuer.tmp;
# mv .env-issuer.tmp .env-issuer;

# Expected Output:
#   sed '/ISSUER_KEY_STORE_TOKEN/d' .env-issuer > .env-issuer.tmp
#   mv .env-issuer.tmp .env-issuer
```

#### Start Issuer API

Now that the issuer API is configured, it can be started.

**For _NON-Apple-M1/M2/Arm_ (ex: Intel/AMD):**

```bash
# FROM: ./

make run;
# (Equivalent)
#   COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_FILE="Dockerfile" docker compose -p issuer -f /Users/username/path/to/sh-id-platform/infrastructure/local/docker-compose.yml up -d api;

# Expected Output:
#   COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_FILE="Dockerfile" docker compose -p issuer -f /Users/username/path/to/sh-id-platform/local/docker-compose.yml up -d api;
```

**For _Apple-M1/M2/Arm_:**

```bash
# FROM: ./

make run-arm;
# (Equivalent)
#   COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_FILE="Dockerfile-arm" docker compose -p issuer -f /Users/username/path/to/sh-id-platform/infrastructure/local/docker-compose.yml up -d api;

# Expected Output:
#   COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_FILE="Dockerfile-arm" docker compose -p issuer -f /Users/username/path/to/sh-id-platform/local/docker-compose.yml up -d api;
#   WARN[0000] Found orphan containers ([issuer-vault-1 issuer-postgres-1 issuer-redis-1]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up. 
```

Navigating to <http://localhost:3001> shows te issuer API's frontend:

![Issuer API frontend](docs/assets/img/3001.png)



(Optional) To remove all services, run the following (ignore the warnings):

```bash
# FROM: ./

make down; 
# (Equivalent)
#   docker compose -p issuer -f ./infrastructure/local/docker-compose-infra.yml down --remove-orphans -v;

# Expected Output:
#   docker compose -p issuer -f /Users/username/path/to/sh-id-platform/infrastructure/local/docker-compose-infra.yml down --remove-orphans
#   [+] Running 4/3
#   ⠿ Container issuer-postgres-1  Removed                                                                                   0.2s
#   ⠿ Container issuer-redis-1     Removed                                                                                   0.2s
#   ⠿ Container issuer-vault-1     Removed                                                                                   0.2s
#   ⠿ Network issuer-network       Removed                                                                                   0.0s
#   docker compose -p issuer -f /Users/username/path/to/sh-id-platform/infrastructure/local/docker-compose.yml down --remove-orphans
#   WARN[0000] The "DOCKER_FILE" variable is not set. Defaulting to a blank string. 
#   WARN[0000] The "DOCKER_FILE" variable is not set. Defaulting to a blank string. 
#   WARN[0000] The "DOCKER_FILE" variable is not set. Defaulting to a blank string. 
#   WARN[0000] The "DOCKER_FILE" variable is not set. Defaulting to a blank string.
```
