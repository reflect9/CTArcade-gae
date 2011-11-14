from google.appengine.ext import db
from django.utils import simplejson as json
import sys, datetime, time

class TournamentLog(db.Model):
    message = db.TextProperty()

class Game(db.Model):
    title = db.StringProperty()
  
class User(db.Model):
    id = db.StringProperty()
    password = db.StringProperty()
    email = db.StringProperty()
    score = db.IntegerProperty(indexed=False)
    
class Match(db.Model):
    user_a = db.StringProperty()
    user_b = db.StringProperty()
    game = db.StringProperty()
    result = db.TextProperty()
    
class AI(db.Model):  
    user = db.StringProperty()
    game = db.StringProperty()
    data = db.TextProperty()

class Strategy(db.Model):
    ''' individual strategy '''
    name = db.StringProperty()
    code = db.StringProperty()  # function name as well  
    description = db.StringProperty() # tooltip
    game = db.StringProperty()
    public = db.BooleanProperty(default=True)  # built-in heuristic rules are public




''' common datastore functions ''' 
SIMPLE_TYPES = (int, long, float, bool, dict, basestring, list)

def to_dict(model):
    output = {}
    for key, prop in model.properties().iteritems():
        value = getattr(model, key)
        if value is None or isinstance(value, SIMPLE_TYPES):
            output[key] = value
        elif isinstance(value, datetime.date):
            # Convert date/datetime to ms-since-epoch ("new Date()").
            ms = time.mktime(value.utctimetuple()) * 1000
            ms += getattr(value, 'microseconds', 0) / 1000
            output[key] = int(ms)
        elif isinstance(value, db.GeoPt):
            output[key] = {'lat': value.lat, 'lon': value.lon}
        elif isinstance(value, db.Model):
            output[key] = to_dict(value)
        else:
            raise ValueError('cannot encode ' + repr(prop))
    return output

def getPublicStrategy(game_title):
    allSt = db.GqlQuery("SELECT * FROM Strategy WHERE game=:1",game_title).fetch(1000)
    list = []
    for st in allSt:
        list.append(to_dict(st))
#    print >>sys.stderr, "getPublicStrategy with "+game_title
#    print >>sys.stderr, list
    return list
def getPublicStrategyDict(game_title):
    dict= {}
    list = getPublicStrategy(game_title);
    for st in list:
#        print >>sys.stderr,st
        dict[st['code']]=st
    return dict
def getUserStrategy(user_id,game_title):
#    userAI = db.GqlQuery("SELECT * FROM AI WHERE user=:1 AND game=:2",user_id,game_title).get()
    userAI = AI.get_by_key_name(user_id+"_"+game_title)
#    print >>sys.stderr, user_id+"_"+game_title
#    print >>sys.stderr, len(userAI)
    if userAI==None:
        return "no rule found for "+user_id + "'s game "+ game_title
#    print >>sys.stderr, userAI.user + userAI.data
    strr = json.loads(userAI.data)
#    print >>sys.stderr, strr
    return strr['data']

def setUserStrategy(user_id,game_title,codeList):
    userAI = db.GqlQuery("SELECT * FROM AI WHERE user=:1 AND game=:2",user_id,game_title).get()
    result = {"data": codeList};
    userAI.data = json.dumps(result)
    userAI.put()
 
''' when empty db is created, run this function to populate basic data set  '''    
def initSampleData():
    Game(title='tictactoe',key_name='tictactoe').put()

    Strategy(name='Win',code='takeWin',key_name='takeWin',description='Take a cell completing three of my stones in a row/column/diagonal',game='tictactoe').put()
    Strategy(name='Block Win',code='takeBlockWin',key_name='takeBlockWin',description='Take a cell of the opponent winning position',game='tictactoe').put()
    Strategy(name='Take Center',code='takeCenter',key_name='takeCenter',description='Take the center cell',game='tictactoe').put()
    Strategy(name='Take Any Corner',code='takeAnyCorner',key_name='takeAnyCorner',description='Take any corner',game='tictactoe').put()
    Strategy(name='Take Any Side',code='takeAnySide',key_name='takeAnySide',description='Take any non-corner cells on the side.',game='tictactoe').put()
    Strategy(name='Take Random',code='takeRandom',key_name='takeRandom',description='Take any empty cell.',game='tictactoe').put()
    Strategy(name='Take Opposite Corner',code='takeOppositeCorner',key_name='takeOppositeCorner',description='Take a corner cell if its opposite corner is occupied by another player',game='tictactoe').put()
    
    User(id='tak',password='tak',email='tak@umd.edu',key_name='tak').put()
    User(id='ben',password='ben',email='ben@umd.edu',key_name='ben').put()
      
    AI(user='tak',game='tictactoe',key_name='tak_tictactoe',data='{"data":["takeWin","takeRandom","takeAnySide"]}').put()
    AI(user='ben',game='tictactoe',key_name='ben_tictactoe',data='{"data":["takeWin","takeBlockWin","takeRandom"]}').put()