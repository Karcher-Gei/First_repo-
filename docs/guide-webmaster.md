# Guide du webmaster – karcher-gei.tn

Ce guide explique comment gérer le site sans écrire de code. Deux outils :

- **Le tableau de bord** (`/dashboard`) : produits, prix, promotions, stock, catégories, filtres, commandes,
  devis, messages.
- **Le CMS** (`/admin-cms`) : page d’accueil, pages de contenu (CGV, « Devenir revendeur »…), magasins, menus,
  balises SEO des pages fixes.

Toute modification enregistrée apparaît sur le site en quelques secondes.

## 1. Premiers pas

1. Connectez-vous au tableau de bord avec l’identifiant qui vous a été remis.
2. **Mettez l’interface en français, une seule fois** : cliquez sur votre nom en bas du menu, puis
   **Langue** → **Français**. Le choix est gardé pour les fois suivantes.
3. Le menu de gauche :
   - **Catalogue** : Produits, Collections (= catégories), Facettes (= caractéristiques), Ressources
     (= images), **Mise à jour CSV**.
   - **Ventes** : Commandes, **Devis**.
   - **Clients** : Clients, **Garanties**, **Messages**.

## 2. Les produits

### Créer un produit

**Catalogue → Produits → Créer**, puis :

1. **Nom** et **Description**. L’éditeur fonctionne comme Word : titres, gras, listes, liens, images et
   **tableaux** (bouton tableau de la barre d’outils, puis les icônes autour du tableau pour ajouter ou
   supprimer des lignes et des colonnes, ou faire une ligne d’en-tête).
2. **Ressources** (colonne de droite) : ajoutez les photos. Glissez-les pour changer l’ordre ; l’étoile choisit
   l’**image principale**. Dans chaque image, remplissez le **Texte alternatif** (ce qu’on voit sur la photo) :
   c’est utile pour Google.
3. **Catégories** (colonne de droite) : cochez les catégories du produit, puis **Enregistrer les catégories**.
4. **Valeurs de facette** : les caractéristiques (Type, Gamme, Marque…). Elles forment le tableau
   « Caractéristiques » de la fiche et les filtres des catégories.
5. Créez au moins une **variante** (une « version ») avec sa **référence (SKU)**, son **prix TTC** et son
   **stock**. Plusieurs versions (ex. Standard / Home) = plusieurs variantes.

L’adresse de la page (URL) est créée toute seule à l’enregistrement.

### Modifier, désactiver, supprimer

- Modifier : ouvrez le produit, changez, puis **Mettre à jour**.
- **Désactiver** (décocher **Activé**) : le produit disparaît du site mais reste dans le catalogue. C’est
  préférable à la suppression pour un produit temporairement indisponible.
- **Supprimer** : définitif. L’ancienne adresse de la page répondra « page introuvable ».

### Onglet SEO

**Balise titre** et **Méta description** : ce que Google affiche. Vides, le site utilise le nom et le début de la
description. **N’effacez pas l’« ID PrestaShop »** ni le **Slug de l’URL** : ils forment l’adresse de la page.

### Gamme professionnelle : « Prix sur devis »

Cochez **Prix sur devis (gamme professionnelle)** : le prix et le stock ne sont **jamais** montrés sur le site,
le produit ne peut pas être mis au panier et le client demande un devis. Vous continuez à voir et modifier le prix
dans le tableau de bord. Les produits de la catégorie « Professionnel » sont déjà cochés.

## 3. Prix et promotions

Sur la **variante** du produit :

- **Prix** : le prix de vente TTC.
- Onglet **Promotion** → **Prix barré TTC** : remplissez-le pour mettre le produit en promotion. Le prix
  ci-dessus devient le prix promo, celui-ci est affiché barré avec le pourcentage de remise. Videz-le pour
  arrêter la promotion.
- **Fin de la promotion** (facultatif) : à cette date, le prix barré redevient automatiquement le prix de vente.

Les produits en promotion apparaissent seuls sur la page **Promotions** du site.

## 4. Mise à jour en masse (fichier CSV / Excel)

Pour changer beaucoup de prix, de promotions ou de stocks d’un coup : **Catalogue → Mise à jour CSV**.

1. **Télécharger le catalogue** : un fichier avec une ligne par produit (ou par version).
2. Ouvrez-le dans **Excel**, faites vos changements, puis **Fichier → Enregistrer sous → CSV**
   (« CSV UTF-8 » ou « CSV (séparateur : point-virgule) », les deux fonctionnent).
3. **Envoyer un fichier CSV** : un **aperçu** montre chaque changement (ancienne valeur → nouvelle valeur) et
   chaque erreur. **Rien n’est modifié à ce stade.**
4. Si l’aperçu est bon, cliquez sur **Appliquer**. Les lignes en erreur sont ignorées : corrigez-les et renvoyez
   le fichier.

