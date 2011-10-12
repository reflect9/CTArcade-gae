#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from datastore import *
from google.appengine.ext import db
from google.appengine.ext.webapp import template
import appengine_utilities
import pprint, os
from TicTacToeMatch import TicTacToeMatch

class Lobby(webapp.RequestHandler):
    def get(self):
        query = User.all()
        users = query.fetch(10)
        
        template_values = {
            'users': users,
        }  # map of variables to be handed to html template

        path = os.path.join(os.path.dirname(__file__), 'lobby.html')
        self.response.out.write(template.render(path, template_values))

class SignUp(webapp.RequestHandler):
    def get(self):
        ''' this signup module will receive ajax call from lobby.html  '''
        # read given user id and password 
        # create User object defined in datastore.py
        # assign usr id and password and save it
        # send back success message
        user = User(uid = self.request.get('name'),
                    email = self.request.get('email'),
                    password = self.request.get('email'))
        user.put()

class LogIn(webapp.RequestHandler):
    def get(self):
        ''' this login module will receive ajax call from lobby.html '''
        # read given user id and password
        # user GqlQuery to retrieve matching User object from datastore
        # if matching User found, 
        #        1) create session object using user id
        session = appengine_utilities.sessions.Session()
        session["id"] =  'tak' # user id here
        
        #        2) [LATER!] read Match that the user has played and hand JSON data to lobby.html
        

class UpdateRule(webapp.RequestHandler):
    def get(self):
        user = db.GqlQuery("SELECT * FROM User WHERE uid=:1",self.request.get("player")).get()
        game = db.GqlQuery("SELECT * FROM Game WHERE title=:1",self.request.get("game")).get()
        if user==None:
            newUser = User(uid=self.request.get("player"),password=self.request.get("player"))
            userKey = newUser.put()
        else:
            userKey = user.key()
        if game==None:
            newGame = Game(title=self.request.get("game"))
            gameKey = newGame.put()
        else:
            gameKey = game.key()
        rule = Rule(
                    player = userKey,
                    game = gameKey,
                    data = self.request.get("strategy")   
                    )
        self.response.out.write(rule.put())
        ''' dummy URL for testing '''
        ''' http://localhost:8080/updateRule?player=ben&game=tictactoe&strategy=[{%22name%22:%22Win%22,%22code%22:%22takeWin%22,%22tooltip%22:%22Take%20a%20cell%20completing%20three%20of%20my%20stones%20in%20a%20row/column/diagonal%22,%22enabled%22:true},{%22name%22:%22Block%20Win%22,%22code%22:%22takeBlockWin%22,%22tooltip%22:%22Take%20a%20cell%20of%20the%20opponent%27s%20winning%20position%22,%22enabled%22:true},{%22name%22:%22Take%20Center%22,%22code%22:%22takeCenter%22,%22tooltip%22:%22Take%20the%20center%20cell%22,%22enabled%22:true},{%22name%22:%22Take%20Any%20Corner%22,%22code%22:%22takeAnyCorner%22,%22tooltip%22:%22Take%20any%20corner%22,%22enabled%22:true},{%22name%22:%22Take%20Any%20Side%22,%22code%22:%22takeAnySide%22,%22tooltip%22:%22Take%20any%20non-corner%20cells%20on%20the%20side.%22,%22enabled%22:true},{%22name%22:%22Random%20Move%22,%22code%22:%22takeRandom%22,%22tooltip%22:%22Take%20any%20empty%20cell.%22,%22enabled%22:true}]'''
        ''' http://localhost:8080/updateRule?player=tak&game=tictactoe&strategy=[{%22name%22:%22Win%22,%22code%22:%22takeWin%22,%22tooltip%22:%22Take%20a%20cell%20completing%20three%20of%20my%20stones%20in%20a%20row/column/diagonal%22,%22enabled%22:true},{%22name%22:%22Take%20Center%22,%22code%22:%22takeCenter%22,%22tooltip%22:%22Take%20the%20center%20cell%22,%22enabled%22:true},{%22name%22:%22Take%20Any%20Corner%22,%22code%22:%22takeAnyCorner%22,%22tooltip%22:%22Take%20any%20corner%22,%22enabled%22:true},{%22name%22:%22Random%20Move%22,%22code%22:%22takeRandom%22,%22tooltip%22:%22Take%20any%20empty%20cell.%22,%22enabled%22:true}]'''
         
class PlayMatch(webapp.RequestHandler):
    def get(self):
        match = TicTacToeMatch(p1='tak',p2='ben')
#        match = TicTacToeMatch(p1=self.request.get('p1'),p2=self.request.get('p2'),turn=self.request.get('p1'))
        result = match.run()
        
        self.response.out.write(pprint.pprint(result['history']))
        self.response.out.write( result['winner'])
        ''' http://localhost:8080/playMatch?p1=tak&p2=ben '''
        
class Trainer(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')

class ReviewMatch(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')


def main():
    application = webapp.WSGIApplication([('/', Lobby),
                                          ('/signUp',SignUp),
                                          ('/LogIn',LogIn),
                                          ('/updateRule', UpdateRule),
                                          ('/playMatch',PlayMatch),
                                          ('/trainer',Trainer),
                                          ('/reviewMatch',ReviewMatch)
                                          
                                          ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
