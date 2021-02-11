import React from 'react';
import Board from './Board';
import BoardInitializer from './BoardInitializer';
import MovesHistory from './MovesHistory';

class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            localPlayerReady: false,
            opponentReady: false,
            gameStarted: false,
            localPlayerTurn: this.props.isHost,
            localPlayerBoard: null,  //Board will be created and populated by the BoardInitializer component
            opponentBoard: new Array(10).fill(null).map(() => new Array(10).fill(null).map(() => ({ hit: false, ship: null }))),
            localPlayerShips: [{ id: '5', hp: 5 }, { id: '4', hp: 4 }, { id: '3_1', hp: 3 }, { id: '3_2', hp: 3 }, { id: '2', hp: 2 }], //Hp = Health points
            localPlayerHealthPoints: 17, //Sum of cells taken by every ship
            opponentHealthPoints: 17,  //healthPoints state variables are used by the host to determine winner
            lastLocalPlayerMove: { row: null, col: null }, //Used to compute result of local player move, stores coordinates and receives move result by opponent 
            movesHistory: [],
            errorMsg: '',
            winner: null,  //winner is used by the non-host player to store the winner received by the host
        }
        this.initializeLocalPlayerBoard = this.initializeLocalPlayerBoard.bind(this);
        this.sendMove = this.sendMove.bind(this);
        this.computeOpponentMoveResult = this.computeOpponentMoveResult.bind(this);
        this.checkWinner = this.checkWinner.bind(this);
    }

    //Set peerjs event listeners
    componentDidMount() {
        this.props.opponent.on('close', () => this.props.onOpponentDisconnect())
        this.props.opponent.on('data', (data) => this.getOpponentMessage(data));
        this.props.peer.on('connection', (conn) => { conn.close(); });
        this.timerID = setInterval(() => this.checkOpponent(), 2000);
    }

    //Remove peerjs event listeners
    componentWillUnmount() {
        this.props.opponent.off();
        this.props.peer.off('connection');
    }

    //Set local player ready, check if opponent is ready
    initializeLocalPlayerBoard(board) {
        this.setState({ localPlayerBoard: board, localPlayerReady: true }, () => { this.props.opponent.send('ready'); this.arePlayersReady() });
    }

    getOpponentMessage(data) {
        if (!this.state.gameStarted) { //If game hasn't started, listen only for 'ready' message
            if (data === 'ready')
                this.setState({ opponentReady: true }, () => this.arePlayersReady());
        }
        else { //If game has started listen for moves/responses
            if (typeof data === 'object' && data !== null)
                this.handleOpponentMove(data);
            else
                this.checkWinner(data);
        }
    }

    arePlayersReady() {
        if (this.state.localPlayerReady && this.state.opponentReady)
            this.setState({ gameStarted: true });
    }

    handleOpponentMove(move) {
        if (this.state.localPlayerTurn) { //If it's the local player turn, message is the result of the last move, update opponent board accordingly
            let boardTemp = this.state.opponentBoard.slice();
            let movesHistoryTemp = this.state.movesHistory.slice();
            let moveResult = move.length > 1 ? 'destroyed' : 'hit';
            movesHistoryTemp.push({ player: 'local', row: this.state.lastLocalPlayerMove.row, col: this.state.lastLocalPlayerMove.col, result: !move[0].ship ? 'miss' : moveResult });

            move.forEach(cell => {
                boardTemp[cell.row][cell.col].ship = cell.ship;
                boardTemp[cell.row][cell.col].hit = cell.hit;
            });

            this.setState((prevState) => ({
                opponentBoard: boardTemp, localPlayerTurn: !prevState.localPlayerTurn, errorMsg: '',
                movesHistory: movesHistoryTemp, lastLocalPlayerMove: { row: null, col: null },
                opponentHealthPoints: move[0].ship ? prevState.opponentHealthPoints - 1 : prevState.opponentHealthPoints
            }),
                () => this.checkWinner()
            );
        }
        else {
            this.computeOpponentMoveResult(move);
        }
    }

    computeOpponentMoveResult(move) {
        let boardTemp = this.state.localPlayerBoard.slice();
        let shipsListTemp = this.state.localPlayerShips.slice();
        let cellShipId = boardTemp[move.row][move.col].ship;
        let affectedCells = [];
        let moveResult = null;
        let movesHistoryTemp = this.state.movesHistory.slice();

        boardTemp[move.row][move.col].hit = true; //Update cell

        if (cellShipId) { //If opponent hit a ship, check if it's still alive
            moveResult = 'hit';
            let hitShip = shipsListTemp.find(ship => ship.id === cellShipId);
            hitShip.hp--; //Remove 1 hp to the hit ship
            if (hitShip.hp === 0) { //If ship has 0 hp, return all ships cell so opponent can see the ship
                moveResult = 'destroyed';
                boardTemp.forEach((row, rowIndex) => { //Search every board cell containing the destroyed ship
                    row.forEach((cell, colIndex) => {
                        if (cell.ship === cellShipId)
                            affectedCells.push({ row: rowIndex, col: colIndex, ship: cell.ship, hit: true, });
                    });
                });
            }
            else
                affectedCells.push({ row: move.row, col: move.col, ship: 'unknown', hit: true, });
        }
        else { //If opponent hit an empty cell send result
            moveResult = 'miss';
            affectedCells.push({ row: move.row, col: move.col, ship: false, hit: true });
        }

        movesHistoryTemp.push({ player: this.props.opponent.peer, row: move.row, col: move.col, result: moveResult });

        this.props.opponent.send(affectedCells);
        this.setState((prevState) => ({
            localPlayerBoard: boardTemp, localPlayerShips: shipsListTemp, localPlayerTurn: !prevState.localPlayerTurn, movesHistory: movesHistoryTemp,
            localPlayerHealthPoints: boardTemp[move.row][move.col].ship ? prevState.localPlayerHealthPoints - 1 : prevState.localPlayerHealthPoints
        }),
            () => this.checkWinner()
        ); //After setting state, check winner
    }

    sendMove(row, col) {
        if (this.state.localPlayerTurn) {
            if (!this.state.opponentBoard[row][col].hit) {
                this.setState({ lastLocalPlayerMove: { row: row, col: col } }); //Add partial move to movesHistory (only coordinates, wait for result)

                this.props.opponent.send({ row: row, col: col });
            }
            else
                this.setState({ errorMsg: 'Hai già colpito quella casella' });
        }
    }

    checkWinner(winner) {
        if (this.props.isHost) { //Compute winner only if local player is host
            if (this.state.localPlayerHealthPoints === 0) {
                this.props.opponent.send(this.props.opponent.peer);
                this.setState({ winner: this.props.opponent.peer });
            }
            else if (this.state.opponentHealthPoints === 0) {
                this.props.opponent.send(this.props.peer.id);
                this.setState({ winner: 'local' });
            }
            else return null;
        }
        else { //Receive winner if local player isn't host
            if (winner === this.props.peer.id)
                this.setState({ winner: 'local' });
            else if (winner === this.props.opponent.peer)
                this.setState({ winner: this.props.opponent.peer });
        }
    }

    render() {
        const { winner, localPlayerTurn, gameStarted, localPlayerReady, opponentReady, localPlayerBoard, opponentBoard, errorMsg, movesHistory } = this.state;
        let status;
        let backButton = null;
        if (winner) { //If there is a winner, prepare new page title and button to go back to lobby
            status = winner === 'local' ? 'Partita terminata!\nHai vinto!' : 'Partita terminata!\nHa vinto ' + winner;
            backButton = <button onClick={() => { this.props.opponent.close() }}>Torna alla lobby</button>
        }
        else
            status = localPlayerTurn ? 'È il tuo turno' : 'È il turno di ' + this.props.opponent.peer

        if (!gameStarted) //If gama hasn't started, show board for ship placement
            return (<div>
                <BoardInitializer confirm={this.initializeLocalPlayerBoard} />
                {localPlayerReady ? 'Pronto! In attesa dell\'avversario...' : ''} <br />
                {opponentReady ? 'L\'avversario è Pronto!' : ''}
            </div>);
        else        //Else show boards and history
            return (<div id="game">
                <div id="left">
                    <h2>{status}</h2>
                    <h3>Griglia dell'avversario</h3>
                    <Board cells={opponentBoard} onClick={winner ? () => { } : this.sendMove} />
                    <p className="error">{errorMsg}</p>
                    <h3>Tua griglia</h3>
                    <Board cells={localPlayerBoard} onClick={() => { return; }} />
                </div>
                <div id="right">
                    <h3>Cronologia</h3>
                    <MovesHistory moves={movesHistory} />
                    {backButton}
                </div>
            </div>)
    }
}

export default Game