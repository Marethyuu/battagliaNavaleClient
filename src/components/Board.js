import React from 'react';

function Cell(props) {
    let cssClass = "cell";

    if (props.ship) {
        if (props.ship === "unknown")
            cssClass = "cell hit";
        else
            cssClass = "cell ship";
    }

    return (
        <button
            className={cssClass}
            onClick={props.onClick}
        >
            {props.value ? "X" : ""}
        </button>
    );
}

class Board extends React.Component {

    handleClick(row, col) {
        this.props.onClick(row, col);
    }

    renderRow(row, rowindex) {
        return (
            <div className="board-row" key={rowindex}>  <div className="row-index">{rowindex + 1}</div>
                {
                    row.map((cell, colindex) => {
                        return this.renderCell(rowindex, colindex);
                    })
                } </div>
        )
    }

    renderCell(row, col) {
        return (
            <Cell
                key={row.toString() + col.toString()}
                value={this.props.cells[row][col].hit}
                ship={this.props.cells[row][col].ship}
                onClick={() => this.handleClick(row, col)}
            />
        );
    }

    render() {
        return (
            <div className="board">
                <div className="board-row" id="column-index-row">
                    <div className="col-index"></div>
                    <div className="col-index">A</div>
                    <div className="col-index">B</div>
                    <div className="col-index">C</div>
                    <div className="col-index">D</div>
                    <div className="col-index">E</div>
                    <div className="col-index">F</div>
                    <div className="col-index">G</div>
                    <div className="col-index">H</div>
                    <div className="col-index">I</div>
                    <div className="col-index">J</div>
                </div>
                <div className="board-row">
                    {
                        this.props.cells.map((row, rowindex) => {
                            return this.renderRow(row, rowindex);
                        })
                    }
                </div>
            </div>
        )
    }


}

export default Board