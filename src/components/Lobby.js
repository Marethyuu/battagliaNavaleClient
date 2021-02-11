import React from 'react';
import PlayerList from './PlayerList';
import ChallengeReceivedDialog from './ChallengeReceivedDialog';
import ChallengeSentDialog from './ChallengeSentDialog';

class Lobby extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            opponent: null,
            errorMsg: '',
            challengeRequestType: '', //Can be 'sent' or 'received'
        }
        this.handleChallengeReceived = this.handleChallengeReceived.bind(this);
        this.sendChallengeRequest = this.sendChallengeRequest.bind(this);
        this.retireChallengeRequest = this.retireChallengeRequest.bind(this);
        this.sendChallengeResponse = this.sendChallengeResponse.bind(this);
    }

    componentDidMount() {
        this.props.peer.on('connection', (conn) => this.handleChallengeReceived(conn));
    }

    componentWillUnmount() {
        this.props.peer.off('connection');
        if (this.state.opponent) {
            this.state.opponent.off();
        }

        this.setState = (state, callback) => {
            return;
        };
    }

    sendChallengeRequest(opponentId) { //Only 1 challenge can be sent/received at a time
        if (!this.state.opponent) {
            let conn = this.props.peer.connect(opponentId); //Connect to opponent and set listeners for response and connection closing
            conn.on('open', () => {
                conn.on('data', (data) => this.handleChallengeResponse(data));
                conn.on('close', () => this.handleConnectionClose('rejected'));
                this.setState({ opponent: conn, challengeRequestType: 'sent', errorMsg: '' });
            })
        }
        this.setState({ errorMsg: 'Quell\'utente ha già ricevuto una sfida o è già in una partita' });
    }


    handleChallengeReceived(conn) { //Handle challenge request received
        if (this.state.opponent) {  //If there is already a challenge sent/received, close the new connection
            conn.close();
        }
        else {
            conn.on('close', () => this.handleConnectionClose('retired'));
            this.setState({ opponent: conn, challengeRequestType: 'received', errorMsg: '' });
        }
    }

    sendChallengeResponse(response) {
        if (response) {
            if (response === 'accept') {
                this.state.opponent.send('accept');
                //this.props.setPlayers(this.props.peer, this.state.opponent); //GAME START
                this.gameStart(false);
            }
            else if (response === 'deny') {
                this.state.opponent.close();
                this.setState({ opponent: null, errorMsg: 'Sfida rifiutata' })
            }

        }
    }

    handleChallengeResponse(response) {
        if (response) {
            if (response === 'accept') {
                //this.props.setPlayers(this.props.peer, this.state.opponent); //GAME START
                this.gameStart(true);
            }
        }
    }

    retireChallengeRequest() {
        if (this.state.opponent) {
            this.state.opponent.close();
            this.setState({ opponent: null, errorMsg: 'Sfida annullata' });
        }
    }

    handleConnectionClose(cause) {
        let errorMsg;
        if (cause === 'rejected')
            errorMsg = 'L\'avversario ha rifiutato la sfida';
        else if (cause === 'retired')
            errorMsg = 'L\'avversario ha ritirato la sfida';
        else
            errorMsg = 'Errore di connessione';

        this.setState({ opponent: null, errorMsg: errorMsg });
    }

    gameStart(localPlayerIsHost) {
        this.props.setOpponent(this.state.opponent, localPlayerIsHost);
    }

    render() {
        let title = 'Sei collegato come ' + this.props.peer.id;
        let body = null;
        let errorMsg = this.state.errorMsg;

        if (!this.state.opponent)
            body = <PlayerList peer={this.props.peer} onClick={this.sendChallengeRequest} challengeSent={this.state.opponent} />
        else if (this.state.challengeRequestType === 'received')
            body = <ChallengeReceivedDialog opponent={this.state.opponent} onClick={this.sendChallengeResponse} />
        else if (this.state.challengeRequestType === 'sent')
            body = <ChallengeSentDialog opponent={this.state.opponent} onClick={this.retireChallengeRequest} />

        return (
            <div>
                <h1>{title}</h1>
                {body}
                <p className="error">{errorMsg}</p>
            </div>
        );

    }
}

export default Lobby