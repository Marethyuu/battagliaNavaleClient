import React from 'react';
import Peer from 'peerjs'

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

            peer.on('error', (error) => {this.setState({loginError: 'Nome utente già preso'})})
            peer.on('open', () => {peer.off('connection open close data error'); this.props.onClick(peer);});
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
                <h1>Scegli un nome utente:</h1>
                <input type="text" value={this.username} onChange={this.handleChange}/>
                <input type="button" onClick={this.handleLoginRequest} value="Entra"/>
                <br/>
                <label className="lbl-error-login">{this.state.loginError}</label>
            </div>
            
        )
    }
}

export default LoginForm