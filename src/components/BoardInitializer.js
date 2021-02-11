import React from 'react';
import Board from './Board';



class BoardInitializer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            board: new Array(10).fill(null).map(() => new Array(10).fill(null).map(() => ({ hit: false, ship: null }))),
            ships: [{ id: '5', size: 5 }, { id: '4', size: 4 }, { id: '3_1', size: 3 }, { id: '3_2', size: 3 }, { id: '2', size: 2 }],
            index: 0,
            firstSidePlaced: { row: null, col: null },
            validMoves: null,
            errorMsg: '',
        }
        this.computeValidMoves = this.computeValidMoves.bind(this);
        this.checkPlacementValidity = this.checkPlacementValidity.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.isBoardInitialized = this.isBoardInitialized.bind(this);
    }

    //After setting the first square of the ship, compute the list of valid last squares 
    computeValidMoves(row, col) {
        const { ships, index } = this.state;
        let validMoves = [];
        let shipSize = ships[index].size - 1;  //The -1 is needed for correct distance calculations
        let boardTemp = this.state.board.slice();
        let valid = true;
        let errorMsg = '';

        if (col - shipSize >= 0 && !boardTemp[row][col - shipSize].ship) { //If cell positioned 'shipSize' cells to the left is free, check intermediate cells
            for (let i = 1; i < shipSize; i++) {
                if (boardTemp[row][col - i].ship)
                    valid = false;
            }
            if (valid)
                validMoves.push({ row: row, col: col - shipSize });
        }
        if (col + shipSize <= 9 && !boardTemp[row][col + shipSize].ship) { //If cell positioned 'shipSize' cells to the right is free, check intermediate cells
            valid = true;
            for (let i = 1; i < shipSize; i++) {
                if (boardTemp[row][col + i].ship)
                    valid = false;
            }
            if (valid)
                validMoves.push({ row: row, col: col + shipSize });
        }
        if (row - shipSize >= 0 && !boardTemp[row - shipSize][col].ship) { //If cell positioned 'shipSize' cells above is free, check intermediate cells
            valid = true;
            for (let i = 1; i < shipSize; i++) {
                if (boardTemp[row - i][col].ship)
                    valid = false;
            }
            if (valid)
                validMoves.push({ row: row - shipSize, col: col });
        }
        if (row + shipSize <= 9 && !boardTemp[row + shipSize][col].ship) { //If cell positioned 'shipSize' cells below is free, check intermediate cells
            valid = true;
            for (let i = 1; i < shipSize; i++) {
                if (boardTemp[row + i][col].ship)
                    valid = false;
            }
            if (valid)
                validMoves.push({ row: row + shipSize, col: col });
        }

        if (validMoves.length === 0) { //If no valid moves possible, cancel last move
            errorMsg = 'Posizione non valida';
            validMoves = null;
        }
        else
            boardTemp[row][col].ship = ships[index].id;
        this.setState({ board: boardTemp, firstSidePlaced: { row: row, col: col }, validMoves: validMoves, errorMsg: errorMsg });
    }

    //When the player attempts to put down the final square of the ship, check if it's valid
    checkPlacementValidity(endRow, endCol) {
        const { validMoves, ships, index } = this.state;

        let startRow = this.state.firstSidePlaced.row;
        let startCol = this.state.firstSidePlaced.col;

        let diffRow = endRow - startRow;
        let diffCol = endCol - startCol;

        let valid = true;
        let boardTemp = this.state.board.slice();

        if (validMoves.find(move => move.row === endRow && move.col === endCol)) {

            if (diffRow === 0) { //Horizontal placement
                if (diffCol > 0) { //Left to right
                    for (let i = 0; i <= diffCol; i++) {
                        boardTemp[startRow][startCol + i].ship = ships[index].id;
                    }
                    if (valid)
                        this.setState((prevState) => { return ({ board: boardTemp, index: prevState.index + 1, validMoves: null, firstSidePlaced: null }) }, () => this.isBoardInitialized());
                }
                else {   //Right to left
                    for (let i = 0; i <= -diffCol; i++) {
                        boardTemp[startRow][endCol + i].ship = ships[index].id;
                    }
                    if (valid)
                        this.setState((prevState) => { return ({ board: boardTemp, index: prevState.index + 1, validMoves: null, firstSidePlaced: null }) }, () => this.isBoardInitialized());
                }
            }
            else { //Vertical placement
                if (diffRow > 0) { //Top to bottom
                    for (let i = 0; i <= diffRow; i++) {
                        boardTemp[startRow + i][startCol].ship = ships[index].id;
                    }
                    if (valid)
                        this.setState((prevState) => { return ({ board: boardTemp, index: prevState.index + 1, validMoves: null, firstSidePlaced: null }) }, () => this.isBoardInitialized());
                }
                else {   //Bottom to top
                    for (let i = 0; i <= -diffRow; i++) {
                        boardTemp[endRow + i][startCol].ship = ships[index].id;
                    }
                    if (valid)
                        this.setState((prevState) => { return ({ board: boardTemp, index: prevState.index + 1, validMoves: null, firstSidePlaced: null }) }, () => this.isBoardInitialized());
                }
            }
        }
    }

    handleClick(row, col) {
        const { validMoves, ships, index } = this.state;

        if (index < ships.length) { //If not all ships have been placed
            let shipId = ships[index].id;
            let boardTemp = this.state.board.slice();

            if (!boardTemp[row][col].ship) {  //If clicked cell is empty
                if (!validMoves) { //If it's the first side of the current ship 
                    this.computeValidMoves(row, col);
                }
                else { //If it's the second side of the current ship
                    this.checkPlacementValidity(row, col);
                }
            }
            else { //If clicked cell is not empty
                if (boardTemp[row][col].ship === shipId) { //If user clicked on the first side of the ship he's placing, remove side previously set
                    boardTemp[row][col].ship = null;
                    this.setState({ board: boardTemp, firstSidePlaced: { row: null, col: null }, validMoves: null, errorMsg: '' });
                }
                else {
                    this.setState({ errorMsg: 'Cella non valida' });
                }
            }
        }
    }

    isBoardInitialized() { //If every ship has been placed, confirm and send to upper component
        if (this.state.index >= this.state.ships.length)
            this.props.confirm(this.state.board);
    }


    render() {
        const { board, ships, index, errorMsg } = this.state;
        let placeShipMsg = '';
        if (index < ships.length) {
            placeShipMsg = <h3>Posiziona la nave da {ships[index].size} caselle</h3>
        }

        return (
            <div>
                <Board cells={board} onClick={this.handleClick} />
                {placeShipMsg}
                {<p>Per posizionare una nave, clicca sulla cella di partenza poi quella di fine</p>}
                <p class="error">{errorMsg}</p>
            </div>
        );
    }
}

export default BoardInitializer