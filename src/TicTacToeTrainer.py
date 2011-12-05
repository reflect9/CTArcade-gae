'''
    We use this class for TicTacToe trainer.  Trainer needs it when AI decides next move, 
    inferring user's move using basic heuristics.   Board status and winning check will be done on client js.  
    
@author: reflect9
'''
from google.appengine.ext import db
import sys, copy
from random import choice
from django.utils import simplejson
from datastore import *

class Type:
    EMPTY = 0
    P1 = 1
    P2 = 2
    SELECTED = 3
    IGNORE = 4

class TicTacToeTrainer:
    def __init__(self,user=None,player1=None,player2=None,game='tictactoe',board=None,turn=None):
        self.user = user;
        self.p1 = player1
        self.p2 = player2
        self.game = game
        self.board = board
        self.turn = turn
        self.strategy = self.loadStrategy(self.user,self.game)
#        print >>sys.stderr, "trainer board created : " 
#        print >>sys.stderr, self.board

    ''' BASIC FUNCTIONS '''
    def loadStrategy(self,player,game):
#        playerKey = db.GqlQuery("SELECT * FROM User WHERE uid=:1",player).get().key()
#        gameKey = db.GqlQuery("SELECT * FROM Game WHERE title=:1",game).get().key()
        codeList = getUserStrategy(player,game)
        print >>sys.stderr,"codeList in loadStrategy : "+ json.dumps(codeList)
#        st = simplejson.loads(strategy.data)
        return codeList
    def flip(self,player):
        if player=='p1':
            return 'p2'
        elif player=='p2':
            return 'p1'
        elif player==self.p1:
            return self.p2
        else:
            return self.p1
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
#    def makeMove(self,x,y,turn):
#        if turn!=self.turn:
#            print >>sys.stderr,"turn doesn't match!"
#            return
#        if self.board[x][y] != 0:
#            print >>sys.stderr,"cannot move on occupied cell ["+str(x)+","+str(y)+"]"
#            return
#        self.board[x][y]=self.turn
#        return self.board
    def findBestStrategy(self):
        if self.isFull():       return {'message':"Tie Game",'locList':None}
        resultList = []
#        print >>sys.stderr, "self.strategy : "+ json.dumps(self.strategy)
        for st in self.strategy:
            # locals() provide a dictionary of all elements in local scope
            # locals()[functionName] gives a handler to the function
            # thus, below we execute local function whose name is st['code']
#            print st
            p1p2 = 'p1' if self.turn==self.p1 else 'p2'
            if (hasattr(self, st)):
                strategyMethodToCall =  getattr(self, st)
                result = strategyMethodToCall(self.board,p1p2)
            else:
                strategy = [s for s in getPublicStrategy(self.game) if s['name'] == st]
                result = self.evaluateCreatedStrategy(eval(strategy[0]['boardList']),self.board,p1p2)
                
            resultList.append({'st':st, 'result':result })
        return resultList
#        return {'message':"no matching strategy found",'locList':None}
    def findMatchingStrategy(self,userLoc):
        matchingStrategy = [];
        allPublicStrategy = getPublicStrategy(self.game)
        print >>sys.stderr, allPublicStrategy
        print >>sys.stderr, userLoc
        for st in allPublicStrategy:
            print >>sys.stderr, st
            if st['name'] in self.strategy: st['enabled']=True # PREVIOUSLY st['code']
            else:  st['enabled']=False
#            print >>sys.stderr, self.board
            p1p2 = 'p1' if self.turn==self.p1 else 'p2'
            print >>sys.stderr, "board : " + json.dumps(self.board) + p1p2
            if (st['code'] != ''):
                strategyMethodToCall = getattr(self, st['code'])
                result = strategyMethodToCall(self.board,p1p2)
            else:
                result = self.evaluateCreatedStrategy(eval(st['boardList']), self.board, p1p2)
            if result['success'] and result['loc']!=None:
                for loc in result['loc']:
                    if int(userLoc[0])==loc[0] and int(userLoc[1])==loc[1]:
                        matchingStrategy.append(st)
                    else:
                        print >>sys.stderr, str(userLoc) + "__" + str(loc)
        return matchingStrategy
    
    
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
#        print >>sys.stderr, board[1]
        for case in combos:
            countEmptyCell = 0
            countPlayerCell = 0
            for pos in case:
