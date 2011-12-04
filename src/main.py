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
from TicTacToeMatch import TicTacToeMatch
from TicTacToeTrainer import TicTacToeTrainer
from appengine_utilities import sessions
from google.appengine.api import taskqueue
import urllib2
from google.appengine.api import urlfetch

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
        
        template_values = {
            'users': users,
            'logged' : logged,
            'user_id': loggedID,
        }  # map of variables to be handed to html template

        path = os.path.join(os.path.dirname(__file__), 'lobby.html')
        self.response.out.write(template.render(path, template_values))

    def post(self):
        key = self.request.get('key')

        # Add the task to the default queue.
        taskqueue.add(url='/worker', params={'key': key}, countdown=0)

        self.redirect('/')    

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
        namePattern = re.compile(r"[a-zA-Z][a-zA-Z0-9]{3,16}$")
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
            ai_rec = AI(key_name=name+"_tictactoe",
                        user = name,
                        game = "tictactoe",
                        data =     "{\"data\":[\"takeRandom\"]}")
            result_2 = ai_rec.put()
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
        if action== 'getUserAI':
            user_AI = getUserStrategy(self.request.get('userID'),'tictactoe')
            self.response.out.write('{"result":'+json.dumps(user_AI)+'}')
        if action== 'runMatch':
            matches = []
            p1 = self.request.get('p1')
            p2 = self.request.get('p2')
            firstTurn = p1
            for i in range(0,30):
                if i<15:    firstTurn = p1
                else:       firstTurn = p2
                match = TicTacToeMatch(p1=self.request.get('p1'),p2=self.request.get('p2'),game='tictactoe',turn=firstTurn)
                matches.append(match.run())
            p1_AI = getUserStrategy(self.request.get('p1'),'tictactoe')
            p2_AI = getUserStrategy(self.request.get('p2'),'tictactoe') 
            result = {}
            result['players'] = {"p1":p1, "p2":p2}
            result['AI'] = {p1:p1_AI, p2:p2_AI}
            result['matches'] = matches 
            self.response.out.write('{"result":'+json.dumps(result)+'}')


class AjaxTrainer(webapp.RequestHandler):
    def get(self):
        action  = self.request.get('action')
        if action == 'getStrategy':
            self.response.out.write(json.dumps(getUserStrategy(self.request.get('player'),self.request.get('game'))))
        elif action == 'getPublicStrategyDict':
            dict = getPublicStrategyDict(self.request.get('game'))
            self.response.out.write(json.dumps(dict))
        elif action == 'findBestStrategy':
            trainer = TicTacToeTrainer(user=self.request.get('user'),player1=self.request.get('player1'),player2=self.request.get('player2'),board=json.loads(self.request.get('board')),turn=self.request.get('turn'),game='tictactoe')
            result = trainer.findBestStrategy()
            self.response.out.write(json.dumps(result)) 
        elif action == 'findMatchingStrategy':
            trainer = TicTacToeTrainer(user=self.request.get('user'),player1=self.request.get('player1'),player2=self.request.get('player2'),board=json.loads(self.request.get('board')),turn=self.request.get('turn'),game='tictactoe')
            result = trainer.findMatchingStrategy(json.loads(self.request.get('loc')))
            self.response.out.write(json.dumps(result))
        elif action == 'enableStrategy':
            # append an existing strategy to the user's AI data 
            codeList = getUserStrategy(self.request.get('player'),self.request.get('game'))
            if self.request.get('strategyToEnable') not in codeList:
                codeList.append(self.request.get('strategyToEnable'))
                setUserStrategy(self.request.get('player'),self.request.get('game'),codeList)
                self.response.out.write('True')
            else:
                self.response.out.write('False')
        elif action == 'makeNewStrategy':
            # it seems that a non-persistent TicTacToeTrainer variable breaks my approach...but to keep form:
            trainer = TicTacToeTrainer(user=self.request.get('user'),player1=self.request.get('player1'),player2=self.request.get('player2'),board=json.loads(self.request.get('board')),turn=self.request.get('turn'),game='tictactoe')
            ruleBoard = list(self.request.get('ruleBoard'))
            trainer.makeNewStrategy(ruleBoard, self.request.get('name'), self.request.get('desc'), self.request.get('translationInvariant'), self.request.get('flipping'), self.request.get('rowPermutation'), self.request.get('columnPermutation'), self.request.get('rotation'))
            self.response.out.write('success')
        elif action == 'changeOrder':
            # change the user's AI's data which is JSON string of an array that contains 
            # codes of strategies
            user_id = self.request.get('player')
            game_title = self.request.get('game')
            data = json.loads(self.request.get('newStrategy'))
            setUserStrategy(user_id,game_title,data)
#            self.response.out.write('updated Rule is '+getUserStrategy(user_id,game_title))
        elif action == '':
            pass
        else:
            # ignore this
            pass                               
                                          

class ReviewMatch(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')

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
        taskqueue.add(url='/round', params={'tournament_entries': json.dumps(tournament_entries)}, countdown=200)
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
        taskqueue.add(url='/round', params={'tournament_entries': json.dumps(tournament_entries)}, countdown=200)
		
        
class RoundWorker(webapp.RequestHandler):
    def post(self): # should run at most 1/s
        try:
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
                match = TicTacToeMatch(player1,player2,game='tictactoe',turn=player1)
                result = match.run()
                print >>sys.stderr, "Match"
                while result["winner"] == "Tie Game":
                    result = match.run()
                    print >>sys.stderr, "Tie"
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
            taskqueue.add(url='/score', params={'tournament_entries': json.dumps(round_winners), 'by': by}, countdown=200)

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
        else:	     
            while len(score_entries) > 0:    
                score_entry = score_entries.pop()
                updateUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",score_entry).get()
                updateUser.score += 1
                updateUser.put()
            if self.request.get('by') != "None":
                next_round.append(self.request.get('by'))
            if len(next_round) >= 2:     
                taskqueue.add(url='/round', params={'tournament_entries': json.dumps(next_round)}, countdown=200)
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
                                          ('/reviewMatch',ReviewMatch), 
                                          ('/worker', CounterWorker), 
                                          ('/round', RoundWorker),
                                          ('/score', ScoreWorker),								  ('/lobby', Lobby),
  
                                          ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
