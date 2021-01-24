import React from 'react';
import ReactDOM from 'react-dom';
import Peer from 'peerjs';
import Game from './Game';

class Lobby extends React.Component {
    constructor(props){
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

    componentDidMount(){
        this.props.peer.on('connection', (conn) => this.handleChallengeReceived(conn));
    }

    componentWillUnmount(){
        this.props.peer.off('connection');
        if(this.state.opponent){
            this.state.opponent.off('open close data');
        }

        this.setState = (state,callback)=>{
            return;
        };
    }

    sendChallengeRequest(opponentId){ //Only 1 challenge can be sent/received at a time
        if(!this.state.opponent){
            let conn = this.props.peer.connect(opponentId); //Connect to opponent and set listeners for response and connection closing
            conn.on('open', () => {
                conn.on('data', (data) => this.handleChallengeResponse(data));
                conn.on('close', () => this.handleConnectionClose('rejected'));
                this.setState({opponent:conn, challengeRequestType:'sent', errorMsg:''});
            })  
        }
    }


    handleChallengeReceived(conn){ //Handle challenge request received
        if(this.state.opponent){  //If there is already a challenge sent/received, close the new connection
            conn.on('open', () =>{
                conn.close();
            })
        }
        else{
            conn.on('close', () => this.handleConnectionClose('retired'));
            this.setState({opponent:conn, challengeRequestType:'received', errorMsg:''});
        }
    }

    sendChallengeResponse(response){
        if(response){
            if(response==='accept'){
                this.state.opponent.send('accept');
                //this.props.setPlayers(this.props.peer, this.state.opponent); //GAME START
                this.gameStart();
            }
            else if(response==='deny'){
                this.state.opponent.close();
                this.setState({opponent:null, errorMsg:'Sfida rifiutata'})
            }
            
        }
    }

    handleChallengeResponse(response){
        if(response){
            if(response==='accept'){
                //this.props.setPlayers(this.props.peer, this.state.opponent); //GAME START
                this.gameStart();
            }
        }
    }

    retireChallengeRequest(){
        if(this.state.opponent){
            this.state.opponent.close();
            this.setState({opponent:null, errorMsg: 'Sfida annullata'});
        }
    }

    handleConnectionClose(cause){
        let errorMsg;
        if(cause==='rejected')
            errorMsg = 'L\'avversario ha rifiutato la sfida';
        else if(cause==='retired')
            errorMsg = 'L\'avversario ha ritirato la sfida';
        else
            errorMsg = 'Errore di connessione';

        this.setState({opponent:null, errorMsg:errorMsg});
    }

    gameStart(){
        this.props.setOpponent(this.state.opponent);
    }

    render(){
        let title='Sei collegato come ' + this.props.peer.id;
        let body=null;
        let errorMsg = this.state.errorMsg;

        if(!this.state.opponent)
            body=<PlayerList peer={this.props.peer} onClick={this.sendChallengeRequest} challengeSent={this.state.opponent}/>
        else if(this.state.challengeRequestType==='received')
            body=<ChallengeReceivedComponent opponent={this.state.opponent} onClick={this.sendChallengeResponse}/>
        else if(this.state.challengeRequestType==='sent')
            body=<ChallengeSentComponent opponent={this.state.opponent} onClick={this.retireChallengeRequest}/>
        
        return(
            <div>
                <h1>{title}</h1>
                {body}
                {errorMsg}
            </div>
        );

    }
}

class PlayerList extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            list:null,
            challengeError:'',
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

    refreshList(){
        let currentPeerIndex=null;
        let currentPeerId=this.props.peer.id;

        this.props.peer.listAllPeers((allPeers) => {
            currentPeerIndex = allPeers.indexOf(currentPeerId);
            if(currentPeerIndex!==-1){
                allPeers.splice(currentPeerIndex,1);} //Remove current player from matchmaking request
            this.setState({list:allPeers});
        });
    }

    render(){
        let players = [];
        let listTemp = this.state.list;
        let challengeButton;
        let challengedPlayer = this.props.challengeSent ? this.props.challengeSent.peer : null;
        if(listTemp){
            this.state.list.forEach(element => {
                challengeButton=null;
                if(!challengedPlayer){
                    challengeButton=<button onClick={() => this.props.onClick(element)} value={element}>Sfida</button>;
                }
                else if(challengedPlayer == element){
                    challengeButton=<button onClick={() => this.props.onClick(null)} value={element}>Annulla</button>;
                }
                players.push(<li key={element} value={element}>{element} {challengeButton}</li>);
            });
        }

        return(
            <div className="players-request">
                <h3>Giocatori connessi:</h3>
                <ul>
                    {players.length>0 ? players : 'Nessun altro giocatore connesso'}
                </ul>
                {this.state.challengeError}
            </div>
        )
    }
}

class ChallengeReceivedComponent extends React.Component {

    render(){
        let requestTemp = this.props.opponent;
        let title;
        let content;
        if(requestTemp){
            title=<h3>Richieste di sfida:</h3>;
            content=(<p value={requestTemp.peer}>{requestTemp.peer} ti ha sfidato!
            <button onClick={() => this.props.onClick('accept')}>Accetta</button>
            <button onClick={() => this.props.onClick('deny')}>Rifiuta</button>
            </p>)
        }
        else{
            content=<p>Nessuna sfida ricevuta</p>
        }

        return(
            <div className="challenge-request-request">
                {title}
                {content}
            </div>
        )
    }
}

class ChallengeSentComponent extends React.Component {

    render(){
        let requestTemp = this.props.opponent;
        let title=<h3>Richieste di sfida:</h3>;
        let content;

        if(requestTemp){
            content=(
                <p value={requestTemp.peer}>
                    Hai sfidato {requestTemp.peer}! In attesa di risposta...
                    <button onClick={() => this.props.onClick()}>Annulla</button>
                </p>
            )
        }

        return(
            <div className="challenge-request-request">
                {title}
                {content}
            </div>
        )
    }
}

export default Lobby