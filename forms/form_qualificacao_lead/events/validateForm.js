var VF_ATIVIDADE_INICIO = 6;
var VF_ATIVIDADE_TENTATIVA_CONTATO = 4;
var VF_ATIVIDADE_OPORTUNIDADE_GERADA = 19;
var VF_ATIVIDADE_PROPOSTA_COMERCIAL = 21;
var VF_ATIVIDADE_LEAD_PERDIDO = 26;
var VF_TABELA_TENTATIVAS = "tbTentativasContato";

function validateForm(form) {
    var atividadeAtual = parseInt(getValue("WKNumState"), 10);
    var completandoAtividade = vfTarefaEstaSendoConcluida(form);
    var acaoFluxo = vfTexto(
        form.getValue("acao_fluxo_comercial")
    );
    var perdendoLead = acaoFluxo == "LEAD_PERDIDO";
    var erros = [];

    if (
        atividadeAtual == 0
        || atividadeAtual == VF_ATIVIDADE_INICIO
    ) {
        var funilDestino = vfTexto(
            form.getValue("funil_destino")
        );

        if (
            completandoAtividade
            && funilDestino == ""
        ) {
            erros.push(
                "Selecione o funil de destino antes de avançar."
            );
        }

        if (
            completandoAtividade
            && funilDestino != ""
            && funilDestino != "CLIENTE"
        ) {
            erros.push("O funil de destino selecionado é inválido.");
        }

        vfLancarErros(erros);
        return;
    }

    if (atividadeAtual == VF_ATIVIDADE_TENTATIVA_CONTATO) {
        vfValidarTentativas(
            form,
            erros,
            completandoAtividade && !perdendoLead
        );

        if (completandoAtividade && !perdendoLead) {
            vfValidarClassificacao(form, erros);
        }
    }

    if (
        atividadeAtual == VF_ATIVIDADE_LEAD_PERDIDO
        && completandoAtividade
    ) {
        vfValidarRecuperacao(form, erros);
    }

    if (
        completandoAtividade
        && perdendoLead
        && vfEhAtividadeComercial(atividadeAtual)
    ) {
        vfValidarPerda(form, erros, atividadeAtual);
    }

    vfLancarErros(erros);
}

function vfValidarTentativas(form, erros, exigirAoMenosUma) {
    var indices = form.getChildrenIndexes(VF_TABELA_TENTATIVAS);

    if (exigirAoMenosUma && indices.length == 0) {
        erros.push(
            "Registre ao menos uma tentativa de contato antes de concluir a atividade."
        );
    }

    for (var i = 0; i < indices.length; i++) {
        var indice = indices[i];
        var numeroTentativa = i + 1;
        var meio = vfTexto(
            form.getValue("tent_meio___" + indice)
        );
        var dataTentativa = vfTexto(
            form.getValue("tent_data___" + indice)
        );
        var horaTentativa = vfTexto(
            form.getValue("tent_hora___" + indice)
        );
        var descricao = vfTexto(
            form.getValue("tent_descricao___" + indice)
        );
        var idTentativa = vfTexto(
            form.getValue("tent_id___" + indice)
        );

        form.setValue(
            "tent_ordem___" + indice,
            String(numeroTentativa)
        );

        form.setValue(
            "tent_numero___" + indice,
            numeroTentativa + "ª"
        );

        if (idTentativa == "") {
            form.setValue(
                "tent_id___" + indice,
                "TENT-" + java.util.UUID.randomUUID().toString()
            );
        }

        if (meio == "") {
            erros.push(
                "Informe o meio de contato da "
                + numeroTentativa
                + "ª tentativa."
            );
        } else if (!vfMeioContatoValido(meio)) {
            erros.push(
                "O meio de contato da "
                + numeroTentativa
                + "ª tentativa é inválido."
            );
        }

        if (dataTentativa == "") {
            erros.push(
                "Informe a data da "
                + numeroTentativa
                + "ª tentativa."
            );
        } else if (!vfDataValida(dataTentativa)) {
            erros.push(
                "Informe uma data válida no formato dd/mm/aaaa na "
                + numeroTentativa
                + "ª tentativa."
            );
        }

        if (
            horaTentativa != ""
            && !vfHoraValida(horaTentativa)
        ) {
            erros.push(
                "Informe um horário válido no formato hh:mm na "
                + numeroTentativa
                + "ª tentativa."
            );
        }

        if (descricao == "") {
            erros.push(
                "Descreva as informações da "
                + numeroTentativa
                + "ª tentativa."
            );
        }

        if (descricao.length > 2000) {
            erros.push(
                "A descrição da "
                + numeroTentativa
                + "ª tentativa ultrapassa 2.000 caracteres."
            );
        }
    }
}

