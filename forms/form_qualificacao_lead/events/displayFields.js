function displayFields(form, customHTML) {
    var atividadeAtual = parseInt(
        getValue("WKNumState"),
        10
    );

    var numeroSolicitacao =
        getValue("WKNumProces");

    var modoFormulario =
        form.getFormMode();

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
        + "\""
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

function escaparJavaScript(valor) {
    if (valor == null) {
        return "";
    }

    return String(valor)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, "\\\"");
}
