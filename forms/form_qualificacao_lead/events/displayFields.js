function displayFields(form, customHTML) {
    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );

    var numeroSolicitacao =
        getValue("WKNumProces");

    var modoFormulario =
        form.getFormMode();

    var funilDestino = form.getValue("funil_origem_fluxo");

    if (funilDestino == null || String(funilDestino) === "") {
        funilDestino = form.getValue("funil_destino");
    }

    if (funilDestino == null || String(funilDestino) === "") {
        funilDestino = form.getValue("funil_origem_perda");
    }
    var contatosSecundarios = montarContatosSecundarios(form);

    if (isNaN(atividadeAtual)) {
        atividadeAtual = 0;
    }

    numeroSolicitacao =
        numeroSolicitacao == null
            ? ""
            : String(numeroSolicitacao);

    modoFormulario =
        modoFormulario == null
            ? ""
            : String(modoFormulario);

    funilDestino = funilDestino == null
        ? ""
        : String(funilDestino);

    /*
     * Persiste o contexto nos campos ocultos.
     */
    form.setValue(
        "atividade_atual",
        String(atividadeAtual)
    );

    form.setValue(
        "modo_formulario",
        modoFormulario
    );

    if (
        numeroSolicitacao !== ""
        && numeroSolicitacao !== "0"
    ) {
        form.setValue(
            "numero_solicitacao",
            numeroSolicitacao
        );
    }

    /*
     * Disponibiliza o contexto diretamente no JavaScript
     * executado no navegador.
     */
    customHTML.append(
        "<script type=\"text/javascript\">"
    );

    customHTML.append(
        "window.IRHO_FORM_CONTEXT = {"
        + "atividadeAtual: "
        + atividadeAtual
        + ","
        + "modoFormulario: \""
        + escaparJavaScript(modoFormulario)
        + "\","
        + "numeroSolicitacao: \""
        + escaparJavaScript(numeroSolicitacao)
        + "\","
        + "funilDestino: \""
        + escaparJavaScript(funilDestino)
        + "\","
        + "contatosSecundarios: "
        + contatosSecundarios
        + "};"
    );

    customHTML.append(
        "window.IRHO_DISPLAY_FIELDS_EXECUTADO = true;"
    );

    customHTML.append(
        "console.log("
        + "\"[IRHO-LEADS] displayFields executado\","
        + "window.IRHO_FORM_CONTEXT"
        + ");"
    );

    customHTML.append(
        "</script>"
    );

    form.setShowDisabledFields(true);
    form.setHidePrintLink(true);

    log.info(
        ">>> [IRHO-LEADS] displayFields"
        + " | Solicitação: "
        + numeroSolicitacao
        + " | Atividade: "
        + atividadeAtual
        + " | Modo: "
        + modoFormulario
    );
}

function montarContatosSecundarios(form) {
    var campos = [
        "ordem",
        "nome",
        "cargo",
        "telefone",
        "email",
        "linkedin"
    ];
    var indices = form.getChildrenIndexes("tbContatosSecundarios") || [];
    var resultado = [];

    for (var i = 0; i < indices.length; i++) {
        var indice = String(indices[i]);
        var contato = [];

        contato.push("indice: \"" + escaparJavaScript(indice) + "\"");

        for (var j = 0; j < campos.length; j++) {
            contato.push(
                campos[j]
                + ": \""
                + escaparJavaScript(
                    form.getValue(
                        "cont_sec_" + campos[j] + "___" + indice
                    )
                )
                + "\""
            );
        }

        resultado.push("{" + contato.join(",") + "}");
    }

    return "[" + resultado.join(",") + "]";
}

function escaparJavaScript(valor) {
    if (valor == null) {
        return "";
    }

    return String(valor)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, "\\\"")
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}