function vfValidarClassificacao(form, erros) {
    var campos = [
        {
            nome: "class_interesse",
            rotulo: "Interesse Inicial"
        },
        {
            nome: "class_necessidades",
            rotulo: "Necessidades e Desafios"
        },
        {
            nome: "class_orcamento",
            rotulo: "Orçamento Disponível"
        },
        {
            nome: "class_timeline",
            rotulo: "Timeline de Decisão"
        },
        {
            nome: "class_autoridade",
            rotulo: "Autoridade de Decisão"
        },
        {
            nome: "class_comunicacao",
            rotulo: "Preferências de Comunicação"
        }
    ];

    for (var i = 0; i < campos.length; i++) {
        var campo = campos[i];
        var valor = vfTexto(
            form.getValue(campo.nome)
        );

        if (valor == "") {
            erros.push(
                "Responda à questão “"
                + campo.rotulo
                + "”."
            );
        }

        if (valor.length > 2000) {
            erros.push(
                "A resposta de “"
                + campo.rotulo
                + "” ultrapassa 2.000 caracteres."
            );
        }
    }
}

function vfValidarPerda(form, erros, atividadeAtual) {
    var camposObrigatorios = [
        {
            nome: "motivo_perda_codigo",
            mensagem: "Selecione a justificativa da perda."
        },
        {
            nome: "motivo_perda_texto",
            mensagem: "A descrição da justificativa da perda não foi informada."
        },
        {
            nome: "perda_chave_pendente",
            mensagem: "A chave de controle da perda não foi gerada."
        },
        {
            nome: "funil_origem_perda",
            mensagem: "O funil de origem da perda não foi informado."
        },
        {
            nome: "atividade_origem_perda",
            mensagem: "A atividade de origem da perda não foi informada."
        },
        {
            nome: "atividade_origem_nome",
            mensagem: "O nome da atividade de origem da perda não foi informado."
        }
    ];

    for (var i = 0; i < camposObrigatorios.length; i++) {
        if (
            vfTexto(
                form.getValue(camposObrigatorios[i].nome)
            ) == ""
        ) {
            erros.push(camposObrigatorios[i].mensagem);
        }
    }

    var codigoMotivo = vfTexto(
        form.getValue("motivo_perda_codigo")
    );
    var textoMotivo = vfTexto(
        form.getValue("motivo_perda_texto")
    );
    var atividadeOrigem = vfTexto(
        form.getValue("atividade_origem_perda")
    );
    var atividadeOrigemNome = vfTexto(
        form.getValue("atividade_origem_nome")
    );
    var funilOrigem = vfTexto(
        form.getValue("funil_origem_perda")
    );
    var descricaoEsperada = vfDescricaoMotivoPerda(codigoMotivo);
    var atividadeNomeEsperado = vfNomeAtividade(atividadeAtual);

    if (
        codigoMotivo != ""
        && descricaoEsperada == ""
    ) {
        erros.push("A justificativa selecionada para a perda é inválida.");
    }

    if (
        descricaoEsperada != ""
        && textoMotivo != descricaoEsperada
    ) {
        erros.push("A descrição da justificativa da perda é inválida.");
    }

    if (
        atividadeOrigem != ""
        && atividadeOrigem != String(atividadeAtual)
    ) {
        erros.push("A atividade de origem da perda não corresponde à atividade atual.");
    }

    if (
        atividadeOrigemNome != ""
        && atividadeOrigemNome != atividadeNomeEsperado
    ) {
        erros.push("O nome da atividade de origem da perda é inválido.");
    }

    if (funilOrigem != "" && funilOrigem != "CLIENTE") {
        erros.push("O funil de origem da perda é inválido.");
    }
}

