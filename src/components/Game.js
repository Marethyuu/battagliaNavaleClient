import React from 'react';
import ReactDOM from 'react-dom';
import Board from './Board';



class Game extends React.Component {
    constructor(props){
        super(props)
        this.state ={
        }
    }

    componentDidMount(){
        this.props.opponent.on('close', () => this.props.onOpponentDisconnect())
    }

    componentWillUnmount(){
        this.props.opponent.off();
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