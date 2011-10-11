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


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')

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
        self.response.out.write('Hello world!')

class Trainer(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')

class ReviewMatch(webapp.RequestHandler):
    def get(self):
        self.response.out.write('Hello world!')


def main():
    application = webapp.WSGIApplication([('/', MainHandler),
                                          ('/updateRule', UpdateRule),
                                          ('/playMatch',PlayMatch),
                                          ('/trainer',Trainer),
                                          ('/reviewMatch',ReviewMatch)
                                          ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
