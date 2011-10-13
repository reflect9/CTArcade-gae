'''
    We use this class for TicTacToe trainer.  Trainer needs it when AI decides next move, 
    inferring user's move using basic heuristics.   Board status and winning check will be done on client js.  
    
@author: reflect9
'''
from google.appengine.ext import db
import sys, copy
from random import choice
from django.utils import simplejson

class TicTacToeTrainer:
    def __init__(self,player=None,game='tictactoe'):
        self.player = player
        self.game=game
        
        self.strategy = self.loadStrategy(self.player,self.game)
        
        




    ''' BASIC FUNCTIONS '''
    def loadStrategy(self,player,game):
        playerKey = db.GqlQuery("SELECT * FROM User WHERE uid=:1",player).get().key()
        gameKey = db.GqlQuery("SELECT * FROM Game WHERE title=:1",game).get().key()
        strategy = db.GqlQuery("SELECT * FROM Rule WHERE player=:1 AND game=:2",playerKey,gameKey).get()
#        print player+",   "+ strategy.data
        return simplejson.loads(strategy.data)
    def flip(self,player):
        return self.p2 if player==self.p1 else self.p1
    def isFull(self):
        for row in self.board:  
            for cell in row:
                if cell==0: return False
        return True
    def checkCol(self,x):
        if self.board[x][0]==self.board[x][1] and self.board[x][1]==self.board[x][2] and self.board[x][0]!=0:
            return self.board[x][0]
        else: return False
    def checkRow(self,y):
        if self.board[0][y]==self.board[1][y] and self.board[1][y]==self.board[2][y] and self.board[0][y]!=0:
            return self.board[0][y]
        else: return False
    def checkDiag1(self):
        if self.board[0][0]!=0 and self.board[0][0]==self.board[1][1] and self.board[1][1]==self.board[2][2]:
            return self.board[0][0]
        else: return False
    def checkDiag2(self):
        if self.board[2][0]!=0 and self.board[2][0]==self.board[1][1] and self.board[0][2]==self.board[1][1]:
            return self.board[2][0]
        else: return False      
    def checkWinner(self):
        for i in range(0,3):
            if self.checkRow(i) != False: 
                return self.checkRow(i)
            if self.checkCol(i) != False: 
                return self.checkCol(i)
        if self.checkDiag1()!=False: 
            return self.checkDiag1()
        if self.checkDiag2()!=False:
            return self.checkDiag2() 
        return False
    def makeMove(self,x,y,turn):
        if turn!=self.turn:
            print >>sys.stderr,"turn doesn't match!"
            return
        if self.board[x][y] != 0:
            print >>sys.stderr,"cannot move on occipied cell ["+str(x)+","+str(y)+"]"
            return
        self.board[x][y]=self.turn
        return self.board
    def findBestStrategy(self,player):
        if self.isFull():       return {'message':"Tie Game",'locList':None}
        for st in self.strategy[player]:
            # locals() provide a dictionary of all elements in local scope
            # locals()[functionName] gives a handler to the function
            # thus, below we execute local function whose name is st['code']
            print st['code']
            strategyMethodToCall =  getattr(self, st['code'])
            result = strategyMethodToCall(self.board,player) 
            if result['success']:
                return {'message':st['name'], 'locList':result['loc']}
        return {'message':"no matching strategy found",'locList':None}
    
    ''' STRATEGIES'''
    def takeWin(self,board,player):
        combos = [
                  [[0,0],[1,1],[2,2]],
                  [[0,2],[1,1],[2,0]],
                  
                  [[0,0],[0,1],[0,2]],
                  [[1,0],[1,1],[1,2]],
                  [[2,0],[2,1],[2,2]],
                  
                  [[0,0],[1,0],[2,0]],
                  [[0,1],[1,1],[2,1]],
                  [[0,2],[1,2],[2,2]]                  
                  ]
        for case in combos:
            countEmptyCell = 0
            countPlayerCell = 0
            for pos in case:
                if board[pos[0]][pos[1]]==player:
                    countPlayerCell = countPlayerCell+1
                if board[pos[0]][pos[1]]==0:
                    emptyCell = pos
                    countEmptyCell = countEmptyCell+1
            if countEmptyCell==1 and countPlayerCell==2:
                return {'success':True, 'loc':[emptyCell]}
        return {'success':False,'loc':None}
    def takeBlockWin(self,board,player):
        opponent = self.flip(player)
        return self.takeWin(board,opponent)
    def takeCenter(self,board,player):
        if board[1][1]==0:
            return {'success':True, 'loc':[[1,1]]}
        return {'success':False}
    def takeAnyCorner(self,board,player):
        combos = [[0,0],[2,2],[2,0],[0,2]]
        possibleMoves = []
        for case in combos:
            if board[case[0]][case[1]]==0:
                possibleMoves.append(case)
        if len(possibleMoves)>0:
            return {'success':True, 'loc':possibleMoves}
        else:
            return {'success':False, 'loc':None}
    def takeAnySide(self,board,player):
        combos = [[0,1],[1,0],[1,2],[2,1]]
        possibleMoves = []
        for case in combos:
            if board[case[0]][case[1]]==0:
                possibleMoves.append(case)
        if len(possibleMoves)>0:
            return {'success':True, 'loc':possibleMoves}
        else:
            return {'success':False, 'loc':None}
    def takeRandom(self,board,player):
        possibleMoves = []
        for x in range(0,3):
            for y in range(0,3):
                if board[x][y]==0:  possibleMoves.append([x,y])
        if len(possibleMoves)>0:
            return {'success':True, 'loc':possibleMoves}
        else:
            return {'success':False, 'loc':None}
        
    def takeOppositeCorner(self,board,player):
        combos = [[[0,0],[2,2]],[[0,2],[2,0]]]
        for corners in combos:
            c1 = corners[0]
            c2 = corners[1]
            if board[c1[0]][c1[1]]!=0 and board[c2[0]][c2[1]]==0:
                return {'success':True, 'loc':[c2]}
            if board[c2[0]][c1[1]]!=0 and board[c1[0]][c2[1]]==0:
                return {'success':True, 'loc':[c1]}      
        return {'success':False}
        