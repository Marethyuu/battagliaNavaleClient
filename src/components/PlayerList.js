import React from 'react';

class PlayerList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            list: null,
            challengeError: '',
        }
        this.refreshList = this.refreshList.bind(this);
    }

    componentDidMount() {
        this.timerID = setInterval(() => this.refreshList(), 2000);
        this.refreshList();

    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    refreshList() {
        let currentPeerIndex = null;
        const currentPeerId = this.props.peer.id;

        this.props.peer.listAllPeers((allPeers) => {
            currentPeerIndex = allPeers.indexOf(currentPeerId);
            if (currentPeerIndex !== -1) {
                allPeers.splice(currentPeerIndex, 1);
            } //Remove current player from matchmaking request
            this.setState({ list: allPeers });
        });
    }

    render() {
        let players = [];
        const listTemp = this.state.list;
        let challengeButton;
        if (listTemp) {
            this.state.list.forEach(element => {
                challengeButton = <button onClick={() => this.props.onClick(element)} value={element}>Sfida</button>;
                players.push(<li key={element} value={element}>{element} {challengeButton}</li>);
            });
        }

        return (
            <div className="players-request">
                <h3>Giocatori connessi:</h3>
                <ul>
                    {players.length > 0 ? players : 'Nessun altro giocatore connesso'}
                </ul>
                <p className="error">{this.state.challengeError}</p>
            </div>
        )
    }
}

export default PlayerList