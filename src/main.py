#!/usr/bin/env python

from google.appengine.dist import use_library
use_library('django', '1.2')

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from datastore import *
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from django.utils import simplejson as json
import appengine_utilities
import pprint, os, sys
from TicTacToeMatch import TicTacToeMatch
from TicTacToeTrainer import TicTacToeTrainer
from appengine_utilities import sessions
from google.appengine.api import taskqueue
from google.appengine.api import urlfetch

class Lobby(webapp.RequestHandler):
    def get(self):
        self.sess = sessions.Session()
        logged=True
        loggedID = ""
        try:
            loggedID = self.sess['loggedInAs']
        except KeyError:
            logged =False
            loggedID = "Guest"
                
        query = User.all()
        users = query.fetch(10)
		
	#key = self.request.get('key')
	#q = taskqueue.Queue('tournament-queue')
	#tasks = []
	#payload_str = 'hello world'
	#tasks.append(taskqueue.Task(payload=payload_str, countdown=5))
	#q.add(tasks)

		
        template_values = {
            'users': users,
            'logged' : logged,
            'loggedInAs': loggedID,
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
        existingUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",self.request.get('name')).get()
        if existingUser:
            self.response.out.write("However, the name is already being used. Try a different name please.")
            return
        user = User(key_name=self.request.get('name'),
                    id = self.request.get('name'),
                    email = self.request.get('email'),
                    password = self.request.get('password'),
					score = 0)            
        result = user.put()                
        if result:
            ai_rec = AI(key_name=self.request.get('name')+"_tictactoe",
                        user = self.request.get('name'),
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
        matches = []
        p1 = self.request.get('p1')
        p2 = self.request.get('p2')
        firstTurn = p1
        for i in range(0,30):
            if i<15:    firstTurn = p1
            else:       firstTurn = p2
            match = TicTacToeMatch(p1=self.request.get('p1'),p2=self.request.get('p2'),game='tictactoe',turn=firstTurn)
            matches.append(match.run())
#            firstTurn = p2 if firstTurn==p1 else p1
#        self.response.out.write(pprint.pprint(result['history']))
#        self.response.out.write(result['history'])
#        self.response.out.write( result['winner'])
        winners = {}
        for m in matches:
            if m['winner'] in winners:
                winners[m['winner']] = winners[m['winner']] + 1
            else:
                winners[m['winner']] = 1
        p1_AI = json.dumps(getUserStrategy(self.request.get('p1'),'tictactoe'))
        p2_AI = json.dumps(getUserStrategy(self.request.get('p2'),'tictactoe'))
        template_values = {
            'p1' : self.request.get('p1'),
            'p2' : self.request.get('p2'),
            'winners' : winners,
            'p1_AI' : p1_AI,
            'p2_AI' : p2_AI,      
            'matches': json.dumps(matches).replace("&quot;","'")
        }  # map of variables to be handed to html template
#        print json.dumps(getUserStrategy(self.request.get('p2'),'tictactoe'))

        path = os.path.join(os.path.dirname(__file__), 'playMatch.html')
        self.response.out.write(template.render(path, template_values))        

        ''' http://localhost:8080/playMatch?p1=tak&p2=ben '''
        
class Trainer(webapp.RequestHandler):
    def get(self):
#        try:
        session = appengine_utilities.sessions.Session()
        if session["loggedInAs"]:
            current_user_id = session["loggedInAs"]
        else:
            self.redirect('/')
#        current_user_id = self.request.get('id')
#        except AttributeError:
#            current_user_id='ben'
        template_values = {
            'user_id': current_user_id,
        }  
        path = os.path.join(os.path.dirname(__file__), 'trainer.html')
        self.response.out.write(template.render(path, template_values))

class AjaxTrainer(webapp.RequestHandler):
    def get(self):
        action  = self.request.get('action')
        if action == 'getStrategy':
#            ai = db.Query(AI.get_by_key_name(self.request.get('player')+"_"+self.request.get('game'))).get()
            self.response.out.write(json.dumps(getUserStrategy(self.request.get('player'),self.request.get('game'))))
        elif action == 'getPublicStrategyDict':
            dict = getPublicStrategyDict(self.request.get('game'))
#            print >>sys.stderr, dict
            self.response.out.write(json.dumps(dict))
        elif action == 'findBestStrategy':
            trainer = TicTacToeTrainer(user=self.request.get('user'),player1=self.request.get('player1'),player2=self.request.get('player2'),board=json.loads(self.request.get('board')),turn=self.request.get('turn'),game='tictactoe')
            result = trainer.findBestStrategy()
            self.response.out.write(json.dumps(result))
            # result is an array. each element has 'st':strategy, 'result':['success']true/false and 'loc':[[x,y],.] 
        elif action == 'findMatchingStrategy':
#            print >>sys.stderr, self.request.get('board')
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
        elif action == 'createStrategy':
            # TBD : creating a new strategy. add it to Strategy model
            pass
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
        log = TournamentLog(message = "Tournament Start")
        print >>sys.stderr, "Tournament Start"
        log.put()
        users = User.all()
        tournament_entries = []
        for p1 in users:
                tournament_entries.append(str(p1.id))
    	log = TournamentLog(message = str(("Loaded:", len(tournament_entries))))
    	log.put()
        print >>sys.stderr, str(("Loaded:", len(tournament_entries)))
        taskqueue.add(url='/round', params={'tournament_entries': json.dumps(tournament_entries)}, countdown=60)
		
class RoundWorker(webapp.RequestHandler):
    def post(self): # should run at most 1/s
        Message = "%s%s" % ("Round Start: ", self.request.get('tournament_entries'))
        print >>sys.stderr, Message
        log = TournamentLog(message = Message)
        log.put()
        	
        round_entries = []
        print >>sys.stderr, "Round Entries Created"
        round_winners = []
        print >>sys.stderr, "Round Winners Created"
        round_entries = json.loads(self.request.get('tournament_entries'))
        print >>sys.stderr, "Round Entries Loaded"
        while len(round_entries) >= 2:
			player1 = round_entries.pop()
			player2 = round_entries.pop()
			match = TicTacToeMatch(player1,player2,game='tictactoe',turn=player1)
			result = match.run()
			while result["winner"] == "Tie Game":
				result = match.run()
			round_winners.append(str(result["winner"]))
			Message = "%s%s" % ("Round Winner: ", str(result["winner"]))
			print >>sys.stderr, Message
			log = TournamentLog(message = Message)
			log.put()
		# Need to do something about adding basic scores with person who gets the by
        by = "None"				
        if len(round_entries) == 1:
			by = round_entries.pop()
			Message = "%s%s" % ("Assigning By:", str(by))			
			print >>sys.stderr, Message
			log = TournamentLog(message = Message)
			log.put()
		# Determine if another round is necessary or if winner can be declared	
        taskqueue.add(url='/score', params={'tournament_entries': json.dumps(round_winners), 'by': by}, countdown=60)

class ScoreWorker(webapp.RequestHandler):
    def post(self): # should run at most 1/s
        print >>sys.stderr, "Scoring"
        next_round = json.loads(self.request.get('tournament_entries'))
        score_entries = json.loads(self.request.get('tournament_entries'))
        if len(score_entries) == 1 and self.request.get('by') == "None":
			Message = "%s%s" % ("Tournament Winner:", str(score_entries))	
			print >>sys.stderr, Message
			log = TournamentLog(message = Message)
			log.put()
			tournament_winner = score_entries.pop()
			updateUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",tournament_winner).get()
			updateUser.score += 10
			updateUser.put()		
        while len(score_entries) >= 2 or (len(score_entries) == 1 and self.request.get('by') != "None"):	
            score_entry = score_entries.pop()
            updateUser = db.GqlQuery("SELECT * FROM User WHERE id=:1",score_entry).get()
            updateUser.score += 1
            updateUser.put()
        if 	self.request.get('by') != "None":
            next_round.append(self.request.get('by'))
        if len(next_round) >= 2: 	
            taskqueue.add(url='/round', params={'tournament_entries': json.dumps(next_round)}, countdown=60)
			        
def main():
    application = webapp.WSGIApplication([('/', Lobby),
                                          ('/init', Init),
                                          ('/signUp',SignUp),
                                          ('/LogIn',LogIn),
                                          ('/updateRule', UpdateRule),
                                          ('/playMatch',PlayMatch),
                                          ('/trainer',Trainer),
                                          ('/ajaxTrainer',AjaxTrainer),
                                          ('/reviewMatch',ReviewMatch), 
										  ('/worker', CounterWorker), 
										  ('/round', RoundWorker),
										  ('/score', ScoreWorker),                                  
                                          ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
