var ATIVIDADE_TENTATIVA_CONTATO = 4;
var TABELA_TENTATIVAS = "tbTentativasContato";

function afterTaskSave(colleagueId, nextSequenceId, userList) {
    var numSolicitacao = getValue("WKNumProces");
    var atividadeAtual = parseInt(getValue("WKNumState"), 10);
    var completandoAtividade = tarefaEstaSendoConcluida();
    var prefixoLog = ">>> [IRHO-LEADS] afterTaskSave";

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
    );

    if (atividadeAtual != ATIVIDADE_TENTATIVA_CONTATO) {
        return;
    }

    try {
        var dataHoraAtual = formatarDataHoraAtual();

        hAPI.setCardValue(
            "atividade_atual",
            String(atividadeAtual)
        );

        if (texto(hAPI.getCardValue("numero_solicitacao")) == "") {
            hAPI.setCardValue(
                "numero_solicitacao",
                String(numSolicitacao)
            );
        }

        if (texto(hAPI.getCardValue("data_inicio_contato")) == "") {
            hAPI.setCardValue(
                "data_inicio_contato",
                dataHoraAtual
            );
        }
        var resumo = calcularResumoTentativas();

        hAPI.setCardValue(
            "total_tentativas",
            String(resumo.total)
        );



        hAPI.setCardValue(
            "ultima_tent_data",
            resumo.ultimaData
        );

        hAPI.setCardValue(
            "ultima_tent_meio",
            resumo.ultimoMeio
        );

        hAPI.setCardValue(
            "acao_atividade",
            completandoAtividade ? "MOVIMENTAR" : "SALVAR"
        );

        if (completandoAtividade) {
            hAPI.setCardValue(
                "status_lead",
                "CONTATO_FINALIZADO"
            );

            if (texto(hAPI.getCardValue("data_fim_contato")) == "") {
                hAPI.setCardValue(
                    "data_fim_contato",
                    formatarDataHoraAtual()
                );
            }
        } else {
            hAPI.setCardValue(
                "status_lead",
                "EM_CONTATO"
            );
        }

        log.info(
            prefixoLog
            + " | Resumo atualizado. Total: "
            + resumo.total
            + " | Último meio: "
            + resumo.ultimoMeio
            + " | Última data: "
            + resumo.ultimaData
        );
    } catch (e) {
        log.error(
            prefixoLog
            + " | Erro ao atualizar o resumo da solicitação "
            + numSolicitacao
            + ": "
            + e
        );

        throw e;
    }
}

function calcularResumoTentativas() {
    var indices = obterIndicesTentativas();
    var ultimaOrdem = -1;
    var ultimaData = "";
    var ultimoMeio = "";

    for (var i = 0; i < indices.length; i++) {
        var indice = indices[i];

        var ordem = parseInt(
            hAPI.getCardValue("tent_ordem___" + indice),
            10
        );

        if (isNaN(ordem)) {
            ordem = i + 1;
        }

        if (ordem >= ultimaOrdem) {
            ultimaOrdem = ordem;

            ultimaData = texto(
                hAPI.getCardValue("tent_data___" + indice)
            );

            ultimoMeio = texto(
                hAPI.getCardValue("tent_meio___" + indice)
            );
        }
    }

    return {
        total: indices.length,
        ultimaData: ultimaData,
        ultimoMeio: ultimoMeio
    };
}

function obterIndicesTentativas() {
    var resultado = [];
    var indices = hAPI.getChildrenIndexes(TABELA_TENTATIVAS);

    if (indices == null) {
        return resultado;
    }

    for (var i = 0; i < indices.size(); i++) {
        resultado.push(String(indices.get(i)));
    }

    return resultado;
}

function tarefaEstaSendoConcluida() {
    var valor = getValue("WKCompletTask");

    return (
        valor === true
        || String(valor).toLowerCase() == "true"
    );
}

function texto(valor) {
    if (valor == null) {
        return "";
    }

    return String(valor).replace(/^\s+|\s+$/g, "");
}

function formatarDataHoraAtual() {
    var formato = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    return formato.format(new java.util.Date());
}
