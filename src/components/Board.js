import React from 'react';
import ReactDOM from 'react-dom';

function Cell(props) {
    return (
        <button 
        className="cell" 
        onClick={props.onClick}
        >
          {props.value}
        </button>
      );
  }

class Board extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            cells: new Array(10).fill(null).map(() => new Array(10).fill(null))
        }
    }

    handleClick(x,y){
        const cells = this.state.cells.slice();
        cells[x][y] = "X";
        this.setState({cells : cells});
    }

    renderRow(row, rowindex){
        return (
            <div class="board-row">  <div class="row-index">{rowindex}</div>
            {
                row.map((cell, colindex) => {
                return this.renderCell(rowindex,colindex);
            })
        } </div>
        )
    }

    renderCell(x,y){
        return ( 
            <Cell 
            value={this.state.cells[x][y]}
            onClick={() => this.handleClick(x,y)}
            />
          );
    }

    render(){
        return(
            <div id="board">
                <div class="board-row" id="column-index-row">
                    <div class="col-index"></div>
                    <div class="col-index">A</div>
                    <div class="col-index">B</div>
                    <div class="col-index">C</div>
                    <div class="col-index">D</div>
                    <div class="col-index">E</div>
                    <div class="col-index">F</div>
                    <div class="col-index">G</div>
                    <div class="col-index">H</div>
                    <div class="col-index">I</div>
                    <div class="col-index">J</div>
                </div>
                <div class="board-row">   
                {
                    this.state.cells.map((row, rowindex) => {
                        return this.renderRow(row, rowindex);
                    })
                }
                </div>
            </div>
        )
    }


    }

    export default Board