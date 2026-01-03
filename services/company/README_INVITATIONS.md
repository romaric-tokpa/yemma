# Système d'Invitation d'Équipe

## Vue d'ensemble

Le système d'invitation permet aux administrateurs d'entreprise (ROLE_COMPANY_ADMIN) d'inviter des recruteurs à rejoindre leur équipe. Les invitations utilisent un token unique et expirent après 7 jours.

## Modèle Invitation

Le modèle `Invitation` contient :
- `email` : Email du recruteur invité
- `token_unique` : Token unique généré pour l'invitation
- `company_id` : ID de l'entreprise
- `role` : Rôle assigné (RECRUTEUR par défaut)
- `status` : Statut (PENDING, ACCEPTED, EXPIRED, CANCELLED)
- `expires_at` : Date d'expiration (7 jours)
- `invited_by` : ID de l'utilisateur qui a envoyé l'invitation

## Endpoints

### POST /api/v1/invitations/invite

**Description** : Envoie une invitation à un recruteur

**Accès** : Uniquement `ROLE_COMPANY_ADMIN`

**Body** :
```json
{
  "email": "recruteur@example.com"
}
```

**Comportement** :
1. Vérifie que l'utilisateur a le rôle `ROLE_COMPANY_ADMIN`
2. Vérifie qu'il n'y a pas déjà une invitation active pour cet email
3. Génère un token unique
4. Crée l'invitation avec le rôle `RECRUTEUR`
5. Appelle le Service Notification pour envoyer l'email avec le lien magique

**Réponse** :
```json
{
  "id": 1,
  "company_id": 123,
  "email": "recruteur@example.com",
  "token": "unique_token_here",
  "role": "RECRUTEUR",
  "status": "pending",
  "expires_at": "2024-01-08T12:00:00Z",
  "invited_by": 456,
  "created_at": "2024-01-01T12:00:00Z",
  "accepted_at": null
}
```

### POST /api/v1/invitations/accept-invite

**Description** : Accepte une invitation et crée le compte recruteur

**Accès** : Public (token d'invitation suffit)

**Body** :
```json
{
  "token": "unique_token_here",
  "password": "motdepasse123",
  "first_name": "Marie",
  "last_name": "Martin"
}
```

**Comportement** :
1. Vérifie que le token est valide et non expiré
2. Si l'utilisateur n'existe pas dans auth-service :
   - Crée le compte avec le mot de passe fourni
   - Assigne le rôle `ROLE_RECRUITER`
3. Si l'utilisateur existe déjà, utilise son compte existant
4. Crée le `TeamMember` avec le rôle de l'invitation
5. Lie automatiquement à la `Company`
6. Marque l'invitation comme `ACCEPTED`

**Réponse** :
```json
{
  "message": "Invitation accepted successfully",
  "team_member_id": 789,
  "company_id": 123,
  "role": "RECRUTEUR",
  "user_id": 101
}
```

## Partage du Quota

**Important** : Tous les recruteurs d'une même entreprise partagent le même quota de vues de profils.

Le quota est géré par `company_id` dans le Payment Service :
- Le quota est lié à `subscription_id`
- La `Subscription` est liée à `company_id`
- Tous les recruteurs d'une même entreprise utilisent donc le même quota

**Exemple** :
- Entreprise A (company_id=1) a un quota de 10 vues/mois
- Recruteur 1 et Recruteur 2 sont membres de l'Entreprise A
- Si Recruteur 1 utilise 7 vues, il reste 3 vues pour Recruteur 2
- Le quota est partagé entre tous les recruteurs de l'entreprise

## Flux d'Invitation

```
1. Admin d'entreprise → POST /invite
   ↓
2. Génération du token unique
   ↓
3. Création de l'invitation en base
   ↓
4. Appel au Service Notification
   ↓
5. Email envoyé avec lien magique
   ↓
6. Recruteur clique sur le lien
   ↓
7. Frontend affiche le formulaire d'acceptation
   ↓
8. Recruteur → POST /accept-invite (avec token + mot de passe)
   ↓
9. Création du compte (si nécessaire) + TeamMember
   ↓
10. Invitation marquée comme ACCEPTED
```

## Sécurité

- Les tokens d'invitation sont uniques et sécurisés (32 caractères aléatoires)
- Les invitations expirent après 7 jours
- Seuls les `ROLE_COMPANY_ADMIN` peuvent envoyer des invitations
- Un utilisateur ne peut être membre que d'une seule entreprise à la fois

## Intégration avec Notification Service

L'endpoint `/invite` appelle automatiquement le Service Notification via :
```
POST /api/v1/triggers/notify_invitation
```

Avec les données :
- `recipient_email` : Email du recruteur
- `recipient_name` : Nom (par défaut depuis l'email)
- `company_name` : Nom de l'entreprise
- `invitation_token` : Token unique
- `invitation_url` : URL d'acceptation

## Exemple d'utilisation

### Inviter un recruteur

```python
# Depuis le frontend (Admin d'entreprise)
const response = await companyApi.inviteRecruiter({
  email: "recruteur@example.com"
});
```

### Accepter une invitation

```python
# Depuis le frontend (Recruteur invité)
const response = await companyApi.acceptInvitation({
  token: "unique_token_from_email",
  password: "securepassword123",
  first_name: "Marie",
  last_name: "Martin"
});
```

## Migration

Pour ajouter le champ `role` au modèle `Invitation`, exécutez :

```bash
cd services/company
alembic revision --autogenerate -m "Add role to Invitation"
alembic upgrade head
```

