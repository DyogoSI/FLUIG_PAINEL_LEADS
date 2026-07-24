function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("documentid");
    dataset.addColumn("lead_id");
    dataset.addColumn("lead_nome");
    dataset.addColumn("lead_cargo");
    dataset.addColumn("lead_telefone");
    dataset.addColumn("lead_email");
    dataset.addColumn("lead_linkedin");
    dataset.addColumn("empresa_nome");
    dataset.addColumn("empresa_cnpj");
    dataset.addColumn("empresa_site");
    dataset.addColumn("lead_origem");
    dataset.addColumn("lead_status");
    dataset.addColumn("fonte_insercao");
    dataset.addColumn("dados_extras");

    var conn = null;
    var stmtForm = null;
    var rsForm = null;
    var stmtDados = null;
    var rsDados = null;

    try {
        // 1. Pega o ID Real do Formulário salvo nas configurações
        var formId = "0";
        var configDs = DatasetFactory.getDataset("ds_config_painel_leads", null, null, null);
        if (configDs != null && configDs.rowsCount > 0) {
            formId = configDs.getValue(0, "idFormulario");
        }

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        var tableName = "ML001028"; // Fallback para a sua tabela antiga caso não encontre

        if (formId !== "0" && formId !== "") {
            // Formata o ID do formulário (ex: 13427 -> 13427, 28 -> 028)
            var formIdStr = formId.toString();
            while (formIdStr.length < 3) {
                formIdStr = "0" + formIdStr;
            }

            // Acha a tabela exata no banco combinando ML + formId
            var queryForm = "SELECT TOP 1 TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'fonte_insercao' AND TABLE_NAME LIKE 'ML%" + formIdStr + "'";
            stmtForm = conn.createStatement();
            rsForm = stmtForm.executeQuery(queryForm);

            if (rsForm.next()) {
                tableName = rsForm.getString("TABLE_NAME");
            }
        }

        // 2. Leitura rápida na tabela oficial
        var queryDados = "SELECT documentid, lead_id, lead_nome, lead_cargo, lead_telefone, lead_email, lead_linkedin, empresa_nome, empresa_cnpj, empresa_site, lead_origem, lead_status, fonte_insercao, dados_extras " +
                         "FROM " + tableName + " a " +
                         "WHERE version = (SELECT MAX(version) FROM " + tableName + " b WHERE b.documentid = a.documentid)";

        stmtDados = conn.createStatement();
        rsDados = stmtDados.executeQuery(queryDados);

        while (rsDados.next()) {
            var statusVal = rsDados.getString("lead_status");
            statusVal = statusVal != null ? statusVal.trim() : "Novo";
            var nome = rsDados.getString("lead_nome");
            var email = rsDados.getString("lead_email");

            if (statusVal.indexOf("Exclu") === 0 || ((nome == null || nome.trim() === "") && (email == null || email.trim() === ""))) {
                continue;
            }

            dataset.addRow([
                rsDados.getString("documentid") || "",
                rsDados.getString("lead_id") || "",
                nome || "",
                rsDados.getString("lead_cargo") || "",
                rsDados.getString("lead_telefone") || "",
                email || "",
                rsDados.getString("lead_linkedin") || "",
                rsDados.getString("empresa_nome") || "",
                rsDados.getString("empresa_cnpj") || "",
                rsDados.getString("empresa_site") || "",
                rsDados.getString("lead_origem") || "Site",
                statusVal,
                rsDados.getString("fonte_insercao") || "Manualmente",
                rsDados.getString("dados_extras") || ""
            ]);
        }

    } catch (e) {
        dataset.addRow(["ERRO SQL", e.toString(), "", "", "", "", "", "", "", "", "", "", "", ""]);
    } finally {
        if (rsDados != null) { try { rsDados.close(); } catch(e) {} }
        if (stmtDados != null) { try { stmtDados.close(); } catch(e) {} }
        if (rsForm != null) { try { rsForm.close(); } catch(e) {} }
        if (stmtForm != null) { try { stmtForm.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}