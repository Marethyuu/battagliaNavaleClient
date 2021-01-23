import React from 'react';
import ReactDOM from 'react-dom';
import Peer from 'peerjs';

class Lobby extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            peer: null,
            opponent: null,
            errorMsg: '',
            challengeRequestType: '', //Can be 'sent' or 'received'
        }
        this.handleLoginRequest = this.handleLoginRequest.bind(this);
        this.handleChallengeReceived = this.handleChallengeReceived.bind(this);
        this.sendChallengeRequest = this.sendChallengeRequest.bind(this);
        this.retireChallengeRequest = this.retireChallengeRequest.bind(this);
        this.sendChallengeResponse = this.sendChallengeResponse.bind(this);
    }

    handleLoginRequest(newPeer){
        this.setState({peer: newPeer}, () => {
            this.state.peer.on('connection', (conn) => this.handleChallengeReceived(conn));
        });
        
    }

    sendChallengeRequest(opponentId){ //Only 1 challenge can be sent/received at a time
        if(!this.state.opponent){
            let conn = this.state.peer.connect(opponentId); //Connect to opponent and set listeners for response and connection closing
            conn.on('open', () => {
                conn.on('data', (data) => this.handleChallengeResponse(data));
                conn.on('close', () => this.handleConnectionClose('rejected'));
                this.setState({opponent:conn, challengeRequestType:'sent', errorMsg:''});
            })
        }
    }


    handleChallengeReceived(conn){ //Handle challenge request received
        if(this.state.opponent){  //If there is already a challenge sent/received, close the new connection
            conn.close();
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
                alert('GAME START | ' + this.state.peer.id + ' vs. ' + this.state.opponent.peer);
                this.props.setPlayers(this.state.peer, this.state.opponent);
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
                alert('GAME START | ' + this.state.peer.id + ' vs. ' + this.state.opponent.peer);
                this.props.setPlayers(this.state.peer, this.state.opponent);
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

    render(){
        let formLogin=null;
        let pageTitle=null;
        let playerList=null;
        let challengeRequest=null;
        
        if(!this.state.peer){
            pageTitle = 'Scegli un nome utente';
            formLogin = <LoginForm onClick={this.handleLoginRequest}/>
        }
        else{
            pageTitle = 'Sei collegato come ' + this.state.peer.id;
            if(!this.state.opponent)
                playerList = <PlayerList peer={this.state.peer} onClick={this.sendChallengeRequest} challengeSent={this.state.opponent}/>
            if(this.state.challengeRequestType==='received')
                challengeRequest = <ChallengeReceivedComponent opponent={this.state.opponent} onClick={this.sendChallengeResponse}/>
            else if(this.state.challengeRequestType==='sent')
                challengeRequest = <ChallengeSentComponent opponent={this.state.opponent} onClick={this.retireChallengeRequest}/>
        }
        
        return(
            <div>
                <h1>{pageTitle}</h1>
                {formLogin}
                <div id="requests">
                    {playerList}
                    {challengeRequest}
                    {this.state.errorMsg}
                </div>
            </div>
        )
    }
}

class LoginForm extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            username: null,
            loginError: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleLoginRequest = this.handleLoginRequest.bind(this);
    }

    handleChange(event){
        this.setState({username: event.target.value, loginError:''})

    }

    attemptLogin(username){
        try {
            const peer = new Peer(username,
                {host:'peerjs-server-battaglia-navale.herokuapp.com', 
                secure:true,
                port:443})

            if(!peer.id) //If server rejects connection (invalid username e.g. starting with '.' or ',')
                throw 'Username non valido';

            this.props.onClick(peer);
        } catch (error) {
            this.setState({loginError:'Username non valido'});
            console.log(error);
        }
        
    }

    handleLoginRequest(){
        const user = this.state.username.trim();

        if(!user)
            this.setState({loginError:'Inserisci un nome utente'})
        else if(user==='')
            this.setState({loginError:'Inserisci un nome utente'})
        else if(user.length<4)
            this.setState({loginError:'Il nome utente deve contenere almeno 4 caratteri'})
        else if(user.length>15)
            this.setState({loginError:'Il nome utente deve contenere al massimo 15 caratteri'})
        else{
            this.setState({loginError:''});
            this.attemptLogin(user);
        }
    }
    
    render(){
        return(
            <div className="loginForm">
                <input type="text" value={this.username} onChange={this.handleChange}/>
                <input type="button" onClick={this.handleLoginRequest} value="Entra"/>
                <br/>
                <label className="lbl-error-login">{this.state.loginError}</label>
            </div>
            
        )
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
        this.refreshList();
    }
    
    componentDidMount() {
        this.timerID = setInterval(() => this.refreshList(), 2000);
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