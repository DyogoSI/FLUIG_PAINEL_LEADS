var ATIVIDADE_TENTATIVA_CONTATO = 4;

function beforeTaskSave(
    colleagueId,
    nextSequenceId,
    userList
) {
    var numSolicitacao =
        getValue("WKNumProces");

    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );

    var completandoAtividade =
        tarefaEstaSendoConcluida();

    var prefixoLog =
        ">>> [IRHO-LEADS] beforeTaskSave";

    log.info(
        prefixoLog
        + " | Solicitação: "
        + numSolicitacao
        + " | Atividade atual: "
        + atividadeAtual
        + " | Destino: "
        + nextSequenceId
        + " | Completando: "
        + completandoAtividade
        + " | Usuário: "
        + colleagueId
    );

    if (
        atividadeAtual
        != ATIVIDADE_TENTATIVA_CONTATO
    ) {
        return;
    }

    /*
     * A validação dos campos e da tabela pai x filho
     * ocorre no validateForm.js.
     *
     * Este evento apenas registra qual ação foi executada.
     */
    hAPI.setCardValue(
        "acao_atividade",
        completandoAtividade
            ? "MOVIMENTAR"
            : "SALVAR"
    );
}

function tarefaEstaSendoConcluida() {
    var valor = getValue(
        "WKCompletTask"
    );

    return valor === true
        || String(valor).toLowerCase()
            == "true";
}