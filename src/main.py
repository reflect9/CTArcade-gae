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
import TicTacToeMatch

class Lobby(webapp.RequestHandler):
    def get(self):
        template_values = {  
                           }  # map of variables to be handed to html template
        path = os.path.join(os.path.dirname(__file__),'lobby.html')
        self.response.out.write(template.render(path,template_values))

class SignUp(webapp.RequestHandler):
    def get(self):
        ''' this signup module will receive ajax call from lobby.html  '''
        # read given user id and password 
        # create User object defined in datastore.py
        # assign usr id and password and save it
        # send back success message

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
        try:
            player = db.GqlQuery("SELECT * FROM User WHERE uid=:1",self.request.get("player")).get()
            game = db.GqlQuery("SELECT * FROM Game WHERE gid=:1",self.request.get("game")).get()
        except Exception:
            self.response.out.write(Exception.message)
            return
        rule = Rule(
                    player = player,
                    game = game,
                    data = self.request.get("strategy")   
                    )
        self.response.out.write(rule.put())
  
class PlayMatch(webapp.RequestHandler):
    def get(self):
        match = TicTacToeMatch(p1=self.request.get('p1'),p2=self.request.get('p2'),turn=self.request.get('p1'))
        history = match.run()
        self.response.out.write(pprint.pprint(history))

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
