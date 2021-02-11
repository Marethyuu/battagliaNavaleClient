function MovesHistory(props) {
    const movesArray = [];

    let player = null;
    let target = null;
    let result = null;

    if (props.moves.length === 0)
        return null;

    props.moves.forEach(move => {
        player = move.player === 'local' ? 'Tu' : move.player;
        target = String.fromCharCode(65 + move.col) + (move.row + 1).toString();
        if (move.result === 'miss')
            result = 'Mancato...';
        else if (move.result === 'hit')
            result = 'Colpito!';
        else if (move.result === 'destroyed')
            result = 'Colpito e affondato!';
        movesArray.push(<p><b>{player}:</b> {target}.   {result}</p>);
    });

    return (
        <div id="history-internal">
            {movesArray.reverse()}
        </div>
    );
}

export default MovesHistory