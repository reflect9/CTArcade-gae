'''
Created on Dec 6, 2011
    merging TicTacToeMatch and TicTacToeTrainer into one
@author: reflect9
'''

from google.appengine.ext import db
import sys, copy, json
from random import choice
from django.utils import simplejson
import datastore

''' TRAINER FUNCTIONS '''
# for adding user-created custom rule to Rule table
def addCustomRule(ruleBoard, title, desc, author, translationInvariant,
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
                if ruleBoard[i][j] != CellType.IGNORE:
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
    print >>sys.stderr, boardList
    if rotation:
        for i in range(len(boardList)):
            rotated = rotate(boardList[i])
            addRule(boardList,rotated)
            addRule(boardList,flip(boardList[i],True,True))
            addRule(boardList,flip(rotated,True,True))

    print boardList.__repr__()
    newRule = datastore.Rule(title=title,code='',description=desc,author=author,game='tictactoe',type='board definition',definition=boardList.__repr__()).put()
    return newRule

# for adding a built-in rule to user's AI by title
def activateBuiltInRule(userID,ruleKeyString):
#    rule = db.GqlQuery("SELECT * FROM Rule WHERE title=:1 AND rule_type=:2",ruleTitle,'built-in').get()
    ai = datastore.getAI(userID,'tictactoe')
    ruleKey = db.Key(ruleKeyString)
    return ai.addRule(ruleKey)
def activateBuiltInRuleByTitle(userID,ruleTitle):
    rule = db.GqlQuery("SELECT * FROM Rule WHERE title=:1 AND rule_type=:2",ruleTitle,'built-in').get()
    ai = datastore.getAI(userID,'tictactoe')
    ruleKey = rule.key()
    return ai.addRule(ruleKey)

''' MATCH FUNCTIONS'''
# run a single match and return result
def runMatch(p1,p2,startTurn):
    strategy = {};  history=[]; counter = 0; result = ""
    strategy[p1] = datastore.getUserRule(p1,'tictactoe')  
    strategy[p2] = datastore.getUserRule(p2,'tictactoe')  
    turn = startTurn
    board = [[0 for i in range(3)] for j in range(3)]
    def makeMove(board,x,y,turn):
        if board[x][y] != 0:
            print >>sys.stderr,"cannot move on occipied cell ["+str(x)+","+str(y)+"]"
            return
        board[x][y]=turn
        return board
    while True:
        opponent = p2 if turn==p1 else p1
        nextMove = findBestStrategy(board,turn,opponent)
        if nextMove['message']=="Tie Game":
            history.append({'board':copy.deepcopy(board),'loc':None,'turn':turn,'message':nextMove['message']})
            result = "Tie Game"
            return {'history':history, 'winner': result}       
        else: # now it will select one from all the moves of the best strategy
            selectedLoc = choice(nextMove['locList'])  # randomly select one location from list
            board = makeMove(board,selectedLoc[0], selectedLoc[1],turn); # update board
            history.append({'board':copy.deepcopy(board),'loc':selectedLoc,'turn':turn,'message':nextMove['message']})
            winner = checkWinner(board);
            if winner:
                result = winner
                return {'history':history, 'winner': result}       
            turn = p2 if turn==p1 else p1
        counter = counter+1
        if counter>9: break            
    return {'history':history, 'winner': result}    
# run multiple matches
def runMatches(p1,p2,numberOfMatches):
    matches = []
    firstTurn = p1
    for i in range(0,numberOfMatches):
        if i<(numberOfMatches/2):    firstTurn = p1
        else:       firstTurn = p2
        match = runMatch(p1,p2,firstTurn)
        matches.append(match)
    p1_AI = datastore.getUserRule(p1, 'tictactoe')
    p2_AI = datastore.getUserRule(p2, 'tictactoe')
    result = {}
    result['players'] = {"p1":p1, "p2":p2}
    result['AI'] = {p1:p1_AI, p2:p2_AI}
    result['matches'] = matches 
    return result

''' GENERAL UTILITY FUNCTIONS '''
def findBestStrategy(board,turn):  
    if isFull(board):       return {'message':"Tie Game",'locList':None}
    # retrieve player's rules from DB here
    userID = turn.replace("_AI","")
    rules = datastore.getUserRuleDict(userID,'tictactoe')      
    for rule in rules:
        if (rule['rule_type']=="built-in"):
            result = eval(rule['definition'])(board,turn)
        elif (rule['rule_type']=="board definition"):
            result = evaluateCreatedStrategy(rule['definition'],board,turn)
        if result['success']:
            return {'message':rule['title'],'rule':rule,'userRules':rules,'locList':result['loc']}
    return {'message':"no matching strategy found",'userRules':rules,'locList':None}

def findMatchingStrategy(board, player, userLoc):
    matchingStrategy = [];
    builtInRules = datastore.getBuiltInRule('tictactoe')
    userLoc = json.loads(userLoc)
    userRules = datastore.getAI(player,'tictactoe').data
    for rule in builtInRules:
        if rule['key'] in userRules:
            rule['enabled']=True # PREVIOUSLY st['code']
        else:  rule['enabled']=False
#        p1p2 = 'p1' if self.turn==self.p1 else 'p2'
#        print >>sys.stderr, "board : " + json.dumps(self.board) + p1p2
        if (rule['rule_type']=="built-in"):
            result = eval(rule['definition'])(board,player)
        elif (rule['rule_type']=="board definition"):
            result = evaluateCreatedStrategy(eval(rule['definition']), board, player)
        if result['success'] and result['loc']!=None:
            for loc in result['loc']:
                if int(userLoc[0])==loc[0] and int(userLoc[1])==loc[1]:
                    matchingStrategy.append(rule)
                else:
                    print >>sys.stderr, str(userLoc) + "__" + str(loc)
    return matchingStrategy

''' BASIC FUNCTIONS FOR CHECKING BOARD STATUS '''
def isFull(board):
    for row in board:  
        for cell in row:
            if cell==0: return False
    return True
def checkCol(board,x):
    if board[x][0]==board[x][1] and board[x][1]==board[x][2] and board[x][0]!=0:
        return board[x][0]
    else: return False
def checkRow(board,y):
    if board[0][y]==board[1][y] and board[1][y]==board[2][y] and board[0][y]!=0:
        return board[0][y]
    else: return False
def checkDiag1(board):
    if board[0][0]!=0 and board[0][0]==board[1][1] and board[1][1]==board[2][2]:
        return board[0][0]
    else: return False
def checkDiag2(board):
    if board[2][0]!=0 and board[2][0]==board[1][1] and board[0][2]==board[1][1]:
        return board[2][0]
    else: return False      
def checkWinner(board):
    for i in range(0,3):
        if checkRow(board,i) != False: 
            return checkRow(board,i)
        if checkCol(board,i) != False: 
            return checkCol(board,i)
    if checkDiag1(board)!=False: 
        return checkDiag1(board)
    if checkDiag2(board)!=False:
        return checkDiag2(board) 
    return False


''' BUILT-IN STRATEGIES'''
def takeWin(board,player):
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
def takeBlockWin(board,player):
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
            # THE ONLY DIFFERENCE FROM takeWin IS THE LINE BELOW 
            if board[pos[0]][pos[1]]!=player and board[pos[0]][pos[1]]!=0:  
                countPlayerCell = countPlayerCell+1
            if board[pos[0]][pos[1]]==0:
                emptyCell = pos
                countEmptyCell = countEmptyCell+1
        if countEmptyCell==1 and countPlayerCell==2:
            return {'success':True, 'loc':[emptyCell]}
    return {'success':False,'loc':None}
def takeCenter(board,player):
    if board[1][1]==0:
        return {'success':True, 'loc':[[1,1]]}
    return {'success':False}
def takeAnyCorner(board,player):
    combos = [[0,0],[2,2],[2,0],[0,2]]
    possibleMoves = []
    for case in combos:
        if board[case[0]][case[1]]==0:
            possibleMoves.append(case)
    if len(possibleMoves)>0:
        return {'success':True, 'loc':possibleMoves}
    else:
        return {'success':False, 'loc':None}
def takeAnySide(board,player):
    combos = [[0,1],[1,0],[1,2],[2,1]]
    possibleMoves = []
    for case in combos:
        if board[case[0]][case[1]]==0:
            possibleMoves.append(case)
    if len(possibleMoves)>0:
        return {'success':True, 'loc':possibleMoves}
    else:
        return {'success':False, 'loc':None}
def takeRandom(board,player):
    possibleMoves = []
    for x in range(0,3):
        for y in range(0,3):
            if board[x][y]==0:  possibleMoves.append([x,y])
    if len(possibleMoves)>0:
        return {'success':True, 'loc':possibleMoves}
    else:
        return {'success':False, 'loc':None}
def takeOppositeCorner(board,player):
    combos = [[[0,0],[2,2]],[[0,2],[2,0]]]
    for corners in combos:
        c1 = corners[0]
        c2 = corners[1]
        if board[c1[0]][c1[1]]!=0 and board[c2[0]][c2[1]]==0:
            return {'success':True, 'loc':[c2]}
        if board[c2[0]][c1[1]]!=0 and board[c1[0]][c2[1]]==0:
            return {'success':True, 'loc':[c1]}      
    return {'success':False}
def evaluateCreatedStrategy(ruleBoardList, board, player):
    result = {'success':True,'loc':[]}
    for row in board:
        for cell in row:
            if cell!=0 and cell!=player:
                opponent = cell
                break
    pushFlag = False
    ruleBoardList = eval(ruleBoardList)
    for ruleBoard in ruleBoardList:
        width = len(ruleBoard)
        height = len(ruleBoard[0])
        for i in range(len(board)-width+1):
            for j in range(len(board[0])-height+1):
                for k in range(i,i+width):
                    for l in range(j,j+height):
                        tile = ruleBoard[k-i][l-j]
                        if (tile == CellType.IGNORE):
                            continue
                        if (tile == CellType.P1 and board[k][l] != player):
                            result['success'] = False
                        elif (tile == CellType.P2 and board[k][l] != opponent):
                            result['success'] = False
                        elif (tile == CellType.EMPTY and board[k][l] != CellType.EMPTY):
                            result['success'] = False
                        elif (tile == CellType.SELECTED and board[k][l] == CellType.EMPTY):
                            result['loc'].append([k,l])
                            pushFlag = True
                if pushFlag and not result['success']:
                    result['loc'].pop()
                pushFlag = False
                result['success'] = True
    if len(result['loc']) == 0:
        result['success'] = False
    return result
class CellType:
    EMPTY = 0
    P1 = 1
    P2 = 2
    SELECTED = 3
    IGNORE = 4
