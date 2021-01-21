import React from 'react';
import ReactDOM from 'react-dom';
import Peer from 'peerjs';

class Lobby extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            isInGame: false,
            peer: null,
            peerId: null,
            challengeRequests: null
        }
        this.handleLoginRequest = this.handleLoginRequest.bind(this);
    }

    handleLoginRequest(newPeer){
        this.setState({peer: newPeer});
    }

    render(){
        let formLogin=null;
        let pageTitle=null;
        let opponentsList=null;
        
        if(!this.state.peer){
            pageTitle = 'Log In';
            formLogin = <LoginForm onClick={this.handleLoginRequest}/>
        }
        else{
            pageTitle = 'You are now logged in as ' + this.state.peer.id;
            opponentsList = <PlayersList peer={this.state.peer} refresh={()=>this.handlePlayerListRefresh()}/>
        }
        
        
        
        return(
            <div>
                <h1>{pageTitle}</h1>
                {formLogin}
                {opponentsList}
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
        const peer = new Peer(username,
            {host:'peerjs-server-battaglia-navale.herokuapp.com', 
            secure:true,
            port:443})
        
        this.props.onClick(peer);
    }

    handleLoginRequest(){
        const user = this.state.username;

        if(!user)
            this.setState({loginError:'Insert a Username'})
        else if(user==='')
            this.setState({loginError:'Insert a Username'})
        else if(user.length<5)
            this.setState({loginError:'Username must contain at least 5 characters'})
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

class PlayersList extends React.Component {
    constructor(props){
        super(props)
        this.state ={
            list:null,
        }
        this.refreshList = this.refreshList.bind(this);
        this.refreshList();
    }
    
    componentDidMount() {
        this.timerID = setInterval(() => this.refreshList(), 3000);
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
                allPeers.splice(currentPeerIndex,1);} //Remove current player from matchmaking list
            this.setState({list:allPeers});
        });
    }

    render(){
        let opponents = [];
        let listTemp = this.state.list;
        if(listTemp){
            this.state.list.forEach(element => {
                opponents.push(<li key={element} value={element}>{element}</li>);
            });
        }

        return(
            <div className="players-list">
                <h3>Connected players:</h3>
                <ul>
                    {opponents.length>0 ? opponents : 'No other players connected'}
                </ul>
            </div>
        )
    }

}

export default Lobby