| Colonne          | Ce qu’elle fait                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Référence        | **Obligatoire**. Identifie la ligne, ne la modifiez pas.                                     |
| Produit, Version | Pour vous repérer seulement : ignorées à l’envoi.                                            |
| Prix TTC         | Le prix de vente, ex. `1311,125`.                                                            |
| Prix barré TTC   | Le prix avant promotion. **Vide = pas de promotion.**                                        |
| Remise %         | Facultatif : calcule le prix TTC à partir du prix barré, ex. `15` pour −15 %.                |
| Fin de promotion | Ex. `31/12/2026`. Vide = sans date de fin.                                                   |
| Stock            | La quantité en stock (nombre entier).                                                        |
| Sur devis        | `oui` / `non`.                                                                               |
| Actif            | `oui` / `non` (`non` = caché du site).                                                       |
| Catégories       | Les numéros des catégories séparés par `\|`, ex. `12 \| 14`. Le nom qui suit sert de repère. |

Astuces :

- Vous pouvez **supprimer les colonnes et les lignes** que vous ne changez pas, sauf « Référence » : une colonne
  absente n’est pas touchée. Un fichier avec seulement `Référence;Stock` met à jour les stocks.
- **Promotion de −20 % sur une liste** : gardez « Référence », « Prix barré TTC » (le prix actuel) et « Remise % »
  (`20`), et éventuellement « Fin de promotion ».
- **Arrêter des promotions** : videz « Prix barré TTC » sur ces lignes.

## 5. Les catégories

**Catalogue → Collections**. Les catégories reprennent l’arbre de PrestaShop (Maison et jardin, Professionnel…).

- **Créer** une catégorie : **Créer**, nom, description, image (Ressources), et sa catégorie parente. Elle reçoit
  son adresse automatiquement. Ajoutez-y des produits depuis la fiche de chaque produit (bloc **Catégories**) ou
  par le fichier CSV (colonne « Catégories »).
- **Image de la catégorie** : bloc Ressources. Elle s’affiche en tête de la page et dans le menu.
- **Onglet SEO** : **Nom dans le menu** (court, ex. « HOME & GARDEN », vide = le nom de la catégorie) et
  **Cacher du menu** (la page reste accessible par son adresse). Ne changez pas le **Slug de l’URL** d’une
  catégorie importée : c’est l’adresse que Google connaît.
- **Filtres affichés** (onglet **Filtres**) : cochez les caractéristiques proposées comme filtres sur la page de
  la catégorie (ex. Type et Gamme). Aucune cochée : toutes celles de ses produits.
- « Promotions » est automatique : tous les produits avec un prix barré. « Coup de cœur » et « Bestsellers » sont
  des **sélections** cachées du menu ; « Coup de cœur » (page d’accueil) se gère comme une catégorie, par le bloc
  Catégories du produit.

## 6. Les caractéristiques (filtres)

**Catalogue → Facettes**. Une facette (ex. « Type ») a des valeurs (« Aspirateur », « Nettoyeur haute
pression »…).

- Nouvelle caractéristique : **Créer** une facette, puis ajoutez ses valeurs.
- Ensuite, sur chaque produit : **Valeurs de facette** → choisissez la valeur.
- La facette **Marque** liste les marques ; chacune a sa page (ex. `/brand/2-karcher`).

## 7. Page d’accueil et contenus (CMS)

Dans **`/admin-cms`** :

- **Homepage** : une liste de **blocs** (bannière Kärcher, univers maison / pro, slider, carrousels de produits,
  catégories, bandeau devis, services, garantie). Glissez pour réordonner, ajoutez ou supprimez des blocs.
  Un **carrousel** montre une collection (ex. `promotions`, `coup-de-coeur`), les meilleures ventes ou les
  nouveautés.
- **Pages** : les pages de contenu, avec le même type d’éditeur.
- **Pages fixes (SEO)** : balise titre et description de Promotions, Nous contacter, Magasins…
- **Navigation** : liens du haut de page et colonnes du pied de page.
- **Stores** : les magasins (adresse, horaires, téléphone).

## 8. Devis, messages, garanties

- **Ventes → Devis** : les demandes de devis. Ouvrez-en une, changez son **statut**, répondez par e-mail.
- **Clients → Messages** : formulaires de contact, revendeur et SAV. Marquez-les « Traité ».
- **Clients → Garanties** : les machines enregistrées par les clients.

Chaque nouvelle commande payée, demande de devis ou message arrive aussi par e-mail à l’adresse commerciale.

## 9. À ne pas faire

- Ne videz pas l’**ID PrestaShop** (onglet SEO) d’un produit ou d’une catégorie : l’adresse de la page en dépend.
- Ne renommez pas les **slugs** `promotions` et `coup-de-coeur` des deux sélections.
- Pour retirer un produit du site, préférez **décocher Activé** plutôt que supprimer.
