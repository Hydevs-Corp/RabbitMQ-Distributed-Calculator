# Calculatrice Distribuée avec RabbitMQ

Ce projet implémente un système de calculatrice distribuée à l'aide de RabbitMQ comme message broker. Le système peut effectuer des opérations mathématiques (addition, soustraction, multiplication et division) de manière asynchrone et distribuer la charge entre plusieurs workers.

<img src="https://github.com/Hydevs-Corp/RabbitMQ-Distributed-Calculator/blob/main/assets/demo.gif?raw=true" width="600" alt="Demo Terminals">

![Demo Front](https://github.com/Hydevs-Corp/RabbitMQ-Distributed-Calculator/blob/main/assets/demo_front.png?raw=true)

## Architecture

Le projet est organisé selon une architecture orientée messages avec les composants suivants:

-   **Workers** : Services qui écoutent les files de messages pour effectuer des opérations mathématiques spécifiques
-   **Producer** : Service qui génère des opérations aléatoires pour les workers
-   **Client interactif** : Interface de ligne de commande pour soumettre des calculs
-   **Serveur web** : API REST et interface utilisateur web pour soumettre des calculs
-   **RabbitMQ** : Broker de messages qui gère la communication entre les composants

![Mermaid Schema](https://github.com/Hydevs-Corp/RabbitMQ-Distributed-Calculator/blob/main/assets/mermaid_diagram.png?raw=true)

### Flux de messages

1. Un client (producer, interactive, ou web) envoie une opération à calculer
2. Le message est publié sur un exchange avec une routing key basée sur l'opération
3. Les workers abonnés à cette opération traitent le message
4. Le résultat est renvoyé à une file de résultats ou à une file spécifique au client

## Prérequis

-   Docker et Docker Compose
-   Node.js (>=20) pour le développement local
-   npm pour le développement local

## Installation

### Avec Docker (recommandé)

1. Cloner le dépôt

2. Créer un fichier `.env` à la racine du projet avec les variables suivantes :

```
RABBITMQ_USER=user
RABBITMQ_PASS=password
AMQP_URL=amqp://user:password@rabbitmq:5672
WEBSERVER_PORT=8025
```

3. Démarrer l'application complète avec Docker Compose :

```sh
docker compose up -d
```

Cette commande va:

-   Démarrer un conteneur RabbitMQ avec l'interface d'administration
-   Construire et démarrer le serveur web sur le port 8025
-   Construire et démarrer une flotte de workers

4. Accéder à l'application:
    - Interface Web: http://localhost:8025
    - Interface d'administration RabbitMQ: http://localhost:15672 (utilisateur et mot de passe définis dans .env)

### Développement local (sans Docker)

1. Démarrer RabbitMQ avec Docker :

```sh
docker compose up -d rabbitmq
```

2. Installer les dépendances Node.js :

```sh
npm install
```

## Utilisation

### Démarrer tous les composants

```sh
npm run start
```

> -   **Workers** : Services qui écoutent les files de messages pour effectuer des opérations mathématiques > spécifiques
> -   **Producer** : Service qui génère des opérations aléatoires pour les workers
> -   **Client Résultat** : Interface de ligne de commande pour soumettre des calculs

### Ou lancer chaques composants individuelement :

##### Démarrer une flotte de workers

```sh
npm run start:workers
```

##### Démarrer la file de résultats :

```sh
npm run start:results
```

##### Lancer le producteur de messages aléatoires

```sh
npm run start:producer
```

### Démarrer le serveur web

```sh
npm run start:webserver
```

Puis accédez à `http://localhost:8025` dans votre navigateur.

### Ou lancer le client interactif

```sh
npm run start:interactive
```

Puis entrez des opérations comme `10 + 5`, `20 * 3`, etc.

## Fonctionnement technique

-   Le système utilise des échanges directs dans RabbitMQ
-   Les opérations sont distribuées aux workers basés sur la routing key
-   Les messages sont persistants pour garantir leur traitement
-   Les workers simulent un temps de traitement aléatoire (5-15 secondes)
-   Les résultats sont renvoyés de manière asynchrone via des files de réponse dédiées

## Conteneurisation

Le projet est conteneurisé avec Docker pour faciliter le déploiement:

### Images Docker

-   `Dockerfile.webserver`: Image pour le serveur web

    -   Basée sur Node.js 22 Alpine
    -   Expose le port 8025
    -   Démarre le serveur web (server.js)

-   `Dockerfile.workers`: Image pour les workers
    -   Basée sur Node.js 22 Alpine
    -   Démarre une flotte de workers (start_workers.js)

### Services Docker Compose

-   **rabbitmq**: Broker de messages

    -   Ports: 5672 (AMQP), 15672 (Interface d'administration)
    -   Utilisateur/mot de passe configurables via variables d'environnement

-   **webserver**: Interface utilisateur et API REST

    -   Construit à partir de Dockerfile.webserver
    -   Port exposé: 8025
    -   Dépend du service rabbitmq
    -   Redémarrage automatique en cas de problème

-   **workers**: Flotte de workers pour traiter les calculs
    -   Construit à partir de Dockerfile.workers
    -   Dépend du service rabbitmq
    -   Redémarrage automatique en cas de problème

## Structure du projet

```
.
├── docker-compose.yml      # Configuration Docker Compose
├── Dockerfile.webserver    # Image Docker pour le serveur web
├── Dockerfile.workers      # Image Docker pour les workers
├── package.json            # Configuration du projet Node.js
├── public/                 # Fichiers statiques pour l'interface web
└── src/
    ├── interactive.js      # Client interactif en ligne de commande
    ├── producer.js         # Générateur d'opérations aléatoires
    ├── result_client.js    # Client pour recevoir les résultats
    ├── server.js           # Serveur web avec API REST
    ├── start_all.js        # Script pour démarrer tous les composants
    ├── start_workers.js    # Script pour démarrer une flotte de workers
    ├── utils/              # Utilitaires partagés
    │   ├── amqpUtils.js    # Fonctions utilitaires pour RabbitMQ
    │   ├── logger.js       # Utilitaires de journalisation
    │   └── runScript.js    # Utilitaire pour exécuter des scripts
    └── worker.js           # Implémentation du worker
```

## Arrêt

Pour arrêter RabbitMQ et les conteneurs Docker:

```sh
docker compose down
```

Pour supprimer également les volumes:

```sh
docker compose down -v
```

## Auteur

Repo créé pour le cours de RabbitMQ & KAFKA à EFREI Paris

-   Louis Réville
-   Sebastien Branly
-   Guillaume Maugin
