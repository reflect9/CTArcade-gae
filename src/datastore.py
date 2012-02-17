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
        if newRuleKey not in self.data:
            newData= self.data
            newData.reverse()
            newData.append(newRuleKey)
            newData.reverse()
            self.data =newData
            self.put()
        result=[]
        for rule in self.getRules():
            temp = to_dict(rule)
            result.append(temp)
        return result
    def removeRule(self,ruleKeyToRemove):
        if ruleKeyToRemove in self.data:
            self.data.remove(ruleKeyToRemove)
            self.put()
        result=[]
        for rule in self.getRules():
            temp = to_dict(rule)
            result.append(temp)
        return result
    def updateByKeyStringList(self,keyStringList):
        newData = []
        for keyString in keyStringList:
            newData.append(db.Key(keyString))
        self.data = newData
        self.put()
        result=[]
        for rule in self.getRules():
            temp = to_dict(rule)
            result.append(temp)
        return result

class Rule(db.Model):
    ''' individual rule '''
    title = db.StringProperty()
    description = db.StringProperty() # tooltip
    author = db.StringProperty() # who created the rule : 'built-in' or user name 
    rule_type = db.StringProperty(default="board definition")  # either 'built-in','board definition' or else
    definition = db.TextProperty(default="") # how the strategy will be executed (either calling built-in python function or use board definition
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
        try:
            result = db.GqlQuery("SELECT * FROM "+table).fetch(1000)
            if len(result)==0:
                return
            for r in result:
                r.delete()
        except:
            return

def clearAll():
    deleteAll('Game')
    deleteAll('Rule')
    deleteAll('User')
    deleteAll('AI')
    
''' when empty db is created, run this function to populate basic data set  '''    
def initSampleData():
    clearAll()
    Game(title='tictactoe',key_name='tictactoe').put()
    Rule(title='Win',definition='takeWin',description='Take a cell completing three of my stones in a row/column/diagonal',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Block Win',definition='takeBlockWin',description='Take a cell of the opponent winning position',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Center',definition='takeCenter',description='Take the center cell',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Any Corner',definition='takeAnyCorner',description='Take any corner',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Any Side',definition='takeAnySide',description='Take any non-corner cells on the side.',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Random',definition='takeRandom',description='Take any empty cell.',author='built-in',rule_type='built-in',game='tictactoe').put()
    Rule(title='Take Opposite Corner',definition='takeOppositeCorner',description='Take a corner cell if its opposite corner is occupied by another player',author='built-in',rule_type='built-in',game='tictactoe').put()
    

    User(id='easyNPC',password='easyNPC',email='easyNPC@umd.edu',score=0,key_name='easyNPC').put()
    User(id='moderateNPC',password='moderateNPC',email='moderateNPC@umd.edu',score=0,key_name='moderateNPC').put()
    User(id='hardNPC',password='hardNPC',email='hardNPC@umd.edu',score=0,key_name='hardNPC').put()    

    AI(user='easyNPC',game='tictactoe',key_name='easyNPC_tictactoe').put()
    AI(user='moderateNPC',game='tictactoe',key_name='moderateNPC_tictactoe').put()
    AI(user='hardNPC',game='tictactoe',key_name='hardNPC_tictactoe').put()
    TicTacToe.activateBuiltInRuleByTitle('easyNPC', 'Take Random')
    TicTacToe.activateBuiltInRuleByTitle('easyNPC', 'Take Any Corner')
    TicTacToe.activateBuiltInRuleByTitle('easyNPC', 'Win')
    TicTacToe.activateBuiltInRuleByTitle('moderateNPC', 'Take Random')
    TicTacToe.activateBuiltInRuleByTitle('moderateNPC', 'Take Any Corner')
    TicTacToe.activateBuiltInRuleByTitle('moderateNPC', 'Block Win')
    TicTacToe.activateBuiltInRuleByTitle('moderateNPC', 'Win')    
    TicTacToe.activateBuiltInRuleByTitle('hardNPC', 'Take Random')
    TicTacToe.activateBuiltInRuleByTitle('hardNPC', 'Take Any Side')
    TicTacToe.activateBuiltInRuleByTitle('hardNPC', 'Take Any Corner')
    TicTacToe.activateBuiltInRuleByTitle('hardNPC', 'Take Center')
    TicTacToe.activateBuiltInRuleByTitle('hardNPC', 'Block Win')
    TicTacToe.activateBuiltInRuleByTitle('hardNPC', 'Win')
    
    TournamentWinners(winner='None').put()
