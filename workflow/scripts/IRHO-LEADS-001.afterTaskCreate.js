function afterTaskCreate(colleagueId) {
    var atividadeAtual = parseInt(getValue("WKNumState"), 10);
    var numeroSolicitacao = getValue("WKNumProces");

    log.info(
        ">>> [IRHO-LEADS] afterTaskCreate"
        + " | Solicitação: "
        + numeroSolicitacao
        + " | Atividade: "
        + atividadeAtual
        + " | Responsável: "
        + colleagueId
    );
}