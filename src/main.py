#!/usr/bin/env python

from google.appengine.dist import use_library
use_library('django', '1.2')

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from datastore import *
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from django.utils import simplejson as json
import pprint, os, sys, re
#from TicTacToeMatch import TicTacToeMatch
#from TicTacToeTrainer import TicTacToeTrainer
import TicTacToe
from appengine_utilities import sessions
from google.appengine.api import taskqueue
import urllib2


class Intro(webapp.RequestHandler):
    def get(self):
        session = sessions.Session()
        try:
            userID = session['loggedInAs']
        except KeyError:
            userID = "Guest"   
        template_values = {
            'userID' : userID,
        }  # map of variables to be handed to html template
        path = os.path.join(os.path.dirname(__file__), 'intro.html')
        self.response.out.write(template.render(path, template_values))     

class Lobby(webapp.RequestHandler):
    def get(self):
        session = sessions.Session()
        logged=True
        loggedID = ""
        try:
            loggedID = session["loggedInAs"]
        except KeyError:
            logged =False
            loggedID = "Guest"
                
        users = User.all()
        users.order('-score')
		
        champ = TournamentWinners.gql("ORDER BY timestamp DESC").fetch(100)
        if len(champ)>0:
            champRet = champ[0]
        else:
            champRet = None
        dthandler = lambda obj: obj.isoformat() if isinstance(obj, datetime.datetime) else None
       
        template_values = {
            'users': users,
            'logged' : logged,
            'user_id': loggedID,
            'champ' : champRet,
			'server_time': json.dumps(datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S'), default=dthandler),
        }  # map of variables to be handed to html template

        path = os.path.join(os.path.dirname(__file__), 'lobby.html')
        self.response.out.write(template.render(path, template_values))

    def post(self):
        key = self.request.get('key')

        # Add the task to the default queue.
        taskqueue.add(url='/worker', params={'key': key}, countdown=0)

        self.redirect('/lobby')    

class Init(webapp.RequestHandler):
    def get(self):
        initSampleData()
        self.redirect('/')

class SignUp(webapp.RequestHandler):
    def get(self):
        ''' this signup module will receive ajax call from lobby.html  '''
        # read given user id and password 
        # create User object defined in datastore.py
        # assign usr id and password and save it
        # send back success message
        namePattern = re.compile(r"[a-zA-Z][a-zA-Z0-9]{2,16}$")
        name = self.request.get('name')
        if namePattern.match(name)==None:
            self.response.out.write("User name(3~16 characters) should contain only alphabets and numbers(not for the first character).")
            return
        existingUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",name).get()
        if existingUser:
            self.response.out.write(name+" already exists. Try a different name please.")
            return
        user = User(key_name=name,
                    id = name,
                    email = self.request.get('email'),
                    password = self.request.get('password'),
                    score = 0)            
        result = user.put()                
        if result:
            AI(key_name=name+"_tictactoe",
                        user = name,
                        game = "tictactoe").put()
            TicTacToe.activateBuiltInRuleByTitle(name, 'Take Random')
            self.response.out.write("You may now login.")         
        #http://ctarcade.appspot.com/signUp?name=ben&email=ben@umd.edu&password=ben

class LogIn(webapp.RequestHandler):
    def get(self):
        self.sess = sessions.Session()
        ''' this login module will receive ajax call from lobby.html '''
        # read given user id and password
        findUser = db.GqlQuery("SELECT * FROM User WHERE id=:1 and password=:2",self.request.get('name'),self.request.get('password')).get()
        if findUser:
            self.sess['loggedInAs'] = findUser.id
            self.response.out.write("You are now logged in as " + self.sess['loggedInAs'])
            return
        else:
            self.response.out.write("We could not find your user information,<br />please try again.")    
            return      
class LogOut(webapp.RequestHandler):
    def get(self):
        self.sess = sessions.Session()
        self.sess.delete()
        self.redirect(self.request.get("redirect"))

class UpdateRule(webapp.RequestHandler):
    def get(self):
        ''' This module is only called directly from URL - it's manual updating of rule. '''
        user = db.GqlQuery("SELECT * FROM User WHERE id=:1",self.request.get("player")).get()
        game = db.GqlQuery("SELECT * FROM Game WHERE title=:1",self.request.get("game")).get()
        if user==None:
            self.response.out.write(self.request.get("player") + " doesn't exist.")
            return
#            newUser = User(uid=self.request.get("player"),password=self.request.get("player"))
#            userKey = newUser.put()
        else:
            userKey = user.key()
        if game==None:
            newGame = Game(title=self.request.get("game"))
            gameKey = newGame.put()
        else:
            gameKey = game.key()
        rule = AI(
                    player = userKey,
                    game = gameKey,
                    data = self.request.get("strategy")   
                    )
        self.response.out.write(rule.put())


class PlayMatch(webapp.RequestHandler):
    def get(self):
        session = sessions.Session()
        try:
            userID = session['loggedInAs']
        except KeyError:
            userID = "Guest"
	if userID != self.request.get("p2"):   
            opponent = self.request.get("p2")
        else:
            opponent = "" 
        print >>sys.stderr, userID
        template_values = {
            'userID' : userID,
            'p2' : opponent
#            'matches': json.dumps(matches).replace("&quot;","'")
        }  # map of variables to be handed to html template
        path = os.path.join(os.path.dirname(__file__), 'playMatch.html')
        self.response.out.write(template.render(path, template_values))        
       
class Trainer(webapp.RequestHandler):
    def get(self):
        try:
            session = sessions.Session()
            if session["loggedInAs"]:
                current_user_id = session["loggedInAs"]
            else:
                self.redirect('/')
        except:
            current_user_id='Guest'
        template_values = {
            'user_id': current_user_id,
        }  
        path = os.path.join(os.path.dirname(__file__), 'trainer.html')
        self.response.out.write(template.render(path, template_values))

class AjaxCall(webapp.RequestHandler):
    def get(self):
        action = self.request.get('action')
        if action== 'getUserList':
            users = db.GqlQuery("SELECT * FROM User").fetch(5000)
            result = []
            for user in users:
                result.append([user.id,user.score])
            self.response.out.write('{"data":'+json.dumps(result)+'}')
        if action == 'getStrategy':
            self.response.out.write(json.dumps(getUserRuleDict(self.request.get('player'),self.request.get('game'))))
        if action== 'runMatch':
            result = TicTacToe.runMatches(self.request.get('p1'), self.request.get('p2'), 20)
#            matches = []
#            p1 = self.request.get('p1')
#            p2 = self.request.get('p2')
#            firstTurn = p1
#            for i in range(0,30):
#                if i<15:    firstTurn = p1
#                else:       firstTurn = p2
#                match = TicTacToeMatch(p1=self.request.get('p1'),p2=self.request.get('p2'),game='tictactoe',turn=firstTurn)
#                matches.append(match.run())
#            p1_AI = getUserStrategy(self.request.get('p1'),'tictactoe')
#            p2_AI = getUserStrategy(self.request.get('p2'),'tictactoe') 
#            result = {}
#            result['players'] = {"p1":p1, "p2":p2}
#            result['AI'] = {p1:p1_AI, p2:p2_AI}
#            result['matches'] = matches 
            self.response.out.write('{"result":'+json.dumps(result)+'}')


class AjaxTrainer(webapp.RequestHandler):
    def get(self):
        action  = self.request.get('action')
        if action == 'getStrategy':
            self.response.out.write(json.dumps(getUserRuleDict(self.request.get('player'),self.request.get('game'))))
        elif action == 'getPublicStrategyDict':
            dict = getBuiltInRuleDict(self.request.get('game'))
            self.response.out.write(json.dumps(dict))
        elif action == 'findBestStrategy':
            result = TicTacToe.findBestStrategy(json.loads(self.request.get('board')), self.request.get('turn'))
            self.response.out.write(json.dumps(result)) 
        elif action == 'findMatchingStrategy':
            result = TicTacToe.findMatchingStrategy(json.loads(self.request.get('board')), self.request.get('turn'), self.request.get('loc'))  
            self.response.out.write(json.dumps(result))
        elif action == 'enableStrategy':
            # append a builtIn strategy to the user's AI data 
            result = TicTacToe.activateBuiltInRule(self.request.get('player'), self.request.get('strategyToEnable'))
            self.response.out.write(json.dumps(result))
        elif action == 'deleteRule':
            # append a builtIn strategy to the user's AI data 
            result = TicTacToe.deleteRule(self.request.get('player'), self.request.get('strategyToDelete'))
            self.response.out.write(json.dumps(result))

        elif action == 'changeOrder':
            user_id = self.request.get('player')
            game_title = self.request.get('game')
            keyStringList = json.loads(self.request.get('newStrategy'))
            userAI = getAI(user_id,game_title)
            self.response.out.write(userAI.updateByKeyStringList(keyStringList))
        elif action == 'a':
            self.response.out.write("hi")
            userAI = AI.get_by_key_name('ingrahaj_tictactoe')
            print userAI
            self.response.out.write(userAI.data)
        elif action == '':
            self.response.out.write("no action")
            pass
        else:
            self.response.out.write("unrecognized action: "+action)
            # ignore this
            pass        
    def post(self):
        action  = self.request.get('action')
        if action == 'makeNewStrategy':
            ruleBoardList = eval(self.request.get('ruleBoardList'))
#            addedRule = TicTacToe.addCustomRule(ruleBoard, self.request.get('title'), self.request.get('desc'), self.request.get('user'), self.request.get('translationInvariant'), self.request.get('flipping'), self.request.get('rowPermutation'), self.request.get('columnPermutation'), self.request.get('rotation'))
            addedRule = TicTacToe.addCustomRuleList(ruleBoardList, self.request.get('title'), self.request.get('desc'), self.request.get('user'))
            userAI = getAI(self.request.get('user'),'tictactoe')
            result = userAI.addRule(addedRule)
            print >>sys.stderr, json.dumps(result)
            self.response.out.write(json.dumps(result)) # True or False
                               
class CounterWorker(webapp.RequestHandler):
    def post(self): # should run at most 1/s
        #log = TournamentLog(message = "Tournament Start")
        print >>sys.stderr, "Tournament Start"
        #log.put()
        users = User.all()
        users.order('-score')
        tournament_entries = []
        for p1 in users:
                tournament_entries.append(str(p1.id))
        #log = TournamentLog(message = str(("Loaded:", len(tournament_entries))))
        #log.put()
        print >>sys.stderr, str(("Loaded:", len(tournament_entries)))
        taskqueue.add(url='/round', params={'tournament_entries': json.dumps(tournament_entries)}, countdown=180)
    def get(self): # should run at most 1/s
        #log = TournamentLog(message = "Tournament Start")
        print >>sys.stderr, "Tournament Start"
        #log.put()
        users = User.all()
        users.order('-score')
        tournament_entries = []
        for p1 in users:
                tournament_entries.append(str(p1.id))
        #log = TournamentLog(message = str(("Loaded:", len(tournament_entries))))
        #log.put()
        print >>sys.stderr, str(("Loaded:", len(tournament_entries)))
        taskqueue.add(url='/round', params={'tournament_entries': json.dumps(tournament_entries)}, countdown=180)
		
        
class RoundWorker(webapp.RequestHandler):
    def post(self): # should run at most 1/s
        try:
       	    tie_counter = 0;
       	    Message = "%s%s" % ("Round Start: ", self.request.get('tournament_entries'))
            print >>sys.stderr, Message
            #log = TournamentLog(message = Message)
            #log.put()
            
            round_entries = []
            print >>sys.stderr, "Round Entries Created"
            round_winners = []
            print >>sys.stderr, "Round Winners Created"
            round_entries = json.loads(self.request.get('tournament_entries'))
            print >>sys.stderr, "Round Entries Loaded"
            while len(round_entries) >= 2:
                player1 = round_entries.pop()
                print >>sys.stderr,"Pop"
                player2 = round_entries.pop()
                print >>sys.stderr,"Pop"
                p1_AI = getUserRuleDict(player1, 'tictactoe')
                p2_AI = getUserRuleDict(player2, 'tictactoe')
                print >>sys.stderr,"AIs Loaded"
                result = TicTacToe.runMatch(player1,player2,player1,p1_AI,p2_AI)
                while result["winner"] == "Tie Game" and tie_counter < 20:
                    result = TicTacToe.runMatch(player1,player2,player1,p1_AI,p2_AI)
                    print >>sys.stderr, "Tie"
                    tie_counter = tie_counter + 1
                if result["winner"] == "Tie Game":
                    round_winners.append(player1)
                else:	
                    round_winners.append(str(result["winner"]))
                #Message = "%s%s" % ("Round Winner: ", str(result["winner"]))
                print >>sys.stderr, result["winner"]
                #log = TournamentLog(message = Message)
                #log.put()
            # Need to do something about adding basic scores with person who gets the by
            print >>sys.stderr, "Prepping Exit"
            by = "None"                
            if len(round_entries) == 1:
                by = round_entries.pop()
                Message = "%s%s" % ("Assigning By:", str(by))            
                print >>sys.stderr, Message
                #log = TournamentLog(message = Message)
                #log.put()
            # Determine if another round is necessary or if winner can be declared
            print >>sys.stderr, "Exiting"    
            taskqueue.add(url='/score', params={'tournament_entries': json.dumps(round_winners), 'by': by}, countdown=180)

        except:
            self.response.clear()
            self.response.set_status(500)
            print >>sys.stderr, "Round Interrupted"

class ScoreWorker(webapp.RequestHandler):
    def post(self): # should run at most 1/s
        print >>sys.stderr, "Scoring"
        next_round = json.loads(self.request.get('tournament_entries'))
        score_entries = json.loads(self.request.get('tournament_entries'))
        if len(score_entries) == 1 and self.request.get('by') == "None":
            Message = "%s%s" % ("Tournament Winner:", str(score_entries))    
            print >>sys.stderr, Message
            #log = TournamentLog(message = Message)
            #log.put()
            tournament_winner = score_entries.pop()
            updateUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",tournament_winner).get()
            updateUser.score += 10
            updateUser.put()
            updateUserStatus = TournamentWinners(winner = tournament_winner).put()
        else:	     
            while len(score_entries) > 0:    
                score_entry = score_entries.pop()
                updateUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",score_entry).get()
                updateUser.score += 1
                updateUser.put()
            if self.request.get('by') != "None":
                next_round.append(self.request.get('by'))
            if len(next_round) >= 2:     
                taskqueue.add(url='/round', params={'tournament_entries': json.dumps(next_round)}, countdown=180)
def main():
    application = webapp.WSGIApplication([('/', Intro),
                                          ('/init', Init),
                                          ('/signUp',SignUp),
                                          ('/LogIn',LogIn),
                                          ('/logOut',LogOut),
                                          ('/updateRule', UpdateRule),
                                          ('/playMatch',PlayMatch),
                                          ('/trainer',Trainer),
                                          ('/ajaxCall',AjaxCall),
                                          ('/ajaxTrainer',AjaxTrainer),
                                          ('/worker', CounterWorker), 
                                          ('/round', RoundWorker),
                                          ('/score', ScoreWorker),								  
                                          ('/lobby', Lobby),
  
                                          ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