function vfValidarRecuperacao(form, erros) {
    var atividadeRecuperacao = vfTexto(
        form.getValue("atividade_recuperacao")
    );

    if (atividadeRecuperacao == "") {
        erros.push(
            "Selecione a atividade para a qual o lead deve retornar."
        );
        return;
    }

    if (
        atividadeRecuperacao != "4"
        && atividadeRecuperacao != "19"
        && atividadeRecuperacao != "21"
    ) {
        erros.push("A atividade de recuperação selecionada é inválida.");
    }
}

function vfDescricaoMotivoPerda(codigo) {
    var motivos = [
        ["SEM_ORCAMENTO", "Sem orçamento / Verba insuficiente"],
        ["PRECO_ACIMA", "Preço acima do esperado"],
        ["FORA_ICP", "Lead fora do perfil (ICP)"],
        ["CONCORRENTE", "Escolheu o concorrente"],
        ["SEM_RETORNO", "Sem retorno do contato (Ghosting)"],
        ["TIMING", "Timing inadequado (Adiou projeto)"],
        ["SEM_FIT_TECNICO", "Falta de fit técnico (Produto não atende)"],
        ["SEM_CONTATO", "Impossibilidade de contato"],
        ["COMPRA_CANCELADA", "Compra cancelada internamente"],
        ["SEM_PRIORIDADE", "Falta de prioridade no momento"],
        ["CONTATO_INVALIDO", "Dados de contato inválidos"],
        ["DUPLICIDADE", "Duplicidade de cadastro"]
    ];

    for (var i = 0; i < motivos.length; i++) {
        if (motivos[i][0] == codigo) {
            return motivos[i][1];
        }
    }

    return "";
}

function vfNomeAtividade(atividadeAtual) {
    if (atividadeAtual == VF_ATIVIDADE_TENTATIVA_CONTATO) {
        return "Tentativa de Contato";
    }

    if (atividadeAtual == VF_ATIVIDADE_OPORTUNIDADE_GERADA) {
        return "Oportunidade Gerada";
    }

    if (atividadeAtual == VF_ATIVIDADE_PROPOSTA_COMERCIAL) {
        return "Proposta comercial";
    }

    return "";
}

function vfEhAtividadeComercial(atividadeAtual) {
    return atividadeAtual == VF_ATIVIDADE_TENTATIVA_CONTATO
        || atividadeAtual == VF_ATIVIDADE_OPORTUNIDADE_GERADA
        || atividadeAtual == VF_ATIVIDADE_PROPOSTA_COMERCIAL;
}

function vfLancarErros(erros) {
    if (erros.length > 0) {
        throw "\n" + erros.join("\n");
    }
}

function vfTarefaEstaSendoConcluida(form) {
    var valor = getValue("WKCompletTask");

    if (valor != null && String(valor) != "") {
        return valor === true
            || String(valor).toLowerCase() == "true";
    }

    return vfTexto(form.getValue("acao_atividade")) == "MOVIMENTAR";
}

function vfMeioContatoValido(meio) {
    return meio == "EMAIL"
        || meio == "LINKEDIN"
        || meio == "WHATSAPP"
        || meio == "TELEFONE";
}

function vfDataValida(valor) {
    var formato;

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
        return false;
    }

    try {
        formato = new java.text.SimpleDateFormat("dd/MM/yyyy");
        formato.setLenient(false);
        formato.parse(valor);
        return true;
    } catch (e) {
        return false;
    }
}

function vfHoraValida(valor) {
    var partes;
    var hora;
    var minuto;

    if (!/^\d{2}:\d{2}$/.test(valor)) {
        return false;
    }

    partes = valor.split(":");
    hora = parseInt(partes[0], 10);
    minuto = parseInt(partes[1], 10);

    return hora >= 0 && hora <= 23
        && minuto >= 0 && minuto <= 59;
}

function vfTexto(valor) {
    if (valor == null) {
        return "";
    }

    return String(valor).replace(/^\s+|\s+$/g, "");
}
