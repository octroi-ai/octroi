# Octroi — Plan & démarche (honnête, sans hype)

**Octroi = le plan de contrôle de l'IA d'une entreprise.** Tout le trafic IA passe par une porte qui le **mesure (FinOps)**, le **route** (multi-fournisseurs, résidence au choix, fallback), et le **met en conformité (EU AI Act)** — positionnement **souverain UE**.

> *« Le jour où un fournisseur te coupe l'accès, tu ne tombes pas. »*

---

## 1. Réalité du marché (sans bullshit)
- **Le cœur (gateway : router + cacher) est commoditisé.** LiteLLM (gratuit, open source), Cloudflare AI Gateway, Portkey, Helicone le font déjà. **Aucun moat** là-dessus.
- **Le seul angle défendable = gouvernance EU AI Act + souveraineté.** C'est ce que les outils US/gratuits ne traitent pas, et c'est **chronométré** (obligations haut-risque qui arrivent, 2026-2027).
- **Validation aujourd'hui = 0.** Aucun utilisateur réel, données de démo. La valeur "business" est à **prouver**, pas acquise.

## 2. Le wedge — qui paie, pour quoi
- **On RENTRE par l'argent** : FinOps (coût IA, ROI immédiat, POC auto-financé) → ouvre les portes vite, acheteur clair (platform-eng / DAF).
- **On RESTE par la conformité** : registre AI Act auto-alimenté + audit → le **moat**, la rétention, l'achat niveau board.
- **Cible** : PME/ETI **régulées en Europe** (banque, assurance, santé, secteur public, scale-ups IA EU).
  **PAS** les AI-natives US — elles prennent LiteLLM gratuit.

## 3. Démarche de validation — 2 SEMAINES, ZÉRO code
Le code n'est plus le goulot. La seule question : **est-ce que quelqu'un paie ?**

**Étape 1 (1 j) — verrouiller UN angle.** Accroche : *« Tu sais quels systèmes IA tournent dans ta boîte, et t'es prêt pour l'EU AI Act ? »*

**Étape 2 (sem. 1) — 10 à 15 conversations, SANS vendre.**
- Liste 30-40 personnes : DSI / responsable plateforme / CISO / DPO / responsable conformité d'entreprises EU.
- Message (une question, pas un pitch) :
  > « Je creuse comment les boîtes EU gèrent leur usage d'IA face à l'AI Act. 20 min pour me dire comment VOUS suivez quels outils IA sont utilisés, et qui porte la conformité ? Je ne vends rien, j'apprends. »
- La démo `octroi.netlify.app` = preuve si on te la demande, **pas** l'accroche.

**Étape 3 — lire le signal RÉEL :**
- ✅ ils dépensent déjà temps/gens là-dessus · quelqu'un a l'AI Act sur le dos · « c'est dispo quand / ça coûte combien » · ils te présentent au budget.
- ❌ « super intéressant, tiens-moi au courant » = **non poli**.

**Étape 4 (sem. 2) — arracher UN engagement :** un seul design-partner qui (a) paie un petit montant, **ou** (b) accepte un pilote avec ses vraies données, **ou** (c) signe une LOI. **Un suffit.**

## 4. Critères de décision (brutaux)
- **1+ acheteur qui tire** → tu tiens un fil. Tu construis le vrai moat **pour lui**.
- **Que du « intéressant » sans personne qui tire** → ré-aime l'angle une fois ; sinon **accepte que ce n'est pas un business** → super objet de portfolio, pas une boîte. Issue légitime.

## 5. Si ça valide — le moat à construire (pas avant)
- **Registre des systèmes IA auto-découvert** par le trafic (toujours à jour, vs les questionnaires manuels des concurrents GRC type Credo AI / OneTrust).
- **Doc Article 11 vivante** régénérée à chaque changement + **piste d'audit horodatée** + suivi des échéances.
- C'est **ça** qui crée la rétention. Pas le routage.

## 6. Risques (à regarder en face)
- **Commoditisation** : gratuit (LiteLLM) + les clouds ajoutent « région EU ».
- **Friction d'adoption** : « faire passer *tout* mon trafic IA par une startup ? » (latence, SPOF, données).
- **Crédibilité méthodo** : la conformité actuelle = decision-support par mots-clés, **pas certifiant** — un auditeur peut la refuser.
- **Souveraineté = positionnement, pas barrière** : un US peut monter une « entité + région EU ».

## 7. Modèle (esquisse)
- FinOps : % des économies, ou par volume/siège.
- Gouvernance : module premium (le moat, la marge).
- Enterprise : souverain / auto-hébergé EU, SLA.

## 8. Bottom line
Tu as un **actif réel** (produit déployé, multilingue, qui marche) et une **thèse correcte mais non prouvée**. Le code = ~3 mois gagnés, **pas un business**. 

**Prochaine étape : pas technique. 10 conversations.** Elles te diront si tu *dois* continuer.
