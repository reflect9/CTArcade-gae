from google.appengine.ext import db
from django.utils import simplejson as json
import sys, datetime, time
import TicTacToe

class TournamentWinners(db.Model):
    timestamp = db.DateTimeProperty(auto_now_add=True)
    winner = db.StringProperty()

class Game(db.Model):
    title = db.StringProperty()
  
class User(db.Model):
    id = db.StringProperty()
    password = db.StringProperty()
    email = db.StringProperty()
    score = db.IntegerProperty(indexed=True)
    
class Match(db.Model):
    user_a = db.StringProperty()
    user_b = db.StringProperty()
    game = db.StringProperty()
    result = db.TextProperty()
    
class AI(db.Model):  
    user = db.StringProperty()
    game = db.StringProperty()
    data = db.ListProperty(db.Key)
    def getRules(self):
        rules = []
        for ruleKey in self.data:
            rules.append(Rule.get(ruleKey))
        return rules
    def addRule(self,newRuleKey):
        if newRuleKey in self.data:
            return False
        else:
            self.data.append(newRuleKey)
            self.put()
            return True
    def updateByKeyStringList(self,keyStringList):
        newData = []
        for keyString in keyStringList:
            newData.append(db.Key(keyString))
        self.data = newData
        self.put()
        return self.getRules()

class Rule(db.Model):
    ''' individual rule '''
    title = db.StringProperty()
    description = db.StringProperty() # tooltip
    author = db.StringProperty() # who created the rule : 'built-in' or user name 
    rule_type = db.StringProperty(default="board definition")  # either 'built-in','board definition' or else
    definition = db.StringProperty(default="") # how the strategy will be executed (either calling built-in python function or use board definition
    game = db.StringProperty()
    public = db.BooleanProperty(default=True)  # built-in heuristic rules are public
    created = db.DateTimeProperty(auto_now_add=True)
    
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
    output['key']=str(model.key())
    return output

def getAI(userID,gameTitle):
    return AI.gql("WHERE user=:1 AND game=:2",userID,gameTitle).get()
def getBuiltInRule(game_title): 
    allSt = db.GqlQuery("SELECT * FROM Rule WHERE game=:1 and rule_type=:2",game_title,"built-in").fetch(1000)
    list = []
    for st in allSt:
        list.append(to_dict(st))  # it returns the list of built-in rules
#    print >>sys.stderr, "getPublicStrategy with "+game_title
#    print >>sys.stderr, list
    return list
def getBuiltInRuleDict(game_title):
    dict= {}
    list = getBuiltInRule(game_title);
    for st in list:
#        print >>sys.stderr,st
        dict[st['title']]=st
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
def getUserRule(user_id,game_title):
    userAI = AI.get_by_key_name(user_id+"_"+game_title)
    if userAI==None:
        return None
    return userAI.getRules()
def getUserRuleDict(user_id,game_title):
    result = []
    userRules = getUserRule(user_id,game_title)
    for rule in userRules:
        temp = to_dict(rule)
#        temp['key']=str(rule.key())
        result.append(temp)
    return result
def setUserStrategy(user_id,game_title,codeList):
    userAI = db.GqlQuery("SELECT * FROM AI WHERE user=:1 AND game=:2",user_id,game_title).get()
    result = {"data": codeList};
    userAI.data = json.dumps(result)
    userAI.put()
 
def deleteAll(table):
    while True:
        result = db.GqlQuery("SELECT * FROM "+table).fetch(1000)
        if len(result)==0:
            return
        for r in result:
            r.delete()

''' when empty db is created, run this function to populate basic data set  '''    
def initSampleData():
    deleteAll('Game')
    Game(title='tictactoe',key_name='tictactoe').put()

    deleteAll('Rule')
    Rule(title='Win',definition='takeWin',description='Take a cell completing three of my stones in a row/column/diagonal',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Block Win',definition='takeBlockWin',description='Take a cell of the opponent winning position',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Center',definition='takeCenter',description='Take the center cell',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Any Corner',definition='takeAnyCorner',description='Take any corner',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Any Side',definition='takeAnySide',description='Take any non-corner cells on the side.',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Random',definition='takeRandom',description='Take any empty cell.',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Opposite Corner',definition='takeOppositeCorner',description='Take a corner cell if its opposite corner is occupied by another player',author='built-in',rule_type='built-in',game='tictactoe').put()
    
    deleteAll('User')
    User(id='tak',password='tak',email='tak@umd.edu',score=0,key_name='tak').put()
    User(id='ben',password='ben',email='ben@umd.edu',score=0,key_name='ben').put()
    User(id='matthew',password='matthew',email='matthew@umd.edu',score=0,key_name='matthew').put()    

    deleteAll('AI')
    AI(user='tak',game='tictactoe',key_name='tak_tictactoe').put()
    AI(user='ben',game='tictactoe',key_name='ben_tictactoe').put()
    AI(user='matthew',game='tictactoe',key_name='matthew_tictactoe').put()
    TicTacToe.activateBuiltInRuleByTitle('tak', 'Win')
    TicTacToe.activateBuiltInRuleByTitle('tak', 'Block Win')
    TicTacToe.activateBuiltInRuleByTitle('tak', 'Take Random')
    TicTacToe.activateBuiltInRuleByTitle('ben', 'Win')
    TicTacToe.activateBuiltInRuleByTitle('ben', 'Block Win')
    TicTacToe.activateBuiltInRuleByTitle('ben', 'Take Any Side')
    TicTacToe.activateBuiltInRuleByTitle('ben', 'Take Random')
    TicTacToe.activateBuiltInRuleByTitle('matthew', 'Win')
    TicTacToe.activateBuiltInRuleByTitle('matthew', 'Block Win')
    TicTacToe.activateBuiltInRuleByTitle('matthew', 'Take Any Corner')
    TicTacToe.activateBuiltInRuleByTitle('matthew', 'Take Random')
