import TicTacToe
import datastore, json
from google.appengine.ext import db

a = datastore.getBuiltInRule('tictactoe') 

print json.dumps(a)