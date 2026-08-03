var ATS_ATIVIDADE_TENTATIVA_CONTATO = 4;
var ATS_ATIVIDADE_OPORTUNIDADE_GERADA = 19;
var ATS_ATIVIDADE_PROPOSTA_COMERCIAL = 21;
var ATS_ATIVIDADE_PARCEIRO = 72;
var ATS_TABELA_TENTATIVAS = "tbTentativasContato";

function afterTaskSave(colleagueId, nextSequenceId, userList) {
    var numSolicitacao = getValue("WKNumProces");
    var atividadeAtual = parseInt(getValue("WKNumState"), 10);
    var completandoAtividade = atsTarefaEstaSendoConcluida();
    var acaoFluxo = atsTexto(
        hAPI.getCardValue("acao_fluxo_comercial")
    );
    var perdendoLead = acaoFluxo == "LEAD_PERDIDO";
    var nutrindoLead = acaoFluxo == "NUTRICAO";
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
        + " | Ação comercial: "
        + acaoFluxo
    );

    try {
        if (atividadeAtual == ATS_ATIVIDADE_TENTATIVA_CONTATO) {
            atsAtualizarResumoContato(
                numSolicitacao,
                completandoAtividade,
                perdendoLead,
                nutrindoLead,
                prefixoLog
            );
        } else if (
            completandoAtividade
            && perdendoLead
            && atsEhAtividadeComercial(atividadeAtual)
        ) {
            hAPI.setCardValue("status_lead", "PERDIDO");
        } else if (
            completandoAtividade
            && nutrindoLead
            && atsEhAtividadeComercial(atividadeAtual)
        ) {
            hAPI.setCardValue("status_lead", "NUTRICAO");
        }

        if (
            completandoAtividade
            && perdendoLead
            && atsEhAtividadeComercial(atividadeAtual)
        ) {
            atsLimparCamposPendentes();
        }
    } catch (e) {
        log.error(
            prefixoLog
            + " | Erro ao atualizar a solicitação "
            + numSolicitacao
            + ": "
            + e
        );

        throw e;
    }
}

function atsAtualizarResumoContato(
    numSolicitacao,
    completandoAtividade,
    perdendoLead,
    nutrindoLead,
    prefixoLog
) {
    var dataHoraAtual = atsFormatarDataHoraAtual();

    hAPI.setCardValue(
        "atividade_atual",
        String(ATS_ATIVIDADE_TENTATIVA_CONTATO)
    );

    if (atsTexto(hAPI.getCardValue("numero_solicitacao")) == "") {
        hAPI.setCardValue(
            "numero_solicitacao",
            String(numSolicitacao)
        );
    }

    if (atsTexto(hAPI.getCardValue("data_inicio_contato")) == "") {
        hAPI.setCardValue(
            "data_inicio_contato",
            dataHoraAtual
        );
    }

    var resumo = atsCalcularResumoTentativas();

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

    if (completandoAtividade && perdendoLead) {
        hAPI.setCardValue("status_lead", "PERDIDO");
    } else if (completandoAtividade && nutrindoLead) {
        hAPI.setCardValue("status_lead", "NUTRICAO");
    } else if (completandoAtividade) {
        hAPI.setCardValue(
            "status_lead",
            "CONTATO_FINALIZADO"
        );
    } else {
        hAPI.setCardValue("status_lead", "EM_CONTATO");
    }

    if (
        completandoAtividade
        && atsTexto(hAPI.getCardValue("data_fim_contato")) == ""
    ) {
        hAPI.setCardValue(
            "data_fim_contato",
            atsFormatarDataHoraAtual()
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
}

function atsCalcularResumoTentativas() {
    var indices = atsObterIndicesTentativas();
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
            ultimaData = atsTexto(
                hAPI.getCardValue("tent_data___" + indice)
            );
            ultimoMeio = atsTexto(
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

function atsObterIndicesTentativas() {
    var resultado = [];
    var indices = hAPI.getChildrenIndexes(
        ATS_TABELA_TENTATIVAS
    );

    if (indices == null) {
        return resultado;
    }

    for (var i = 0; i < indices.length; i++) {
        resultado.push(String(indices[i]));
    }

    return resultado;
}

function atsLimparCamposPendentes() {
    hAPI.setCardValue("motivo_perda_codigo", "");
    hAPI.setCardValue("motivo_perda_texto", "");
    hAPI.setCardValue("perda_chave_pendente", "");
}

function atsEhAtividadeComercial(atividadeAtual) {
    return atividadeAtual == ATS_ATIVIDADE_TENTATIVA_CONTATO
        || atividadeAtual == ATS_ATIVIDADE_OPORTUNIDADE_GERADA
        || atividadeAtual == ATS_ATIVIDADE_PROPOSTA_COMERCIAL
        || atividadeAtual == ATS_ATIVIDADE_PARCEIRO;
}

function atsTarefaEstaSendoConcluida() {
    var valor = getValue("WKCompletTask");

    return valor === true
        || String(valor).toLowerCase() == "true";
}

function atsTexto(valor) {
    if (valor == null) {
        return "";
    }

    return String(valor).replace(/^\s+|\s+$/g, "");
}

function atsFormatarDataHoraAtual() {
    var formato = new java.text.SimpleDateFormat(
        "yyyy-MM-dd HH:mm:ss"
    );

    return formato.format(new java.util.Date());
}
