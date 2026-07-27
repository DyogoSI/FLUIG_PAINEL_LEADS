function defineStructure() {}
function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("documentid");
    dataset.addColumn("lead_email");
    dataset.addColumn("dados_extras");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("java:/jdbc/AppDS");
        conn = ds.getConnection();

        // Traz de todos os leads (não só os vindos de Diagnóstico): o modal usa isso tanto pra achar
        // quais diagnósticos já foram vinculados quanto pra achar um lead existente pelo e-mail.
        var query = "SELECT id, lead_email, dados_extras FROM PAINEL_LEADS_DADOS " +
                    "WHERE (lead_status IS NULL OR lead_status NOT LIKE 'Exclu%')";

        stmt = conn.createStatement();
        rs = stmt.executeQuery(query);

        while (rs.next()) {
            dataset.addRow([
                rs.getString("id") || "",
                rs.getString("lead_email") || "",
                rs.getString("dados_extras") || ""
            ]);
        }
    } catch (e) {
        // silencioso: usado só para destacar diagnósticos já vinculados, não deve travar o modal se falhar
    } finally {
        if (rs != null) { try { rs.close(); } catch(e) {} }
        if (stmt != null) { try { stmt.close(); } catch(e) {} }
        if (conn != null) { try { conn.close(); } catch(e) {} }
    }

    return dataset;
}

function onMobileSync(user) {}
