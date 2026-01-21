# Wheely

### Frontend Angular

Lancer l'app : `cd front && ng serve`

### Backend Django

Lancer le serveur :

```
cd back
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt // python -m pip install -r requirements.txt
python manage.py runserver
```

Enregistrer les requirements : `pip freeze > requirements.txt`

Appliquer les modifications de modèles sur la BDD :
```
python manage.py makemigrations
python manage.py migrate
```