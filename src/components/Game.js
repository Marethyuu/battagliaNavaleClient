import React from 'react';
import ReactDOM from 'react-dom';
import Board from './Board';



class Game extends React.Component {
    constructor(props){
        super(props)
        this.state ={
        }
    }

    render(){
        return(
            <div id="game">
            <Board />
            <Board />
            </div>
        )
    }
}

export default Game