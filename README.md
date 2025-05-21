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

### Flux de messages

1. Un client (producer, interactive, ou web) envoie une opération à calculer
2. Le message est publié sur un exchange avec une routing key basée sur l'opération
3. Les workers abonnés à cette opération traitent le message
4. Le résultat est renvoyé à une file de résultats ou à une file spécifique au client

## Prérequis

-   Docker et Docker Compose
-   Node.js (>=14)
-   npm

## Installation

1. Cloner le dépôt

2. Démarrer RabbitMQ avec Docker:

```sh
docker-compose up -d
```

3. Installer les dépendances Node.js:

```sh
npm install
```

## Utilisation

### Démarrer tous les composants

```sh
npm run start:all
```

### Démarrer une flotte de workers

```sh
npm run start:workers
```

### Lancer le client interactif

```sh
npm run interactive
```

Puis entrez des opérations comme `10 + 5`, `20 * 3`, etc.

### Démarrer le serveur web

```sh
npm run server
```

Puis accédez à `http://localhost:8025` dans votre navigateur.

### Lancer le producteur de messages aléatoires

```sh
npm run producer
```

### Démarrer un worker spécifique

```sh
npm run worker [ID] [OPERATION]
```

Où:

-   `ID` est un identifiant pour le worker (par défaut: 1)
-   `OPERATION` est l'une des opérations suivantes: add, sub, mul, div (par défaut: add)

Exemple:

```sh
npm run worker 2 mul
```

## Fonctionnement technique

-   Le système utilise des échanges directs dans RabbitMQ
-   Les opérations sont distribuées aux workers basés sur la routing key
-   Les messages sont persistants pour garantir leur traitement
-   Les workers simulent un temps de traitement aléatoire (5-6 secondes)
-   Les résultats sont renvoyés de manière asynchrone via des files de réponse dédiées

## Conteneurisation

Le projet peut être déployé avec Docker à l'aide des Dockerfiles fournis:

-   `Dockerfile.webserver` pour le serveur web
-   `Dockerfile.workers` pour les workers

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
docker-compose down
```

## Auteur

Repo créé pour le cours de RabbitMQ & KAFKA à EFREI Paris

-   Louis Réville
-   Sebastien Branly
-   Guillaume Maugin
