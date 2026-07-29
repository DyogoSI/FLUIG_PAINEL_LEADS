function beforeStateEntry(sequenceId) {
    var numeroSolicitacao = getValue("WKNumProces");

    log.info(
        ">>> [IRHO-LEADS] beforeStateEntry"
        + " | Solicitação: "
        + numeroSolicitacao
        + " | Destino: "
        + sequenceId
    );
}