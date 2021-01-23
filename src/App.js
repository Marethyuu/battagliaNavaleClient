import React from 'react';
import ReactDOM from 'react-dom';
import Peer from 'peerjs';
import Lobby from './components/Lobby';
import Game from './components/Game';

class App extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            peer: null, //Peer is the local player
            opponent: null,
        }
        this.setPlayers = this.setPlayers.bind(this);
    }

    setPlayers(newPeer, newOpponent){
        if(newPeer && newOpponent)
            this.setState({peer:newPeer, opponent:newOpponent});
    }


    render(){

        if(!this.state.peer && !this.state.opponent)
            return (<Lobby setPlayers={this.setPlayers}/>);
        else
            return(<Game />);
    }
}

export default App