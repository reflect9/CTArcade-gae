from google.appengine.ext import db


class Game(db.Model):
    title = db.StringProperty()
    
class User(db.Model):
    uid = db.StringProperty()
    email= db.StringProperty()
    password = db.StringProperty()

class Match(db.Model):
    playerA = db.ReferenceProperty(User, collection_name='playerA')
    playerB = db.ReferenceProperty(User, collection_name='playerB')
    game = db.ReferenceProperty()
    result = db.TextProperty()
    
class Rule(db.Model):
    player = db.ReferenceProperty(User)
    game = db.ReferenceProperty(Game)
    data = db.TextProperty()