#                print >>sys.stderr, pos
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
        print >>sys.stderr, board
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

    def evaluateCreatedStrategy(self, ruleBoardList, board, player):
        result = {'success':True,'loc':[]}
        pushFlag = False
        for ruleBoard in ruleBoardList:
            width = len(ruleBoard)
            height = len(ruleBoard[0])
            for i in range(len(board)-width+1):
                for j in range(len(board[0])-height+1):
                    for k in range(i,i+width):
                        for l in range(j,j+height):
                            tile = ruleBoard[k-i][l-j]
                            if (tile == Type.P1 and board[k][l] != player):
                                result['success'] = False
                            elif (tile == Type.P2 and board[k][l] != self.flip(player)):
                                result['success'] = False
                            elif (tile == Type.EMPTY and board[k][l] != Type.EMPTY):
                                result['success'] = False
                            elif (tile == Type.SELECTED and board[k][l] == Type.EMPTY):
                                result['loc'].append([k,l])
                                pushFlag = True
                    if pushFlag and not result['success']:
                        result['loc'].pop()
                    pushFlag = False
                    result['success'] = True
        if len(result['loc']) == 0:
            result['success'] = False
        return result
        
    def makeNewStrategy(self, ruleBoard, name, desc, translationInvariant,
                        flipping, rowPermutation, columnPermutation, rotation):
        def addRule(container, toBeAdded):
            if toBeAdded not in container:
                container.append(toBeAdded)
        def flip(ruleBoard, horizontally, vertically):
            flipped = []
            for i in range(len(ruleBoard)):
                flipped.append([0]*len(ruleBoard[0]))
            for i in range(len(ruleBoard)):
                for j in range(len(ruleBoard[0])):
                    xIndex = i
                    yIndex = j
                    if horizontally:
                        xIndex = len(ruleBoard)-i-1
                    if vertically:
                        yIndex = len(ruleBoard[0])-j-1
                    flipped[xIndex][yIndex] = ruleBoard[i][j]
            return flipped
        def rotate(ruleBoard):
            # rotated will start with transposed dimensions
            rotated = []
            for i in range(len(ruleBoard[0])):
                rotated.append([0]*len(ruleBoard))
            # now define the values appropriately
            for i in range(len(ruleBoard)):
                for j in range(len(ruleBoard[0])):
                    xIndex = j
                    yIndex = len(ruleBoard)-i-1
                    rotated[xIndex][yIndex] = ruleBoard[i][j]
            return rotated
        def colPermute(ruleBoard,offset):
            permuted = []
            for i in range(len(ruleBoard)):
                permuted.append([0]*len(ruleBoard[0]))
            print permuted
            print ruleBoard
            for i in range(len(ruleBoard)):
                for j in range(len(ruleBoard[0])):
                    xIndex = (i + offset) % len(ruleBoard)
                    permuted[xIndex][j] = ruleBoard[i][j]
                    print (i,",",j,": ",permuted)
            return permuted
        def rowPermute(ruleBoard,offset):
            permuted = []
            for i in range(len(ruleBoard)):
                permuted.append([0]*len(ruleBoard[0]))
            for i in range(len(ruleBoard)):
                for j in range(len(ruleBoard[0])):
                    yIndex = (i + offset) % len(ruleBoard[0])
                    permuted[i][yIndex] = ruleBoard[i][j]
            return permuted
        def minimize(ruleBoard):
            hMin = len(ruleBoard)
            hMax = 0
            vMin = len(ruleBoard[0])
            vMax = 0
            for i in range(len(ruleBoard)):
                for j in range(len(ruleBoard[0])):
                    if ruleBoard[i][j] != Type.IGNORE:
                        hMin = min(hMin,i)
                        hMax = max(hMax,i)
                        vMin = min(vMin,j)
                        vMax = max(vMax,j)
            width = hMax-hMin+1
            height = vMax-vMin+1

            newBoard = []
            for i in range(hMin,hMin+width):
                newBoard.append([])
                for j in range(vMin,vMin+height):
                    newBoard[i].append(ruleBoard[i][j])
            return newBoard

        # Here is the start of the actual processing function
        
        if translationInvariant:
            ruleBoard = minimize(ruleBoard)

        boardList = []
        boardList.append(ruleBoard)

        if flipping:
            for i in range(len(boardList)):
                print boardList
                addRule(boardList,flip(boardList[i],True,False))
                print boardList
                addRule(boardList,flip(boardList[i],False,True))
                print boardList
                addRule(boardList,flip(boardList[i],True,True))
                print boardList

        if rowPermutation:
            for i in range(len(boardList)):
                for j in range(len(boardList[i][0])):
                    addRule(boardList,rowPermute(boardList[i],j))

        if columnPermutation:
            for i in range(len(boardList)):
                for j in range(len(boardList[i])):
                    addRule(boardList,colPermute(boardList[i],j))

        print boardList

        if rotation:
            for i in range(len(boardList)):
                rotated = rotate(boardList[i])
                addRule(boardList,rotated)
                addRule(boardList,flip(boardList[i],True,True))
                addRule(boardList,flip(rotated,True,True))

        print boardList.__repr__()
        Strategy(name=name,code='',key_name=name,description=desc,game='tictactoe',boardList=boardList.__repr__()).put()
