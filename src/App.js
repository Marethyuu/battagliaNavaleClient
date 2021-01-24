import React from 'react';
import ReactDOM from 'react-dom';
import Lobby from './components/Lobby';
import Game from './components/Game';
import LoginForm from './components/LoginForm';

class App extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            localPlayer: null, //localPlayer is the local player
            remotePlayer: null,
        }
        this.setRemotePlayer = this.setRemotePlayer.bind(this);
        this.gameClosed = this.gameClosed.bind(this);
        this.handleLoginRequest = this.handleLoginRequest.bind(this);
    }

    handleLoginRequest(newlocalPlayer){
        this.setState({localPlayer: newlocalPlayer});        
    }
    
    setRemotePlayer(newRemotePlayer){
        this.setState({remotePlayer:newRemotePlayer});
    }

    gameClosed(){
        this.setState({remotePlayer:null});
    }

    render(){
        if(!this.state.localPlayer) //First step: set the local localPlayer with a login procedure
            return (<LoginForm onClick={this.handleLoginRequest}/>);
        else if(!this.state.remotePlayer) //Second step: set the remotePlayer
            return (<Lobby peer={this.state.localPlayer} setOpponent={this.setRemotePlayer}/>);
        else //If localPlayer and remotePlayer are set, start game
            return (<Game onOpponentDisconnect={this.gameClosed} peer={this.state.localPlayer} opponent={this.state.remotePlayer}/>);
    }
}

export default App