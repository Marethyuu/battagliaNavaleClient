import React from 'react';
import ReactDOM from 'react-dom';
import Peer from 'peerjs';

class Lobby extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            peer: null,
            challengeSent: null,
            challengeReceived: null,
            errorMsg: '',
        }
        this.handleLoginRequest = this.handleLoginRequest.bind(this);
        this.handleChallenge = this.handleChallenge.bind(this);
        this.handleChallengeResponse = this.handleChallengeResponse.bind(this);
        this.sendChallengeResponse = this.sendChallengeResponse.bind(this);
    }

    handleLoginRequest(newPeer){
        this.setState({peer: newPeer}, () => {
            this.state.peer.on('connection', (conn) => this.handleChallengeReceived(conn));
        });
        
    }

    handleChallenge(opponentPeerId){ //Sends challenge request or cancels previously sent request
        let conn = this.state.peer.connect(opponentPeerId);
        if(conn && opponentPeerId!==null){
            conn.on('open', () =>{
                this.setState({challengeSent: conn, errorMsg:''});
                this.state.challengeSent.on('data', (data) => this.handleChallengeResponse(data));
                this.state.challengeSent.on('close', () => {this.state.challengeSent.close(); 
                                                            this.state.errorMsg==='' ? this.state.errorMsg='L\'utente ha già ricevuto una sfida' : this.state.errorMsg=this.state.errorMsg;
                                                            this.setState({challengeSent:null, errorMsg:'L\'utente ha già ricevuto una sfida'});
                                                        });
            })
        }
        else{
            if(this.state.challengeSent){
                this.state.challengeSent.close();
                this.setState({errorMsg:'Sfida annullata'});
            }
        }
    }

    handleChallengeReceived(conn){
        conn.on('open', () =>{
            if(!this.state.challengeReceived)
                this.setState({challengeReceived: conn});
            else
                conn.close();
                
            conn.on('close', () => {conn.close(); this.setState({challengeReceived: null})});
        })
        
    }

    handleChallengeResponse(data){
        if(data){
            if(data==='accept'){
                if(this.state.challengeReceived) //Local peer sent challenge, remote peer accepted
                    alert('GAME START | '+ this.state.peer.id + ' vs. ' + this.state.challengeReceived.peer);
                else                            //Remote peer sent challenge, local peer accepted
                    alert('GAME START | '+ this.state.peer.id + ' vs. ' + this.state.challengeSent.peer);
            }
            else if(data==='deny'){
                this.state.challengeSent.close();
                this.setState({errorMsg:'L\'utente ha rifiutato la sfida',challengeSent:null});
            }
        }
    }

    sendChallengeResponse(data){
        let opponent = this.state.challengeReceived;
        if(opponent){
            opponent.send(data);
            if(data==='accept'){
                alert('GAME START | '+ this.state.peer.id + ' vs. ' + this.state.challengeReceived.peer);
            }
            else if(data==='deny'){
                opponent.on('close', ()=> {opponent.close()});
                this.setState({challengeReceived:null});
            }
        }
    }

    render(){
        let formLogin=null;
        let pageTitle=null;
        let playerList=null;
        let challengeRequest=null;
        
        if(!this.state.peer){
            pageTitle = 'Log In';
            formLogin = <LoginForm onClick={this.handleLoginRequest}/>
        }
        else{
            pageTitle = 'Sei collegato come ' + this.state.peer.id;
            playerList = <PlayerList peer={this.state.peer} onClick={this.handleChallenge} challengeSent={this.state.challengeSent}/>
            challengeRequest = <ChallengeRequest challengeReceived={this.state.challengeReceived} onClick={this.sendChallengeResponse}/>
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
        else{
            this.setState({loginError:''});
            this.attemptLogin(user);
        }
    }
    
    render(){
        return(
            <div className="loginForm">
                <input type="text" value={this.username} onChange={this.handleChange}/>
                <input type="button" onClick={this.handleLoginRequest} value="Login"/>
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

class ChallengeRequest extends React.Component {

    render(){
        let requestTemp = this.props.challengeReceived;
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

export default Lobby