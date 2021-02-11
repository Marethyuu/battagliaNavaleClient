function ChallengeReceivedDialog(props) {
    const requestTemp = props.opponent;
    let title;
    let content;
    if (requestTemp) {
        title = <h3>Richieste di sfida:</h3>;
        content = (<p value={requestTemp.peer}>{requestTemp.peer} ti ha sfidato!
            <button onClick={() => props.onClick('accept')}>Accetta</button>
            <button onClick={() => props.onClick('deny')}>Rifiuta</button>
        </p>)
    }
    else {
        content = <p>Nessuna sfida ricevuta</p>
    }

    return (
        <div className="challenge-request-request">
            {title}
            {content}
        </div>
    )
}

export default ChallengeReceivedDialog;