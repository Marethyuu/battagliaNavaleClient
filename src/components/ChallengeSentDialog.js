function ChallengeSentDialog(props) {
    const requestTemp = props.opponent;
    const title = <h3>Richieste di sfida:</h3>;
    let content;

    if (requestTemp) {
        content = (
            <p value={requestTemp.peer}>
                Hai sfidato {requestTemp.peer}! In attesa di risposta...
                <button onClick={() => props.onClick()}>Annulla</button>
            </p>
        )
    }

    return (
        <div className="challenge-request-request">
            {title}
            {content}
        </div>
    );
}

export default ChallengeSentDialog;