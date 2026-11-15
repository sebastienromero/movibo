>
## template 1
 Dans `index.html`, transforme les liens de navigation en une grille de cases carrées : deux cases par ligne et, si leur nombre est impair, la dernière seule sur la dernière ligne. Fais en sorte que la grille soit facile à utiliser sur téléphone, sans débordement horizontal et avec des cases qui restent carrées. 

Suis copilit-instructions.md pour coder. Conserve les comportements actuels. Modifie uniquement ce qui est nécessaire et vérifie le résultat avec le test pertinent — ou, s’il n’y a pas de test adapté, indique comment tu l’as vérifié.
## balise texte html

Paragraphe : <p>Un paragraphe.</p>
Pour séparer deux idées, écris deux blocs <p>...</p>.
Saut de ligne simple : <br>
À utiliser ponctuellement, par exemple pour une adresse ou un poème. Pour des idées distinctes, préfère un nouveau paragraphe.
Liste à puces : entoure la liste avec <ul>, et chaque élément avec <li>.
Liste numérotée : utilise <ol> à la place de <ul>, avec les mêmes balises <li>.
Gras / importance : <strong>texte important</strong>.
Italique / emphase : <em>texte mis en relief</em>.
Citation en bloc : <blockquote><p>Une citation.</p></blockquote>.
Lien : <a href="https://exemple.com">texte du lien</a>.
## exemple article

<article class="article">
  <p class="article-date">Sábado 14 de noviembre de 2026</p>
  <h3>El derecho a la ciudad</h3>

  <p>La ciudad debe ser accesible y habitable para todas las personas.</p>

  <p>Esto incluye, por ejemplo, el derecho a:</p>
  <ul>
    <li>respirar un aire sano;</li>
    <li>acceder a parques y espacios verdes;</li>
    <li>desplazarse sin depender de un vehículo motorizado.</li>
  </ul>

  <p><strong>La movilidad también es una cuestión de justicia.</strong></p>

  <p><em>Una ciudad más justa se construye escuchando a quienes la habitan.</em></p>

  <blockquote>
    <p>“La ciudad es de quienes la viven.”</p>
  </blockquote>
</article>
## template 2

Contexte
- Projet / fonctionnalité : [quelques mots]
- Fichier(s) concerné(s), si je les connais : [chemins]
- Symptôme ou besoin : [ce qui se passe / ce que je veux obtenir]

Tâche
- [Explique / diagnostique / modifie] : [résultat concret attendu]

Contraintes
- Conserve : [comportements, liens, API, style…]
- Ne change pas : [éléments hors périmètre]
- Limite l’intervention à : [fichier(s) ou partie concernée, si pertinent]

Vérification
- Lance le contrôle pertinent le plus ciblé : [test, build, vérification manuelle…]
- Si aucun contrôle adapté n’existe, indique comment tu as vérifié.
- Signale clairement les échecs et les limites ; ne prétends pas qu’un contrôle a réussi s’il n’a pas été lancé.

Réponse attendue
- Résume brièvement ce qui a été fait ou trouvé.
- Mentionne les fichiers concernés et le résultat de la vérification.
- Si une information essentielle manque ou si plusieurs choix changent le résultat, demande-moi avant de trancher.