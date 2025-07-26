# 📱 Guide de Test depuis votre Téléphone

Ce guide vous explique comment tester l'application Arcadis Fit depuis votre téléphone sur un agent cloud.

## 🚀 Démarrage Rapide

### 1. Préparer l'Agent Cloud

```bash
# Dans votre agent cloud, exécutez :
./test-app.sh
```

Choisissez l'option **6** pour un test complet automatique.

### 2. Configurer les Ports

**Important :** Vous devez ouvrir les ports sur votre agent cloud :

#### AWS EC2
```bash
# Ajouter une règle de sécurité pour le port 3000
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

#### Google Cloud
```bash
# Créer une règle de pare-feu
gcloud compute firewall-rules create arcadis-fit-api \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Arcadis Fit API"
```

#### Azure
```bash
# Configurer le groupe de sécurité réseau
az network nsg rule create \
  --resource-group myResourceGroup \
  --nsg-name myNetworkSecurityGroup \
  --name arcadis-fit-api \
  --protocol tcp \
  --priority 1000 \
  --destination-port-range 3000
```

### 3. Obtenir l'IP Publique

```bash
# Obtenir l'IP publique de votre agent
curl ifconfig.me
```

## 📱 Test depuis votre Téléphone

### Test 1 : Vérifier que l'API fonctionne

Ouvrez votre navigateur mobile et allez à :
```
http://VOTRE_IP_PUBLIQUE:3000/health
```

Vous devriez voir :
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Test 2 : Documentation API

Visitez la documentation Swagger :
```
http://VOTRE_IP_PUBLIQUE:3000/api-docs
```

### Test 3 : Test d'Inscription

Utilisez une app comme **Postman** ou **Insomnia** sur votre téléphone :

**POST** `http://VOTRE_IP_PUBLIQUE:3000/api/auth/register`

**Headers :**
```
Content-Type: application/json
```

**Body :**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User",
  "phoneNumber": "+221123456789",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

### Test 4 : Service AI Nutrition

Testez le service AI :
```
http://VOTRE_IP_PUBLIQUE:8001/health
```

## 🔧 Applications Mobiles de Test

### Pour iOS
1. **Postman** - Test d'API
2. **Insomnia** - Alternative à Postman
3. **Working Copy** - Pour voir le code

### Pour Android
1. **Postman** - Test d'API
2. **API Tester** - Test d'API simple
3. **Termux** - Terminal pour tests avancés

## 📋 Checklist de Test

- [ ] L'agent cloud est démarré
- [ ] Les ports 3000 et 8001 sont ouverts
- [ ] L'API répond sur `/health`
- [ ] La documentation Swagger est accessible
- [ ] L'inscription d'utilisateur fonctionne
- [ ] Le service AI répond

## 🐛 Dépannage

### L'API ne répond pas
```bash
# Vérifier que le serveur tourne
ps aux | grep node

# Vérifier les logs
tail -f backend/logs/app.log

# Redémarrer le serveur
cd backend && npm run dev
```

### Port fermé
```bash
# Vérifier les ports ouverts
netstat -tlnp | grep :3000

# Vérifier le pare-feu
sudo ufw status
```

### Erreur de connexion
```bash
# Tester la connectivité
curl -v http://localhost:3000/health

# Vérifier l'IP publique
curl ifconfig.me
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** dans `backend/logs/`
2. **Testez localement** d'abord
3. **Vérifiez la configuration** dans `.env`
4. **Consultez la documentation** dans `docs/`

## 🎯 Prochaines Étapes

Une fois les tests de base réussis :

1. **Configurer Supabase** pour la base de données
2. **Intégrer Twilio** pour les SMS
3. **Configurer DEXCHANGE** pour les paiements
4. **Déployer les apps mobiles** (iOS/Android)
5. **Mettre en production** avec un domaine

---

**Note :** Ce guide est pour les tests de développement. Pour la production, configurez HTTPS, des clés d'API sécurisées et un domaine personnalisé.