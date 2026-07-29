var VF_ATIVIDADE_TENTATIVA_CONTATO = 4;
var VF_TABELA_TENTATIVAS = "tbTentativasContato";

function validateForm(form) {
    var atividadeAtual = parseInt(getValue("WKNumState"), 10);
    var completandoAtividade = vfTarefaEstaSendoConcluida(form);
    var indices;
    var erros = [];

    if (atividadeAtual != VF_ATIVIDADE_TENTATIVA_CONTATO) {
        return;
    }

    indices = form.getChildrenIndexes(VF_TABELA_TENTATIVAS);

    if (completandoAtividade && indices.length == 0) {
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

    if (completandoAtividade) {
        vfValidarClassificacao(form, erros);
    }

    function vfValidarClassificacao(
        form,
        erros
    ) {
        var campos = [
            {
                nome:
                    "class_interesse",

                rotulo:
                    "Interesse Inicial"
            },
            {
                nome:
                    "class_necessidades",

                rotulo:
                    "Necessidades e Desafios"
            },
            {
                nome:
                    "class_orcamento",

                rotulo:
                    "Orçamento Disponível"
            },
            {
                nome:
                    "class_timeline",

                rotulo:
                    "Timeline de Decisão"
            },
            {
                nome:
                    "class_autoridade",

                rotulo:
                    "Autoridade de Decisão"
            },
            {
                nome:
                    "class_comunicacao",

                rotulo:
                    "Preferências de Comunicação"
            }
        ];

        for (
            var i = 0;
            i < campos.length;
            i++
        ) {
            var campo = campos[i];

            var valor = vfTexto(
                form.getValue(
                    campo.nome
                )
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

    if (erros.length > 0) {
        throw "\n" + erros.join("\n");
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
