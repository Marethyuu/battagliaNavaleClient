import React from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import LoginForm from './components/LoginForm';

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            localPlayer: null,
            remotePlayer: null,
            localPlayerIsHost: false,
        }
    }

    handleLoginRequest = newlocalPlayer => {
        this.setState({ localPlayer: newlocalPlayer });
    }

    setRemotePlayer = (newRemotePlayer, localPlayerIsHost) => {
        this.setState({ remotePlayer: newRemotePlayer, localPlayerIsHost: localPlayerIsHost });
    }

    gameClosed = () => {
        alert('Avversario Disconnesso!');
        this.setState({ remotePlayer: null });
    }

    render() {
        if (!this.state.localPlayer) //First step: set the local localPlayer with a login procedure
            return (<LoginForm onClick={this.handleLoginRequest} />);
        else if (!this.state.remotePlayer) //Second step: set the remotePlayer
            return (<Lobby peer={this.state.localPlayer} setOpponent={this.setRemotePlayer} />);
        else //If localPlayer and remotePlayer are set, start game
            return (<Game onOpponentDisconnect={this.gameClosed} peer={this.state.localPlayer} opponent={this.state.remotePlayer} isHost={this.state.localPlayerIsHost} />);
    }
}

export default App